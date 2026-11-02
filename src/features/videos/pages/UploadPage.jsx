import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { videoRepository } from "../videoRepository";
import { extractVideoMetadata, uploadMediaWithProgress, cleanupStorageObject } from "../uploadService";
import { normalizeSupabaseError } from "../../../lib/errors";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const REEL_MAX_DURATION_SECONDS = 180; // 3 minutes

export default function UploadPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Content Type: 'animation' | 'reel'
    const [contentType, setContentType] = useState("animation");

    // Form inputs
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [videoDuration, setVideoDuration] = useState(null);
    const [thumbnailBlob, setThumbnailBlob] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);

    // Upload & Progress states
    // state: 'IDLE' | 'ANALYZING' | 'CREATING_DRAFT' | 'UPLOADING' | 'FINALIZING' | 'SUCCESS' | 'ERROR'
    const [uploadPhase, setUploadPhase] = useState("IDLE");
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadStep, setUploadStep] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const videoInputRef = useRef(null);
    const thumbInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const activeUploadTaskRef = useRef(null);

    // Clean up previews on unmount
    useEffect(() => {
        return () => {
            if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
                URL.revokeObjectURL(thumbnailPreview);
            }
            if (activeUploadTaskRef.current) {
                activeUploadTaskRef.current.abort();
            }
        };
    }, [thumbnailPreview]);

    async function handleVideoSelected(file) {
        if (!file) return;

        setErrorMessage("");

        // Check MIME type
        const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
        if (!allowedTypes.includes(file.type)) {
            setErrorMessage("Format video harus berupa MP4, WebM, atau MOV.");
            return;
        }

        // Check file size (100 MB limit)
        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage("Ukuran berkas melebihi batas 100 MB.");
            return;
        }

        setVideoFile(file);
        setUploadPhase("ANALYZING");
        setUploadStep("Menganalisis durasi dan frame video...");

        try {
            const meta = await extractVideoMetadata(file);

            // Conditional duration validation based on contentType
            if (contentType === "reel" && meta.durationSeconds > REEL_MAX_DURATION_SECONDS) {
                setErrorMessage(
                    `Durasi Reel (${meta.durationSeconds} detik) melebihi batas maksimal ${REEL_MAX_DURATION_SECONDS} detik (3 menit). Untuk video lebih panjang, pilih jenis "Film Animasi".`
                );
                setVideoFile(null);
                setVideoDuration(null);
                setUploadPhase("IDLE");
                return;
            }

            if (meta.durationSeconds < 1) {
                setErrorMessage("Durasi video tidak valid (kurang dari 1 detik).");
                setVideoFile(null);
                setVideoDuration(null);
                setUploadPhase("IDLE");
                return;
            }

            setVideoDuration(meta.durationSeconds);

            if (meta.thumbnailBlob) {
                setThumbnailBlob(meta.thumbnailBlob);
                const previewUrl = URL.createObjectURL(meta.thumbnailBlob);
                setThumbnailPreview(previewUrl);
            }

            // Auto-detect format suggestion if aspect ratio is strongly vertical or horizontal
            if (meta.aspectRatio && meta.aspectRatio < 0.8 && contentType !== "reel") {
                setContentType("reel");
            } else if (meta.aspectRatio && meta.aspectRatio > 1.3 && contentType !== "animation") {
                setContentType("animation");
            }

            // Auto-fill title if empty from filename
            if (!title) {
                const autoTitle = file.name
                    .replace(/\.[^/.]+$/, "")
                    .replace(/[-_]/g, " ")
                    .slice(0, 100);
                setTitle(autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1));
            }
        } catch (err) {
            setErrorMessage(err.message || "Gagal memproses berkas video.");
            setVideoFile(null);
        } finally {
            setUploadPhase("IDLE");
            setUploadStep("");
        }
    }

    function handleCustomThumbnail(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setErrorMessage("Format thumbnail harus JPG, PNG, atau WebP.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage("Ukuran thumbnail maksimal 5 MB.");
            return;
        }

        setThumbnailBlob(file);
        const previewUrl = URL.createObjectURL(file);
        setThumbnailPreview(previewUrl);
    }

    function handleCancelUpload() {
        if (activeUploadTaskRef.current) {
            activeUploadTaskRef.current.abort();
            activeUploadTaskRef.current = null;
        }
        setUploadPhase("IDLE");
        setUploadPercent(0);
        setUploadStep("");
        setErrorMessage("Pengunggahan video dibatalkan.");
    }

    async function handleSubmit(shouldPublishImmediately = false) {
        setErrorMessage("");

        if (!user?.id) {
            setErrorMessage("Sesi Anda tidak ditemukan. Silakan masuk / login kembali.");
            return;
        }

        if (!title.trim()) {
            setErrorMessage("Judul video tidak boleh kosong.");
            return;
        }

        if (!videoFile || !videoDuration) {
            setErrorMessage("Pilih berkas video yang valid terlebih dahulu.");
            return;
        }

        // Validate duration constraint
        if (contentType === "reel" && videoDuration > REEL_MAX_DURATION_SECONDS) {
            setErrorMessage(`Durasi Reel maksimal adalah ${REEL_MAX_DURATION_SECONDS} detik.`);
            return;
        }

        setUploadPhase("CREATING_DRAFT");
        setUploadPercent(5);
        setUploadStep("Menyiapkan draf karya di database...");

        let createdDraftId = null;
        let videoStoragePath = null;
        let thumbStoragePath = null;

        try {
            // 1. Create draft in database
            const { data: draft, error: draftErr } = await videoRepository.createDraft({
                creatorId: user.id,
                title: title.trim(),
                description: description.trim() || null,
                contentType,
            });

            if (draftErr || !draft) {
                throw new Error(normalizeSupabaseError(draftErr, "Gagal membuat draf karya di database."));
            }

            createdDraftId = draft.id;
            const fileExt = videoFile.name.split(".").pop() || "mp4";
            videoStoragePath = `${user.id}/${createdDraftId}/media-${Date.now()}.${fileExt}`;

            // 2. Upload thumbnail if available
            if (thumbnailBlob) {
                setUploadStep("Mengunggah sampul / thumbnail karya...");
                const thumbExt = thumbnailBlob.type === "image/png" ? "png" : "webp";
                thumbStoragePath = `${user.id}/${createdDraftId}/thumb-${Date.now()}.${thumbExt}`;

                await uploadMediaWithProgress({
                    bucket: "thumbnails",
                    filePath: thumbStoragePath,
                    file: thumbnailBlob,
                    contentType: thumbnailBlob.type || "image/webp",
                });
            }

            // 3. Resumable Upload with real progress
            setUploadPhase("UPLOADING");
            setUploadStep("Mengunggah berkas video ke penyimpanan cloud...");

            await uploadMediaWithProgress({
                bucket: "videos",
                filePath: videoStoragePath,
                file: videoFile,
                contentType: videoFile.type || "video/mp4",
                onUploadInstance: (task) => {
                    activeUploadTaskRef.current = task;
                },
                onProgress: (percent) => {
                    setUploadPercent(percent);
                },
            });

            // 4. Update video row with storage paths & duration
            setUploadPhase("FINALIZING");
            setUploadStep("Memperbarui informasi media dan durasi...");

            const { error: updateErr } = await videoRepository.updateVideo(createdDraftId, {
                storage_path: videoStoragePath,
                thumbnail_path: thumbStoragePath,
                duration_seconds: videoDuration,
                content_type: contentType,
            });

            if (updateErr) {
                throw new Error(normalizeSupabaseError(updateErr, "Gagal menyimpan metadata video."));
            }

            // 5. Publish if requested
            if (shouldPublishImmediately) {
                setUploadStep("Mempublikasikan karya ke katalog publik...");
                const { error: pubErr } = await videoRepository.publishVideo(createdDraftId);
                if (pubErr) {
                    console.warn("[UploadPage] Draft created, but publish returned warning:", pubErr);
                }
            }

            setUploadPhase("SUCCESS");
            setUploadStep("Berhasil! Mengalihkan ke Studio...");
            setTimeout(() => {
                navigate("/studio");
            }, 600);
        } catch (err) {
            console.error("[UploadPage] Error during upload:", err);
            // Cleanup storage if needed
            if (videoStoragePath) {
                cleanupStorageObject("videos", videoStoragePath);
            }
            setUploadPhase("ERROR");
            setErrorMessage(normalizeSupabaseError(err, err.message || "Gagal mengunggah video. Silakan coba lagi."));
        } finally {
            activeUploadTaskRef.current = null;
        }
    }

    const isBusy = ["ANALYZING", "CREATING_DRAFT", "UPLOADING", "FINALIZING"].includes(uploadPhase);

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Link to="/studio" className="text-xs font-bold text-amber-800 hover:underline">
                            ← Kembali ke Studio
                        </Link>
                        <h1
                            className="text-3xl font-black text-[#3B2A0E] mt-1"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Unggah Animasi & Cerita Budaya
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Pilih format penayangan sesuai jenis karya Anda: Film Animasi (Horizontal) atau Reels (Vertikal).
                        </p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-6 rounded-2xl px-5 py-4 text-sm bg-red-50 text-red-800 border border-red-200 font-medium">
                        {errorMessage}
                    </div>
                )}

                {/* Content Type Selector */}
                <div className="mb-8 grid sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setContentType("animation")}
                        className={`p-5 rounded-3xl border-2 text-left transition cursor-pointer flex items-start gap-4 ${
                            contentType === "animation"
                                ? "border-[#8DC63F] bg-white shadow-md ring-2 ring-[#8DC63F]/20"
                                : "border-amber-200 bg-white/70 hover:bg-white"
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                            contentType === "animation" ? "bg-[#8DC63F] text-neutral-950 font-bold" : "bg-amber-100 text-amber-800"
                        }`}>
                            🎬
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#3B2A0E]">Film Animasi (Full Video)</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">16:9</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Untuk film cerita rakyat berdurasi panjang atau film pendek. Ditayangkan di Katalog Animasi dengan kontrol player horizontal lengkap.
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setContentType("reel")}
                        className={`p-5 rounded-3xl border-2 text-left transition cursor-pointer flex items-start gap-4 ${
                            contentType === "reel"
                                ? "border-[#8DC63F] bg-white shadow-md ring-2 ring-[#8DC63F]/20"
                                : "border-amber-200 bg-white/70 hover:bg-white"
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                            contentType === "reel" ? "bg-[#8DC63F] text-neutral-950 font-bold" : "bg-amber-100 text-amber-800"
                        }`}>
                            📱
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#3B2A0E]">Reels (Video Singkat)</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">9:16</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Untuk video cuplikan, teaser, atau konten budaya pendek berdurasi maksimal 180 detik. Ditayangkan di feed Reels vertikal.
                            </p>
                        </div>
                    </button>
                </div>

                {/* Main Upload Container */}
                <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8">
                    {/* Left: Video Dropzone & Thumbnail */}
                    <div className="space-y-6">
                        {!videoFile ? (
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    handleVideoSelected(file);
                                }}
                                onClick={() => videoInputRef.current?.click()}
                                className={`rounded-3xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                                    isDragging
                                        ? "border-amber-500 bg-amber-100/50"
                                        : "border-amber-300 bg-white hover:bg-amber-50/50"
                                } shadow-sm min-h-[320px]`}
                            >
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    className="hidden"
                                    onChange={(e) => handleVideoSelected(e.target.files?.[0])}
                                />
                                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-neutral-800 text-base mb-1">
                                    Tarik berkas video ke sini atau klik untuk memilih
                                </h3>
                                <p className="text-xs text-neutral-500 max-w-xs mb-3">
                                    Format MP4, WebM, atau MOV.
                                    {contentType === "reel" ? " Durasi maks 180 detik (Reel)." : " Durasi bebas (Animasi)."} Maksimal 100 MB.
                                </p>
                                <span className="px-4 py-1.5 rounded-full text-xs font-bold text-amber-900 bg-amber-100">
                                    Pilih Berkas Video
                                </span>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                                    <div>
                                        <h4 className="font-bold text-sm text-neutral-900 truncate max-w-[220px]">
                                            {videoFile.name}
                                        </h4>
                                        <p className="text-xs text-neutral-500">
                                            {(videoFile.size / (1024 * 1024)).toFixed(1)} MB • {videoDuration} detik • {contentType === "animation" ? "Film Animasi" : "Reel"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => {
                                            setVideoFile(null);
                                            setVideoDuration(null);
                                            setThumbnailPreview(null);
                                        }}
                                        className="text-xs font-semibold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        Ganti Video
                                    </button>
                                </div>

                                {/* Dynamic Aspect Ratio Preview Box */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-neutral-700">
                                            Sampul / Thumbnail ({contentType === "animation" ? "16:9 Landscape" : "9:16 Portrait"})
                                        </label>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => thumbInputRef.current?.click()}
                                            className="text-xs text-amber-800 font-semibold hover:underline cursor-pointer"
                                        >
                                            Ganti Sampul
                                        </button>
                                    </div>

                                    <input
                                        ref={thumbInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleCustomThumbnail}
                                    />

                                    <div className={`relative rounded-2xl overflow-hidden bg-neutral-900 mx-auto ${
                                        contentType === "animation" ? "aspect-video w-full" : "aspect-[9/14] max-h-64"
                                    }`}>
                                        {thumbnailPreview ? (
                                            <img
                                                src={thumbnailPreview}
                                                alt="Pratinjau sampul"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                                                Tidak ada pratinjau
                                            </div>
                                        )}
                                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-bold">
                                            {videoDuration}s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {uploadPhase === "ANALYZING" && (
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                {uploadStep}
                            </div>
                        )}
                    </div>

                    {/* Right: Metadata Form & Actions */}
                    <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm flex flex-col justify-between">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                    Judul Karya <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={120}
                                    disabled={isBusy}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={contentType === "animation" ? "Contoh: Sangkuriang dan Gunung Tangkuban Parahu" : "Contoh: Momen Epik Pertarungan Roro Jonggrang"}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F]"
                                />
                                <div className="text-right text-[11px] text-neutral-400 mt-1">
                                    {title.length}/120
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1 px-1">
                                    <label className="block text-xs font-semibold text-neutral-600">
                                        Deskripsi / Sinopsis Cerita
                                    </label>
                                    <span className="text-[11px] text-neutral-400">
                                        {description.length}/2200
                                    </span>
                                </div>
                                <textarea
                                    rows={5}
                                    maxLength={2200}
                                    disabled={isBusy}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ceritakan ringkasan kisah cerita rakyat ini, pesan moral, dan latar budayanya..."
                                    className="w-full px-5 py-3 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F] resize-none"
                                />
                            </div>

                            {/* Resumable Upload Progress Bar & Cancel Button */}
                            {isBusy && (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                                        <span>{uploadStep}</span>
                                        <span>{uploadPercent}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-amber-200/60 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-[#8DC63F] transition-all duration-300"
                                            style={{ width: `${uploadPercent}%` }}
                                        />
                                    </div>
                                    <div className="text-right pt-1">
                                        <button
                                            type="button"
                                            onClick={handleCancelUpload}
                                            className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                                        >
                                            Batalkan Unggahan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                disabled={isBusy || !videoFile}
                                onClick={() => handleSubmit(false)}
                                className="flex-1 py-3.5 rounded-full text-xs font-bold text-neutral-800 bg-[#F5F0E0] hover:bg-[#EAE2CE] transition disabled:opacity-50 cursor-pointer"
                            >
                                Simpan Draf Saja
                            </button>
                            <button
                                type="button"
                                disabled={isBusy || !videoFile}
                                onClick={() => handleSubmit(true)}
                                className="flex-1 py-3.5 rounded-full text-xs font-bold text-neutral-950 shadow hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: "#8DC63F" }}
                            >
                                Unggah & Publikasikan
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

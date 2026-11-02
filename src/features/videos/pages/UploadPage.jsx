import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { videoRepository } from "../videoRepository";
import {
    MAX_VIDEO_BYTES,
    MAX_THUMBNAIL_BYTES,
    extractVideoMetadata,
} from "../uploadService";
import { normalizeSupabaseError } from "../../../lib/errors";

import { createUploadOperation, runVideoUpload } from "../uploadWorkflow";

const REEL_MAX_DURATION_SECONDS = 180; // 3 minutes

export default function UploadPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Content Type: 'animation' | 'reel' (User selection is sovereign)
    const [contentType, setContentType] = useState("animation");

    // Form inputs
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [videoDuration, setVideoDuration] = useState(null);
    const [thumbnailBlob, setThumbnailBlob] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [aspectRatioSuggestion, setAspectRatioSuggestion] = useState("");

    // Upload & Publish State Machine
    // States: 'IDLE' | 'ANALYZING' | 'CREATING_DRAFT' | 'UPLOADING' | 'METADATA_SAVED' | 'PUBLISHING' | 'PUBLISHED' | 'PUBLISH_FAILED' | 'UPLOAD_FAILED' | 'CANCELLED'
    const [uploadPhase, setUploadPhase] = useState("IDLE");
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadStep, setUploadStep] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [persistedDraftId, setPersistedDraftId] = useState(null);

    const videoInputRef = useRef(null);
    const thumbInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const activeOperationRef = useRef(null);
    const mountedRef = useRef(false);
    const navigationTimerRef = useRef(null);

    // Clean up preview blob URLs
    useEffect(() => {
        return () => {
            if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    // Keep callbacks from an old upload/navigation from touching this page.
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            activeOperationRef.current?.cancel();
            clearTimeout(navigationTimerRef.current);
        };
    }, []);

    async function handleVideoSelected(file) {
        if (!file) return;

        setErrorMessage("");
        setAspectRatioSuggestion("");

        // 1. Check MIME type
        const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
        if (!allowedTypes.includes(file.type)) {
            setErrorMessage("Format video harus berupa MP4, WebM, atau MOV.");
            return;
        }

        // 2. Strict 50 MB check before any draft creation
        if (file.size > MAX_VIDEO_BYTES) {
            const sizeMb = (file.size / (1000 * 1000)).toFixed(1);
            setErrorMessage(
                `Ukuran video (${sizeMb} MB) melebihi batas 50 MB yang tersedia pada NusaTales MVP (Supabase Free Tier). Silakan kompres atau ekspor ulang video sebelum mengunggah.`
            );
            return;
        }

        setVideoFile(file);
        setUploadPhase("ANALYZING");
        setUploadStep("Menganalisis durasi dan frame video...");

        try {
            const meta = await extractVideoMetadata(file);

            // Conditional duration validation based on selected contentType
            if (contentType === "reel" && meta.durationSeconds > REEL_MAX_DURATION_SECONDS) {
                setErrorMessage(
                    `Durasi Reel (${meta.durationSeconds} detik) melebihi batas maksimal ${REEL_MAX_DURATION_SECONDS} detik (3 menit). Untuk karya lebih panjang, pilih format "Film Animasi".`
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

            // Aspect ratio recommendation without silent mutation of user's choice
            if (meta.aspectRatio && meta.aspectRatio < 0.8 && contentType === "animation") {
                setAspectRatioSuggestion(
                    "Saran: Video ini berorientasi vertikal (9:16). Disarankan memilih format 'Reel', namun pilihan tetap berada di tangan Anda."
                );
            } else if (meta.aspectRatio && meta.aspectRatio > 1.3 && contentType === "reel") {
                setAspectRatioSuggestion(
                    "Saran: Video ini berorientasi horizontal (16:9). Disarankan memilih format 'Film Animasi', namun pilihan tetap berada di tangan Anda."
                );
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

        if (file.size > MAX_THUMBNAIL_BYTES) {
            setErrorMessage("Ukuran thumbnail maksimal 5 MB.");
            return;
        }

        setThumbnailBlob(file);
        const previewUrl = URL.createObjectURL(file);
        setThumbnailPreview(previewUrl);
    }

    function handleCancelUpload() {
        if (activeOperationRef.current?.cancel()) {
            setUploadPhase("CANCELLING");
            setUploadStep("Membatalkan unggahan dan membersihkan draf...");
        }
    }

    async function handleRetryPublish() {
        if (!persistedDraftId || activeOperationRef.current) return;
        const operation = createUploadOperation();
        operation.beginPublish();
        activeOperationRef.current = operation;
        const isCurrent = () => mountedRef.current && activeOperationRef.current === operation;
        setUploadPhase("PUBLISHING");
        setErrorMessage("");
        setUploadStep("Mengonfirmasi publikasi karya...");
        try {
            const { error } = await videoRepository.publishVideo(persistedDraftId);
            if (error) throw error;
            if (!isCurrent()) return;
            setUploadPhase("PUBLISHED");
            setUploadStep("Karya berhasil dipublikasikan!");
            navigationTimerRef.current = setTimeout(() => navigate("/studio"), 800);
        } catch (err) {
            if (!isCurrent()) return;
            setUploadPhase("PUBLISH_FAILED");
            setErrorMessage(normalizeSupabaseError(err, "Gagal mempublikasikan karya. Silakan coba lagi."));
        } finally {
            if (activeOperationRef.current === operation) activeOperationRef.current = null;
        }
    }

    async function handleSubmit(shouldPublishImmediately = false) {
        if (activeOperationRef.current) return;
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

        // Re-validate 50 MB before transfer
        if (videoFile.size > MAX_VIDEO_BYTES) {
            const sizeMb = (videoFile.size / (1000 * 1000)).toFixed(1);
            setErrorMessage(
                `Ukuran video (${sizeMb} MB) melebihi batas 50 MB yang tersedia pada NusaTales MVP. Silakan kompres video terlebih dahulu.`
            );
            return;
        }

        // Validate duration constraint
        if (contentType === "reel" && videoDuration > REEL_MAX_DURATION_SECONDS) {
            setErrorMessage(`Durasi Reel maksimal adalah ${REEL_MAX_DURATION_SECONDS} detik.`);
            return;
        }

        const operation = createUploadOperation();
        activeOperationRef.current = operation;
        setPersistedDraftId(null);
        const isCurrent = () => mountedRef.current && activeOperationRef.current === operation;
        try {
            const result = await runVideoUpload({
                userId: user.id, title: title.trim(), description: description.trim() || null,
                file: videoFile, thumbnail: thumbnailBlob, duration: videoDuration,
                contentType, publish: shouldPublishImmediately,
            }, operation, (phase, step, percent) => {
                if (!isCurrent()) return;
                setUploadPhase(phase);
                setUploadStep(step);
                if (percent !== undefined) setUploadPercent(percent);
            });
            if (!isCurrent()) return;
            setPersistedDraftId(result.draftId);
            setUploadPhase(result.published ? "PUBLISHED" : "DRAFT_SAVED");
            setUploadStep(result.published ? "Karya berhasil dipublikasikan!" : "Draf karya berhasil disimpan!");
            navigationTimerRef.current = setTimeout(() => navigate("/studio"), 700);
        } catch (err) {
            if (!isCurrent()) return;
            if (err.isCancelled) {
                setUploadPhase("CANCELLED");
                setUploadPercent(0);
                setUploadStep("");
                setErrorMessage(err.cleanupErrors?.length
                    ? "Unggahan dibatalkan. Sebagian berkas belum berhasil dibersihkan; periksa draf di Studio."
                    : "Pengunggahan video dibatalkan.");
            } else {
                setUploadPhase(err.phase || "UPLOAD_FAILED");
                if (err.draftId) setPersistedDraftId(err.draftId);
                setErrorMessage(normalizeSupabaseError(err, "Gagal mengunggah video. Silakan coba lagi."));
            }
        } finally {
            if (activeOperationRef.current === operation) activeOperationRef.current = null;
        }
    }

    const isUploadingActive = ["ANALYZING", "CREATING_DRAFT", "UPLOADING", "METADATA_SAVED", "PUBLISHING", "CANCELLING"].includes(
        uploadPhase
    );

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
                            Pilih format penayangan sesuai jenis karya: Film Animasi (Horizontal) atau Reels (Vertikal).
                            Maksimal 50 MB per berkas.
                        </p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-6 rounded-2xl px-5 py-4 text-sm bg-red-50 text-red-800 border border-red-200 font-medium space-y-2">
                        <p>{errorMessage}</p>
                        {uploadPhase === "PUBLISH_FAILED" && persistedDraftId && (
                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleRetryPublish}
                                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#8DC63F] hover:bg-[#7db534] shadow-sm cursor-pointer"
                                >
                                    Coba Publikasikan Lagi
                                </button>
                                <Link
                                    to="/studio"
                                    className="px-4 py-1.5 rounded-full text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200"
                                >
                                    Buka Draf di Studio
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Aspect ratio recommendation banner (if any) */}
                {aspectRatioSuggestion && (
                    <div className="mb-6 rounded-2xl px-5 py-3.5 text-xs bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-between">
                        <span>💡 {aspectRatioSuggestion}</span>
                        <button
                            type="button"
                            onClick={() => setAspectRatioSuggestion("")}
                            className="text-amber-700 hover:text-amber-950 ml-2 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Content Type Selector */}
                <div className="mb-8 grid sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        disabled={isUploadingActive}
                        onClick={() => setContentType("animation")}
                        className={`p-5 rounded-3xl border-2 text-left transition cursor-pointer flex items-start gap-4 ${
                            contentType === "animation"
                                ? "border-[#8DC63F] bg-white shadow-md ring-2 ring-[#8DC63F]/20"
                                : "border-amber-200 bg-white/70 hover:bg-white"
                        }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                                contentType === "animation"
                                    ? "bg-[#8DC63F] text-neutral-950 font-bold"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            🎬
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#3B2A0E]">Film Animasi (Full Video)</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    16:9
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Untuk film cerita rakyat berdurasi penuh atau film pendek. Durasi bebas (minimal 1 detik),
                                ukuran maksimal tetap 50 MB. Ditayangkan di Katalog Animasi dengan Cinema Player.
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        disabled={isUploadingActive}
                        onClick={() => setContentType("reel")}
                        className={`p-5 rounded-3xl border-2 text-left transition cursor-pointer flex items-start gap-4 ${
                            contentType === "reel"
                                ? "border-[#8DC63F] bg-white shadow-md ring-2 ring-[#8DC63F]/20"
                                : "border-amber-200 bg-white/70 hover:bg-white"
                        }`}
                    >
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl ${
                                contentType === "reel"
                                    ? "bg-[#8DC63F] text-neutral-950 font-bold"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            📱
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#3B2A0E]">Reels (Video Singkat)</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    9:16
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Untuk cuplikan, teaser, atau konten budaya pendek. Durasi maksimal 180 detik, ukuran
                                maksimal 50 MB. Ditayangkan di feed Reels vertikal.
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
                                    {contentType === "reel" ? " Durasi maks 180 detik (Reel)." : " Durasi bebas (Animasi)."}
                                    {" "}Maksimal ukuran 50 MB.
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
                                            {(videoFile.size / (1000 * 1000)).toFixed(1)} MB • {videoDuration} detik •{" "}
                                            {contentType === "animation" ? "Film Animasi" : "Reel"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isUploadingActive}
                                        onClick={() => {
                                            setVideoFile(null);
                                            setVideoDuration(null);
                                            setThumbnailPreview(null);
                                            setAspectRatioSuggestion("");
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
                                            disabled={isUploadingActive}
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

                                    <div
                                        className={`relative rounded-2xl overflow-hidden bg-neutral-900 mx-auto ${
                                            contentType === "animation" ? "aspect-video w-full" : "aspect-[9/14] max-h-64"
                                        }`}
                                    >
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
                                    disabled={isUploadingActive}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={
                                        contentType === "animation"
                                            ? "Contoh: Sangkuriang dan Gunung Tangkuban Parahu"
                                            : "Contoh: Momen Epik Pertarungan Roro Jonggrang"
                                    }
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
                                    disabled={isUploadingActive}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ceritakan ringkasan kisah cerita rakyat ini, pesan moral, dan latar budayanya..."
                                    className="w-full px-5 py-3 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F] resize-none"
                                />
                            </div>

                            {/* Resumable Upload Progress Bar & Cancel Button */}
                            {isUploadingActive && (
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
                                            disabled={["ANALYZING", "PUBLISHING", "CANCELLING"].includes(uploadPhase)}
                                            onClick={handleCancelUpload}
                                            className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {uploadPhase === "PUBLISHING" ? "Menunggu hasil publikasi..." : "Batalkan Unggahan"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                disabled={isUploadingActive || !videoFile}
                                onClick={() => handleSubmit(false)}
                                className="flex-1 py-3.5 rounded-full text-xs font-bold text-neutral-800 bg-[#F5F0E0] hover:bg-[#EAE2CE] transition disabled:opacity-50 cursor-pointer"
                            >
                                Simpan Draf Saja
                            </button>
                            <button
                                type="button"
                                disabled={isUploadingActive || !videoFile}
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

import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, Textarea, Notice } from "../../../components/ui/form";
import { Film, Smartphone, Check, UploadCloud, FileVideo, X, ImagePlus, LockKeyhole, ArrowUpRight } from "lucide-react";
import React, { useState, useRef, useEffect, useId } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AnimationPicker from "../../animations/studio/AnimationPicker";
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

export default function UploadPage({ embedded = false, onStatusChange }) {
    const { user } = useAuth();
    const formId = useId();
    const navigate = useNavigate();
    const location = useLocation();

    // Content Type: 'animation' | 'reel' (User selection is sovereign)
    const [contentType, setContentType] = useState("animation");
    const [animationId, setAnimationId] = useState("");
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);

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
            window.dispatchEvent(new Event("nusatales:videos-changed"));
            if (!embedded) navigationTimerRef.current = setTimeout(() => navigate("/studio"), 800);
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

        if (contentType === "animation" && (!animationId || !Number.isInteger(seasonNumber) || seasonNumber < 1 || seasonNumber > 999 || !Number.isInteger(episodeNumber) || episodeNumber < 1 || episodeNumber > 99999)) {
            setErrorMessage("Pilih animasi serta nomor musim dan episode yang valid.");
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
                contentType, animationId, seasonNumber, episodeNumber, publish: shouldPublishImmediately,
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
            window.dispatchEvent(new Event("nusatales:videos-changed"));
            if (!embedded) navigationTimerRef.current = setTimeout(() => navigate("/studio"), 700);
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
                setErrorMessage(`${normalizeSupabaseError(err, "Gagal mengunggah video. Silakan coba lagi.")}${err.cleanupErrors?.length ? " Sebagian draf atau berkas mungkin belum dibersihkan. Periksa penyimpanan dan hubungi administrator jika masalah berulang." : ""}`);
            }
        } finally {
            if (activeOperationRef.current === operation) activeOperationRef.current = null;
        }
    }

    const isUploadingActive = ["ANALYZING", "CREATING_DRAFT", "UPLOADING", "METADATA_SAVED", "PUBLISHING", "CANCELLING"].includes(
        uploadPhase
    );
    const isComplete = ["PUBLISHED", "DRAFT_SAVED"].includes(uploadPhase);

    // A Studio shortcut selects its parent without remounting the persistent
    // upload form. Never retarget an operation that is already running.
    useEffect(() => {
        if (location.pathname !== "/studio/upload" || isUploadingActive || isComplete) return;
        const params = new URLSearchParams(location.search);
        const parent = params.get("animation");
        if (!parent) return;
        const number = Number(params.get("episode") || 1);
        setContentType("animation"); setAnimationId(parent); setSeasonNumber(1);
        setEpisodeNumber(Number.isInteger(number) && number > 0 && number <= 99999 ? number : 1);
    }, [location.key]);

    function startNewUpload() {
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setVideoDuration(null);
        setThumbnailBlob(null);
        setThumbnailPreview(null);
        setPersistedDraftId(null);
        setUploadPhase("IDLE");
        setUploadPercent(0);
        setUploadStep("");
        setErrorMessage("");
        setAspectRatioSuggestion("");
        if (videoInputRef.current) videoInputRef.current.value = "";
        if (thumbInputRef.current) thumbInputRef.current.value = "";
    }

    useEffect(() => {
        onStatusChange?.({ active: isUploadingActive, percent: uploadPercent, phase: uploadPhase });
    }, [onStatusChange, isUploadingActive, uploadPercent, uploadPhase]);

    return <ActionFormLayout embedded={embedded} title="Unggah karya" description="Bagikan ceritamu. Pilih format, tambahkan video, lalu lengkapi informasinya." wide>
        <form onSubmit={(event) => { event.preventDefault(); handleSubmit(true); }}>
        <Notice>{errorMessage && <><p>{errorMessage}</p>{uploadPhase === "PUBLISH_FAILED" && persistedDraftId && <Button variant="outline" busy={isUploadingActive} onClick={handleRetryPublish}>Coba Publikasikan Lagi</Button>}</>}</Notice>
        {isComplete && <Notice tone="success"><p>{uploadStep}</p><div className="ui-notice-actions"><Link to="/studio" className="ui-text-link">Lihat di Studio</Link><Button variant="ghost" onClick={startNewUpload}>Unggah karya lain</Button></div></Notice>}
        <div className="ui-field">
            <span className="ui-section-label">Format karya</span>
            <div className="ui-format-picker" aria-label="Format karya">
                <button type="button" aria-pressed={contentType === "animation"} disabled={isUploadingActive || isComplete} onClick={() => setContentType("animation")}><Film size={19} /><span><strong>Animasi / episode</strong><small>Film atau episode serial</small></span>{contentType === "animation" && <Check size={16} />}</button>
                <button type="button" aria-pressed={contentType === "reel"} disabled={isUploadingActive || isComplete} onClick={() => setContentType("reel")}><Smartphone size={19} /><span><strong>Reels</strong><small>Vertikal / Maks. 3 menit</small></span>{contentType === "reel" && <Check size={16} />}</button>
            </div>
        </div>
        {contentType === "animation" && user?.id && <AnimationPicker userId={user.id} value={animationId} season={seasonNumber} episode={episodeNumber} disabled={isUploadingActive || isComplete} onChange={(id, season, episode) => { setAnimationId(id); setSeasonNumber(season); setEpisodeNumber(episode); }} />}
        {aspectRatioSuggestion && <Notice tone="info">{aspectRatioSuggestion}</Notice>}
        <div className="ui-upload-grid">
            <div className="ui-form">
                <div className="ui-field">
                    <label className="ui-section-label" htmlFor={`${formId}-video`}>Berkas video <span aria-hidden="true">*</span></label>
                    <input id={`${formId}-video`} ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" tabIndex={-1} aria-label="Pilih berkas video" disabled={isUploadingActive || isComplete} onChange={(e) => handleVideoSelected(e.target.files?.[0])} />
                    {!videoFile ? <button type="button" className={`ui-dropzone ${isDragging ? "is-dragging" : ""}`} onClick={() => videoInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleVideoSelected(e.dataTransfer.files?.[0]); }}>
                        <span className="ui-dropzone-icon"><UploadCloud size={24} /></span><strong>Pilih atau tarik video ke sini</strong><span>MP4, WebM, MOV / Maksimal 50 MB</span><span className="ui-dropzone-choose">Pilih berkas</span>
                    </button> : <div className="ui-file-selected"><div className="ui-file-icon"><FileVideo size={22} /></div><div><h4>{videoFile.name}</h4><p>{(videoFile.size / 1000000).toFixed(1)} MB{videoDuration ? ` / ${videoDuration} detik` : " ? Memeriksa video..."}</p></div><Button variant="ghost" disabled={isUploadingActive || isComplete} aria-label="Ganti Video" onClick={() => { setVideoFile(null); setVideoDuration(null); setThumbnailBlob(null); setThumbnailPreview(null); setAspectRatioSuggestion(""); if (videoInputRef.current) videoInputRef.current.value = ""; }}><X size={16} /></Button></div>}
                </div>
                <div className="ui-field">
                    <div className="ui-label-row"><label htmlFor={`${formId}-thumbnail`}>Sampul karya</label><span className="ui-counter">Opsional</span></div>
                    <input id={`${formId}-thumbnail`} ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCustomThumbnail} className="sr-only" tabIndex={-1} disabled={isUploadingActive || isComplete} aria-label="Pilih sampul karya" />
                    <button type="button" className={`ui-thumbnail-picker ${contentType === "reel" ? "ui-thumbnail-portrait" : ""}`} onClick={() => thumbInputRef.current?.click()} disabled={isUploadingActive || isComplete} aria-label={thumbnailPreview ? "Ganti Sampul" : "Pilih Sampul"}>
                        {thumbnailPreview ? <><img src={thumbnailPreview} alt="Pratinjau sampul karya" /><span className="ui-thumbnail-change"><ImagePlus size={15} />Ganti sampul</span></> : <span><ImagePlus size={23} /><strong>Tambahkan sampul</strong><small>JPG, PNG, WebP / Maks. 5 MB</small></span>}
                    </button>
                    <p className="ui-hint">Sampul dibuat otomatis dari video. Kamu juga bisa memakai gambarmu sendiri.</p>
                </div>
            </div>
            <div className="ui-form">
                <Field id={`${formId}-title`} label="Judul karya" required trailing={<span className="ui-counter">{title.length}/120</span>}>
                    <Input id={`${formId}-title`} required maxLength={120} disabled={isUploadingActive || isComplete} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Sangkuriang dan Gunung Tangkuban Parahu" />
                </Field>
                <Field id={`${formId}-description`} label="Deskripsi" hint="Ceritakan kisah, pesan, atau budaya yang menginspirasi karyamu." trailing={<span className="ui-counter">{description.length}/2200</span>}>
                    <Textarea id={`${formId}-description`} rows={6} maxLength={2200} disabled={isUploadingActive || isComplete} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ceritakan ringkasan kisah cerita rakyat ini, pesan moral, dan latar budayanya..." aria-describedby={`${formId}-description-hint`} />
                </Field>
                <div className="ui-info-note"><LockKeyhole size={16} /><p>Draf hanya terlihat olehmu. Pilih <strong>Terbitkan</strong> saat karyamu siap ditonton.</p></div>
            </div>
        </div>
        {isUploadingActive && <section role="status" className="ui-upload-progress"><div><span>{uploadStep}</span><strong>{uploadPercent}%</strong></div><progress max={100} value={uploadPercent} aria-label="Progres unggahan" /><div><span className="ui-hint">Kamu boleh menutup popup saat proses berjalan.</span><Button variant="ghost" disabled={["ANALYZING", "PUBLISHING", "CANCELLING"].includes(uploadPhase)} onClick={handleCancelUpload}>{uploadPhase === "PUBLISHING" ? "Menunggu publikasi..." : "Batalkan Unggahan"}</Button></div></section>}
        <div className="ui-form-footer"><p className="ui-hint">{contentType === "reel" ? "Reels / Maksimal 3 menit" : "Film animasi / Minimal 1 detik"}</p><div className="ui-button-row"><Button variant="outline" disabled={isUploadingActive || !videoFile || !videoDuration || isComplete} onClick={() => handleSubmit(false)}>Simpan Draf Saja</Button><Button type="submit" disabled={isUploadingActive || !videoFile || !videoDuration || isComplete}><ArrowUpRight size={16} />Unggah &amp; Publikasikan</Button></div></div>
        </form>
    </ActionFormLayout>;
}

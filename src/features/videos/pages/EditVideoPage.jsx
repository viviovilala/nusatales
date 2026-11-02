import ActionFormLayout from "../../../components/ActionFormLayout";
import { Button, Field, Input, Textarea, Notice } from "../../../components/ui/form";
import { ArrowUpRight, Film, Loader2 } from "lucide-react";
import { studioDuration } from "../studio/studioTypes";
import { useStorageImageUrl } from "../../../components/StorageImage";
import React, { useState, useEffect, useId, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { videoRepository } from "../videoRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function EditVideoPage({ embedded = false, videoId }) {
    const formId = useId();
    const [canEdit, setCanEdit] = useState(false);
    const params = useParams();
    const id = videoId || params.id;
    const { user } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("draft");
    const [contentType, setContentType] = useState("animation");
    const [thumbnailPath, setThumbnailPath] = useState(null);
    const [durationSeconds, setDurationSeconds] = useState(null);
    const [failedThumbnail, setFailedThumbnail] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const savingRef = useRef(false);

    // Cached popup forms keep unsaved text, but publication/deletion from Studio
    // must be reflected immediately when the same editor is opened again.
    useEffect(() => {
        function sync(event) {
            const change = event.detail;
            if (!change || change.id !== id) return;
            if (change.deleted) {
                setCanEdit(false);
                setSuccessMessage("");
                setErrorMessage("Karya ini sudah dihapus dari Studio.");
            } else if (change.status) setStatus(change.status);
        }
        window.addEventListener("nusatales:videos-changed", sync);
        return () => window.removeEventListener("nusatales:videos-changed", sync);
    }, [id]);

    useEffect(() => {
        let isMounted = true;

        async function fetchVideo() {
            setIsLoading(true);
            try {
                const { data, error } = await videoRepository.getVideoById(id);

                if (error || !data) {
                    if (isMounted) setErrorMessage("Video tidak ditemukan.");
                    return;
                }

                if (data.creator_id !== user?.id) {
                    if (isMounted) setErrorMessage("Anda tidak memiliki hak untuk mengedit video ini.");
                    return;
                }

                if (isMounted) {
                    setCanEdit(true);
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setStatus(data.status || "draft");
                    setContentType(data.content_type || "animation");
                    setThumbnailPath(data.thumbnail_path);
                    setDurationSeconds(data.duration_seconds);
                }
            } catch (err) {
                if (isMounted) setErrorMessage(normalizeSupabaseError(err));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (id && user?.id) {
            fetchVideo();
        }

        return () => {
            isMounted = false;
        };
    }, [id, user?.id]);

    async function handleSave(e) {
        e.preventDefault();
        if (savingRef.current || !canEdit) return;
        setErrorMessage("");
        setSuccessMessage("");

        if (!title.trim()) {
            setErrorMessage("Judul video tidak boleh kosong.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);
        try {
            const { error } = await videoRepository.updateVideo(id, {
                title: title.trim(),
                description: description.trim() || null,
            });

            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal memperbarui informasi karya."));
                return;
            }

            setSuccessMessage("Perubahan informasi berhasil disimpan.");
            window.dispatchEvent(new Event("nusatales:videos-changed"));
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    async function handleTogglePublish() {
        if (savingRef.current || !canEdit) return;
        savingRef.current = true;
        setErrorMessage("");
        setSuccessMessage("");
        setIsSaving(true);

        try {
            if (status === "draft") {
                const { error } = await videoRepository.publishVideo(id);
                if (error) throw error;
                setStatus("published");
                setSuccessMessage("Karya berhasil dipublikasikan ke publik!");
            } else {
                const { error } = await videoRepository.unpublishVideo(id);
                if (error) throw error;
                setStatus("draft");
                setSuccessMessage("Karya berhasil ditarik kembali ke draf.");
            }
            window.dispatchEvent(new Event("nusatales:videos-changed"));
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err, "Gagal mengubah status publikasi."));
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    const thumbUrl = useStorageImageUrl(thumbnailPath);
    const isAnim = contentType === "animation";
    const publicUrl = isAnim ? `/watch/${id}` : `/reels/${id}`;

    return <ActionFormLayout embedded={embedded} title="Edit karya" description="Rapikan informasi karya dan atur siapa yang bisa menontonnya." wide>
        {isLoading ? <div className="ui-loading" role="status"><Loader2 size={22} className="ui-spinner" />Memuat karya...</div> : <>
            <Notice>{errorMessage}</Notice><Notice tone="success">{successMessage}</Notice>
            {canEdit && <div className="ui-editor-grid">
                <aside className="ui-media-summary">
                    <div className={`ui-cover-preview ${!isAnim ? "ui-cover-portrait" : ""}`}>{thumbUrl && failedThumbnail !== thumbUrl ? <img src={thumbUrl} alt={title} onError={() => setFailedThumbnail(thumbUrl)} /> : <div className="ui-cover-empty"><Film size={32} strokeWidth={1.5} /><span>Thumbnail belum tersedia</span></div>}{durationSeconds > 0 && <span className="ui-duration">{studioDuration(durationSeconds)}</span>}</div>
                    <div className="ui-summary-row"><span className="ui-badge">{isAnim ? "Film animasi" : "Reel"}</span><span className={`ui-badge ${status === "published" ? "ui-badge-green" : ""}`}>{status === "published" ? "Dipublikasikan" : "Draf"}</span></div>
                    <p className="ui-hint">{status === "published" ? "Karyamu bisa ditonton semua orang." : "Karya ini hanya dapat dilihat olehmu."}</p>
                    <Button variant="outline" busy={isSaving} onClick={handleTogglePublish}>{status === "published" ? "Tarik ke Draf" : "Publikasikan Karya"}</Button>
                    {status === "published" && <Link to={publicUrl} className="ui-text-link ui-preview-link">Lihat karya <ArrowUpRight size={14} /></Link>}
                </aside>
                <form onSubmit={handleSave} className="ui-form">
                    <Field id={`${formId}-title`} label="Judul karya" required trailing={<span className="ui-counter">{title.length}/120</span>}>
                        <Input id={`${formId}-title`} required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul karya cerita rakyat" disabled={isSaving} />
                    </Field>
                    <Field id={`${formId}-description`} label="Deskripsi" hint="Ceritakan kisah, pesan, dan budaya di balik karyamu.">
                        <Textarea id={`${formId}-description`} rows={7} maxLength={2200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tuliskan deskripsi karya..." disabled={isSaving} aria-describedby={`${formId}-description-hint`} />
                    </Field>
                    <div className="ui-form-footer"><span className="ui-hint">Format dan berkas video tetap tersimpan.</span><Button type="submit" busy={isSaving}>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Button></div>
                </form>
            </div>}
        </>}
    </ActionFormLayout>;
}

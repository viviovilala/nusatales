import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { videoRepository } from "../videoRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function EditVideoPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("draft");
    const [thumbnailPath, setThumbnailPath] = useState(null);
    const [durationSeconds, setDurationSeconds] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

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
                    if (isMounted) setErrorMessage("Anda tidak memiliki akses untuk mengedit video ini.");
                    return;
                }

                if (isMounted) {
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setStatus(data.status || "draft");
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
        setErrorMessage("");
        setSuccessMessage("");

        if (!title.trim()) {
            setErrorMessage("Judul video tidak boleh kosong.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await videoRepository.updateVideo(id, {
                title: title.trim(),
                description: description.trim() || null,
            });

            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal memperbarui video."));
                return;
            }

            setSuccessMessage("Perubahan informasi video berhasil disimpan.");
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleTogglePublish() {
        setErrorMessage("");
        setSuccessMessage("");
        setIsSaving(true);

        try {
            if (status === "draft") {
                const { error } = await videoRepository.publishVideo(id);
                if (error) throw error;
                setStatus("published");
                setSuccessMessage("Video berhasil dipublikasikan ke Reels!");
            } else {
                const { error } = await videoRepository.unpublishVideo(id);
                if (error) throw error;
                setStatus("draft");
                setSuccessMessage("Video ditarik kembali ke draf.");
            }
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err, "Gagal mengubah status publikasi."));
        } finally {
            setIsSaving(false);
        }
    }

    const thumbUrl = videoRepository.getThumbnailPublicUrl(thumbnailPath) || "/poto/hero-roro-action.webp";

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
                <AppNavbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </main>
                <Footer />
            </div>
        );
    }

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
                            Edit Informasi Video
                        </h1>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-6 rounded-2xl px-5 py-4 text-sm bg-red-50 text-red-800 border border-red-200 font-medium">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 rounded-2xl px-5 py-4 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        {successMessage}
                    </div>
                )}

                <div className="grid md:grid-cols-[1fr_1.4fr] gap-8">
                    {/* Thumbnail & Status Preview */}
                    <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm space-y-4">
                        <div className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-neutral-900 shadow-inner">
                            <img
                                src={thumbUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                            {durationSeconds && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-xs font-bold">
                                    {durationSeconds}s
                                </span>
                            )}
                            <div className="absolute bottom-3 left-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        status === "published"
                                            ? "bg-emerald-500 text-white"
                                            : "bg-amber-400 text-amber-950"
                                    }`}
                                >
                                    {status === "published" ? "Dipublikasikan" : "Draf"}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleTogglePublish}
                                className={`w-full py-3 rounded-full text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 ${
                                    status === "published"
                                        ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                        : "bg-[#8DC63F] text-white hover:opacity-90"
                                }`}
                            >
                                {status === "published" ? "Tarik ke Draf (Unpublish)" : "Publikasikan ke Reels"}
                            </button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm flex flex-col justify-between"
                    >
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-600 mb-1 px-1">
                                    Judul Video <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={120}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Judul video animasi"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F]"
                                />
                                <div className="text-right text-[11px] text-neutral-400 mt-1">
                                    {title.length}/120
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1 px-1">
                                    <label className="block text-xs font-semibold text-neutral-600">
                                        Deskripsi Video
                                    </label>
                                    <span className="text-[11px] text-neutral-400">
                                        {description.length}/2200
                                    </span>
                                </div>
                                <textarea
                                    rows={6}
                                    maxLength={2200}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ceritakan tentang kisah atau latar budaya dari video ini..."
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[#F7F3EA] text-neutral-900 text-sm outline-none focus:ring-2 focus:ring-[#8DC63F] resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-100 flex gap-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 py-3.5 rounded-full text-xs font-bold text-white shadow hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: "#8DC63F" }}
                            >
                                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
}

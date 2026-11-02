import StorageImage from "../../../components/StorageImage";
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { useAuth } from "../../auth/AuthProvider";
import { videoRepository } from "../videoRepository";
import OnboardingBanner from "../../profile/components/OnboardingBanner";
import { normalizeSupabaseError } from "../../../lib/errors";

export default function StudioPage() {
    const { user, profile } = useAuth();
    const displayName = profile?.display_name || user?.user_metadata?.display_name || "Kreator";

    const [videos, setVideos] = useState([]);
    const [filter, setFilter] = useState("all"); // 'all' | 'animation' | 'reel' | 'published' | 'draft'
    const [isLoading, setIsLoading] = useState(true);
    const [actionError, setActionError] = useState("");

    // Modal state for delete confirmation
    const [deleteModal, setDeleteModal] = useState({ open: false, video: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStudioVideos = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        setActionError("");

        try {
            const { data, error } = await videoRepository.getMyStudioVideos(user.id);
            if (error) {
                setActionError(normalizeSupabaseError(error, "Gagal memuat video studio."));
                return;
            }
            setVideos(data || []);
        } catch (err) {
            setActionError(normalizeSupabaseError(err));
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadStudioVideos();
    }, [loadStudioVideos]);

    async function handleTogglePublish(video) {
        setActionError("");
        try {
            if (video.status === "draft") {
                const { error } = await videoRepository.publishVideo(video.id);
                if (error) throw error;
            } else {
                const { error } = await videoRepository.unpublishVideo(video.id);
                if (error) throw error;
            }
            await loadStudioVideos();
        } catch (err) {
            setActionError(normalizeSupabaseError(err, "Gagal mengubah status publikasi video."));
        }
    }

    async function handleConfirmDelete() {
        if (!deleteModal.video) return;
        setIsDeleting(true);
        setActionError("");

        try {
            const { error } = await videoRepository.softDeleteVideo(deleteModal.video.id);
            if (error) throw error;
            setDeleteModal({ open: false, video: null });
            await loadStudioVideos();
        } catch (err) {
            setActionError(normalizeSupabaseError(err, "Gagal menghapus video."));
        } finally {
            setIsDeleting(false);
        }
    }

    const filteredVideos = videos.filter((v) => {
        if (filter === "animation") return v.content_type === "animation";
        if (filter === "reel") return v.content_type === "reel";
        if (filter === "published") return v.status === "published";
        if (filter === "draft") return v.status === "draft";
        return true;
    });

    const animationCount = videos.filter((v) => v.content_type === "animation").length;
    const reelCount = videos.filter((v) => v.content_type === "reel").length;
    const publishedCount = videos.filter((v) => v.status === "published").length;
    const draftCount = videos.filter((v) => v.status === "draft").length;

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
                <OnboardingBanner />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                            Studio Kreator NusaTales
                        </span>
                        <h1
                            className="text-3xl font-black text-[#3B2A0E] mt-0.5"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Halo, {displayName}
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Kelola portofolio film animasi budaya, video reels, dan status publikasi karya Anda.
                        </p>
                    </div>

                    <Link
                        to="/studio/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-neutral-950 shadow transition hover:opacity-95 self-start md:self-auto cursor-pointer"
                        style={{ backgroundColor: "#8DC63F" }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Unggah Karya Baru
                    </Link>
                </div>

                {actionError && (
                    <div className="mb-6 rounded-2xl px-5 py-4 text-sm bg-red-50 text-red-800 border border-red-200 font-medium">
                        {actionError}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 border-b border-amber-200/80 pb-3 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            filter === "all"
                                ? "bg-amber-900 text-white"
                                : "text-neutral-600 hover:bg-amber-100/60"
                        }`}
                    >
                        Semua ({videos.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("animation")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            filter === "animation"
                                ? "bg-amber-800 text-white"
                                : "text-neutral-600 hover:bg-amber-100/60"
                        }`}
                    >
                        Film Animasi ({animationCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("reel")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            filter === "reel"
                                ? "bg-amber-800 text-white"
                                : "text-neutral-600 hover:bg-amber-100/60"
                        }`}
                    >
                        Reels ({reelCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("published")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            filter === "published"
                                ? "bg-emerald-600 text-white"
                                : "text-neutral-600 hover:bg-amber-100/60"
                        }`}
                    >
                        Dipublikasikan ({publishedCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("draft")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            filter === "draft"
                                ? "bg-amber-600 text-white"
                                : "text-neutral-600 hover:bg-amber-100/60"
                        }`}
                    >
                        Draf ({draftCount})
                    </button>
                </div>

                {/* Videos List Container */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-amber-200/70 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm font-medium text-neutral-600">Memuat karya studio Anda...</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/70 shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                <line x1="7" y1="2" x2="7" y2="22" />
                                <line x1="17" y1="2" x2="17" y2="22" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">
                            Belum Ada Karya dalam Kategori Ini
                        </h3>
                        <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
                            Unggah karya cerita daerah Anda dalam format Film Animasi (Horizontal) atau Reels (Vertikal).
                        </p>
                        <Link
                            to="/studio/upload"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-neutral-950 shadow hover:opacity-95"
                            style={{ backgroundColor: "#8DC63F" }}
                        >
                            Unggah Karya Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredVideos.map((video) => {
                            const isPub = video.status === "published";
                            const isAnim = video.content_type === "animation";
                            const formattedDate = new Date(video.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            });

                            const watchLink = isAnim ? `/watch/${video.id}` : `/reels/${video.id}`;

                            return (
                                <div
                                    key={video.id}
                                    className="bg-white rounded-3xl p-5 border border-amber-200/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:shadow-md transition"
                                >
                                    {/* Thumbnail + Details */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`relative rounded-2xl overflow-hidden bg-neutral-900 shrink-0 ${
                                            isAnim ? "w-32 h-20 sm:w-36 sm:h-24 aspect-video" : "w-20 h-28 sm:w-24 sm:h-32 aspect-[9/14]"
                                        }`}>
                                            <StorageImage
                                                path={video.thumbnail_path}
                                                fallbackSrc="/poto/hero-roro-action.webp"
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {video.duration_seconds && (
                                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                                                    {video.duration_seconds}s
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                        isAnim
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    {isAnim ? "🎬 Animasi" : "📱 Reel"}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                        isPub
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {isPub ? "Dipublikasikan" : "Draf"}
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    • {formattedDate}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-[#3B2A0E] truncate mb-1">
                                                {video.title}
                                            </h3>

                                            <p className="text-xs text-neutral-500 line-clamp-2 max-w-xl">
                                                {video.description || "Belum ada deskripsi."}
                                            </p>

                                            {isPub && (
                                                <Link
                                                    to={watchLink}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:underline mt-2"
                                                >
                                                    {isAnim ? "Tonton di Player Animasi →" : "Buka di Reels →"}
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePublish(video)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-sm cursor-pointer ${
                                                isPub
                                                    ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                                    : "bg-[#8DC63F] text-neutral-950 hover:opacity-90"
                                            }`}
                                        >
                                            {isPub ? "Tarik ke Draf" : "Publikasikan"}
                                        </button>

                                        <Link
                                            to={`/studio/videos/${video.id}/edit`}
                                            className="px-4 py-2 rounded-full text-xs font-bold text-neutral-800 bg-[#F5F0E0] hover:bg-[#EAE2CE] transition"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => setDeleteModal({ open: true, video })}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
                                            title="Hapus Video"
                                            aria-label="Hapus Video"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-100">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg text-center text-neutral-900 mb-2">
                            Hapus Karya Ini?
                        </h3>
                        <p className="text-xs text-neutral-600 text-center mb-6">
                            Karya <span className="font-bold text-neutral-800">"{deleteModal.video?.title}"</span> akan ditarik dari studio dan katalog publik.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteModal({ open: false, video: null })}
                                className="flex-1 py-2.5 rounded-full text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow transition cursor-pointer"
                            >
                                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

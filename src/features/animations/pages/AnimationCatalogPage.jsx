import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { videoRepository } from "../../videos/videoRepository";

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}j ${mins.toString().padStart(2, "0")}m`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AnimationCatalogPage() {
    const [animations, setAnimations] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    const categories = [
        { id: "all", label: "Semua Cerita" },
        { id: "legenda", label: "Legenda Daerah" },
        { id: "fabel", label: "Fabel & Dongeng" },
        { id: "mitologi", label: "Mitologi & Pahlawan" },
    ];

    const fetchAnimations = useCallback(async (query = "") => {
        setIsLoading(true);
        try {
            const { data, count } = await videoRepository.getAnimationCatalog({
                limit: 24,
                offset: 0,
                search: query,
            });
            setAnimations(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error("[AnimationCatalogPage] Error fetching catalog:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnimations();
    }, [fetchAnimations]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchAnimations(searchQuery);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            {/* Hero Banner */}
            <section className="bg-gradient-to-b from-[#3B2A0E] to-[#261A07] text-white pt-12 pb-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-2xl space-y-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🎬 Film Animasi Budaya Nusantara
                            </span>
                            <h1
                                className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-100 leading-tight"
                                style={{ fontFamily: "Georgia, serif" }}
                            >
                                Katalog Cerita Rakyat & Sinema Animasi
                            </h1>
                            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                                Saksikan karya film animasi bertema legenda, mitologi, dan kearifan lokal dari seluruh penjuru Indonesia dalam tayangan horizontal berkualitas tinggi.
                            </p>

                            {/* Search Bar */}
                            <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2 max-w-lg">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari judul cerita (misal: Sangkuriang, Roro Jonggrang)..."
                                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-white placeholder-neutral-400 text-xs sm:text-sm border border-white/15 outline-none focus:ring-2 focus:ring-[#8DC63F]"
                                    />
                                    <svg
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </div>
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-neutral-950 bg-[#8DC63F] hover:bg-[#7db534] transition shadow-md cursor-pointer shrink-0"
                                >
                                    Cari
                                </button>
                            </form>
                        </div>

                        <div className="hidden md:block w-72 shrink-0">
                            <img
                                src="/poto/splash-baca.webp"
                                alt="Animasi Budaya"
                                className="w-full h-auto object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Catalog Grid Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
                {/* Category Pills & Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    selectedCategory === cat.id
                                        ? "bg-[#3B2A0E] text-white shadow"
                                        : "bg-white text-neutral-700 hover:bg-amber-100/60 border border-amber-200/60"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="text-xs font-semibold text-neutral-600">
                        Menampilkan {animations.length} dari {totalCount} animasi
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-amber-200/70 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm font-medium text-neutral-600">Memuat katalog animasi...</p>
                    </div>
                ) : animations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-200/70 shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">
                            {searchQuery ? "Animasi Tidak Ditemukan" : "Belum Ada Film Animasi"}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6">
                            {searchQuery
                                ? `Tidak ada film animasi dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
                                : "Belum ada karya animasi cerita rakyat berdurasi penuh yang dipublikasikan. Anda dapat mengunggah animasi pertama di Studio!"}
                        </p>
                        <div className="flex justify-center gap-3">
                            {searchQuery ? (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        fetchAnimations("");
                                    }}
                                    className="px-5 py-2.5 rounded-full text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200"
                                >
                                    Reset Pencarian
                                </button>
                            ) : (
                                <Link
                                    to="/studio/upload"
                                    className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow hover:opacity-95"
                                    style={{ backgroundColor: "#8DC63F" }}
                                >
                                    Unggah Animasi Sekarang
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {animations.map((video) => {
                            const thumb = video.thumbnailUrl || "/poto/hero-roro-action.webp";
                            const formattedDate = new Date(video.publishedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            });

                            return (
                                <Link
                                    key={video.id}
                                    to={`/watch/${video.id}`}
                                    className="group bg-white rounded-3xl overflow-hidden border border-amber-200/70 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                                >
                                    {/* 16:9 Thumbnail Box */}
                                    <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                                        <img
                                            src={thumb}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-[#8DC63F] text-neutral-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition duration-300">
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* Duration Badge */}
                                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[11px] font-bold backdrop-blur-xs">
                                            {formatDuration(video.durationSeconds)}
                                        </span>
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-base text-[#3B2A0E] group-hover:text-amber-700 transition line-clamp-2 leading-snug mb-1.5">
                                                {video.title}
                                            </h3>
                                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-4">
                                                {video.description || "Animasi budaya cerita rakyat Nusantara."}
                                            </p>
                                        </div>

                                        {/* Creator & Date */}
                                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-amber-200 text-amber-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                    {video.creator?.avatarUrl ? (
                                                        <img
                                                            src={video.creator.avatarUrl}
                                                            alt={video.creator.displayName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        (video.creator?.displayName || "K").charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="font-semibold text-neutral-700 truncate">
                                                    {video.creator?.displayName}
                                                </span>
                                            </div>
                                            <span className="text-neutral-400 shrink-0">
                                                {formattedDate}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { reelsRepository } from "../reelsRepository";
import ReelItem from "../components/ReelItem";

const PAGE_SIZE = 10;

export default function ReelsPage() {
    const { videoId } = useParams();
    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [notFoundNotice, setNotFoundNotice] = useState("");

    const lastWheelTime = useRef(0);
    const touchStartY = useRef(0);
    const currentOffsetRef = useRef(0);

    // Initial feed load (or deep link load)
    const loadInitialFeed = useCallback(async () => {
        setIsLoading(true);
        setNotFoundNotice("");
        currentOffsetRef.current = 0;

        try {
            let initialVideos = [];

            // If deep linked to specific video
            if (videoId) {
                const { data: requestedVideo } = await reelsRepository.getPublishedVideoById(videoId);

                if (requestedVideo) {
                    // If content is an Animation, redirect safely to the cinema player
                    if (requestedVideo.contentType === "animation") {
                        navigate(`/watch/${videoId}`, { replace: true });
                        return;
                    }
                    initialVideos.push(requestedVideo);
                } else {
                    setNotFoundNotice(
                        "Video Reel yang diminta tidak ditemukan atau belum dipublikasikan."
                    );
                }
            }

            // Fetch general published reels feed
            const { data: feedData } = await reelsRepository.getFeedVideos({
                limit: PAGE_SIZE,
                offset: 0,
            });

            const rawQueryCount = (feedData || []).length;
            const existingIds = new Set(initialVideos.map((v) => v.id));
            const freshFeed = (feedData || []).filter((v) => !existingIds.has(v.id));
            const merged = [...initialVideos, ...freshFeed];

            setVideos(merged);
            setActiveIndex(0);
            currentOffsetRef.current = rawQueryCount;
            setHasMore(rawQueryCount === PAGE_SIZE);
        } catch (err) {
            console.error("[ReelsPage] Feed error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        loadInitialFeed();
    }, [loadInitialFeed]);

    // Load next page of reels when near the end
    const loadMoreReels = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextOffset = currentOffsetRef.current;
            const { data: nextBatch } = await reelsRepository.getFeedVideos({
                limit: PAGE_SIZE,
                offset: nextOffset,
            });

            if (!nextBatch || nextBatch.length === 0) {
                setHasMore(false);
                return;
            }

            setVideos((prev) => {
                const existing = new Set(prev.map((v) => v.id));
                const filtered = nextBatch.filter((v) => !existing.has(v.id));
                return [...prev, ...filtered];
            });

            currentOffsetRef.current += nextBatch.length;
            if (nextBatch.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } catch (err) {
            console.error("[ReelsPage] Load more error:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore]);

    // Pre-fetch when user is within 2 videos of the end
    useEffect(() => {
        if (videos.length > 0 && activeIndex >= videos.length - 2 && hasMore && !isLoadingMore) {
            loadMoreReels();
        }
    }, [activeIndex, videos.length, hasMore, isLoadingMore, loadMoreReels]);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => Math.min(videos.length - 1, prev + 1));
    }, [videos.length]);

    // Keyboard navigation (ArrowUp, ArrowDown, Mute)
    useEffect(() => {
        function handleKeyDown(e) {
            if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

            if (e.key === "ArrowDown" || e.key === "PageDown") {
                e.preventDefault();
                goToNext();
            } else if (e.key === "ArrowUp" || e.key === "PageUp") {
                e.preventDefault();
                goToPrev();
            } else if (e.key === "m" || e.key === "M") {
                setIsMuted((prev) => !prev);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrev]);

    // Mouse wheel navigation
    const handleWheel = (e) => {
        const now = Date.now();
        if (now - lastWheelTime.current < 450) return;

        if (e.deltaY > 30) {
            lastWheelTime.current = now;
            goToNext();
        } else if (e.deltaY < -30) {
            lastWheelTime.current = now;
            goToPrev();
        }
    };

    // Touch swipe navigation
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY.current - touchEndY;

        if (Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                goToNext();
            } else {
                goToPrev();
            }
        }
    };

    return (
        <div className="h-screen w-screen bg-black flex flex-col overflow-hidden text-white select-none">
            {/* Top Navigation Bar */}
            <div className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition text-xs font-bold text-white border border-white/10"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            <span>Beranda</span>
                        </Link>

                        <Link
                            to="/animations"
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition text-xs font-bold text-amber-200 border border-white/10"
                        >
                            <span>Katalog Animasi</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/studio/upload"
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-neutral-950 bg-[#8DC63F] hover:bg-[#7db534] shadow-md transition"
                        >
                            + Unggah Karya
                        </Link>
                    </div>
                </div>
            </div>

            {/* Notice for missing deep link */}
            {notFoundNotice && (
                <div className="absolute top-16 inset-x-4 z-40 max-w-md mx-auto bg-amber-900/90 border border-amber-600 text-amber-100 text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between">
                    <span>{notFoundNotice}</span>
                    <button
                        onClick={() => setNotFoundNotice("")}
                        className="text-amber-200 hover:text-white ml-2 text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main Reels Viewer Area */}
            <main
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex-1 relative flex items-center justify-center overflow-hidden"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-amber-200">Memuat Reels Cerita Rakyat...</p>
                    </div>
                ) : videos.length === 0 ? (
                    /* True Empty State */
                    <div className="max-w-sm w-full mx-4 bg-neutral-900/90 border border-neutral-800 rounded-4xl p-8 text-center backdrop-blur-md shadow-2xl">
                        <img
                            src="/poto/splash-senyum.webp"
                            className="w-24 h-auto mx-auto mb-4 object-contain"
                            alt="Maskot NusaTales"
                        />
                        <h2
                            className="text-2xl font-bold text-amber-100 mb-2"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Belum Ada Video Reels
                        </h2>
                        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                            Belum ada video pendek budaya yang dipublikasikan. Jadilah kreator pertama yang membagikan reel kisah rakyat ke NusaTales!
                        </p>
                        <div className="flex flex-col gap-2.5">
                            <Link
                                to="/studio/upload"
                                className="w-full py-3 rounded-full text-xs font-bold text-neutral-950 bg-[#8DC63F] hover:bg-[#7db534] transition shadow-md"
                            >
                                Mulai Unggah Reel
                            </Link>
                            <Link
                                to="/animations"
                                className="w-full py-2.5 rounded-full text-xs font-semibold text-neutral-400 hover:text-white transition"
                            >
                                Jelajahi Film Animasi
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[440px] h-full flex items-center justify-center">
                        {videos.map((video, idx) => (
                            <div
                                key={video.id}
                                className={`absolute inset-0 transition-opacity duration-300 ${
                                    idx === activeIndex
                                        ? "opacity-100 pointer-events-auto z-10"
                                        : "opacity-0 pointer-events-none z-0"
                                }`}
                            >
                                <ReelItem
                                    video={video}
                                    isActive={idx === activeIndex}
                                    isMuted={isMuted}
                                    onToggleMute={() => setIsMuted((prev) => !prev)}
                                />
                            </div>
                        ))}

                        {/* Desktop Navigation Arrows */}
                        {videos.length > 1 && (
                            <div className="hidden lg:flex flex-col gap-3 absolute -right-16 top-1/2 -translate-y-1/2 z-30">
                                <button
                                    type="button"
                                    disabled={activeIndex === 0}
                                    onClick={goToPrev}
                                    className="w-10 h-10 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer shadow-lg border border-neutral-700"
                                    title="Video Sebelumnya (Arrow Up)"
                                    aria-label="Video Sebelumnya"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M18 15l-6-6-6 6" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    disabled={activeIndex === videos.length - 1}
                                    onClick={goToNext}
                                    className="w-10 h-10 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer shadow-lg border border-neutral-700"
                                    title="Video Selanjutnya (Arrow Down)"
                                    aria-label="Video Selanjutnya"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

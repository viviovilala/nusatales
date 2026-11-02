import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import { videoRepository } from "../../videos/videoRepository";
import { interactionRepository } from "../../interactions/interactionRepository";
import { useAuth } from "../../auth/AuthProvider";
import { normalizeSupabaseError } from "../../../lib/errors";

function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function WatchAnimationPage() {
    const { videoId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);

    const [video, setVideo] = useState(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // Video Player Controls
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimerRef = useRef(null);

    // Likes & Comments stats
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isLikePending, setIsLikePending] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // 1. Fetch Video Record & Signed Media URL
    useEffect(() => {
        let isMounted = true;

        async function fetchVideoData() {
            if (!videoId) return;
            setIsLoading(true);
            setErrorMessage("");

            try {
                const { data, error } = await videoRepository.getVideoById(videoId);
                if (error || !data) {
                    if (isMounted) setErrorMessage("Video animasi tidak ditemukan atau belum dipublikasikan.");
                    return;
                }

                if (isMounted) {
                    setVideo(data);
                }

                // Resolve signed media URL
                if (data.storage_path) {
                    const signed = await videoRepository.getMediaSignedUrl(data.storage_path, 7200);
                    if (isMounted && signed) {
                        setMediaUrl(signed);
                    }
                }
            } catch (err) {
                if (isMounted) setErrorMessage(normalizeSupabaseError(err));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchVideoData();

        return () => {
            isMounted = false;
        };
    }, [videoId]);

    // 2. Fetch Interactions (Likes & Comments)
    useEffect(() => {
        let isMounted = true;

        async function loadInteractions() {
            if (!videoId) return;
            try {
                const [likeStats, commentsData] = await Promise.all([
                    interactionRepository.getLikeStats(videoId, user?.id),
                    interactionRepository.getComments(videoId),
                ]);

                if (isMounted) {
                    setLikesCount(likeStats.count || 0);
                    setHasLiked(likeStats.hasLiked || false);
                    setComments((commentsData.data || []));
                }
            } catch (err) {
                console.error("[WatchAnimationPage] Error loading interactions:", err);
            }
        }

        loadInteractions();

        return () => {
            isMounted = false;
        };
    }, [videoId, user?.id]);

    // 3. Resume playback position from localStorage
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid || !videoId) return;

        const handleLoadedMetadata = () => {
            setDuration(vid.duration || 0);
            const savedTime = localStorage.getItem(`nusatales_watch_${videoId}`);
            if (savedTime) {
                const parsed = parseFloat(savedTime);
                if (parsed > 5 && parsed < (vid.duration || 0) - 10) {
                    vid.currentTime = parsed;
                    setCurrentTime(parsed);
                    setToastMessage(`Melanjutkan pemutaran di ${formatTime(parsed)}`);
                    setTimeout(() => setToastMessage(""), 3000);
                }
            }
        };

        vid.addEventListener("loadedmetadata", handleLoadedMetadata);
        return () => vid.removeEventListener("loadedmetadata", handleLoadedMetadata);
    }, [videoId, mediaUrl]);

    // 4. Save playback position periodically
    const handleTimeUpdate = () => {
        const vid = videoRef.current;
        if (!vid) return;

        setCurrentTime(vid.currentTime);
        if (Math.floor(vid.currentTime) % 4 === 0 && vid.currentTime > 2) {
            localStorage.setItem(`nusatales_watch_${videoId}`, vid.currentTime.toString());
        }
    };

    // Playback Controls
    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;

        if (vid.paused) {
            vid.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
            vid.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const vid = videoRef.current;
        if (!vid) return;

        const seekTime = parseFloat(e.target.value);
        vid.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const toggleMute = () => {
        const vid = videoRef.current;
        if (!vid) return;

        const nextMuted = !isMuted;
        vid.muted = nextMuted;
        setIsMuted(nextMuted);
    };

    const handleVolumeChange = (e) => {
        const vid = videoRef.current;
        if (!vid) return;

        const val = parseFloat(e.target.value);
        vid.volume = val;
        setVolume(val);
        vid.muted = val === 0;
        setIsMuted(val === 0);
    };

    const toggleFullscreen = () => {
        const container = playerContainerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    // Like Toggle
    const handleToggleLike = async () => {
        if (!isAuthenticated || !user?.id) {
            setToastMessage("Silakan masuk untuk menyukai animasi.");
            setTimeout(() => setToastMessage(""), 2500);
            return;
        }

        if (isLikePending) return;

        const prevLiked = hasLiked;
        const prevCount = likesCount;

        setHasLiked(!prevLiked);
        setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
        setIsLikePending(true);

        try {
            const { error } = await interactionRepository.toggleLike(videoId, user.id, prevLiked);
            if (error) throw error;
        } catch (err) {
            setHasLiked(prevLiked);
            setLikesCount(prevCount);
        } finally {
            setIsLikePending(false);
        }
    };

    // Share handler
    const handleShare = async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video?.title || "NusaTales Animasi",
                    text: `Tonton animasi cerita rakyat "${video?.title}" di NusaTales!`,
                    url: shareUrl,
                });
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setToastMessage("Tautan animasi berhasil disalin!");
                setTimeout(() => setToastMessage(""), 2500);
            } catch {
                setToastMessage("Gagal menyalin tautan.");
                setTimeout(() => setToastMessage(""), 2500);
            }
        }
    };

    // Comment Submission
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user?.id || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            const { data, error } = await interactionRepository.addComment(videoId, user.id, commentText);
            if (error) throw error;
            if (data) {
                setComments((prev) => [data, ...prev]);
                setCommentText("");
            }
        } catch (err) {
            console.error("Comment submit error:", err);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user?.id) return;
        try {
            const { error } = await interactionRepository.deleteComment(commentId, user.id);
            if (error) throw error;
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            console.error("Delete comment error:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#1A1208] text-white">
                <AppNavbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </main>
                <Footer />
            </div>
        );
    }

    if (errorMessage || !video) {
        return (
            <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
                <AppNavbar />
                <main className="flex-1 max-w-xl w-full mx-auto px-6 py-20 text-center">
                    <div className="bg-white rounded-3xl p-10 border border-amber-200/80 shadow-md">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            ✕
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Animasi Tidak Ditemukan</h2>
                        <p className="text-sm text-neutral-600 mb-6">{errorMessage || "Video ini tidak tersedia."}</p>
                        <Link
                            to="/animations"
                            className="inline-block px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#8DC63F] shadow hover:opacity-95"
                        >
                            Kembali ke Katalog Animasi
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const creatorName = video.creator?.display_name || "Kreator NusaTales";
    const creatorUsername = video.creator?.username;
    const creatorAvatar = videoRepository.getThumbnailPublicUrl(video.creator?.avatar_path);

    return (
        <div className="min-h-screen flex flex-col bg-[#140E06] text-white">
            <AppNavbar />

            {/* Toast Notice */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-2xl">
                    {toastMessage}
                </div>
            )}

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
                {/* 16:9 Cinema Video Player Box */}
                <div
                    ref={playerContainerRef}
                    onMouseMove={handleMouseMove}
                    className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none"
                >
                    {mediaUrl ? (
                        <video
                            ref={videoRef}
                            src={mediaUrl}
                            poster={videoRepository.getThumbnailPublicUrl(video.thumbnail_path) || undefined}
                            playsInline
                            onTimeUpdate={handleTimeUpdate}
                            onClick={togglePlay}
                            className="w-full h-full object-contain cursor-pointer"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Big Center Play Icon (shown when paused) */}
                    {!isPlaying && mediaUrl && (
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/60 hover:bg-[#8DC63F] hover:text-neutral-950 text-white flex items-center justify-center transition-all duration-200 transform scale-100 hover:scale-110 shadow-2xl cursor-pointer"
                        >
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="6 4 20 12 6 20" />
                            </svg>
                        </button>
                    )}

                    {/* Bottom Controls Bar */}
                    <div
                        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 transition-opacity duration-300 ${
                            showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        {/* Progress Scrubber Bar */}
                        <div className="mb-3 flex items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-[#8DC63F] cursor-pointer"
                            />
                        </div>

                        {/* Control buttons row */}
                        <div className="flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="p-1 hover:text-amber-400 transition cursor-pointer"
                                    title={isPlaying ? "Jeda (Pause)" : "Putar (Play)"}
                                >
                                    {isPlaying ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="6" y="4" width="4" height="16" />
                                            <rect x="14" y="4" width="4" height="16" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21" />
                                        </svg>
                                    )}
                                </button>

                                {/* Volume & Mute */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="p-1 hover:text-amber-400 transition cursor-pointer"
                                    >
                                        {isMuted || volume === 0 ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                            </svg>
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-16 h-1 rounded-full appearance-none bg-white/30 accent-amber-400 cursor-pointer hidden sm:block"
                                    />
                                </div>

                                {/* Time display */}
                                <span className="font-mono text-neutral-300">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="p-1 hover:text-amber-400 transition cursor-pointer"
                                    title="Layar Penuh"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 3 21 3 21 9" />
                                        <polyline points="9 21 3 21 3 15" />
                                        <line x1="21" y1="3" x2="14" y2="10" />
                                        <line x1="3" y1="21" x2="10" y2="14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video Info Section */}
                <div className="mt-6 flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-neutral-800">
                    <div className="flex-1 space-y-2">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Film Animasi
                        </span>
                        <h1
                            className="text-2xl sm:text-3xl font-black text-amber-100 leading-tight"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            {video.title}
                        </h1>

                        {/* Creator Card */}
                        <div className="flex items-center gap-3 pt-2">
                            <Link
                                to={creatorUsername ? `/u/${creatorUsername}` : "#"}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-200 text-amber-950 font-bold flex items-center justify-center shrink-0 border border-white/20">
                                    {creatorAvatar ? (
                                        <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
                                    ) : (
                                        creatorName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-neutral-100 group-hover:text-amber-300 transition">
                                        {creatorName}
                                    </h4>
                                    {creatorUsername && (
                                        <p className="text-xs text-neutral-400 font-mono">@{creatorUsername}</p>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Interaction Buttons (Like & Share) */}
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                        <button
                            type="button"
                            onClick={handleToggleLike}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-md border cursor-pointer ${
                                hasLiked
                                    ? "bg-rose-600/30 border-rose-500 text-rose-400"
                                    : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                            }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{likesCount} Suka</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition shadow-md cursor-pointer"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            <span>Bagikan</span>
                        </button>
                    </div>
                </div>

                {/* Description & Comments Layout */}
                <div className="mt-6 grid md:grid-cols-[1.4fr_1fr] gap-8">
                    {/* Description Block */}
                    <div className="bg-neutral-900/60 rounded-3xl p-6 border border-neutral-800 space-y-3">
                        <h3 className="font-bold text-sm text-amber-200 uppercase tracking-wider">
                            Sinopsis & Latar Cerita
                        </h3>
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {video.description || "Belum ada sinopsis untuk film animasi ini."}
                        </p>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-neutral-900/60 rounded-3xl p-6 border border-neutral-800 flex flex-col h-[480px]">
                        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                            <h3 className="font-bold text-sm text-white">Komentar Penonton</h3>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                                {comments.length}
                            </span>
                        </div>

                        {/* Comments list */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                            {comments.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500">
                                    <p className="text-xs">Belum ada komentar. Jadilah penonton pertama yang memberi tanggapan!</p>
                                </div>
                            ) : (
                                comments.map((c) => {
                                    const isOwner = user?.id === c.user_id;
                                    return (
                                        <div key={c.id} className="flex items-start gap-3 group">
                                            <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0">
                                                {c.user?.displayName?.charAt(0).toUpperCase() || "P"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-xs text-neutral-200 truncate">
                                                        {c.user?.displayName || "Penonton"}
                                                    </span>
                                                    {isOwner && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteComment(c.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:underline cursor-pointer"
                                                        >
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed break-words">
                                                    {c.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="pt-3 border-t border-neutral-800">
                            {isAuthenticated ? (
                                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        maxLength={500}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Beri apresiasi atau tanggapan cerita..."
                                        className="flex-1 px-4 py-2.5 rounded-full bg-neutral-800 text-white placeholder-neutral-500 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmittingComment || !commentText.trim()}
                                        className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-950 bg-[#8DC63F] hover:bg-[#7db534] transition disabled:opacity-40 cursor-pointer shrink-0"
                                    >
                                        Kirim
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-2">
                                    <Link
                                        to="/login"
                                        className="text-xs font-bold text-amber-400 hover:underline"
                                    >
                                        Masuk untuk memberikan komentar →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

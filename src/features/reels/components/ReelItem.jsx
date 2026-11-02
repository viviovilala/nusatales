import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { reelsRepository } from "../reelsRepository";

export default function ReelItem({ video, isActive, isMuted, onToggleMute }) {
    const videoRef = useRef(null);
    const [mediaUrl, setMediaUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [expandedDesc, setExpandedDesc] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    // Resolve signed media URL when video becomes active
    useEffect(() => {
        let isMounted = true;

        async function resolveUrl() {
            if (!video.storagePath) return;
            try {
                const url = await reelsRepository.getSignedVideoUrl(video.storagePath);
                if (isMounted && url) {
                    setMediaUrl(url);
                }
            } catch (err) {
                console.error("[ReelItem] Error resolving signed URL:", err);
            }
        }

        if (isActive && !mediaUrl) {
            resolveUrl();
        }

        return () => {
            isMounted = false;
        };
    }, [isActive, video.storagePath, mediaUrl]);

    // Handle play / pause based on isActive
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        if (isActive && mediaUrl) {
            vid.currentTime = 0;
            const playPromise = vid.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => {
                        // Autoplay policy fallback: try muted
                        vid.muted = true;
                        vid.play()
                            .then(() => setIsPlaying(true))
                            .catch(() => setIsPlaying(false));
                    });
            }
        } else {
            vid.pause();
            setIsPlaying(false);
        }
    }, [isActive, mediaUrl]);

    function handleVideoClick() {
        const vid = videoRef.current;
        if (!vid) return;

        if (vid.paused) {
            vid.play()
                .then(() => {
                    setIsPlaying(true);
                    triggerPlayIcon();
                })
                .catch(() => {});
        } else {
            vid.pause();
            setIsPlaying(false);
            triggerPlayIcon();
        }
    }

    function triggerPlayIcon() {
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);
    }

    function handleTimeUpdate() {
        const vid = videoRef.current;
        if (!vid || !vid.duration) return;
        const currentProgress = (vid.currentTime / vid.duration) * 100;
        setProgress(currentProgress);
    }

    async function handleShare(e) {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/reels/${video.id}`;
        const shareData = {
            title: video.title,
            text: `Tonton animasi cerita rakyat "${video.title}" di NusaTales!`,
            url: shareUrl,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                // User cancelled or unsupported
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setToastMessage("Tautan video berhasil disalin!");
                setTimeout(() => setToastMessage(""), 2500);
            } catch {
                setToastMessage("Gagal menyalin tautan.");
                setTimeout(() => setToastMessage(""), 2500);
            }
        }
    }

    const creatorInitial = (video.creator?.displayName || "K").charAt(0).toUpperCase();

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none">
            {/* Video or Poster element */}
            {mediaUrl ? (
                <video
                    ref={videoRef}
                    src={mediaUrl}
                    poster={video.thumbnailUrl || undefined}
                    playsInline
                    loop
                    muted={isMuted}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={handleVideoClick}
                    className="w-full h-full object-contain cursor-pointer"
                />
            ) : (
                <div
                    onClick={handleVideoClick}
                    className="relative w-full h-full flex items-center justify-center cursor-pointer bg-neutral-900"
                >
                    {video.thumbnailUrl && (
                        <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-contain opacity-70"
                        />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            )}

            {/* Buffering Indicator */}
            {isBuffering && mediaUrl && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-amber-400/90 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Tap feedback Play/Pause overlay */}
            {showPlayIcon && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-ping">
                    <div className="w-20 h-20 rounded-full bg-black/50 text-white flex items-center justify-center">
                        {isPlaying ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Toast notification banner */}
            {toastMessage && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-neutral-700 animate-fade">
                    {toastMessage}
                </div>
            )}

            {/* Right Action Bar */}
            <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5">
                {/* Audio toggle button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMute();
                    }}
                    className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer border border-white/10"
                    title={isMuted ? "Aktifkan Suara" : "Bisukan"}
                    aria-label={isMuted ? "Aktifkan Suara" : "Bisukan"}
                >
                    {isMuted ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                    )}
                </button>

                {/* Share button */}
                <button
                    type="button"
                    onClick={handleShare}
                    className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer border border-white/10"
                    title="Bagikan Cerita"
                    aria-label="Bagikan Cerita"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                </button>
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Bottom Info Bar: Creator & Title */}
            <div className="absolute left-4 right-20 bottom-7 z-20 text-white pointer-events-auto">
                {/* Creator info */}
                <Link
                    to={video.creator?.username ? `/u/${video.creator.username}` : "#"}
                    className="inline-flex items-center gap-2.5 mb-2 group"
                >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-200 border-2 border-white/60 flex items-center justify-center text-amber-950 font-bold text-xs shrink-0">
                        {video.creator?.avatarUrl ? (
                            <img
                                src={video.creator.avatarUrl}
                                alt={video.creator.displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{creatorInitial}</span>
                        )}
                    </div>
                    <div className="leading-tight">
                        <p className="font-bold text-sm text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                            {video.creator?.displayName}
                        </p>
                        {video.creator?.username && (
                            <p className="text-[11px] text-white/70 font-mono">
                                @{video.creator.username}
                            </p>
                        )}
                    </div>
                </Link>

                {/* Video Title */}
                <h2 className="text-base font-bold leading-snug line-clamp-2 drop-shadow-md">
                    {video.title}
                </h2>

                {/* Description toggle */}
                {video.description && (
                    <div className="mt-1">
                        <p
                            onClick={() => setExpandedDesc(!expandedDesc)}
                            className={`text-xs text-white/80 leading-relaxed cursor-pointer ${
                                expandedDesc ? "" : "line-clamp-1"
                            }`}
                        >
                            {video.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 z-20">
                <div
                    className="h-full bg-amber-400 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

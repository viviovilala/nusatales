import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Film, Loader2, MoreVertical, Pause, Play, RotateCcw, UserRound, Volume2, VolumeX } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { reelsRepository } from "../reelsRepository";
import { formatReelTime } from "../reelTypes";
import type { ReelVideo } from "../reelTypes";
import ReelAvatar from "./ReelAvatar";

type Props = {
    video: ReelVideo; suspended: boolean; isMuted: boolean;
    onToggleMute: () => void; onAutoplayMuted: () => void; onCreator: () => void; onDetails: () => void;
    autoAdvance: boolean; onToggleAutoAdvance: () => void; onAdvance: () => void;
    playbackRate: number; onRateChange: () => void;
};

export default function ReelItem({ video, suspended, isMuted, onToggleMute, onAutoplayMuted, onCreator, onDetails, autoAdvance, onToggleAutoAdvance, onAdvance, playbackRate, onRateChange }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const poster = useStorageImageUrl(video.thumbnailPath);
    const reducedMotion = useReducedMotion();
    const [url, setUrl] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const [error, setError] = useState("");
    const [buffering, setBuffering] = useState(true);
    const [manualPause, setManualPause] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [frameReady, setFrameReady] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [duration, setDuration] = useState(video.durationSeconds || 0);
    const allowed = useRef(false);
    allowed.current = !suspended && !manualPause && !error;
    const muteFallback = useRef(onAutoplayMuted);
    muteFallback.current = onAutoplayMuted;

    useEffect(() => {
        let current = true;
        setUrl(null);
        setError("");
        setBuffering(true);
        setFrameReady(false);
        setElapsed(0);
        reelsRepository.getSignedVideoUrl(video.storagePath, attempt > 0).then((signedUrl) => {
            if (!current) return;
            if (!signedUrl) throw new Error("Media unavailable");
            setUrl(signedUrl);
        }).catch(() => { if (current) { setError("Video belum berhasil dimuat."); setBuffering(false); } });
        return () => { current = false; };
    }, [video.storagePath, attempt]);

    useEffect(() => {
        const element = videoRef.current;
        if (!element || !url) return;
        let current = true;
        if (!allowed.current) { element.pause(); return; }
        async function play() {
            try {
                await element!.play();
            } catch {
                if (!current || !allowed.current) return;
                element!.muted = true;
                muteFallback.current();
                try { await element!.play(); }
                catch { if (current) { setManualPause(true); setBuffering(false); } return; }
            }
            if (current && allowed.current) { setPlaying(true); setBuffering(false); }
        }
        play();
        return () => { current = false; element.pause(); };
    }, [url, suspended, manualPause, error]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    }, [playbackRate, url]);

    useEffect(() => {
        if (!buffering || !url || manualPause || suspended || error) return;
        const timer = setTimeout(() => { setError("Video belum dapat diputar. Periksa koneksimu."); setBuffering(false); }, 18000);
        return () => clearTimeout(timer);
    }, [buffering, url, manualPause, suspended, error]);

    useEffect(() => {
        function key(event: KeyboardEvent) {
            if (suspended || error || event.code !== "Space") return;
            const target = event.target;
            if (target instanceof HTMLElement && target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
            event.preventDefault();
            setManualPause((value) => !value);
        }
        window.addEventListener("keydown", key);
        return () => window.removeEventListener("keydown", key);
    }, [suspended, error]);

    function retry() { setManualPause(false); setAttempt((value) => value + 1); }

    return <motion.div className="reel-frame" initial={reducedMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .25 }}>
        <div className="reel-media-viewport">
        {url && <video key={attempt} className={frameReady ? "is-ready" : ""} ref={videoRef} src={url} poster={poster || undefined} playsInline loop={!autoAdvance} muted={isMuted} preload="metadata" aria-label={`Video ${video.title}`}
            onClick={() => { if (!suspended && !error) setManualPause((value) => !value); }}
            onTimeUpdate={(event) => { const value = event.currentTarget.currentTime; if (Number.isFinite(value)) setElapsed(value); }}
            onLoadedMetadata={(event) => { const value = event.currentTarget.duration; if (Number.isFinite(value) && value > 0) setDuration(value); }}
            onLoadedData={() => setFrameReady(true)}
            onEnded={() => { setManualPause(true); if (autoAdvance && !suspended) onAdvance(); }}
            onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
            onPlaying={(event) => { if (!allowed.current) event.currentTarget.pause(); else { setPlaying(true); setBuffering(false); } }}
            onPause={() => setPlaying(false)} onError={() => { setError("Cerita ini belum bisa diputar. Coba muat ulang videonya."); setBuffering(false); }} />}
        {!frameReady && poster && <img className="reel-loading-poster" src={poster} alt="" />}
        </div>
        <div className="reel-bottom-controls" data-feed-ignore>
            <div className="reel-control-start"><button type="button" aria-label={manualPause ? "Putar video" : "Jeda video"} onClick={() => setManualPause((value) => !value)} disabled={Boolean(error)}>{manualPause ? <Play size={21} fill="currentColor" /> : <Pause size={21} />}</button><span className="reel-clock">{formatReelTime(elapsed)} / {formatReelTime(duration)}</span></div>
            <div className="reel-control-end">
                <label className="reel-auto-control"><span>Gulir otomatis</span><button type="button" role="switch" aria-label="Gulir otomatis" aria-checked={autoAdvance} onClick={onToggleAutoAdvance}><span /></button></label>
                <button type="button" className="reel-rate-control" aria-label={`Kecepatan: ${playbackRate}x`} onClick={onRateChange}>{playbackRate === 1 ? "1.0x" : `${playbackRate}x`}</button>
                <button type="button" aria-label={isMuted ? "Aktifkan Suara" : "Bisukan"} aria-pressed={!isMuted} onClick={onToggleMute}>{isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
            <DropdownMenu.Root modal={false}><DropdownMenu.Trigger aria-label="Opsi video"><MoreVertical size={23} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="nusa-dropdown" align="end" side="top" sideOffset={10}>
                <DropdownMenu.Item onSelect={onDetails}><Film size={16} />Tentang cerita</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onCreator}><UserRound size={16} />Profil kreator</DropdownMenu.Item>
                <DropdownMenu.Item asChild><AppLink to="/studio/upload">Bagikan karyamu</AppLink></DropdownMenu.Item>
            </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
            </div>
        </div>
        {error ? <div className="reel-media-state" role="alert"><Film size={29} /><p>{error}</p><button type="button" onClick={retry}><RotateCcw size={16} />Muat ulang video</button></div> : buffering && !manualPause ? <div className="reel-buffering" role="status"><Loader2 size={29} className="ui-spinner" /><span className="sr-only">Memuat video...</span></div> : manualPause && !suspended && <button type="button" className="reel-center-play" aria-label="Lanjutkan video" onClick={() => setManualPause(false)}><Play size={36} fill="currentColor" /></button>}
        <div className="reel-caption" data-feed-ignore>
            <button type="button" className="reel-creator-caption" onClick={onCreator}><ReelAvatar creator={video.creator} /><strong>{video.creator.username ? `@${video.creator.username}` : video.creator.displayName}</strong><span className="reel-profile-chip">Lihat profil</span></button>
            <h1>{video.title}</h1>
            {video.description && <button type="button" className="reel-caption-description" onClick={onDetails}>{video.description}</button>}
        </div>
        <label className="sr-only" htmlFor={`seek-${video.id}`}>Posisi video</label>
        <input id={`seek-${video.id}`} className="reel-seek" type="range" min={0} max={duration || 1} step={.1} value={Math.min(elapsed, duration || 1)} disabled={!url || !duration || Boolean(error)} aria-valuetext={formatReelTime(elapsed)} data-feed-ignore
            onChange={(event) => { const value = Number(event.target.value); if (videoRef.current) { videoRef.current.currentTime = value; setElapsed(value); } }} />
        <span className="sr-only" aria-live="off">{playing ? "Video diputar" : "Video dijeda"}</span>
    </motion.div>;
}

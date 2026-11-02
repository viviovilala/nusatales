import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Maximize, Minimize, Pause, Play, RotateCcw, Settings2, Volume2, VolumeX } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { videoRepository } from "../../videos/videoRepository";
import type { WatchAnimation } from "./watchTypes";
import { watchTime } from "./watchTypes";

export default function AnimationPlayer({ video, suspended }: { video: WatchAnimation; suspended: boolean }) {
    const ref = useRef<HTMLVideoElement>(null), frame = useRef<HTMLDivElement>(null);
    const poster = useStorageImageUrl(video.thumbnailPath);
    const [url, setUrl] = useState<string | null>(null), [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0), [loading, setLoading] = useState(true), [buffering, setBuffering] = useState(false);
    const [wanted, setWanted] = useState(false), [playing, setPlaying] = useState(false), [ended, setEnded] = useState(false);
    const [elapsed, setElapsed] = useState(0), [duration, setDuration] = useState(video.durationSeconds || 0);
    const [volume, setVolume] = useState(1), [muted, setMuted] = useState(false), [rate, setRate] = useState(1);
    const [fullscreen, setFullscreen] = useState(false), [notice, setNotice] = useState("");
    const allowed = useRef(false), checkpoint = useRef<number | null>(null), savedBucket = useRef(-1);
    allowed.current = wanted && !suspended && !error;

    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setUrl(null); setBuffering(false);
        const timeout = setTimeout(() => { if (active) { active = false; setLoading(false); setError("Video belum berhasil dimuat. Coba muat ulang."); } }, 18000);
        async function resolve() {
            try {
                if (!video.storagePath) throw new Error("Berkas animasi ini belum tersedia.");
                const signed = await videoRepository.getMediaSignedUrl(video.storagePath, 7200);
                if (!signed) throw new Error("Video belum berhasil dimuat. Coba muat ulang.");
                if (active) setUrl(signed);
            } catch (error) { if (active) setError(error instanceof Error ? error.message : "Video belum berhasil dimuat."); }
            finally { if (active) setLoading(false); clearTimeout(timeout); }
        }
        void resolve();
        return () => { active = false; clearTimeout(timeout); };
    }, [video.id, video.storagePath, attempt]);

    useEffect(() => {
        const element = ref.current;
        if (!element || !url) return;
        let current = true;
        if (!allowed.current) { element.pause(); return; }
        element.play().catch(() => { if (current && allowed.current) { setWanted(false); setNotice("Tekan putar untuk melanjutkan animasi."); } });
        return () => { current = false; element.pause(); };
    }, [url, wanted, suspended, error]);
    useEffect(() => { if (ref.current) { ref.current.playbackRate = rate; ref.current.volume = volume; ref.current.muted = muted; } }, [url, rate, volume, muted]);
    useEffect(() => {
        if (!buffering || !wanted || suspended || error) return;
        const timer = setTimeout(() => { setBuffering(false); setError("Pemutaran terhenti. Coba muat ulang video."); }, 18000);
        return () => clearTimeout(timer);
    }, [buffering, wanted, suspended, error]);
    useEffect(() => {
        const changed = () => setFullscreen(document.fullscreenElement === frame.current);
        document.addEventListener("fullscreenchange", changed);
        return () => document.removeEventListener("fullscreenchange", changed);
    }, []);
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 4000);
        return () => clearTimeout(timer);
    }, [notice]);

    function save(time: number) {
        if (!Number.isFinite(time) || time < 2) return;
        try { localStorage.setItem(`nusatales_watch_${video.id}`, String(time)); } catch { /* Playback also works with unavailable local storage. */ }
    }
    function metadata(element: HTMLVideoElement) {
        const length = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : video.durationSeconds || 0;
        setDuration(length);
        let resume = checkpoint.current;
        if (resume === null) { try { resume = Number(localStorage.getItem(`nusatales_watch_${video.id}`)); } catch { resume = 0; } }
        if (resume && Number.isFinite(resume) && resume > 5 && resume < length - 5) {
            element.currentTime = resume; setElapsed(resume); setNotice(`Melanjutkan dari ${watchTime(resume)}`);
        }
        setBuffering(false);
    }
    function seek(value: number) {
        if (!ref.current || !Number.isFinite(value)) return;
        const next = Math.max(0, Math.min(value, duration || 0));
        ref.current.currentTime = next; setElapsed(next); setEnded(false); save(next);
    }
    function toggle() {
        if (suspended || error || !url) return;
        if (ended) { seek(0); setEnded(false); }
        setWanted((value) => !value); setNotice("");
    }
    async function toggleFullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen();
            else {
                const element = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
                if (element?.webkitEnterFullscreen) element.webkitEnterFullscreen();
                else setNotice("Layar penuh belum tersedia di browser ini.");
            }
        } catch { setNotice("Layar penuh belum bisa dibuka. Coba lagi."); }
    }

    return <div ref={frame} className="animation-player" role="region" aria-label="Pemutar animasi" tabIndex={0} onKeyDown={(event) => {
        if (suspended || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLElement && event.target.closest('button, input, select, a, [role="menuitemradio"]')) return;
        if ([" ", "k", "K"].includes(event.key)) { event.preventDefault(); toggle(); }
        else if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); seek(elapsed + (event.key === "ArrowLeft" ? -5 : 5)); }
        else if (event.key.toLowerCase() === "m") setMuted((value) => !value);
        else if (event.key.toLowerCase() === "f") void toggleFullscreen();
    }}>
        {url && <video ref={ref} key={url} src={url} poster={poster || undefined} playsInline preload="metadata" aria-label={`Animasi ${video.title}`} onClick={toggle}
            onLoadedMetadata={(event) => metadata(event.currentTarget)} onLoadedData={() => setBuffering(false)}
            onTimeUpdate={(event) => { const time = event.currentTarget.currentTime; if (!Number.isFinite(time)) return; setElapsed(time); const bucket = Math.floor(time / 4); if (bucket !== savedBucket.current) { savedBucket.current = bucket; save(time); } }}
            onPlaying={(event) => { if (!allowed.current) event.currentTarget.pause(); else { setPlaying(true); setBuffering(false); setEnded(false); } }}
            onPause={(event) => { setPlaying(false); save(event.currentTarget.currentTime); }} onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
            onEnded={() => { setWanted(false); setPlaying(false); setEnded(true); try { localStorage.removeItem(`nusatales_watch_${video.id}`); } catch {} }}
            onError={() => { setBuffering(false); setError("Animasi ini belum bisa diputar. Coba muat ulang videonya."); }} />}
        {loading ? <div className="watch-player-state" role="status"><Loader2 size={27} className="ui-spinner" /><p>Menyiapkan tayangan...</p></div>
            : error ? <div className="watch-player-state" role="alert"><Film size={31} /><p>{error}</p><button type="button" onClick={() => { checkpoint.current = ref.current?.currentTime ?? elapsed; setAttempt((value) => value + 1); }}>Muat ulang video <RotateCcw size={14} /></button></div>
                : !wanted && <button type="button" className="watch-center-play" aria-label={ended ? "Putar ulang animasi" : "Mulai menonton"} onClick={toggle}>{ended ? <RotateCcw size={31} /> : <Play size={34} fill="currentColor" />}</button>}
        {buffering && wanted && !suspended && !error && <span role="status" className="watch-player-buffer"><Loader2 size={30} className="ui-spinner" /><span className="sr-only">Menunggu video...</span></span>}
        {notice && <div className="watch-player-notice" role="status">{notice}</div>}
        <div className="watch-player-controls">
            <label className="sr-only" htmlFor={`watch-seek-${video.id}`}>Posisi video</label><input id={`watch-seek-${video.id}`} type="range" className="watch-player-seek" min={0} max={duration || 1} step={.1} value={Math.min(elapsed, duration || 1)} aria-valuetext={watchTime(elapsed)} disabled={!url || Boolean(error)} onChange={(event) => seek(Number(event.target.value))} />
            <div className="watch-player-control-row"><div><button type="button" aria-label={wanted ? "Jeda video" : "Putar video"} disabled={!url || Boolean(error)} onClick={toggle}>{wanted ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button>
                <button type="button" aria-label={muted || volume === 0 ? "Aktifkan suara" : "Bisukan video"} onClick={() => { setMuted((value) => !value); if (volume === 0) setVolume(.7); }}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                <input type="range" className="watch-volume" aria-label="Volume video" min={0} max={1} step={.05} value={muted ? 0 : volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); setMuted(next === 0); }} />
                <span className="watch-player-clock">{watchTime(elapsed)} / {watchTime(duration)}</span></div>
                <div><DropdownMenu.Root modal={false}><DropdownMenu.Trigger aria-label="Pengaturan pemutaran"><Settings2 size={18} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="nusa-dropdown watch-player-menu" align="end" side="top" sideOffset={9}><DropdownMenu.Label className="nusa-dropdown-label">Kecepatan pemutaran</DropdownMenu.Label><DropdownMenu.RadioGroup value={String(rate)} onValueChange={(value) => setRate(Number(value))}>{[.5, .75, 1, 1.25, 1.5, 2].map((value) => <DropdownMenu.RadioItem key={value} value={String(value)}>{value}× {value === 1 ? "Normal" : ""}<DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator></DropdownMenu.RadioItem>)}</DropdownMenu.RadioGroup></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
                    <button type="button" aria-label={fullscreen ? "Keluar layar penuh" : "Layar penuh"} onClick={() => { void toggleFullscreen(); }}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button></div>
            </div>
        </div>
        <span className="sr-only" aria-live="off">{playing ? "Video diputar" : "Video dijeda"}</span>
    </div>;
}

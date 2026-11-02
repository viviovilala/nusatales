import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, RotateCcw, Share2 } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useAppModal } from "../../../app/ModalContext";
import { interactionRepository } from "../../interactions/interactionRepository";
import type { WatchAnimation } from "./watchTypes";

export default function AnimationActions({ video }: { video: WatchAnimation }) {
    const { user } = useAuth(); const modal = useAppModal();
    const [count, setCount] = useState<number | null>(null), [liked, setLiked] = useState(false), [busy, setBusy] = useState(false);
    const [error, setError] = useState(""), [revision, setRevision] = useState(0), [notice, setNotice] = useState("");
    const [shareLink, setShareLink] = useState("");
    const key = `${video.id}:${user?.id || "guest"}`, currentKey = useRef(key), pending = useRef(false);
    currentKey.current = key;
    useEffect(() => {
        let active = true;
        setCount(null); setLiked(false); setBusy(false); pending.current = false; setError("");
        async function load() {
            try {
                const stats = await interactionRepository.getLikeStats(video.id, user?.id);
                if (!active) return;
                if (stats.error) throw stats.error;
                setCount(stats.count); setLiked(stats.hasLiked);
            } catch { if (active) setError("Jumlah suka belum berhasil dimuat."); }
        }
        void load();
        return () => { active = false; };
    }, [key, revision]);
    async function toggleLike() {
        if (!user) { modal?.open("/login"); return; }
        if (pending.current || count === null) return;
        pending.current = true; setBusy(true); setError("");
        const before = { liked, count }, operationKey = key;
        setLiked(!liked); setCount(liked ? Math.max(0, count - 1) : count + 1);
        try {
            const result = await interactionRepository.toggleLike(video.id, user.id, liked);
            if (result.error) throw result.error;
        } catch {
            if (currentKey.current === operationKey) { setLiked(before.liked); setCount(before.count); setError("Suka belum tersimpan. Coba lagi."); }
        } finally { if (currentKey.current === operationKey) { pending.current = false; setBusy(false); } }
    }
    async function share() {
        const url = `${location.origin}/watch/${encodeURIComponent(video.id)}`;
        setNotice(""); setShareLink("");
        if (navigator.share) {
            try { await navigator.share({ title: video.title, url }); return; }
            catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
        }
        try { await navigator.clipboard.writeText(url); setNotice("Tautan animasi berhasil disalin."); }
        catch { setShareLink(url); setNotice("Salin tautan ini untuk membagikan animasi."); }
    }
    return <div className="watch-actions-wrap"><div className="watch-actions">
        <button type="button" aria-label={liked ? "Batalkan suka" : "Sukai animasi"} aria-pressed={liked} disabled={busy || Boolean(user && count === null)} onClick={() => { void toggleLike(); }}><Heart size={16} fill={liked ? "currentColor" : "none"} /><span>{count === null ? "—" : new Intl.NumberFormat("id-ID", { notation: "compact" }).format(count)}</span><span className="sr-only"> suka</span></button>
        <button type="button" onClick={() => { void share(); }}><Share2 size={15} />Bagikan</button>
        <button type="button" disabled aria-label="Simpan, belum tersedia" title="Fitur simpan belum tersedia"><Bookmark size={15} />Simpan</button>
    </div>{error && <div className="watch-inline-error" role="alert">{error}{count === null && <button type="button" aria-label="Muat ulang suka" onClick={() => setRevision((value) => value + 1)}><RotateCcw size={13} /></button>}</div>}
        {notice && <p className="watch-action-notice" role="status">{notice}</p>}{shareLink && <input className="watch-share-link" aria-label="Tautan animasi" readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} />}
    </div>;
}

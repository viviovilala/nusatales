import React, { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Heart, Loader2, MessageSquare, Share2 } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useAppModal } from "../../../app/ModalContext";
import { interactionRepository } from "../../interactions/interactionRepository";
import ReelAvatar from "./ReelAvatar";
import type { ReelVideo } from "../reelTypes";

type Props = {
    video: ReelVideo; onCreator: () => void; onComments: () => void;
    commentCount: { videoId: string; count: number } | null;
    onPrevious: () => void; onNext: () => void; first: boolean; last: boolean; loadingMore: boolean;
};
const compact = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function ReelActions({ video, onCreator, onComments, commentCount, onPrevious, onNext, first, last, loadingMore }: Props) {
    const { user } = useAuth();
    const modal = useAppModal();
    const account = useRef(user?.id);
    account.current = user?.id;
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState<number | null>(null);
    const [comments, setComments] = useState<number | null>(null);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");
    const [shareFallback, setShareFallback] = useState(false);
    const shareUrl = `${window.location.origin}/reels/${video.id}`;

    useEffect(() => {
        let current = true;
        setLikes(null);
        setComments(null);
        setLiked(false);
        setPending(false);
        Promise.all([
            interactionRepository.getLikeStats(video.id, user?.id),
            interactionRepository.getCommentCount(video.id),
        ]).then(([likeStats, commentStats]) => {
            if (!current) return;
            if (!likeStats.error) { setLikes(likeStats.count); setLiked(likeStats.hasLiked); }
            if (!commentStats.error) setComments(commentStats.count);
        }).catch(() => { /* Counts stay unavailable until the next successful request. */ });
        return () => { current = false; };
    }, [video.id, user?.id]);
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(""), 4000);
        return () => clearTimeout(timer);
    }, [message]);

    async function toggleLike() {
        if (!user?.id) { modal?.open("/login"); return; }
        if (pending) return;
        const actor = user.id;
        const before = liked;
        const count = likes;
        setLiked(!before);
        if (count !== null) setLikes(Math.max(0, count + (before ? -1 : 1)));
        setPending(true);
        try {
            const result = await interactionRepository.toggleLike(video.id, user.id, before);
            if (result.error) throw result.error;
        } catch {
            if (account.current !== actor) return;
            setLiked(before);
            setLikes(count);
            setMessage("Suka belum tersimpan. Silakan coba lagi.");
        } finally { if (account.current === actor) setPending(false); }
    }

    async function share() {
        if (navigator.share) {
            try { await navigator.share({ title: video.title, url: shareUrl }); return; }
            catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
        }
        try { await navigator.clipboard.writeText(shareUrl); setMessage("Tautan video berhasil disalin!"); }
        catch { setShareFallback(true); setMessage("Salin tautan ini untuk membagikan cerita."); }
    }

    return <div className="reels-actions" aria-label="Aksi cerita">
        <button type="button" className="reels-creator-action" onClick={onCreator} aria-label={`Lihat profil ${video.creator.displayName}`}><ReelAvatar creator={video.creator} /></button>
        <div className="reels-action"><button type="button" className={`reels-action-circle ${liked ? "is-liked" : ""}`} onClick={toggleLike} disabled={pending} aria-label="Suka" aria-pressed={liked}><Heart size={29} fill="currentColor" /></button><span aria-label={likes === null ? "Jumlah suka belum tersedia" : `${likes} suka`}>{compact(likes)}</span></div>
        <div className="reels-action"><button type="button" className="reels-action-circle" onClick={onComments} aria-label="Komentar"><MessageSquare size={28} fill="currentColor" /></button><span aria-label="Jumlah komentar">{compact(commentCount?.videoId === video.id ? commentCount.count : comments)}</span></div>
        <div className="reels-action"><button type="button" className="reels-action-circle reels-save-unavailable" disabled aria-label="Simpan, belum tersedia" title="Fitur simpan belum tersedia"><Bookmark size={27} fill="currentColor" /></button></div>
        <div className="reels-action"><button type="button" className="reels-action-circle" onClick={share} aria-label="Bagikan Cerita"><Share2 size={28} /></button></div>
        <div className="reels-feed-controls"><button type="button" disabled={first} onClick={onPrevious} aria-label="Video Sebelumnya"><ChevronUp size={22} /></button><button type="button" disabled={last || loadingMore} onClick={onNext} aria-label="Video Selanjutnya">{loadingMore ? <Loader2 size={20} className="ui-spinner" /> : <ChevronDown size={22} />}</button></div>
        {message && <div role="status" className="reels-action-toast">{message}</div>}
        {shareFallback && <input className="reels-share-fallback" aria-label="Tautan untuk dibagikan" value={shareUrl} readOnly onFocus={(event) => event.target.select()} />}
    </div>;
}

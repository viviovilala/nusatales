import React, { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useAuth } from "../../auth/AuthProvider";
import { interactionRepository } from "../interactionRepository";
import { Button, Notice, Textarea } from "../../../components/ui/form";
import ReelsDialog from "../../reels/components/ReelsDialog";
import ReelAvatar from "../../reels/components/ReelAvatar";
import type { ReelComment, ReelCreator } from "../../reels/reelTypes";

type Props = {
    videoId: string; isOpen: boolean; onClose: () => void;
    onCountChange?: (videoId: string, count: number) => void;
    onCreator?: (creator: ReelCreator) => void;
};

function relativeTime(value: string) {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (!Number.isFinite(seconds)) return "";
    if (seconds < 60) return "Baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mnt`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function CommentDrawer({ videoId, isOpen, onClose, onCountChange, onCreator }: Props) {
    const { user, isAuthenticated } = useAuth();
    const [comments, setComments] = useState<ReelComment[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const currentVideo = useRef(videoId);
    currentVideo.current = videoId;
    const countCallback = useRef(onCountChange);
    countCallback.current = onCountChange;
    const fieldId = useId();

    useEffect(() => { setText(""); setComments([]); setSubmitting(false); setDeleting(null); }, [videoId, user?.id]);
    useEffect(() => {
        if (!isOpen) return;
        let current = true;
        setLoading(true);
        setError("");
        interactionRepository.getComments(videoId).then((result) => {
            if (!current) return;
            if (result.error) throw result.error;
            const records: ReelComment[] = result.data || [];
            setComments(records);
            countCallback.current?.(videoId, records.length);
        }).catch(() => { if (current) setError("Komentar belum berhasil dimuat. Coba lagi."); })
            .finally(() => { if (current) setLoading(false); });
        return () => { current = false; };
    }, [videoId, isOpen, revision, user?.id]);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!user?.id || !text.trim() || submitting || deleting) return;
        const target = videoId;
        setSubmitting(true);
        setError("");
        try {
            const result = await interactionRepository.addComment(target, user.id, text);
            if (currentVideo.current !== target) return;
            if (result.error || !result.data) throw result.error;
            const records = [result.data, ...comments];
            setComments(records);
            countCallback.current?.(target, records.length);
            setText("");
        } catch { if (currentVideo.current === target) setError("Komentar belum terkirim. Tulisanmu tetap tersimpan, silakan coba lagi."); }
        finally { if (currentVideo.current === target) setSubmitting(false); }
    }

    async function remove(id: string) {
        if (!user?.id || deleting || submitting) return;
        const target = videoId;
        setDeleting(id);
        setError("");
        try {
            const result = await interactionRepository.deleteComment(id, user.id);
            if (currentVideo.current !== target) return;
            if (result.error) throw result.error;
            const records = comments.filter((comment) => comment.id !== id);
            setComments(records);
            countCallback.current?.(target, records.length);
        } catch { if (currentVideo.current === target) setError("Komentar belum berhasil dihapus. Coba lagi."); }
        finally { if (currentVideo.current === target) setDeleting(null); }
    }

    return <ReelsDialog open={isOpen} title="Komentar" onClose={onClose}>
        <div className="reels-comments-list" aria-busy={loading}>
            <Notice>{error}</Notice>
            {error && <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Muat ulang komentar</Button>}
            {loading ? <div className="reels-comment-skeleton" role="status">Memuat percakapan...</div> : comments.length ? comments.map((comment) => <article key={comment.id} className="reels-comment">
                <button className="reels-comment-avatar" type="button" aria-label={`Lihat profil ${comment.user.displayName}`} onClick={() => onCreator?.(comment.user)}><ReelAvatar creator={comment.user} /></button>
                <div className="reels-comment-copy"><div><button type="button" onClick={() => onCreator?.(comment.user)}>{comment.user.displayName}</button><time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time></div><p>{comment.content}</p></div>
                {comment.userId === user?.id && <button className="reels-comment-delete" type="button" disabled={Boolean(deleting) || submitting} aria-busy={deleting === comment.id} aria-label="Hapus komentarmu" onClick={() => remove(comment.id)}><Trash2 size={15} /></button>}
            </article>) : !error && <div className="reels-conversation-empty"><MessageCircle size={30} /><h3>Mulai percakapannya</h3><p>Bagikan pendapatmu tentang cerita ini.</p></div>}
        </div>
        <div className="reels-comment-composer">
            {isAuthenticated ? <form onSubmit={submit}>
                <label className="sr-only" htmlFor={fieldId}>Tulis komentar</label>
                <Textarea id={fieldId} rows={2} maxLength={1000} placeholder="Apa pendapatmu tentang cerita ini?" value={text} onChange={(event) => setText(event.target.value)} disabled={submitting} />
                <div><span>{text.length}/1000</span><Button type="submit" busy={submitting} disabled={!text.trim() || Boolean(deleting)}><Send size={15} />Kirim</Button></div>
            </form> : <div className="reels-comment-login"><p>Masuk untuk ikut bercerita.</p><AppLink to="/login" className="ui-button ui-button-primary">Masuk / Daftar</AppLink></div>}
        </div>
    </ReelsDialog>;
}

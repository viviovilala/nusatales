import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useAuth } from "../../auth/AuthProvider";
import { interactionRepository } from "../../interactions/interactionRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import ReelAvatar from "../../reels/components/ReelAvatar";
import type { ReelCreator } from "../../reels/reelTypes";
import type { WatchComment } from "./watchTypes";
import { catalogDate } from "../catalog/catalogTypes";

export default function AnimationDiscussion({ videoId, onCreator }: { videoId: string; onCreator: (creator: ReelCreator) => void }) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<WatchComment[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [draft, setDraft] = useState(""), [busy, setBusy] = useState(false), [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null), [sort, setSort] = useState("newest"), [limit, setLimit] = useState(8);
    const [revision, setRevision] = useState(0), [mutationError, setMutationError] = useState("");
    const key = `${videoId}:${user?.id || "guest"}`, currentKey = useRef(key), pending = useRef(false);
    currentKey.current = key;
    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setMutationError(""); setConfirmDelete(null); setBusy(false); setDeleting(null); pending.current = false;
        async function load() {
            try {
                const result = await interactionRepository.getComments(videoId);
                if (!active) return;
                if (result.error) throw result.error;
                setComments(result.data as WatchComment[]);
            } catch { if (active) setError("Diskusi belum berhasil dimuat. Coba lagi."); }
            finally { if (active) setLoading(false); }
        }
        void load();
        return () => { active = false; };
    }, [key, revision]);
    useEffect(() => { setDraft(""); }, [key]);
    async function submit() {
        if (!user || loading || error || pending.current || !draft.trim()) return;
        const operationKey = key, text = draft.trim();
        pending.current = true; setBusy(true); setMutationError("");
        try {
            const result = await interactionRepository.addComment(videoId, user.id, text);
            if (result.error || !result.data) throw result.error || new Error("Komentar belum tersimpan.");
            if (currentKey.current !== operationKey) return;
            setComments((items) => [result.data as WatchComment, ...items]); setDraft(""); setSort("newest"); setLimit((value) => Math.max(value, 8));
        } catch (error) { if (currentKey.current === operationKey) setMutationError(normalizeSupabaseError(error, "Komentar belum tersimpan.") || "Komentar belum tersimpan."); }
        finally { if (currentKey.current === operationKey) { pending.current = false; setBusy(false); } }
    }
    async function remove(comment: WatchComment) {
        if (!user || comment.userId !== user.id || pending.current) return;
        const operationKey = key;
        pending.current = true; setDeleting(comment.id); setMutationError("");
        try {
            const result = await interactionRepository.deleteComment(comment.id, user.id);
            if (result.error) throw result.error;
            if (currentKey.current === operationKey) { setComments((items) => items.filter((item) => item.id !== comment.id)); setConfirmDelete(null); }
        } catch (error) { if (currentKey.current === operationKey) setMutationError(normalizeSupabaseError(error, "Komentar belum berhasil dihapus.") || "Komentar belum berhasil dihapus."); }
        finally { if (currentKey.current === operationKey) { pending.current = false; setDeleting(null); } }
    }
    const sorted = [...comments].sort((a, b) => {
        const difference = (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
        return sort === "newest" ? difference : -difference;
    });
    const author: ReelCreator = { displayName: profile?.display_name || "Kamu", avatarPath: profile?.avatar_path };
    return <section className="animation-discussion" aria-labelledby="watch-discussion-title">
        <header className="watch-discussion-heading"><h2 id="watch-discussion-title"><MessageSquare size={19} />NusaRembug <span>{loading || error ? "—" : comments.length} komentar</span></h2><label><span className="sr-only">Urutan komentar</span><select aria-label="Urutan komentar" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select></label></header>
        <div className="watch-comment-composer">{user ? <><ReelAvatar creator={author} /><form onSubmit={(event) => { event.preventDefault(); void submit(); }}><label className="sr-only" htmlFor={`watch-comment-${videoId}`}>Tulis diskusi</label><textarea id={`watch-comment-${videoId}`} placeholder="Bagikan pendapatmu tentang cerita ini..." rows={3} maxLength={500} value={draft} disabled={busy} onChange={(event) => setDraft(event.target.value)} /><div><span>{draft.length}/500</span><button type="submit" disabled={!draft.trim() || busy || Boolean(deleting) || loading || Boolean(error)}>{busy ? <Loader2 size={14} className="ui-spinner" /> : <Send size={14} />}{busy ? "Mengirim..." : "Kirim"}</button></div></form></>
            : <div className="watch-comment-login"><MessageSquare size={22} /><div><strong>Ikut meramaikan cerita.</strong><p>Masuk untuk berbagi pendapat dan berdiskusi dengan penonton lain.</p></div><AppLink to="/login">Masuk</AppLink></div>}</div>
        {mutationError && <p className="watch-inline-error" role="alert">{mutationError}</p>}
        {loading ? <div className="watch-discussion-state" role="status"><Loader2 size={18} className="ui-spinner" />Memuat diskusi...</div>
            : error ? <div className="watch-discussion-state"><p role="alert">{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Coba lagi</button></div>
                : !comments.length ? <div className="watch-discussion-state"><MessageSquare size={22} /><p>Belum ada diskusi. Jadilah yang pertama berbagi kesan.</p></div>
                    : <div className="watch-comments">{sorted.slice(0, limit).map((comment) => <article key={comment.id} className="watch-comment" aria-label={`Komentar ${comment.user.displayName}`}>
                        <button type="button" className="watch-comment-avatar" aria-label={`Profil ${comment.user.displayName}`} onClick={() => onCreator(comment.user)}><ReelAvatar creator={comment.user} /></button>
                        <div className="watch-comment-content"><header><button type="button" onClick={() => onCreator(comment.user)}>{comment.user.displayName}</button><time dateTime={comment.createdAt}>{catalogDate(comment.createdAt)}</time></header><p>{comment.content}</p>
                            {user?.id === comment.userId && <div className="watch-comment-delete">{confirmDelete === comment.id ? <><span>Hapus komentarmu?</span><button type="button" disabled={Boolean(deleting) || busy} onClick={() => setConfirmDelete(null)}>Batal</button><button type="button" disabled={Boolean(deleting) || busy} onClick={() => { void remove(comment); }}>{deleting === comment.id ? "Menghapus..." : "Ya, hapus"}</button></>
                                : <button type="button" disabled={Boolean(deleting) || busy} onClick={() => setConfirmDelete(comment.id)}><Trash2 size={12} />Hapus</button>}</div>}
                        </div>
                    </article>)}</div>}
        {!loading && !error && comments.length > limit && <button className="watch-more-comments" type="button" onClick={() => setLimit((value) => value + 8)}>Lihat diskusi lainnya</button>}
    </section>;
}

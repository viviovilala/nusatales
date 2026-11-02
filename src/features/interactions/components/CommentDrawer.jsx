import StorageImage from "../../../components/StorageImage";
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { interactionRepository } from "../interactionRepository";
import { normalizeSupabaseError } from "../../../lib/errors";

function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const now = new Date();
    const past = new Date(dateString);
    const diffSeconds = Math.floor((now - past) / 1000);

    if (diffSeconds < 60) return "baru saja";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} mnt`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} hari`;
    return past.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function CommentDrawer({ videoId, isOpen, onClose }) {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const commentsEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function loadComments() {
            if (!videoId || !isOpen) return;
            setIsLoading(true);
            setErrorMessage("");

            try {
                const { data, error } = await interactionRepository.getComments(videoId);
                if (error) {
                    if (isMounted) setErrorMessage(normalizeSupabaseError(error));
                    return;
                }
                if (isMounted) setComments(data || []);
            } catch (err) {
                if (isMounted) setErrorMessage(normalizeSupabaseError(err));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (isOpen) {
            loadComments();
        }

        return () => {
            isMounted = false;
        };
    }, [videoId, isOpen]);

    async function handleAddComment(e) {
        e.preventDefault();
        if (!commentText.trim() || !user?.id || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const { data, error } = await interactionRepository.addComment(
                videoId,
                user.id,
                commentText
            );

            if (error) {
                setErrorMessage(normalizeSupabaseError(error, "Gagal mengirim komentar."));
                return;
            }

            if (data) {
                setComments((prev) => [data, ...prev]);
                setCommentText("");
            }
        } catch (err) {
            setErrorMessage(normalizeSupabaseError(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteComment(commentId) {
        if (!user?.id) return;

        try {
            const { error } = await interactionRepository.deleteComment(commentId, user.id);
            if (error) throw error;
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            console.error("Delete comment error:", err);
        }
    }

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] bg-neutral-900 border-t border-neutral-800 rounded-t-3xl max-h-[75vh] h-[520px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 select-text"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">Komentar</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                            {comments.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                        aria-label="Tutup"
                    >
                        ✕
                    </button>
                </div>

                {/* Comment List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {errorMessage && (
                        <div className="rounded-xl px-4 py-2.5 text-xs bg-red-900/60 border border-red-700 text-red-200">
                            {errorMessage}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-xs">Memuat komentar...</p>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-16 text-neutral-400">
                            <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-neutral-300">Belum ada komentar</p>
                            <p className="text-xs text-neutral-500 mt-1">Jadilah orang pertama yang mengomentari video ini!</p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const isOwner = user?.id === comment.userId;
                            const initial = (comment.user?.displayName || "P").charAt(0).toUpperCase();

                            return (
                                <div key={comment.id} className="flex items-start gap-3 group">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-200 text-amber-950 font-bold text-xs flex items-center justify-center shrink-0">
                                        {comment.user?.avatarPath ? (
                                            <StorageImage
                                                path={comment.user.avatarPath}
                                                alt={comment.user.displayName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{initial}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-bold text-neutral-200 truncate">
                                                {comment.user?.displayName}
                                            </span>
                                            {comment.user?.username && (
                                                <span className="text-[10px] text-neutral-500 font-mono">
                                                    @{comment.user.username}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-neutral-500 ml-auto shrink-0">
                                                {formatRelativeTime(comment.createdAt)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>

                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition cursor-pointer"
                                            title="Hapus komentar"
                                            aria-label="Hapus komentar"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-900/90">
                    {isAuthenticated ? (
                        <form onSubmit={handleAddComment} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                maxLength={500}
                                disabled={isSubmitting}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Tulis tanggapan atau komentar..."
                                className="flex-1 px-4 py-2.5 rounded-full bg-neutral-800 text-white placeholder-neutral-500 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !commentText.trim()}
                                className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-950 bg-[#8DC63F] hover:bg-[#7db534] transition disabled:opacity-40 cursor-pointer shrink-0"
                            >
                                Kirim
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-1">
                            <p className="text-xs text-neutral-400 mb-1.5">
                                Ingin ikut mengomentari karya cerita ini?
                            </p>
                            <Link
                                to="/login"
                                state={{ from: location }}
                                className="inline-block px-5 py-2 rounded-full text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition"
                            >
                                Masuk untuk Berkomentar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

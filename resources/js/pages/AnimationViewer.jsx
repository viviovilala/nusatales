import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnimationById } from "../services/animationService";
import {
    addComment,
    getComments,
    recordView,
    saveWatchHistory,
    shareAnimation,
    toggleLike,
} from "../services/communityService";
import { useAuth } from "../contexts/AuthContext";

export default function AnimationViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [animation, setAnimation] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadAnimation() {
            try {
                const [animationData, commentResponse] = await Promise.all([
                    getAnimationById(id),
                    getComments(id, { per_page: 20 }),
                ]);

                if (!ignore) {
                    setAnimation(animationData);
                    setComments(commentResponse.data ?? []);
                }

                await recordView(id);

                if (isAuthenticated) {
                    await saveWatchHistory(id, animationData.duration ?? 0);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(
                        error.response?.data?.message || "Failed to load animation."
                    );
                }
            }
        }

        loadAnimation();

        return () => {
            ignore = true;
        };
    }, [id, isAuthenticated]);

    async function handleLike() {
        setMessage("");
        setErrorMessage("");

        if (!isAuthenticated) {
            setErrorMessage("Please sign in to like this animation.");
            navigate("/login");
            return;
        }

        try {
            const result = await toggleLike(id);
            setAnimation((previous) =>
                previous
                    ? {
                          ...previous,
                          counts: {
                              ...previous.counts,
                              likes: result.likes_count,
                          },
                      }
                    : previous
            );
            setMessage(result.liked ? "Animation liked." : "Like removed.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to update like.");
        }
    }

    async function handleShare(platform) {
        setMessage("");
        setErrorMessage("");

        if (!isAuthenticated) {
            setErrorMessage("Please sign in to share this animation.");
            navigate("/login");
            return;
        }

        try {
            await shareAnimation(id, platform);
            setMessage(`Share recorded for ${platform}.`);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to record share.");
        }
    }

    async function handleComment(event) {
        event.preventDefault();
        setMessage("");
        setErrorMessage("");

        if (!commentText.trim()) {
            return;
        }

        if (!isAuthenticated) {
            setErrorMessage("Please sign in to add a comment.");
            navigate("/login");
            return;
        }

        try {
            const created = await addComment(id, commentText);
            setComments((previous) => [created, ...previous]);
            setCommentText("");
            setMessage("Comment added.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to add comment.");
        }
    }

    return (
        <div className="min-h-screen px-6 py-6" style={{ backgroundColor: "#F5F0E0" }}>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Viewer</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            Cultural Animation
                        </h1>
                    </div>
                    <Link to="/" className="px-5 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#3B2A0E" }}>
                        Back to Home
                    </Link>
                </div>

                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                {!animation ? (
                    <div className="rounded-3xl p-8 text-sm" style={{ backgroundColor: "#FFFFFF" }}>
                        Loading animation...
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
                        <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                            <div className="aspect-video rounded-3xl overflow-hidden mb-5" style={{ backgroundColor: "#2B1808" }}>
                                {animation.video_url ? (
                                    <video controls poster={animation.thumbnail_url || undefined} className="w-full h-full object-cover">
                                        <source src={animation.video_url} />
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/80 text-sm">
                                        Video preview unavailable
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold mb-3" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                {animation.title}
                            </h2>
                            <p className="text-sm leading-7 mb-5" style={{ color: "#6B5A3E" }}>
                                {animation.description || "No description available."}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={handleLike} className="px-4 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#8DC63F" }}>
                                    Like ({animation.counts?.likes ?? 0})
                                </button>
                                <button onClick={() => handleShare("whatsapp")} className="px-4 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#EBDCB7", color: "#5C4B2D" }}>
                                    Share WhatsApp
                                </button>
                                <button onClick={() => handleShare("instagram")} className="px-4 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#EBDCB7", color: "#5C4B2D" }}>
                                    Share Instagram
                                </button>
                            </div>
                        </section>

                        <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                            <h3 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                Community Comments
                            </h3>
                            <form onSubmit={handleComment} className="mb-5">
                                <textarea
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    rows={4}
                                    placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to join the discussion..."}
                                    className="w-full px-4 py-4 rounded-2xl outline-none"
                                    style={{ backgroundColor: "#F7F3EA" }}
                                    disabled={!isAuthenticated}
                                />
                                <button
                                    type="submit"
                                    disabled={!isAuthenticated}
                                    className="w-full mt-3 py-3 rounded-2xl text-white font-semibold disabled:opacity-60"
                                    style={{ backgroundColor: "#3B2A0E" }}
                                >
                                    {isAuthenticated ? "Add Comment" : "Login to Comment"}
                                </button>
                            </form>
                            <div className="space-y-3">
                                {comments.length === 0 ? (
                                    <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                        No comments yet.
                                    </p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8F2E4" }}>
                                            <p className="font-semibold" style={{ color: "#3B2A0E" }}>
                                                {comment.user?.name || "Community member"}
                                            </p>
                                            <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

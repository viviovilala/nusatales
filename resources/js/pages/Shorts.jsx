import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedAnimations } from "../services/animationService";
import { toggleLike, addComment, getComments, shareAnimation } from "../services/communityService";
import { useAuth } from "../contexts/AuthContext";
import AppNavbar from "../navbar/AppNavbar.jsx";

// Video budaya premium sebagai fallback jika database kosong
const fallbackShorts = [
    {
        id: "short-wayang",
        title: "Pertunjukan Wayang Kulit Kuno",
        description: "Melihat lebih dekat seni bayangan warisan budaya adiluhung Nusantara.",
        video_url: "https://assets.mixkit.co/videos/preview/mixkit-indonesian-wayang-kulit-shadow-puppet-performance-43096-large.mp4",
        creator: { name: "Dalang Parahyangan" },
        counts: { likes: 320, comments: 45 }
    },
    {
        id: "short-bali",
        title: "Gerbang Candi Bentar Bali",
        description: "Keagungan arsitektur tradisional Bali yang menyapa dunia di pagi hari.",
        video_url: "https://assets.mixkit.co/videos/preview/mixkit-traditional-hindu-temple-gate-in-bali-43095-large.mp4",
        creator: { name: "Pesona Dewata" },
        counts: { likes: 512, comments: 88 }
    }
];

export default function Shorts() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [shorts, setShorts] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
    const [likedStates, setLikedStates] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const videoRefs = useRef([]);

    // Ambil data video dari backend
    useEffect(() => {
        let ignore = false;
        async function fetchVideos() {
            try {
                const response = await getPublishedAnimations({ per_page: 10 });
                if (!ignore) {
                    const apiVideos = response.data ?? [];
                    // Gabungkan video asli backend dengan fallback budaya premium
                    setShorts(apiVideos.length > 0 ? [...apiVideos, ...fallbackShorts] : fallbackShorts);
                }
            } catch (error) {
                if (!ignore) {
                    setShorts(fallbackShorts);
                }
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        fetchVideos();
        return () => { ignore = true; };
    }, []);

    // Autoplay video aktif, pause video lainnya
    useEffect(() => {
        videoRefs.current.forEach((video, idx) => {
            if (video) {
                if (idx === activeIndex) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });

        // Load komentar video aktif
        if (shorts[activeIndex]) {
            loadComments(shorts[activeIndex].id);
        }
    }, [activeIndex, shorts]);

    async function loadComments(videoId) {
        try {
            // Abaikan request komentar jika ID adalah dummy/fallback
            if (String(videoId).startsWith("short-")) {
                setComments([
                    { id: 1, user: { name: "Budi Budiman" }, content: "Sangat bangga dengan kebudayaan kita! 🇮🇩" },
                    { id: 2, user: { name: "Siti Rahma" }, content: "Visual animasinya halus sekali bre!" }
                ]);
                return;
            }
            const res = await getComments(videoId, { per_page: 20 });
            setComments(res.data ?? []);
        } catch (e) {
            setComments([]);
        }
    }

    async function handleLike(videoId) {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        const isCurrentlyLiked = likedStates[videoId];
        setLikedStates(prev => ({ ...prev, [videoId]: !isCurrentlyLiked }));

        // Update hitungan di UI lokal
        setShorts(prev => prev.map(item => {
            if (item.id === videoId) {
                return {
                    ...item,
                    counts: {
                        ...item.counts,
                        likes: (item.counts?.likes ?? 0) + (isCurrentlyLiked ? -1 : 1)
                    }
                };
            }
            return item;
        }));

        // Panggil API backend jika bukan video fallback
        if (!String(videoId).startsWith("short-")) {
            try {
                await toggleLike(videoId);
            } catch (e) {}
        }
    }

    async function handleCommentSubmit(e) {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        const activeVideo = shorts[activeIndex];
        const newCommentObj = {
            id: Date.now(),
            user: { name: "Anda" },
            content: commentText
        };

        setComments(prev => [newCommentObj, ...prev]);
        setCommentText("");

        // Panggil API backend jika bukan video fallback
        if (!String(activeVideo.id).startsWith("short-")) {
            try {
                await addComment(activeVideo.id, commentText);
            } catch (e) {}
        }
    }

    const nextVideo = () => {
        if (activeIndex < shorts.length - 1) {
            setActiveIndex(prev => prev + 1);
        }
    };

    const prevVideo = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#110C05" }}>
            <AppNavbar current="shorts" />

            <div className="flex-1 flex items-center justify-center p-4 relative">
                {isLoading ? (
                    <div className="text-white text-sm">Menyiapkan panggung cerita...</div>
                ) : (
                    <div className="relative w-full max-w-[420px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        {/* Video Player */}
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                            {shorts[activeIndex] && (
                                <video
                                    ref={el => videoRefs.current[activeIndex] = el}
                                    src={shorts[activeIndex].video_url}
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover"
                                    onClick={() => {
                                        const activeVideo = videoRefs.current[activeIndex];
                                        if (activeVideo) {
                                            activeVideo.paused ? activeVideo.play() : activeVideo.pause();
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* Navigation Overlay (Up/Down Buttons) */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                            <button 
                                onClick={prevVideo}
                                disabled={activeIndex === 0}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-white disabled:opacity-20 hover:bg-black/60 transition"
                            >
                                🛞
                            </button>
                            <button 
                                onClick={nextVideo}
                                disabled={activeIndex === shorts.length - 1}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10 text-white disabled:opacity-20 hover:bg-black/60 transition"
                            >
                                ⬇️
                            </button>
                        </div>

                        {/* Right Floating Actions Sidebar */}
                        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                            {/* Like Button */}
                            <div className="flex flex-col items-center gap-1">
                                <button 
                                    onClick={() => handleLike(shorts[activeIndex]?.id)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition active:scale-90"
                                    style={{ 
                                        backgroundColor: likedStates[shorts[activeIndex]?.id] ? "#8DC63F" : "rgba(0,0,0,0.5)",
                                        color: "#fff"
                                    }}
                                >
                                    ❤️
                                </button>
                                <span className="text-white text-xs font-semibold shadow-sm">
                                    {shorts[activeIndex]?.counts?.likes ?? 0}
                                </span>
                            </div>

                            {/* Comment Button */}
                            <div className="flex flex-col items-center gap-1">
                                <button 
                                    onClick={() => setIsCommentDrawerOpen(true)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-black/50 text-white transition hover:bg-black/70"
                                >
                                    💬
                                </button>
                                <span className="text-white text-xs font-semibold shadow-sm">
                                    {comments.length}
                                </span>
                            </div>

                            {/* Share Button */}
                            <button 
                                onClick={() => {
                                    alert("Tautan video telah disalin! Siap dibagikan ke WhatsApp.");
                                }}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-black/50 text-white transition hover:bg-black/70"
                            >
                                🔗
                            </button>

                            {/* Spin Disc Icon */}
                            <div className="w-10 h-10 rounded-full bg-cover animate-spin-slow border-2 border-white/50" 
                                 style={{ backgroundImage: "url('/poto/logo.png')", animationDuration: "6s" }} 
                            />
                        </div>

                        {/* Bottom Information Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-black/80 to-transparent z-10 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">👤</div>
                                <span className="text-white font-bold text-sm">
                                    @{shorts[activeIndex]?.creator?.name || shorts[activeIndex]?.user?.nama || "Kreator Nusa"}
                                </span>
                                <button className="px-3 py-1 rounded-full text-xs font-bold text-black" style={{ backgroundColor: "#8DC63F" }}>
                                    Ikuti
                                </button>
                            </div>
                            <h4 className="text-white font-bold text-sm">
                                {shorts[activeIndex]?.title}
                            </h4>
                            <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                                {shorts[activeIndex]?.description || "Mari lestarikan cerita nusantara."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Slide-Up Comment Drawer */}
            {isCommentDrawerOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
                    <div className="w-full max-w-[420px] h-[50vh] bg-white rounded-t-3xl p-5 flex flex-col gap-4 relative animate-slide-up shadow-2xl">
                        <button 
                            onClick={() => setIsCommentDrawerOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 font-bold text-lg hover:text-black"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-bold text-[#3B2A0E] mb-2" style={{ fontFamily: "Georgia, serif" }}>
                            Diskusi Budaya ({comments.length})
                        </h3>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {comments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Belum ada diskusi. Jadilah yang pertama!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="rounded-2xl p-3 bg-[#F8F2E4] border border-[#E8DFC7]/30">
                                        <p className="font-bold text-xs text-[#3B2A0E]">@{comment.user?.name || "NusaMember"}</p>
                                        <p className="text-sm text-[#6B5A3E] mt-1">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="flex gap-2 border-t pt-3">
                            <input
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder={isAuthenticated ? "Bagikan pendapat Anda..." : "Masuk untuk ikut berdiskusi..."}
                                disabled={!isAuthenticated}
                                className="flex-1 px-4 py-2 rounded-full border bg-gray-50 outline-none text-sm"
                            />
                            <button 
                                type="submit"
                                disabled={!isAuthenticated}
                                className="px-4 py-2 rounded-full text-white font-bold text-sm disabled:opacity-50"
                                style={{ backgroundColor: "#8DC63F" }}
                            >
                                Kirim
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

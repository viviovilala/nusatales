import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { useAuth } from "../contexts/AuthContext";
import { addFavorite, getEpisodeById, saveEpisodeProgress, submitRating } from "../services/seriesService";

export default function EpisodeWatch() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [episode, setEpisode] = useState(null);
    const [score, setScore] = useState(5);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const lastSavedSecond = useRef(0);

    useEffect(() => {
        let ignore = false;

        async function loadEpisode() {
            try {
                const data = await getEpisodeById(id);

                if (!ignore) {
                    setEpisode(data);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load episode.");
                }
            }
        }

        loadEpisode();

        return () => {
            ignore = true;
        };
    }, [id]);

    async function persistProgress(video, completed = false) {
        if (!isAuthenticated || !episode) {
            return;
        }

        const current = Math.floor(video.currentTime || 0);

        if (!completed && current - lastSavedSecond.current < 15) {
            return;
        }

        lastSavedSecond.current = current;

        try {
            await saveEpisodeProgress(episode.id, {
                progress_seconds: current,
                duration_seconds: Math.floor(video.duration || episode.duration_seconds || 0),
                completed,
            });
        } catch (_error) {
            // Progress should never interrupt playback.
        }
    }

    async function favoriteEpisode() {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            await addFavorite({ target_type: "episode", target_id: episode.id });
            setMessage("Episode added to favorites.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save favorite.");
        }
    }

    async function rateEpisode() {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            await submitRating({ target_type: "episode", target_id: episode.id, score });
            setMessage("Episode rating saved.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save rating.");
        }
    }

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="watch" />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                {!episode ? (
                    <div className="rounded-3xl p-8" style={{ backgroundColor: "#FFFFFF", color: "#8A7B5A" }}>
                        Loading episode...
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
                        <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                            <div className="aspect-video rounded-3xl overflow-hidden mb-5" style={{ backgroundColor: "#2B1808" }}>
                                {episode.video_url ? (
                                    <video
                                        controls
                                        poster={episode.thumbnail_url || undefined}
                                        className="w-full h-full object-cover"
                                        onTimeUpdate={(event) => persistProgress(event.currentTarget)}
                                        onEnded={(event) => persistProgress(event.currentTarget, true)}
                                    >
                                        <source src={episode.video_url} />
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/80 text-sm">
                                        Episode video unavailable
                                    </div>
                                )}
                            </div>
                            <Link to={`/series/${episode.series?.slug}`} className="text-sm font-semibold" style={{ color: "#8A7B5A" }}>
                                {episode.series?.title || "Series"}
                            </Link>
                            <h1 className="text-4xl font-bold mt-2 mb-3" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                Episode {episode.episode_number}: {episode.title}
                            </h1>
                            <p className="text-sm leading-7" style={{ color: "#6B5A3E" }}>
                                {episode.description || "No episode description available."}
                            </p>
                        </section>

                        <aside className="space-y-5">
                            <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                    Episode Access
                                </h2>
                                <p className="text-sm mb-4" style={{ color: "#6B5A3E" }}>
                                    {episode.is_premium ? `Premium episode: ${episode.coin_price} coins` : "Free episode"}
                                </p>
                                <button onClick={favoriteEpisode} className="w-full py-3 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#8DC63F" }}>
                                    Add Favorite
                                </button>
                            </section>

                            <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                    Rate Episode
                                </h2>
                                <select value={score} onChange={(event) => setScore(Number(event.target.value))} className="w-full px-4 py-4 rounded-2xl outline-none mb-3" style={{ backgroundColor: "#F7F3EA" }}>
                                    {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>{value} stars</option>
                                    ))}
                                </select>
                                <button onClick={rateEpisode} className="w-full py-3 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#3B2A0E" }}>
                                    Save Rating
                                </button>
                            </section>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}


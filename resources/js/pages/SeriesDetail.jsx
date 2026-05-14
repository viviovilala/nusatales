import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { useAuth } from "../contexts/AuthContext";
import { addFavorite, getSeriesBySlug, submitRating } from "../services/seriesService";

export default function SeriesDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [series, setSeries] = useState(null);
    const [score, setScore] = useState(5);
    const [review, setReview] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadSeries() {
            try {
                const data = await getSeriesBySlug(slug);

                if (!ignore) {
                    setSeries(data);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load series.");
                }
            }
        }

        loadSeries();

        return () => {
            ignore = true;
        };
    }, [slug]);

    async function favoriteSeries() {
        setMessage("");
        setErrorMessage("");

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            await addFavorite({ target_type: "series", target_id: series.id });
            setMessage("Series added to favorites.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save favorite.");
        }
    }

    async function rateSeries(event) {
        event.preventDefault();
        setMessage("");
        setErrorMessage("");

        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            await submitRating({
                target_type: "series",
                target_id: series.id,
                score,
                review,
            });
            setReview("");
            setMessage("Rating saved.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to save rating.");
        }
    }

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="series" />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                {!series ? (
                    <div className="rounded-3xl p-8" style={{ backgroundColor: "#FFFFFF", color: "#8A7B5A" }}>
                        Loading series...
                    </div>
                ) : (
                    <>
                        <section className="rounded-3xl overflow-hidden mb-6" style={{ backgroundColor: "#2B1808" }}>
                            <div className="min-h-[340px] relative">
                                {series.banner_image_url || series.cover_image_url ? (
                                    <img src={series.banner_image_url || series.cover_image_url} alt={series.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                ) : null}
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(25,12,0,0.92), rgba(25,12,0,0.25))" }} />
                                <div className="relative z-10 p-8 md:p-12 max-w-3xl">
                                    <Link to="/explore" className="text-sm font-semibold" style={{ color: "#C8B89A" }}>Explore</Link>
                                    <h1 className="text-5xl font-bold mt-4 mb-4" style={{ color: "#F5F0E0", fontFamily: "Georgia, serif" }}>
                                        {series.title}
                                    </h1>
                                    <p className="text-sm leading-7 mb-6" style={{ color: "#E8DFC7" }}>
                                        {series.synopsis || series.description || "No synopsis available."}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button onClick={favoriteSeries} className="px-5 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#8DC63F" }}>
                                            Add Favorite
                                        </button>
                                        {series.episodes?.[0] ? (
                                            <Link to={`/episodes/${series.episodes[0].id}`} className="px-5 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#F5F0E0", color: "#1A0A00" }}>
                                                Watch Episode 1
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
                            <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                <div className="flex items-center justify-between gap-4 mb-5">
                                    <h2 className="text-2xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Episodes</h2>
                                    <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                        {series.counts?.episodes ?? series.episodes?.length ?? 0} published
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {(series.episodes ?? []).map((episode) => (
                                        <Link key={episode.id} to={`/episodes/${episode.id}`} className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: "#F8F2E4" }}>
                                            <div>
                                                <p className="font-semibold" style={{ color: "#3B2A0E" }}>
                                                    Episode {episode.episode_number}: {episode.title}
                                                </p>
                                                <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                                    {episode.description || "Continue the story."}
                                                </p>
                                            </div>
                                            <span className="text-xs px-3 py-2 rounded-full" style={{ backgroundColor: episode.is_premium ? "#FFF1EB" : "#EEF7E3", color: episode.is_premium ? "#A63B1F" : "#4B6E17" }}>
                                                {episode.is_premium ? `${episode.coin_price} coins` : "Free"}
                                            </span>
                                        </Link>
                                    ))}
                                    {(series.episodes ?? []).length === 0 ? (
                                        <p className="text-sm" style={{ color: "#8A7B5A" }}>No published episodes yet.</p>
                                    ) : null}
                                </div>
                            </section>

                            <section className="rounded-3xl p-6 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Review Series</h2>
                                <p className="text-sm mb-5" style={{ color: "#6B5A3E" }}>
                                    Average rating: {series.rating?.average ?? "New"} / 5
                                </p>
                                <form onSubmit={rateSeries} className="space-y-3">
                                    <select value={score} onChange={(event) => setScore(Number(event.target.value))} className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }}>
                                        {[5, 4, 3, 2, 1].map((value) => (
                                            <option key={value} value={value}>{value} stars</option>
                                        ))}
                                    </select>
                                    <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={5} placeholder="Write an optional review..." className="w-full px-4 py-4 rounded-2xl outline-none" style={{ backgroundColor: "#F7F3EA" }} />
                                    <button type="submit" className="w-full py-4 rounded-2xl text-white font-semibold" style={{ backgroundColor: "#3B2A0E" }}>
                                        Save Rating
                                    </button>
                                </form>
                            </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}


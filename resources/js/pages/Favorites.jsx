import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { getContinueWatching, getFavorites, removeFavorite } from "../services/seriesService";

export default function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [progress, setProgress] = useState([]);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadFavorites() {
            try {
                const [favoriteResponse, progressResponse] = await Promise.all([
                    getFavorites({ per_page: 30 }),
                    getContinueWatching({ per_page: 10 }),
                ]);

                if (!ignore) {
                    setFavorites(favoriteResponse.data ?? []);
                    setProgress(progressResponse.data ?? []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load favorites.");
                }
            }
        }

        loadFavorites();

        return () => {
            ignore = true;
        };
    }, []);

    async function handleRemove(id) {
        setMessage("");
        setErrorMessage("");

        try {
            await removeFavorite(id);
            setFavorites((previous) => previous.filter((item) => item.id !== id));
            setMessage("Favorite removed.");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Failed to remove favorite.");
        }
    }

    function targetLink(item) {
        if (item.target_type === "series") {
            return `/series/${item.target?.slug}`;
        }

        return `/episodes/${item.target?.id}`;
    }

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="favorites" />
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Library</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            Favorites
                        </h1>
                    </div>
                    <Link to="/explore" className="px-5 py-3 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#3B2A0E" }}>
                        Explore More
                    </Link>
                </div>

                {message ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>{message}</div> : null}
                {errorMessage ? <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>{errorMessage}</div> : null}

                <section className="rounded-3xl p-6 border mb-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Continue Watching</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {progress.map((item) => (
                            <Link key={item.id} to={`/episodes/${item.episode?.id}`} className="rounded-2xl p-4" style={{ backgroundColor: "#F8F2E4" }}>
                                <p className="font-semibold" style={{ color: "#3B2A0E" }}>{item.episode?.title || "Episode"}</p>
                                <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                    {item.progress_percent}% complete
                                </p>
                            </Link>
                        ))}
                        {progress.length === 0 ? <p className="text-sm" style={{ color: "#8A7B5A" }}>No watch progress yet.</p> : null}
                    </div>
                </section>

                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {favorites.map((item) => (
                        <div key={item.id} className="rounded-3xl p-5 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                            <p className="text-xs uppercase mb-2" style={{ color: "#8A7B5A" }}>{item.target_type}</p>
                            <Link to={targetLink(item)} className="font-bold text-xl block mb-2" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                                {item.target?.title || "Favorite"}
                            </Link>
                            <p className="text-sm mb-4" style={{ color: "#6B5A3E" }}>
                                {item.target?.synopsis || item.target?.description || "Saved to your NusaTales library."}
                            </p>
                            <button onClick={() => handleRemove(item.id)} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: "#E7D2C8", color: "#8A3B28" }}>
                                Remove
                            </button>
                        </div>
                    ))}
                    {favorites.length === 0 ? (
                        <div className="rounded-3xl p-8 border" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7", color: "#8A7B5A" }}>
                            No favorites yet.
                        </div>
                    ) : null}
                </section>
            </main>
        </div>
    );
}


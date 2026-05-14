import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../navbar/AppNavbar.jsx";
import { getCategories } from "../services/referenceService";
import { getGenres, getSeries } from "../services/seriesService";

export default function Explore() {
    const [series, setSeries] = useState([]);
    const [genres, setGenres] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({ search: "", genre: "", kategori_id: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadReferences() {
            try {
                const [genreList, categoryList] = await Promise.all([
                    getGenres(),
                    getCategories(),
                ]);

                if (!ignore) {
                    setGenres(genreList);
                    setCategories(categoryList);
                }
            } catch (_error) {
                if (!ignore) {
                    setErrorMessage("Failed to load catalog filters.");
                }
            }
        }

        loadReferences();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        async function loadSeries() {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const params = Object.fromEntries(
                    Object.entries(filters).filter(([, value]) => value !== "")
                );
                const response = await getSeries({ ...params, per_page: 24 });

                if (!ignore) {
                    setSeries(response.data ?? []);
                }
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.response?.data?.message || "Failed to load series.");
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        const timer = window.setTimeout(loadSeries, 250);

        return () => {
            ignore = true;
            window.clearTimeout(timer);
        };
    }, [filters]);

    function updateFilter(key, value) {
        setFilters((previous) => ({ ...previous, [key]: value }));
    }

    return (
        <div className="min-h-screen pb-10" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="explore" />
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                        <p className="text-sm mb-1" style={{ color: "#8A7B5A" }}>Explore</p>
                        <h1 className="text-4xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                            Cerita Nusantara
                        </h1>
                    </div>
                    <Link to="/favorites" className="px-5 py-3 rounded-full text-sm font-semibold" style={{ backgroundColor: "#3B2A0E", color: "#FFFFFF" }}>
                        Favorites
                    </Link>
                </div>

                <section className="grid md:grid-cols-[1.3fr_0.7fr_0.7fr] gap-3 mb-6">
                    <input
                        value={filters.search}
                        onChange={(event) => updateFilter("search", event.target.value)}
                        placeholder="Search folklore series..."
                        className="w-full px-5 py-4 rounded-2xl outline-none"
                        style={{ backgroundColor: "#FFFFFF", color: "#3B2A0E" }}
                    />
                    <select
                        value={filters.genre}
                        onChange={(event) => updateFilter("genre", event.target.value)}
                        className="w-full px-5 py-4 rounded-2xl outline-none"
                        style={{ backgroundColor: "#FFFFFF", color: "#3B2A0E" }}
                    >
                        <option value="">All genres</option>
                        {genres.map((genre) => (
                            <option key={genre.id} value={genre.slug}>{genre.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.kategori_id}
                        onChange={(event) => updateFilter("kategori_id", event.target.value)}
                        className="w-full px-5 py-4 rounded-2xl outline-none"
                        style={{ backgroundColor: "#FFFFFF", color: "#3B2A0E" }}
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                </section>

                {errorMessage ? (
                    <div className="mb-5 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#FFF1EB", color: "#A63B1F" }}>
                        {errorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="rounded-3xl p-8" style={{ backgroundColor: "#FFFFFF", color: "#8A7B5A" }}>
                        Loading series...
                    </div>
                ) : series.length === 0 ? (
                    <div className="rounded-3xl p-8" style={{ backgroundColor: "#FFFFFF", color: "#8A7B5A" }}>
                        No published series matched your filters.
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {series.map((item) => (
                            <Link key={item.id} to={`/series/${item.slug}`} className="rounded-3xl overflow-hidden border block" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8DFC7" }}>
                                <div className="aspect-video" style={{ backgroundColor: "#DCCDAA" }}>
                                    {item.cover_image_url ? (
                                        <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "#6B5A3E" }}>
                                            NusaTales Series
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <p className="font-bold text-lg" style={{ color: "#3B2A0E" }}>{item.title}</p>
                                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#EEF7E3", color: "#4B6E17" }}>
                                            {item.counts?.episodes ?? 0} eps
                                        </span>
                                    </div>
                                    <p className="text-sm leading-6 line-clamp-3" style={{ color: "#6B5A3E" }}>
                                        {item.synopsis || item.description || "Published NusaTales folklore series."}
                                    </p>
                                    <p className="text-xs mt-4" style={{ color: "#8A7B5A" }}>
                                        Rating {item.rating?.average ?? "New"} / 5
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


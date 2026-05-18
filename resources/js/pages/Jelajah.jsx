import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedAnimations } from "../services/animationService";
import AppNavbar from "../navbar/AppNavbar.jsx";
import Footer from "./components/Footer.jsx";

const fallbackImages = [
    { src: "/poto/hero-roro-closeup.webp", position: "52% 48%" },
    { src: "/poto/hero-roro-action.webp", position: "78% 52%" },
    { src: "/poto/hero-roro-closeup.webp", position: "50% 50%" },
    { src: "/poto/hero-bandung-bondowoso.webp", position: "50% 52%" },
    { src: "/poto/hero-roro-action.webp", position: "58% 52%" },
    { src: "/poto/hero-bandung-bondowoso.webp", position: "66% 50%" },
    { src: "/poto/hero-roro-action.webp", position: "34% 52%" },
    { src: "/poto/hero-roro-action.webp", position: "62% 52%" },
];

const fallbackAnimations = Array.from({ length: 12 }, (_, index) => ({
    id: `dummy-jelajah-${index + 1}`,
    title: index % 4 === 3 ? "Candi Borobudur" : "Kisah Seribu Candi",
    description: "Temukan rahasia di balik kisah legenda Nusantara dalam animasi pendek yang seru.",
    creator: { name: "Adi Bagas Koro" },
    genre: ["Romance", "Action", "Drama"],
    counts: { likes: 12800000, comments: 10 },
}));

const genres = ["All Genre", "SC-FI", "Fantasy", "Mystery", "Drama", "Romance", "Thriller", "Thriller"];

function isDummyRecord(id) {
    return String(id).startsWith("dummy-");
}

function getAnimationLink(item) {
    return isDummyRecord(item.id) ? "/register" : `/animations/${item.id}`;
}

function getCover(item, index) {
    const fallback = fallbackImages[index % fallbackImages.length];

    return {
        src: item.thumbnail_url || item.cover_url || item.poster_url || item.image_url || item.thumbnail || item.cover || fallback.src,
        position: item.image_position || fallback.position,
    };
}

function formatLikes(value) {
    const likes = Number(value ?? 12800000);

    if (likes >= 1000000) {
        return `${(likes / 1000000).toFixed(likes % 1000000 === 0 ? 0 : 1)} M`;
    }

    if (likes >= 1000) {
        return `${Math.round(likes / 1000)} K`;
    }

    return String(likes);
}

function getGenreText(item) {
    if (Array.isArray(item.genre)) {
        return item.genre.join(", ");
    }

    if (Array.isArray(item.genres)) {
        return item.genres.map((genre) => genre.name || genre).join(", ");
    }

    return item.genre || "Romance, Action, Drama";
}

function ExploreCard({ item, index }) {
    const cover = getCover(item, index);

    return (
        <Link
            to={getAnimationLink(item)}
            className="reveal-card group overflow-hidden rounded-xl bg-white shadow-[0_10px_24px_rgba(93,62,30,0.06)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(93,62,30,0.12)]"
            style={{ "--reveal-delay": `${index * 55}ms` }}
        >
            <div className="relative h-72 overflow-hidden bg-[#D4C5A0]">
                <img
                    src={cover.src}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    style={{ objectPosition: cover.position }}
                    alt={item.title}
                />
                {index < 4 ? (
                    <span className="absolute left-4 top-4 rounded-md bg-[#B8EF64] px-3 py-1 text-sm font-black text-[#587526] shadow-[0_8px_16px_rgba(65,83,30,0.16)]">
                        Episode Baru
                    </span>
                ) : null}
            </div>
            <div className="px-3 pb-4 pt-3">
                <p className="text-sm font-bold text-[#B8A793]">{getGenreText(item)}</p>
                <h3 className="mt-1 text-xl font-black leading-tight text-[#6B3F25]">
                    {item.title}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-lg font-black text-[#6B9D28]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#B8EF64">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>{formatLikes(item.counts?.likes)}</span>
                </div>
            </div>
        </Link>
    );
}

function ExploreHero({ item }) {
    const cover = getCover(item, 0);

    return (
        <section className="relative overflow-hidden rounded-[32px] min-h-[520px] bg-[#2a1200] shadow-[0_18px_45px_rgba(71,45,20,0.18)]">
            <img
                src={cover.src}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: cover.position }}
                alt={item.title}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(39,19,13,0.88)_0%,rgba(65,33,19,0.62)_38%,rgba(65,33,19,0.1)_76%)]" />
            <div className="absolute inset-y-0 left-0 w-2/3 bg-[radial-gradient(circle_at_12%_30%,rgba(243,105,38,0.52),rgba(243,105,38,0)_45%)]" />

            <div className="relative z-10 flex min-h-[520px] max-w-2xl flex-col justify-center px-8 py-10 md:px-12">
                <span className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#B8EF64] px-5 py-2 text-sm font-black uppercase text-[#587526]">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#719D2F] text-[10px] text-white">+</span>
                    Series Populer
                </span>

                <div className="mb-8 flex items-center gap-5">
                    <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#FFF9E7] shadow-[0_10px_22px_rgba(0,0,0,0.2)]">
                        <img src="/poto/splash-senyum.webp" className="h-14 w-14 object-contain" alt="Kreator" />
                    </div>
                    <p className="text-2xl font-black uppercase text-white/90">
                        {item.creator?.name || item.user?.nama || "Adi Bagas Koro"}
                    </p>
                </div>

                <h1 className="max-w-xl text-5xl font-black uppercase leading-[0.95] text-[#FFF9E7] md:text-6xl">
                    {item.title}
                </h1>
                <p className="mt-6 max-w-md text-base font-semibold leading-relaxed text-white/90">
                    {item.description || "Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar."}
                </p>

                <Link
                    to={getAnimationLink(item)}
                    className="mt-10 inline-flex w-fit rounded-full bg-[#B8EF64] px-10 py-5 text-lg font-black text-[#47611B] shadow-[0_12px_26px_rgba(91,115,38,0.28)] transition hover:-translate-y-0.5"
                >
                    Tonton Sekarang
                </Link>
            </div>

            <div className="absolute bottom-8 right-9 flex gap-2">
                {[0, 1, 2].map((dot) => (
                    <span key={dot} className={`h-3 rounded-full ${dot === 0 ? "w-3 bg-white" : "w-3 bg-white/35"}`} />
                ))}
            </div>
        </section>
    );
}

export default function Jelajah() {
    const [animations, setAnimations] = useState(fallbackAnimations);
    const [activeGenre, setActiveGenre] = useState("All Genre");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function loadAnimations() {
            try {
                const response = await getPublishedAnimations({ per_page: 12 });
                const apiAnimations = response.data ?? [];

                if (!ignore) {
                    setAnimations(apiAnimations.length > 0 ? apiAnimations : fallbackAnimations);
                }
            } catch (_error) {
                if (!ignore) {
                    setAnimations(fallbackAnimations);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadAnimations();

        return () => {
            ignore = true;
        };
    }, []);

    const visibleAnimations = useMemo(() => {
        if (activeGenre === "All Genre") {
            return animations;
        }

        const filtered = animations.filter((item) => getGenreText(item).toLowerCase().includes(activeGenre.toLowerCase()));
        return filtered.length > 0 ? filtered : animations;
    }, [activeGenre, animations]);

    const heroItem = visibleAnimations[0] || fallbackAnimations[0];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#FFF9E7" }}>
            <AppNavbar current="jelajah" />

            <main className="mx-auto max-w-7xl px-6 pb-16">
                <ExploreHero item={heroItem} />

                <div className="mt-8 flex items-center gap-5 overflow-x-auto pb-2">
                    {genres.map((genre) => (
                        <button
                            key={genre}
                            type="button"
                            onClick={() => {
                                setActiveGenre(genre);
                                setPage(1);
                            }}
                            className={`shrink-0 rounded-full border px-8 py-3 text-base font-black transition ${activeGenre === genre ? "border-[#D69A10] bg-[#D69A10] text-white shadow-[0_8px_18px_rgba(155,104,12,0.22)]" : "border-[#EEDDAA] bg-[#FFF2D3] text-[#D69A10] hover:bg-[#FFE9B4]"}`}
                        >
                            {genre}
                        </button>
                    ))}
                    <div className="h-10 w-px shrink-0 bg-[#EEDDAA]" />
                    <button type="button" className="grid h-12 w-16 shrink-0 place-items-center rounded-full border border-[#EEDDAA] bg-[#FFF2D3] text-[#D69A10]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                {isLoading ? (
                    <p className="mt-8 text-sm font-semibold text-[#7B4A2B]">Menyiapkan cerita...</p>
                ) : null}

                <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleAnimations.slice(0, 12).map((item, index) => (
                        <ExploreCard key={`${item.id}-${index}`} item={item} index={index} />
                    ))}
                </div>

                <div className="mt-12 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-[#EEDDAA] bg-white text-[#C9B997]"
                    >
                        ‹
                    </button>
                    {[1, 2, 3, 4].map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black ${page === item ? "bg-[#D69A10] text-white shadow-[0_8px_16px_rgba(155,104,12,0.24)]" : "text-[#6B5A3E]"}`}
                        >
                            {item}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(4, current + 1))}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-[#EEDDAA] bg-white text-[#C9B997]"
                    >
                        ›
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedAnimations } from "../services/animationService";
import AppNavbar from "../navbar/AppNavbar.jsx";
import Footer from './components/Footer.jsx';

const dummySeries = [
    {
        id: "dummy-roro-jonggrang",
        title: "Kisah Seribu Candi",
        description: "Rahasia satu malam penuh siasat dalam legenda Roro Jonggrang.",
        counts: { comments: 12 },
    },
    {
        id: "dummy-borobudur",
        title: "Candi Borobudur",
        description: "Perjalanan megah warisan batu yang menyimpan jejak peradaban.",
        counts: { comments: 10 },
    },
    {
        id: "dummy-malin-kundang",
        title: "Malin Kundang",
        description: "Cerita klasik tentang durhaka, ombak, dan kutukan yang abadi.",
        counts: { comments: 18 },
    },
    {
        id: "dummy-timun-mas",
        title: "Timun Mas",
        description: "Keberanian seorang gadis melawan raksasa dengan kecerdikan.",
        counts: { comments: 9 },
    },
    {
        id: "dummy-sangkuriang",
        title: "Sangkuriang",
        description: "Legenda gunung dan takdir yang berputar pada masa lalu.",
        counts: { comments: 14 },
    },
];

function isDummyRecord(id) {
    return String(id).startsWith("dummy-");
}

// Wrapper konsisten untuk semua section
const Container = ({ children, className = "" }) => (
    <div className={`max-w-7xl mx-auto px-6 ${className}`}>
        {children}
    </div>
);

// ===== HERO =====
const heroSlides = [
    {
        title: "RORO JONGGRANG",
        description: "Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar.",
        image: "/poto/hero-roro-closeup.webp",
        objectPosition: "68% 48%",
    },
    {
        title: "SERIBU CANDI",
        description: "Ikuti kobaran sihir dan ambisi yang membangun legenda besar tanah Jawa sebelum fajar tiba.",
        image: "/poto/hero-roro-action.webp",
        objectPosition: "54% 52%",
    },
    {
        title: "BANDUNG BONDOWOSO",
        description: "Saksikan perjalanan sang pangeran sakti dalam kisah janji, tipu daya, dan takdir kerajaan.",
        image: "/poto/hero-bandung-bondowoso.webp",
        objectPosition: "66% 48%",
    },
];

const seriesFallbackImages = [
    { src: "/poto/hero-roro-action.webp", position: "46% 52%" },
    { src: "/poto/hero-bandung-bondowoso.webp", position: "54% 52%" },
    { src: "/poto/hero-roro-closeup.webp", position: "50% 48%" },
    { src: "/poto/hero-roro-action.webp", position: "62% 56%" },
    { src: "/poto/hero-roro-action.webp", position: "78% 52%" },
];

function getSeriesCover(item, index) {
    const fallback = seriesFallbackImages[index % seriesFallbackImages.length];

    return {
        src: item.thumbnail_url || item.cover_url || item.poster_url || item.image_url || item.thumbnail || item.cover || fallback.src,
        position: item.image_position || fallback.position,
    };
}

function getAnimationLink(item) {
    return isDummyRecord(item.id) ? "/register" : `/animations/${item.id}`;
}

function Hero() {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000); // Auto-slide setiap 5 detik
        return () => clearInterval(interval);
    }, []);

    const currentSlide = heroSlides[activeSlide % heroSlides.length];

    return (
        <div id="hero" className="px-6 mt-4">
            <div className="max-w-7xl mx-auto">
                <section className="relative min-h-[460px] overflow-hidden rounded-[28px] bg-[#2a1200] shadow-[0_18px_45px_rgba(71,45,20,0.18)] md:min-h-[500px]">
                    <div className="absolute inset-0">
                        {heroSlides.map((slide, index) => (
                            <img
                                key={slide.image}
                                src={slide.image}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                                    activeSlide % heroSlides.length === index ? "opacity-100" : "opacity-0"
                                }`}
                                style={{ objectPosition: slide.objectPosition }}
                                alt={slide.title}
                            />
                        ))}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(35,19,9,0.92)_0%,rgba(56,31,13,0.78)_38%,rgba(56,31,13,0.24)_68%,rgba(25,13,7,0.18)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(247,89,24,0.8)_0%,rgba(247,149,36,0.36)_20%,rgba(247,149,36,0)_47%)] pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(21,13,8,0.56),rgba(21,13,8,0))] pointer-events-none" />
                    </div>

                    <div className="relative z-10 flex min-h-[460px] max-w-[700px] flex-col justify-center px-6 py-9 sm:px-9 md:min-h-[500px] md:px-11">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f7e9a0] bg-[#f7f0d9]/92 shadow-[0_7px_18px_rgba(0,0,0,0.22)] overflow-hidden">
                            <img
                                src="/poto/splash-senyum.webp"
                                className="h-10 w-10 object-contain drop-shadow-sm"
                                alt="Maskot NusaTales"
                            />
                        </div>
                        <h1 className="mb-4 max-w-[650px] text-4xl font-black uppercase leading-[0.95] tracking-wide text-[#fff8e8] sm:text-5xl md:text-6xl" style={{ fontFamily: "Georgia, serif" }}>
                            {currentSlide.title}
                        </h1>
                        <p className="mb-7 max-w-[600px] text-sm font-medium leading-relaxed text-[#fff9ed]/90">
                            {currentSlide.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link to="/register" className="rounded-full border border-white/35 bg-white/18 px-8 py-3 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition hover:bg-white/26">
                                Daftar
                            </Link>
                            <a href="#series-populer" className="flex items-center gap-2 rounded-full bg-[#b8ef64] px-7 py-3 text-sm font-bold text-[#2f4b14] shadow-[0_10px_24px_rgba(98,138,35,0.28)] transition hover:bg-[#a8e856]">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                Tonton Sekarang
                            </a>
                        </div>
                    </div>

                    <div className="absolute bottom-7 right-7 z-10 flex items-center gap-2">
                        {heroSlides.map((slide, i) => (
                            <button
                                key={slide.title}
                                onClick={() => setActiveSlide(i)}
                                className="h-2 rounded-full transition-all"
                                style={{
                                    width: activeSlide === i ? "22px" : "8px",
                                    backgroundColor: activeSlide === i ? "#F5F0E0" : "rgba(255,255,255,0.42)"
                                }}
                                aria-label={`Pilih slide ${i + 1}`}
                                type="button"
                             />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

// ===== JELAJAHI SECTION =====
function JelajahiSection() {
    return (
        <Container className="mt-12 md:mt-14">
            <div id="jelajah"></div>
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 py-4 md:flex-row md:py-0">
                <div className="w-full max-w-2xl text-center md:text-left">
                    <h2 className="mb-7 text-3xl font-black leading-tight tracking-normal md:text-5xl" style={{ color: "#6B3F25" }}>
                        yuk, jelajahi cerita nusantara !!!
                    </h2>
                    <p className="mx-auto mb-8 max-w-xl text-base font-semibold leading-relaxed md:mx-0 md:text-xl" style={{ color: "#111111" }}>
                        Yuk, temukan cerita legenda, mitologi, hingga sejarah dari berbagai{" "}
                        <Link to="/peta" className="font-semibold no-underline transition hover:opacity-80" style={{ color: "#7FA64A" }}>daerah di Indonesia</Link>{" "}
                        lewat{" "}
                        <a href="#series-populer" className="font-semibold no-underline transition hover:opacity-80" style={{ color: "#7FA64A" }}>animasi pendek</a>{" "}
                        yang seru untuk dinikmati.
                    </p>
                    <a href="#series-populer" className="mx-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-[0_10px_20px_rgba(141,198,63,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 md:mx-0" style={{ backgroundColor: "#B8EF64", color: "#47611B" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Mulai
                    </a>
                </div>
                <div className="flex shrink-0 justify-center md:w-64">
                    <img
                        src="/poto/splash-senyum.webp"
                        className="h-auto w-40 object-contain drop-shadow-[0_16px_24px_rgba(92,58,30,0.18)] md:w-52"
                        alt="Maskot NusaTales"
                    />
                </div>
            </div>
        </Container>
    );
}

// ===== SERIES CARD =====
function SeriesCard({ number, title, desc, episodes, image, imagePosition, isFeatured = false, revealDelay = 0 }) {
    return (
        <article
            className={`reveal-card group h-full overflow-hidden rounded-[30px] bg-white shadow-[0_14px_34px_rgba(93,62,30,0.08)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(93,62,30,0.14)] ${isFeatured ? "min-h-[520px]" : "min-h-[250px]"}`}
            style={{ "--reveal-delay": `${revealDelay}ms` }}
        >
            <div className={`relative w-full overflow-hidden bg-[#D4C5A0] ${isFeatured ? "h-[350px]" : "h-[138px]"}`}>
                <img
                    src={image}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    style={{ objectPosition: imagePosition }}
                    alt={title}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/22 to-transparent" />
                {isFeatured && (
                    <div className="absolute right-5 top-5 rounded-full bg-[#F7FFE7] px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#7FA64A] shadow-[0_8px_18px_rgba(54,72,24,0.12)]">
                        SERIES BARU
                    </div>
                )}
                <div className={`absolute -bottom-3 right-4 font-black leading-none text-[#8EAF4C] drop-shadow-[0_2px_0_rgba(255,255,255,0.9)] ${isFeatured ? "text-7xl md:text-8xl" : "text-6xl"}`}>
                    {number}
                </div>
            </div>
            <div className={`${isFeatured ? "p-7" : "p-5"} flex min-h-[112px] flex-col`}>
                <h3 className={`${isFeatured ? "text-2xl" : "text-xl"} mb-3 font-black leading-tight text-[#6B3F25]`}>
                    {title}
                </h3>
                <p className={`${isFeatured ? "text-base" : "text-sm"} line-clamp-2 leading-relaxed text-[#5F5041]`}>
                    {desc}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs font-semibold text-[#B18468]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{episodes} Episode</span>
                        {isFeatured && <span>850K Penonton</span>}
                    </div>
                    <button
                        type="button"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7B4A2B] transition hover:bg-[#FFF2D3]"
                        aria-label={`Simpan ${title} ke favorit`}
                        onClick={(event) => event.preventDefault()}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    );
}

function CategoryBrowseSection({ series }) {
    const categories = ["LEGENDA", "MITOLOGI", "KOMEDI", "PETUALANGAN", "MISTERI", "ROMANTIS"];
    const categoryItems = series.slice(0, 5);

    return (
        <section id="jelajahi-episode" className="mt-14">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black leading-tight md:text-4xl" style={{ color: "#6B3F25" }}>
                        Series Populer Berdasarkan Kategori
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <a
                                key={category}
                                href="#episode-terbaru"
                                className="rounded-full border border-[#B8EF64] px-3 py-1 text-xs font-bold uppercase leading-none text-[#7FA64A] transition hover:bg-[#B8EF64] hover:text-[#47611B]"
                            >
                                {category}
                            </a>
                        ))}
                    </div>
                </div>
                <a href="#episode-terbaru" className="mt-1 flex shrink-0 items-center gap-3 text-base font-bold transition hover:opacity-75" style={{ color: "#7FA64A" }}>
                    Lihat Semua
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {categoryItems.map((item, index) => {
                    const cover = getSeriesCover(item, index + 1);

                    return (
                        <Link
                            key={`${item.id}-category`}
                            to={getAnimationLink(item)}
                            className="reveal-card group relative h-48 overflow-hidden rounded-2xl bg-[#D4C5A0] shadow-[0_12px_24px_rgba(93,62,30,0.09)] transition duration-500 ease-out hover:-translate-y-1 md:h-56"
                            style={{ "--reveal-delay": `${index * 70}ms` }}
                        >
                            <img
                                src={cover.src}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                style={{ objectPosition: cover.position }}
                                alt={item.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/14 to-transparent" />
                            <h3 className="absolute bottom-5 left-5 right-4 text-xl font-black leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                                {item.title}
                            </h3>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function LatestEpisodeSection({ series }) {
    const fallbackEpisodeTitles = [
        "Tragedi Sumpah Palapa",
        "Perjanjian Dengan Siluman",
        "Janji yang Dilangkari",
        "Penebusan Dosa",
        "Pernikahan Malin Kundang",
    ];

    return (
        <section id="episode-terbaru" className="mt-14">
            <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-3xl font-black leading-tight md:text-4xl" style={{ color: "#6B3F25" }}>
                    Episode Terbaru
                </h2>
                <a href="#series-populer" className="flex shrink-0 items-center gap-3 text-base font-bold transition hover:opacity-75" style={{ color: "#7FA64A" }}>
                    Lihat Semua
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {series.slice(0, 5).map((item, index) => {
                    const cover = getSeriesCover(item, index + 2);
                    const episodeTitle = item.latest_episode?.title || item.episode_title || fallbackEpisodeTitles[index] || item.title;
                    const episodeLabel = item.latest_episode?.number || item.episode_number || [24, 24, 9, 10, 8][index] || index + 1;

                    return (
                        <Link
                            key={`${item.id}-episode`}
                            to={getAnimationLink(item)}
                            className="reveal-card group overflow-hidden rounded-3xl border-2 border-[#9BC84E] bg-white shadow-[0_10px_24px_rgba(93,62,30,0.08)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(93,62,30,0.14)]"
                            style={{ "--reveal-delay": `${index * 70}ms` }}
                        >
                            <div className="relative m-3 mb-0 h-32 overflow-hidden rounded-2xl bg-[#D4C5A0]">
                                <img
                                    src={cover.src}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    style={{ objectPosition: cover.position }}
                                    alt={episodeTitle}
                                />
                                <span className="absolute left-3 top-3 rounded-full bg-[#DDF9A1] px-2.5 py-1 text-[10px] font-black uppercase text-[#7FA64A]">
                                    EP {episodeLabel}
                                </span>
                                <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#7FA64A] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </span>
                            </div>
                            <div className="px-4 pb-4 pt-3">
                                <p className="mb-2 text-xs font-medium text-[#9A8A78]">{item.title}</p>
                                <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-snug text-[#3B2A0E]">
                                    {episodeTitle}
                                </h3>
                                <p className="mt-3 text-[11px] font-bold uppercase text-[#A7A08B]">
                                    {item.published_at ? "Baru Dirilis" : `${index * 3 + 2} Jam Yang Lalu`}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function LegendMapPromo() {
    return (
        <section className="mt-14 overflow-hidden rounded-2xl border border-[#E8DFC7] bg-white/50 px-6 py-8 shadow-[0_12px_30px_rgba(93,62,30,0.06)] md:px-12">
            <div className="grid items-center gap-8 md:grid-cols-[0.85fr_1.15fr]">
                <div>
                    <h2 className="text-3xl font-black leading-tight text-[#6B3F25]">
                        Jelajahi Peta Legenda
                    </h2>
                    <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-black">
                        Setiap pulau memiliki kisahnya sendiri. Gunakan peta interaktif kami untuk menemukan cerita rakyat dari Sabang hingga Merauke !!!
                    </p>
                    <Link
                        to="/peta"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#B8EF64] px-6 py-3 text-sm font-bold text-[#47611B] shadow-[0_10px_20px_rgba(141,198,63,0.28)] transition hover:-translate-y-0.5 hover:bg-[#A8E856]"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/>
                            <path d="M9 3v15M15 6v15"/>
                        </svg>
                        Buka Peta Interaktif
                    </Link>
                </div>

                <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[#23C96F] md:min-h-[250px]">
                    <img
                        src="/poto/peta-legenda.webp"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: "50% 48%" }}
                        alt="Peta legenda Nusantara"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#23C96F]/20" />
                    <img
                        src="/poto/splash-senyum.webp"
                        className="absolute -bottom-2 right-2 w-24 drop-shadow-[0_14px_20px_rgba(59,42,14,0.28)] md:w-32"
                        alt="Maskot NusaTales"
                    />
                </div>
            </div>
        </section>
    );
}

function PricingSection() {
    const plans = [
        {
            name: "Supporter",
            price: "Rp15.000",
            tone: "border-[#9B7A5C]",
            perks: ["Bebas Iklan", "Akses lebih Cepat", "Dukung Creator Lokal"],
            disabled: ["Akses Video Behind the Scenes", "Melihat Proses Story Board", "Sneak peek episode yang belum dirilis"],
        },
        {
            name: "Explorer",
            price: "Rp35.000",
            tone: "border-[#8DC63F]",
            featured: true,
            perks: ["Bebas Iklan", "Akses lebih Cepat", "Dukung Creator Lokal", "Akses Video Behind the Scenes", "Melihat Proses Story Board", "Sneak peek episode yang belum dirilis"],
            disabled: [],
        },
        {
            name: "VIP/Creator Pack",
            price: "Rp75.000",
            tone: "border-[#9B7A5C]",
            perks: ["Seluruh Benefit Paket Explorer", "Unduh File PSD Karakter", "Akses Desain Vektor Karakter", "Akses Unduh Background Art", "Akses Unduh Asset Animasi", "Akses Unduh Story Board"],
            disabled: [],
        },
    ];

    return (
        <section className="mt-14">
            <div className="mb-7 text-center">
                <h2 className="text-3xl font-black leading-tight text-[#6B3F25] md:text-4xl">
                    Pilihan Paket NusaAdhi
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-black">
                    Pilih paket yang paling pas untuk petualangan menelusuri kisah Nusantara-mu
                </p>
            </div>

            <div className="grid items-end gap-6 md:grid-cols-[0.7fr_1fr_1fr_1fr]">
                <div className="hidden justify-center md:flex">
                    <img
                        src="/poto/splash-senyum.webp"
                        className="w-48 object-contain drop-shadow-[0_16px_22px_rgba(92,58,30,0.18)]"
                        alt="Maskot NusaTales"
                    />
                </div>

                {plans.map((plan) => (
                    <article
                        key={plan.name}
                        className={`rounded-3xl border-2 bg-white/72 p-6 shadow-[0_14px_32px_rgba(93,62,30,0.08)] ${plan.tone} ${plan.featured ? "md:-translate-y-5" : ""}`}
                    >
                        <p className="text-sm font-black text-[#E07813]">{plan.name}</p>
                        <div className="mt-1 flex items-end gap-1">
                            <span className="text-3xl font-black text-[#E45F16]">{plan.price}</span>
                            <span className="pb-1 text-xs font-bold text-[#7B4A2B]">/Bulan</span>
                        </div>
                        <h3 className="mt-6 text-base font-black text-[#3B2A0E]">
                            {plan.featured ? "Akses Konten Eksklusif" : plan.name === "Supporter" ? "Akses Fitur Dasar" : "Akses Penuh & Unduh"}
                        </h3>
                        <ul className="mt-5 space-y-2 text-sm font-semibold text-[#3B2A0E]">
                            {plan.perks.map((perk) => (
                                <li key={perk} className="flex gap-2">
                                    <span className="text-[#7FA64A]">✓</span>
                                    <span>{perk}</span>
                                </li>
                            ))}
                            {plan.disabled.map((perk) => (
                                <li key={perk} className="flex gap-2 text-[#3B2A0E]/55 line-through">
                                    <span className="text-[#D5462D]">×</span>
                                    <span>{perk}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/register"
                            className={`mt-6 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${plan.featured ? "bg-[#B8EF64] text-[#47611B]" : "bg-[#74451F] text-white"}`}
                        >
                            Beli Paket
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

function WeeklyRecommendationSection() {
    return (
        <section className="mt-14 min-h-[360px] overflow-hidden rounded-[28px] bg-[#CFC5B8] px-7 py-12 md:min-h-[390px] md:px-12 md:py-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_0.75fr]">
                <div>
                    <h2 className="max-w-xl text-3xl font-black leading-tight text-[#B8EF64] drop-shadow-[0_1px_0_#6B3F25] md:text-4xl">
                        Dapatkan Rekomendasi Cerita Setiap Pekan!
                    </h2>
                    <p className="mt-5 max-w-xl text-sm font-semibold leading-relaxed text-black md:text-base">
                        Bergabunglah dengan ribuan penjelajah Nusantara lainnya dan jadilah yang pertama tahu saat legenda baru dirilis dalam format chibi yang menggemaskan.
                    </p>
                    <Link
                        to="/register"
                        className="mt-7 inline-flex rounded-full bg-[#B8EF64] px-7 py-3 text-sm font-black text-[#47611B] shadow-[0_10px_20px_rgba(91,115,38,0.24)] transition hover:-translate-y-0.5"
                    >
                        Daftar Sekarang
                    </Link>
                    <p className="mt-7 text-xs font-medium text-[#6B5A3E]">
                        Kami menjaga privasi ceritamu sebagaimana kami menjaga warisan budaya kita.
                    </p>
                </div>
                <div className="relative mx-auto flex h-64 w-64 items-end justify-center rounded-full bg-[#B8EF64] md:h-72 md:w-72">
                    <img
                        src="/poto/splash-senyum.webp"
                        className="absolute -bottom-3 h-72 w-auto object-contain drop-shadow-[0_16px_22px_rgba(92,58,30,0.22)] md:h-[360px]"
                        alt="Maskot NusaTales"
                    />
                </div>
            </div>
        </section>
    );
}

// ===== SERIES POPULER =====
function SeriesPopuler() {
    const [series, setSeries] = useState(dummySeries);
    const [isUsingFallback, setIsUsingFallback] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function loadHomepageData() {
            try {
                const animationResponse = await getPublishedAnimations({ per_page: 5 });

                if (!ignore) {
                    const apiSeries = animationResponse.data ?? [];

                    setSeries(apiSeries.length > 0 ? apiSeries : dummySeries);
                    setIsUsingFallback(apiSeries.length === 0);
                }
            } catch (_error) {
                if (!ignore) {
                    setSeries(dummySeries);
                    setIsUsingFallback(true);
                }
            }
        }

        loadHomepageData();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <Container className="mt-14 mb-12">
            <div id="series-populer"></div>
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black md:text-4xl" style={{ color: "#6B3F25" }}>Series Populer</h2>
                    <p className="mt-4 text-base font-semibold text-black">Kisah paling banyak ditonton minggu ini.</p>
                </div>
                <a href="#jelajahi-episode" className="flex shrink-0 items-center gap-3 text-base font-bold transition hover:opacity-75" style={{ color: "#7FA64A" }}>
                    Lihat Semua
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
            {isUsingFallback ? (
                <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EBDCB7", color: "#6B5A3E" }}>
                    Menampilkan data dummy sementara sampai koleksi backend siap.
                </div>
            ) : null}
            <div className="grid grid-cols-1 gap-7 md:grid-cols-3 md:auto-rows-[250px]">
                {series.map((item, index) => (
                    <Link key={item.id} to={getAnimationLink(item)} className={index === 0 ? "block md:row-span-2" : "block"}>
                        {(() => {
                            const cover = getSeriesCover(item, index);

                            return (
                                <SeriesCard
                                    number={String(index + 1)}
                                    title={item.title}
                                    desc={item.description || "NusaTales published animation."}
                                    episodes={item.counts?.comments ?? 0}
                                    image={cover.src}
                                    imagePosition={cover.position}
                                    isFeatured={index === 0}
                                    revealDelay={index * 85}
                                />
                            );
                        })()}
                    </Link>
                ))}
            </div>

            <CategoryBrowseSection series={series} />
            <LatestEpisodeSection series={series} />
            <LegendMapPromo />
            <PricingSection />
            <WeeklyRecommendationSection />
        </Container>
    );
}

// ===== MAIN =====
export default function LandingPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "#F5F0E0" }}>
            <AppNavbar current="home" />
            <Hero />
            <JelajahiSection />
            <SeriesPopuler />
            <Footer />
        </div>
    );
}

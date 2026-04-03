import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublishedAnimations } from "../services/animationService";
import { getCreators } from "../services/referenceService";
import AppNavbar from "../navbar/AppNavbar.jsx";

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

const dummyCreators = [
    { id: "dummy-creator-1", name: "Studio Parahyangan", followers_count: 1200, videos_count: 8 },
    { id: "dummy-creator-2", name: "Nusa Frame", followers_count: 980, videos_count: 6 },
    { id: "dummy-creator-3", name: "Legenda Timur", followers_count: 1430, videos_count: 11 },
    { id: "dummy-creator-4", name: "Cerita Pesisir", followers_count: 760, videos_count: 5 },
];

function isDummyRecord(id) {
    return String(id).startsWith("dummy-");
}

// Wrapper konsisten untuk semua section
const Container = ({ children, className = "" }) => (
    <div className={`max-w-6xl mx-auto px-6 ${className}`}>
        {children}
    </div>
);

// ===== HERO =====
function Hero() {
    const [activeSlide, setActiveSlide] = useState(0);

    return (
        <div id="hero" className="px-6 mt-4">
            <div className="max-w-6xl mx-auto">
                <section className="rounded-3xl overflow-hidden relative" style={{ minHeight: "380px", backgroundColor: "#2a1200" }}>
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 opacity-50" style={{
                            background: "radial-gradient(ellipse at 75% 50%, #c04000 0%, #2a0800 65%)"
                        }}></div>
                        <div className="absolute inset-0" style={{
                            background: "linear-gradient(to right, rgba(10,5,0,0.92) 38%, rgba(10,5,0,0.1) 100%)"
                        }}></div>
                        {/* <img src="/images/roro-bg.webp" className="w-full h-full object-cover absolute inset-0" /> */}
                    </div>

                    <div className="absolute right-8 top-0 h-full hidden md:flex items-center opacity-20">
                        <div className="text-9xl">👸</div>
                        {/* <img src="/images/roro-character.webp" className="h-full object-contain" /> */}
                    </div>

                    <div className="relative z-10 px-10 py-12 flex flex-col justify-center h-full">
                        <div className="w-10 h-10 rounded-full mb-5 border-2 border-yellow-400 bg-amber-700 flex items-center justify-center">
                            <span className="text-xl">🧒</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none" style={{ color: "#F5F0E0", fontFamily: "Georgia, serif" }}>
                            RORO JONGGRANG
                        </h1>
                        <p className="text-sm mb-7 max-w-md leading-relaxed" style={{ color: "#C8B89A" }}>
                            Temukan rahasia di balik terciptanya seribu candi dalam 1 malam melalui kisah cinta dan janji yang terlanggar.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link to="/register" className="px-7 py-3 rounded-full font-semibold text-sm transition hover:opacity-90" style={{ backgroundColor: "#F5F0E0", color: "#1a0a00" }}>
                                Daftar
                            </Link>
                            <a href="#series-populer" className="flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition hover:opacity-90" style={{ backgroundColor: "#8DC63F", color: "#fff" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                Tonton Sekarang
                            </a>
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                            {[0,1,2].map((i) => (
                                <button key={i} onClick={() => setActiveSlide(i)}
                                    className="rounded-full transition-all"
                                    style={{
                                        width: activeSlide === i ? "28px" : "8px",
                                        height: "8px",
                                        backgroundColor: activeSlide === i ? "#8DC63F" : "rgba(255,255,255,0.3)"
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// ===== JELAJAHI SECTION =====
function JelajahiSection() {
    return (
        <Container className="mt-10">
            <div id="jelajah"></div>
            <div className="flex items-center justify-between gap-8">
                <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                        yuk, jelajahi cerita nusantara !!!
                    </h2>
                    <p className="text-sm leading-relaxed mb-5 max-w-lg" style={{ color: "#6B5A3E" }}>
                        Yuk, temukan cerita legenda, mitologi, hingga sejarah dari berbagai{" "}
                        <a href="#creator-section" className="font-semibold underline" style={{ color: "#8DC63F" }}>daerah di Indonesia</a>{" "}
                        lewat{" "}
                        <a href="#series-populer" className="font-semibold underline" style={{ color: "#8DC63F" }}>animasi pendek</a>{" "}
                        yang seru untuk dinikmati.
                    </p>
                    <a href="#series-populer" className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: "#8DC63F", color: "#fff" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Mulai
                    </a>
                </div>
                <div className="hidden md:block shrink-0">
                    <img src="/poto/nunjuk.webp" className="w-44 h-auto" alt="Sitompel" />
                </div>
            </div>
        </Container>
    );
}

// ===== SERIES CARD =====
function SeriesCard({ number, title, desc, episodes, isFeatured = false }) {
    return (
        <div className="rounded-2xl overflow-hidden cursor-pointer" style={{ backgroundColor: "#D4C5A0" }}>
            <div className="w-full relative flex items-center justify-center overflow-hidden"
                style={{ height: isFeatured ? "320px" : "180px", backgroundColor: "#C4A882" }}>
                {/* <img src={`/images/series-${number}.webp`} className="w-full h-full object-cover" /> */}
                <div className="text-6xl opacity-20">🎭</div>
                {isFeatured && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: "#8DC63F", color: "#fff" }}>
                        SERIES BARU
                    </div>
                )}
                <div className="absolute bottom-2 left-3 text-7xl font-black" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "Georgia, serif", lineHeight: 1 }}>
                    {number}
                </div>
                <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-sm mb-1" style={{ color: "#3B2A0E" }}>{title}</h3>
                <p className="text-xs leading-relaxed mb-2" style={{ color: "#6B5A3E" }}>{desc}</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#9B8E7A" }}>{episodes} Episode</span>
                    {isFeatured && <span className="text-xs" style={{ color: "#9B8E7A" }}>850K Penonton</span>}
                </div>
            </div>
        </div>
    );
}

// ===== SERIES POPULER =====
function SeriesPopuler() {
    const [series, setSeries] = useState(dummySeries);
    const [creators, setCreators] = useState(dummyCreators);
    const [isUsingFallback, setIsUsingFallback] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function loadHomepageData() {
            try {
                const [animationResponse, creatorResponse] = await Promise.all([
                    getPublishedAnimations({ per_page: 5 }),
                    getCreators({ per_page: 4 }),
                ]);

                if (!ignore) {
                    const apiSeries = animationResponse.data ?? [];
                    const apiCreators = creatorResponse.items ?? creatorResponse ?? [];

                    setSeries(apiSeries.length > 0 ? apiSeries : dummySeries);
                    setCreators(apiCreators.length > 0 ? apiCreators : dummyCreators);
                    setIsUsingFallback(apiSeries.length === 0 || apiCreators.length === 0);
                }
            } catch (_error) {
                if (!ignore) {
                    setSeries(dummySeries);
                    setCreators(dummyCreators);
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
        <Container className="mt-10 mb-12">
            <div id="series-populer"></div>
            <div className="flex items-end justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>Series Populer</h2>
                    <p className="text-sm mt-1" style={{ color: "#9B8E7A" }}>Kisah paling banyak ditonton minggu ini.</p>
                </div>
                <a href="#creator-section" className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#8DC63F" }}>
                    Lihat Semua
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
            {isUsingFallback ? (
                <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "#EBDCB7", color: "#6B5A3E" }}>
                    Menampilkan data dummy sementara sampai koleksi backend siap.
                </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {series.map((item, index) => (
                    <Link key={item.id} to={isDummyRecord(item.id) ? "/register" : `/animations/${item.id}`} className={index === 0 ? "md:row-span-2 block" : "block"}>
                        <SeriesCard
                            number={String(index + 1)}
                            title={item.title}
                            desc={item.description || "NusaTales published animation."}
                            episodes={item.counts?.comments ?? 0}
                            isFeatured={index === 0}
                        />
                    </Link>
                ))}
            </div>

            <div id="creator-section" className="mt-8">
                <h3 className="text-xl font-bold mb-4" style={{ color: "#3B2A0E", fontFamily: "Georgia, serif" }}>
                    Featured Creators
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {creators.map((creator) => (
                        <Link key={creator.id} to={isDummyRecord(creator.id) ? "/register" : "/account"} className="rounded-3xl p-5 block" style={{ backgroundColor: "#DCCDAA" }}>
                            <p className="font-bold text-lg" style={{ color: "#3B2A0E" }}>
                                {creator.name}
                            </p>
                            <p className="text-sm mt-1" style={{ color: "#6B5A3E" }}>
                                {creator.followers_count} followers
                            </p>
                            <p className="text-sm" style={{ color: "#8A7B5A" }}>
                                {creator.videos_count} animations
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </Container>
    );
}

// ===== FOOTER =====
function Footer() {
    return (
        <footer className="py-10 px-6" style={{ backgroundColor: "#5C3A1E" }}>
            <h2 className="text-center text-3xl font-bold mb-6" style={{ color: "#8DC63F", fontFamily: "Georgia, serif" }}>NusaTales</h2>
            <div className="flex items-center justify-center gap-8 mb-4 flex-wrap">
                {["Tentang Kami", "Kredit Budaya", "Privasi", "Syarat & Ketentuan"].map((item) => (
                    <a key={item} href="#" className="text-sm transition hover:opacity-80" style={{ color: "#F5F0E0" }}>{item}</a>
                ))}
            </div>
            <div className="w-16 h-px mx-auto mb-4" style={{ backgroundColor: "#8DC63F" }}></div>
            <p className="text-center text-xs" style={{ color: "#C8B89A" }}>© 2026 NusaTales: Sang Penjaga Cerita Nusantara.</p>
            <p className="text-center text-xs mt-1" style={{ color: "#C8B89A" }}>Dibuat dengan cinta untuk warisan budaya.</p>
            <div className="flex justify-center mt-6">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ backgroundColor: "#7A5230" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5F0E0" strokeWidth="2.5">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                </button>
            </div>
        </footer>
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

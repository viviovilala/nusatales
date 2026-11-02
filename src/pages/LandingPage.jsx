import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import Footer from "../components/Footer";

const heroSlides = [
    {
        title: "RORO JONGGRANG",
        description: "Temukan rahasia di balik terciptanya seribu candi dalam satu malam melalui kisah cinta, janji, dan siasat kerajaan.",
        image: "/poto/hero-roro-closeup.webp",
        objectPosition: "68% 48%",
    },
    {
        title: "SERIBU CANDI",
        description: "Ikuti kobaran kekuatan magis dan tekad yang membangun legenda besar tanah Jawa sebelum fajar tiba.",
        image: "/poto/hero-roro-action.webp",
        objectPosition: "54% 52%",
    },
    {
        title: "BANDUNG BONDOWOSO",
        description: "Saksikan perjalanan sang ksatria sakti dalam takdir kerajaan dan ujian janji yang abadi.",
        image: "/poto/hero-bandung-bondowoso.webp",
        objectPosition: "66% 48%",
    },
];

const featuredFolklore = [
    {
        title: "Kisah Seribu Candi",
        region: "Jawa Tengah",
        desc: "Kisah cinta dan persyaratan membangun seribu candi dalam semalam oleh Bandung Bondowoso.",
        image: "/poto/hero-roro-action.webp",
        position: "46% 52%",
    },
    {
        title: "Malin Kundang",
        region: "Sumatera Barat",
        desc: "Peringatan abadi tentang bakti kepada orang tua di tepi pantai Pantai Air Manis.",
        image: "/poto/hero-bandung-bondowoso.webp",
        position: "54% 52%",
    },
    {
        title: "Candi Borobudur",
        region: "Jawa Tengah",
        desc: "Kemegahan relief dan arsitektur peninggalan wangsa Syailendra.",
        image: "/poto/hero-roro-closeup.webp",
        position: "50% 48%",
    },
];

export default function LandingPage() {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const currentSlide = heroSlides[activeSlide % heroSlides.length];

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E0]">
            <AppNavbar />

            {/* Hero Section */}
            <div id="hero" className="px-4 sm:px-6 mt-2">
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
                            <div className="absolute inset-0 bg-gradient-to-r from-[#231309]/95 via-[#381F0D]/75 to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#150D08]/80 to-transparent pointer-events-none" />
                        </div>

                        <div className="relative z-10 flex min-h-[460px] max-w-[700px] flex-col justify-center px-6 py-9 sm:px-9 md:min-h-[500px] md:px-11">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f7e9a0] bg-[#f7f0d9]/90 shadow-md overflow-hidden">
                                <img
                                    src="/poto/splash-senyum.webp"
                                    className="h-10 w-10 object-contain drop-shadow-sm"
                                    alt="Maskot NusaTales"
                                />
                            </div>
                            <h1
                                className="mb-4 max-w-[650px] text-4xl font-black uppercase leading-[0.95] tracking-wide text-[#fff8e8] sm:text-5xl md:text-6xl"
                                style={{ fontFamily: "Georgia, serif" }}
                            >
                                {currentSlide.title}
                            </h1>
                            <p className="mb-7 max-w-[600px] text-sm font-medium leading-relaxed text-[#fff9ed]/90">
                                {currentSlide.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    to="/reels"
                                    className="flex items-center gap-2 rounded-full bg-[#b8ef64] px-7 py-3 text-sm font-bold text-[#2f4b14] shadow-md transition hover:bg-[#a8e856]"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Tonton di Reels
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-full border border-white/40 bg-white/20 px-8 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/30"
                                >
                                    Gabung Kreator
                                </Link>
                            </div>
                        </div>

                        {/* Slide indicators */}
                        <div className="absolute bottom-7 right-7 z-10 flex items-center gap-2">
                            {heroSlides.map((slide, i) => (
                                <button
                                    key={slide.title}
                                    onClick={() => setActiveSlide(i)}
                                    className="h-2 rounded-full transition-all cursor-pointer"
                                    style={{
                                        width: activeSlide === i ? "24px" : "8px",
                                        backgroundColor: activeSlide === i ? "#b8ef64" : "rgba(255,255,255,0.4)",
                                    }}
                                    aria-label={`Pilih slide ${i + 1}`}
                                    type="button"
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Showcase Section */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-14 w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-[#7FA64A]">
                            Warisan Budaya
                        </span>
                        <h2
                            className="text-3xl sm:text-4xl font-black text-[#6B3F25] mt-1"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            Jelajahi Cerita Rakyat Indonesia
                        </h2>
                        <p className="text-sm font-medium text-neutral-700 max-w-xl mt-2">
                            Temukan cerita legenda, mitologi, hingga sejarah dari berbagai penjuru Nusantara lewat video animasi pendek yang memikat.
                        </p>
                    </div>

                    <Link
                        to="/reels"
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:opacity-95"
                        style={{ backgroundColor: "#B8EF64", color: "#47611B" }}
                    >
                        Buka Feed Reels
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredFolklore.map((item) => (
                        <div
                            key={item.title}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-amber-200/70 hover:shadow-md transition"
                        >
                            <div className="h-44 relative bg-amber-200 overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: item.position }}
                                />
                                <span className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold rounded-full">
                                    {item.region}
                                </span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-[#3B2A0E] mb-2">{item.title}</h3>
                                <p className="text-sm text-neutral-600 mb-4">{item.desc}</p>
                                <Link
                                    to="/reels"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950"
                                >
                                    Tonton di Reels →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}

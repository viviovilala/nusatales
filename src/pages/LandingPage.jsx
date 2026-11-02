import { AppLink as Link } from "../app/ModalContext";
import React, { useEffect, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, Pause, ChevronLeft, ChevronRight, Compass, Film, Sparkles, Clock3, RefreshCw } from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import Footer from "../components/Footer";
import SubscriptionPlans from "../components/SubscriptionPlans";
import StorageImage from "../components/StorageImage";
import Reveal, { useReveal } from "../components/Reveal";
import { videoRepository } from "../features/videos/videoRepository";
import { videoHref } from "../lib/videoLinks";
import { useAuth } from "../features/auth/AuthProvider";

// Editorial artwork introduces the cultural collection. Playback links below
// always use actual published records rather than inventing video IDs/counts.
const heroSlides = [
    { title: "RORO JONGGRANG", description: "Temukan rahasia di balik terciptanya seribu candi dalam satu malam. Sebuah kisah cinta, janji, dan siasat kerajaan.", image: "/poto/hero-roro-closeup.webp", position: "65% 43%", search: "Roro Jonggrang" },
    { title: "KISAH SERIBU CANDI", description: "Ketika janji bertemu kekuatan magis. Jelajahi legenda tanah Jawa yang terus hidup, dari satu generasi ke generasi berikutnya.", image: "/poto/hero-roro-action.webp", position: "60% 45%", search: "Seribu Candi" },
    { title: "BANDUNG BONDOWOSO", description: "Ikuti jejak sang ksatria dalam kisah tentang tekad, takdir, dan sebuah janji sebelum fajar tiba.", image: "/poto/hero-bandung-bondowoso.webp", position: "65% 42%", search: "Bandung Bondowoso" },
];
const filters = [{ value: "all", label: "Semua karya" }, { value: "animation", label: "Film animasi" }, { value: "reel", label: "Shorts budaya" }];
const StoryLink = motion.create(Link);

function SectionHeading({ eyebrow, title, description, href = "/animations", linkText = "Lihat semua" }) {
    return <div className="home-section-heading">
        <div>{eyebrow && <span className="home-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>
        <Link to={href} className="home-text-link">{linkText}<ArrowRight size={17} aria-hidden="true" /></Link>
    </div>;
}
function StoryCard({ video, featured = false, compact = false, index = 0 }) {
    const duration = video.duration_seconds;
    const reveal = useReveal("up", index * 0.06);
    const reducedMotion = useReducedMotion();
    return <StoryLink {...reveal} whileHover={reducedMotion ? undefined : { y: -3, transition: { duration: 0.18 } }} to={videoHref(video)} className={`home-story-card ${featured ? "home-story-featured" : ""} ${compact ? "home-story-compact" : ""}`}>
        <div className="home-story-image">
            <StorageImage path={video.thumbnail_path} fallbackSrc="/poto/hero-roro-action.webp" alt="" loading="lazy" />
            <span className="home-format-label">{video.content_type === "animation" ? "Film animasi" : "Shorts"}</span>
            <span className="home-story-play"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
            {duration > 0 && <span className="home-duration"><Clock3 size={12} />{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}</span>}
        </div>
        <div className="home-story-info">
            <span className="home-story-creator">{video.creator?.display_name || "Kreator NusaTales"}</span>
            <h3>{video.title}</h3>
            {!compact && <p>{video.description || "Temukan kisah dan sudut pandang budaya lewat karya kreator Nusantara."}</p>}
            <span className="home-story-watch">Tonton cerita<ArrowRight size={14} aria-hidden="true" /></span>
        </div>
    </StoryLink>;
}
function LoadingStories() {
    return <div className="home-bento" role="status" aria-label="Memuat pilihan cerita">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className={`home-story-skeleton ${index === 0 ? "home-story-featured" : ""}`}><div /><span /><span /></div>)}
    </div>;
}

export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const reducedMotion = useReducedMotion();
    const [activeSlide, setActiveSlide] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [videos, setVideos] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loadState, setLoadState] = useState("loading");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (reducedMotion || !autoPlay || hovered || focused) return;
        const timer = setInterval(() => setActiveSlide((index) => (index + 1) % heroSlides.length), 6500);
        return () => clearInterval(timer);
    }, [reducedMotion, autoPlay, hovered, focused]);
    useEffect(() => {
        let current = true;
        setLoadState("loading");
        videoRepository.getPublishedFeed({ limit: 18, contentType: null }).then(({ data, error }) => {
            if (!current) return;
            if (error) { setLoadState("error"); return; }
            setVideos(data || []);
            setLoadState("ready");
        }).catch(() => { if (current) setLoadState("error"); });
        return () => { current = false; };
    }, [retry]);

    const slide = heroSlides[activeSlide];
    const matchingVideo = videos.find((video) => video.title.toLowerCase().includes(slide.search.toLowerCase()));
    const collection = filter === "all" ? videos : videos.filter((video) => video.content_type === filter);
    const featured = collection.slice(0, 5);
    const latest = videos.slice(0, 5);
    const creatorHref = isAuthenticated ? "/studio/upload" : "/register";

    return <div className="home-page batik-surface">
        <AppNavbar />
        <main id="main-content" tabIndex={-1} className="home-main">
            {/* Hero carousel matching the reference's image-led composition. */}
            <Reveal as="section" className="home-hero" aria-roledescription="carousel" aria-label="Kisah Nusantara pilihan"
                onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
                <AnimatePresence initial={false}>
                    <motion.img key={slide.image} src={slide.image} alt="" className="home-hero-art"
                        style={{ objectPosition: slide.position }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.7 }} fetchPriority="high" />
                </AnimatePresence>
                <div className="home-hero-shade" />
                <Reveal key={slide.title} direction="left" delay={0.08} className="home-hero-content" aria-live={autoPlay && !reducedMotion ? "off" : "polite"}>
                    <span className="home-hero-kicker"><Sparkles size={14} aria-hidden="true" />LEGENDA NUSANTARA</span>
                    <h1>{slide.title}</h1>
                    <p>{slide.description}</p>
                    <div className="home-hero-actions">
                        <Link to={matchingVideo ? videoHref(matchingVideo) : `/animations?q=${encodeURIComponent(slide.search)}`} className="nusa-button"><Play size={16} fill="currentColor" aria-hidden="true" />{matchingVideo ? "Tonton sekarang" : "Jelajahi kisah"}</Link>
                        <Link to={creatorHref} className="nusa-button nusa-button-glass">{isAuthenticated ? "Bagikan karya" : "Mulai petualangan"}<ArrowRight size={16} /></Link>
                    </div>
                </Reveal>
                <div className="home-carousel-controls">
                    <button className="home-carousel-arrow" aria-label="Kisah sebelumnya" onClick={() => setActiveSlide((activeSlide + heroSlides.length - 1) % heroSlides.length)}><ChevronLeft size={18} /></button>
                    <div className="home-carousel-dots">{heroSlides.map((item, index) => <button key={item.title} aria-label={`Lihat ${item.title}`} aria-pressed={activeSlide === index} onClick={() => setActiveSlide(index)} />)}</div>
                    <button className="home-carousel-arrow" aria-label="Kisah berikutnya" onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}><ChevronRight size={18} /></button>
                    {!reducedMotion && <button className="home-carousel-arrow" aria-label={autoPlay ? "Jeda pergantian kisah" : "Putar pergantian kisah"} onClick={() => setAutoPlay(!autoPlay)}>{autoPlay ? <Pause size={14} /> : <Play size={14} />}</button>}
                </div>
                <span className="home-hero-number" aria-hidden="true">0{activeSlide + 1}<span> / 03</span></span>
            </Reveal>

            {/* Introduction and mascot */}
            <Reveal as="section" id="tentang-kami" className="home-intro">
                <div><span className="home-eyebrow">SELAMAT DATANG, PENJELAJAH</span>
                    <h2>Yuk, jelajahi cerita<br />Nusantara!</h2>
                    <p>Dari legenda yang akrab di telinga sampai kisah yang belum pernah kamu dengar. Temukan budaya Indonesia lewat animasi karya kreator lokal.</p>
                    <a href="#pilihan-cerita" className="nusa-button"><Compass size={16} />Mulai menjelajah</a>
                </div>
                <Reveal direction="right" delay={0.12} className="home-intro-mascot"><span aria-hidden="true" /><img src="/poto/nunjuk.webp" width="160" height="300" alt="Maskot NusaTales mengajak menjelajah" /></Reveal>
            </Reveal>

            {/* Published stories use real records, without invented popularity metrics. */}
            <Reveal as="section" id="pilihan-cerita" className="home-section">
                <SectionHeading eyebrow="ADA CERITA DI SETIAP SUDUT" title="Pilihan cerita Nusantara" description="Temukan karya terbaru dari para penjaga cerita." />
                <div className="home-filter-row" role="group" aria-label="Filter jenis karya">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</div>
                {loadState === "loading" ? <LoadingStories /> : loadState === "error" ? <div className="home-empty" role="alert"><Compass size={30} /><h3>Cerita belum berhasil dimuat</h3><p>Coba muat kembali untuk melanjutkan penjelajahan.</p><button className="nusa-button" onClick={() => setRetry(retry + 1)}><RefreshCw size={16} />Coba lagi</button></div>
                    : featured.length ? <div className="home-bento">{featured.map((video, index) => <StoryCard key={video.id} video={video} index={index} featured={index === 0} />)}</div>
                        : <div className="home-empty"><Film size={30} /><h3>Kisah baru sedang menanti</h3><p>{filter === "all" ? "Belum ada karya yang dipublikasikan. Jadilah bagian dari cerita pertama di sini." : "Belum ada karya dalam format ini. Coba jelajahi format lainnya."}</p><Link to={filter === "all" ? creatorHref : "/animations"} className="nusa-button">{filter === "all" ? "Bagikan ceritamu" : "Buka katalog"}<ArrowRight size={16} /></Link></div>}
            </Reveal>

            {/* A compact latest row follows the episode strip in the reference. */}
            {loadState === "ready" && latest.length > 0 && <Reveal as="section" className="home-section">
                <SectionHeading title="Baru hadir, siap ditonton" description="Lanjutkan petualangan dengan karya yang baru dipublikasikan." />
                <div className="home-latest">{latest.map((video, index) => <StoryCard key={video.id} video={video} index={index} compact />)}</div>
            </Reveal>}

            {/* The map is an editorial illustration; the CTA opens the working catalogue. */}
            <Reveal as="section" className="home-map-banner">
                <div><span className="home-eyebrow">DARI SABANG SAMPAI MERAUKE</span><h2>Satu Nusantara.<br />Ribuan cerita.</h2><p>Setiap daerah menyimpan kisahnya sendiri. Kenali warisan yang menghubungkan kita, satu cerita pada satu waktu.</p><Link to="/animations" className="nusa-button"><Compass size={16} />Jelajahi koleksi budaya</Link></div>
                <Reveal direction="right" delay={0.1} className="home-map-art"><div className="home-map-landscape"><img src="/poto/peta-legenda.webp" alt="Ilustrasi peta kepulauan Indonesia" loading="lazy" width="1840" height="2800" /></div><img className="home-map-mascot" src="/poto/nunjuk.webp" alt="" loading="lazy" /></Reveal>
            </Reveal>

            <SubscriptionPlans />

            <Reveal as="section" className="home-creator-banner">
                <div><span className="home-eyebrow">CERITA KITA, WARISAN BERSAMA</span><h2>Cerita berikutnya,<br />bisa jadi karyamu.</h2><p>Jadilah bagian dari para penjaga cerita. Bawa kisah dari daerahmu, hidupkan lewat imajinasimu.</p><Link to={creatorHref} className="nusa-button">{isAuthenticated ? "Unggah karya pertamamu" : "Gabung jadi kreator"}<ArrowRight size={16} /></Link></div>
                <Reveal direction="right" delay={0.12} className="home-creator-mascot"><span aria-hidden="true" /><img src="/poto/splash-senyum.webp" width="220" height="320" alt="Maskot NusaTales menyambut kreator" loading="lazy" /></Reveal>
            </Reveal>
        </main>
        <Footer />
    </div>;
}

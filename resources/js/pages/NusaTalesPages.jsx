import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
    AssetCard,
    BadgeCard,
    ChallengeCard,
    CoinPackageCard,
    CommentSection,
    CreatorCard,
    CulturalProgressPath,
    EmptyState,
    EpisodeCard,
    ErrorState,
    FavoriteButton,
    Icon,
    ImageFrame,
    LikeButton,
    LoadingSkeleton,
    LoginPrompt,
    MonetizationAgreementModal,
    Navbar,
    NusaAdhiPanel,
    PageShell,
    SaveButton,
    ShareButton,
    ShortVideoPlayer,
    StudioShell,
    SubscriptionPlanCard,
    ThumbnailSelector,
    TransactionHistory,
    UploadDropzone,
    VideoCard,
    VideoPlayer,
    WalletBalanceCard,
} from "../components/nusatales/NusaComponents";
import {
    categories as fallbackCategories,
    challenge as fallbackChallenge,
    koinPackages,
    comments,
    creators,
    culturalProgress,
    exploreCards,
    favoriteItems,
    featuredVideo,
    genres as fallbackGenres,
    karyaItems,
    latestEpisodes,
    mascotImage,
    mockups,
    popularStudioSeries,
    products,
    regions,
    seriesPopular,
    shorts,
    studioEpisodes,
    studioStats,
    subscriptionPlans,
    unwrapApiData,
} from "../data/nusatalesData";
import api, { setStoredToken } from "../services/api";
import { getAssets } from "../services/assetApi";
import { getChallenge, getChallengeLeaderboard, getChallenges } from "../services/challengeApi";
import { addFavorite, getBadges, getCulturalProgress, getMissions, getRegions } from "../services/culturalApi";
import { getFavorites } from "../services/favoriteApi";
import { checkoutCoinPackage, getCoinPackages, getWallet, getWalletTransactions } from "../services/walletApi";
import { checkoutSubscription, getBilling, getSubscriptionPlans } from "../services/subscriptionApi";
import {
    agreeMonetization,
    createStudioVideo,
    getStudioAnalytics,
    getStudioDashboard,
    getStudioMonetization,
    getStudioVideos,
} from "../services/studioApi";
import {
    getCategories,
    getGenres,
    getLatestEpisodes,
    getPopularSeries,
    getSeries,
    getSeriesDetail,
} from "../services/seriesApi";
import {
    getFeaturedVideos,
    getRecommendedVideos,
    getVideo,
    getVideos,
    likeVideo,
    recordVideoView,
    saveWatchLater,
    unlockVideo,
} from "../services/videoApi";
import { getApiErrorMessage, getApiValidationErrors } from "../utils/errorMessage";

function StudioActivationPrompt() {
    const { activateStudio } = useAuth();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function activate() {
        setLoading(true);
        setMessage("");

        try {
            await activateStudio();
            setMessage("Studio NusaKarya berhasil diaktifkan.");
            navigate("/studio/upload");
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error("API error:", error?.response?.status, error?.response?.data || error);
            }

            setMessage(getApiErrorMessage(error, "Studio belum bisa diaktifkan saat ini."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <StudioShell active="Beranda">
            <section className="nt-card pad nt-soft" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 14rem", gap: "1.5rem", alignItems: "center" }}>
                <div>
                    <h1 className="nt-title" style={{ fontSize: "2.6rem" }}>Aktifkan Studio NusaKarya</h1>
                    <p style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.7 }}>
                        Studio NusaKarya adalah ruang kreator NusaTales untuk mengunggah animasi, membuat episode NusaSaga, membagikan Shorts, dan membangun channel cerita Nusantara.
                    </p>
                    {message ? <div className={`nt-status ${message.includes("belum") ? "nt-error" : ""}`}>{message}</div> : null}
                    <button type="button" className="nt-btn dark" onClick={activate} disabled={loading} style={{ marginTop: "1rem" }}>
                        {loading ? "Mengaktifkan..." : "Aktifkan Studio"}
                    </button>
                </div>
                <img src={mascotImage} alt="" style={{ width: "13rem", justifySelf: "center" }} />
            </section>
        </StudioShell>
    );
}

function useApiFallback(loader, fallback, deps = []) {
    const [data, setData] = useState(fallback);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let ignore = false;

        async function load() {
            setStatus("loading");
            try {
                const response = await loader();
                if (!ignore) {
                    setData(unwrapApiData(response, fallback));
                    setStatus("ready");
                }
            } catch (_error) {
                if (!ignore) {
                    setData(fallback);
                    setStatus("fallback");
                }
            }
        }

        load();

        return () => {
            ignore = true;
        };
    }, deps);

    return { data, status };
}

function StatusLine({ status }) {
    if (status === "loading") {
        return <LoadingSkeleton />;
    }

    if (status === "fallback") {
        return <ErrorState />;
    }

    return null;
}

function getFirstFieldError(errors, key) {
    const error = errors?.[key];

    if (Array.isArray(error)) {
        return error[0] ?? "";
    }

    return typeof error === "string" ? error : "";
}

const cleanTheme = {
    cream: "#F5F0E0",
    brown: "#3B2A0E",
    darkBrown: "#5C3A1E",
    muted: "#6B5A3E",
    lime: "#8DC63F",
    soft: "#DCCDAA",
    panel: "#fff8e8",
};

const cleanTwoColumn = "repeat(auto-fit, minmax(18rem, 1fr))";
const cleanFourGrid = "repeat(auto-fit, minmax(13rem, 1fr))";

function cleanCardStyle(extra = {}) {
    return {
        borderRadius: "1.8rem",
        background: extra.background ?? "rgba(255,255,255,.72)",
        border: "1px solid rgba(92,58,30,.08)",
        boxShadow: "0 1.2rem 2.6rem rgba(59,42,14,.08)",
        ...extra,
    };
}

function SectionHeader({ title, subtitle, link }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "end", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div>
                <h2 className="nt-heading" style={{ color: cleanTheme.brown, letterSpacing: "-.03em" }}>{title}</h2>
                {subtitle ? <p className="nt-subtle" style={{ margin: ".35rem 0 0", fontWeight: 750, color: cleanTheme.muted, lineHeight: 1.55 }}>{subtitle}</p> : null}
            </div>
            {link ? (
                <Link to={link.to} style={{ color: cleanTheme.lime, fontWeight: 950, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
                    {link.label} -&gt;
                </Link>
            ) : null}
        </div>
    );
}

function CleanIntro({ badge, title, subtitle, action, mascot = true }) {
    return (
        <section className="nt-card pad" style={cleanCardStyle({ display: "grid", gridTemplateColumns: mascot ? "minmax(0, 1fr) 12rem" : "1fr", gap: "1.5rem", alignItems: "center", background: "#ded4bd" })}>
            <div>
                {badge ? <span className="nt-pill green">{badge}</span> : null}
                <h1 className="nt-title" style={{ marginTop: badge ? "1rem" : 0, color: cleanTheme.brown }}>{title}</h1>
                {subtitle ? <p style={{ maxWidth: "48rem", color: cleanTheme.muted, lineHeight: 1.6, fontWeight: 800 }}>{subtitle}</p> : null}
                {action ? <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: "1.1rem" }}>{action}</div> : null}
            </div>
            {mascot ? <img className="nt-hide-mobile" src={mascotImage} alt="" style={{ width: "11rem", justifySelf: "center" }} /> : null}
        </section>
    );
}

function SeriesCard({ item, rank = "1", large = false }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.explore;
    const slug = item?.slug ?? item?.id ?? "kisah-seribu-candi";

    return (
        <Link to={`/watch/${slug}`} className="nt-card" style={cleanCardStyle({ overflow: "hidden", textDecoration: "none", color: "inherit", display: "block" })}>
            <ImageFrame src={image} style={{ height: large ? "20rem" : "10.8rem", borderRadius: "1.4rem 1.4rem 0 0", position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", left: "1rem", bottom: ".5rem", color: "rgba(255,255,255,.35)", fontFamily: "Georgia, serif", fontSize: large ? "5.8rem" : "3.8rem", fontWeight: 950, lineHeight: 1 }}>{rank}</span>
                {large ? <span className="nt-pill green" style={{ position: "absolute", right: "1rem", top: "1rem" }}>Series Baru</span> : null}
            </ImageFrame>
            <div style={{ padding: "1rem" }}>
                <h3 style={{ margin: 0, color: cleanTheme.brown, fontWeight: 950, fontSize: large ? "1.35rem" : "1rem" }}>{item?.title ?? "Kisah Nusantara"}</h3>
                <p style={{ color: cleanTheme.muted, lineHeight: 1.45, fontWeight: 700, fontSize: ".88rem" }}>{item?.description ?? "Cerita budaya Indonesia dalam animasi singkat."}</p>
                <small className="nt-subtle">{item?.genre ?? item?.category?.name ?? "Legenda"} • {item?.views ?? item?.view_count ?? "850K"} tayangan</small>
            </div>
        </Link>
    );
}

function HomeHero({ item }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.explore;
    const slug = item?.slug ?? "roro-jonggrang";

    return (
        <section className="nt-container nt-section">
            <ImageFrame
                src={image}
                style={{
                    minHeight: "31rem",
                    borderRadius: "2.4rem",
                    overflow: "hidden",
                    position: "relative",
                    display: "grid",
                    alignItems: "center",
                    padding: "2.8rem",
                    color: "#fffdf7",
                    boxShadow: "0 1.8rem 4rem rgba(59,42,14,.22)",
                    backgroundColor: "#2a1200",
                }}
            >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 76% 45%, rgba(192,64,0,.55) 0%, rgba(42,8,0,.7) 58%), linear-gradient(90deg, rgba(10,5,0,.94) 34%, rgba(10,5,0,.12) 100%)" }} />
                <div style={{ position: "relative", maxWidth: "42rem" }}>
                    <div className="nt-avatar" style={{ width: "4rem", height: "4rem", marginBottom: "1rem", borderColor: cleanTheme.lime }}>
                        <img src={mascotImage} alt="" />
                    </div>
                    <span className="nt-pill green">Lakon & NusaSaga</span>
                    <h1 className="nt-title" style={{ color: "#fffdf7", fontSize: "clamp(3rem, 7vw, 6.4rem)", lineHeight: .95, marginTop: "1rem" }}>{item?.title ?? "RORO JONGGRANG"}</h1>
                    <p style={{ maxWidth: "35rem", lineHeight: 1.6, fontWeight: 800, color: "#C8B89A" }}>
                        {item?.subtitle ?? item?.description ?? "Temukan rahasia di balik terciptanya seribu candi dalam satu malam melalui kisah cinta dan janji yang terlanggari."}
                    </p>
                    <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                        <Link className="nt-btn green" to={`/watch/${slug}`}>
                            <Icon name="play" />
                            Tonton Sekarang
                        </Link>
                        <Link className="nt-btn ghost" style={{ color: "#fffdf7", borderColor: "rgba(255,255,255,.45)" }} to="/register">Daftar Gratis</Link>
                    </div>
                </div>
            </ImageFrame>
        </section>
    );
}

export function HomePage() {
    const featured = useApiFallback(getFeaturedVideos, featuredVideo, []);
    const series = useApiFallback(getPopularSeries, seriesPopular, []);
    const episodes = useApiFallback(getLatestEpisodes, latestEpisodes, []);
    const categories = useApiFallback(getCategories, fallbackCategories, []);
    const plans = useApiFallback(getSubscriptionPlans, subscriptionPlans, []);

    const mainFeature = Array.isArray(featured.data) ? featured.data[0] ?? featuredVideo : featured.data;
    const seriesItems = Array.isArray(series.data) ? series.data : seriesPopular;
    const episodeItems = Array.isArray(episodes.data) ? episodes.data : latestEpisodes;

    return (
        <PageShell active="Beranda">
            <HomeHero item={{ ...featuredVideo, ...mainFeature }} />
            <main className="nt-container" style={{ display: "grid", gap: "2.4rem", paddingBottom: "3rem" }}>
                <CleanIntro
                    badge="Penjelajah Nusantara"
                    title="Yuk, jelajahi cerita Nusantara!"
                    subtitle="Temukan legenda, mitologi, dan sejarah dari berbagai daerah di Indonesia lewat animasi pendek yang seru, ringan, dan modern."
                    action={
                        <Link to="/jelajah" className="nt-btn green">
                            <Icon name="play" />
                            Mulai Jelajah
                        </Link>
                    }
                />

                <section>
                    <SectionHeader title="Series Populer" subtitle="Kisah paling banyak ditonton minggu ini." link={{ to: "/jelajah", label: "Lihat Semua" }} />
                    <StatusLine status={series.status} />
                    <div className="nt-grid" style={{ gridTemplateColumns: cleanTwoColumn }}>
                        <SeriesCard item={seriesItems[0] ?? seriesPopular[0]} rank="1" large />
                        <div className="nt-grid nt-grid-2">
                            {seriesItems.slice(1, 5).map((item, index) => <SeriesCard key={item.id ?? item.slug} item={item} rank={index + 2} />)}
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader title="Series Populer Berdasarkan Kategori" link={{ to: "/jelajah", label: "Lihat Semua" }} />
                    <StatusLine status={categories.status} />
                    <div style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        {(Array.isArray(categories.data) ? categories.data : fallbackCategories).map((category) => (
                            <span key={category.id ?? category.name ?? category} className="nt-pill green" style={{ padding: ".35rem .7rem", fontSize: ".75rem" }}>
                                {category.name ?? category}
                            </span>
                        ))}
                    </div>
                    <div className="nt-grid nt-grid-4">
                        {seriesPopular.slice(1).concat(seriesPopular.slice(0, 1)).map((item) => <VideoCard key={item.slug} item={item} compact />)}
                    </div>
                </section>

                <section>
                    <SectionHeader title="Episode Terbaru" link={{ to: "/jelajah", label: "Lihat Semua" }} />
                    <StatusLine status={episodes.status} />
                    <div className="nt-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))" }}>
                        {episodeItems.slice(0, 5).map((item) => <EpisodeCard key={item.id} item={item} />)}
                    </div>
                </section>

                <section className="nt-card pad" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(18rem, 34rem)", gap: "2rem", alignItems: "center" }}>
                    <div>
                        <h2 className="nt-heading">Jelajahi Peta Legenda</h2>
                        <p style={{ lineHeight: 1.5, fontWeight: 800 }}>
                            Setiap pulau memiliki kisahnya sendiri. Gunakan peta interaktif kami untuk menemukan cerita rakyat dari Sabang hingga Merauke.
                        </p>
                        <Link to="/peta" className="nt-btn green"><Icon name="map" /> Buka Peta Interaktif</Link>
                    </div>
                    <ImageFrame src={mockups.mapDefault} style={{ minHeight: "13rem", borderRadius: "1rem" }} />
                </section>

                <section>
                    <SectionHeader title="Pilihan Paket NusaAdhi" subtitle="Pilih paket yang paling pas untuk petualangan menelusuri kisah Nusantara-mu" />
                    <StatusLine status={plans.status} />
                    <div style={{ display: "grid", gridTemplateColumns: "12rem 1fr", gap: "1.5rem", alignItems: "end" }}>
                        <img src={mascotImage} alt="" style={{ width: "11rem" }} />
                        <div className="nt-grid nt-grid-3">
                            {(Array.isArray(plans.data) ? plans.data : subscriptionPlans).slice(0, 3).map((plan) => (
                                <SubscriptionPlanCard key={plan.id ?? plan.name} item={{ ...subscriptionPlans.find((fallback) => fallback.id === plan.id), ...plan }} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="nt-card pad" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 16rem", gap: "1rem", alignItems: "center", background: "#ded4bd" }}>
                    <div>
                        <h2 className="nt-heading" style={{ color: "var(--nt-lime-dark)" }}>Dapatkan Rekomendasi Cerita Setiap Pekan!</h2>
                        <p style={{ maxWidth: "42rem", fontWeight: 800, lineHeight: 1.5 }}>
                            Bergabunglah dengan ribuan penjelajah Nusantara lainnya dan jadilah yang pertama tahu saat legenda baru dirilis dalam format chibi yang menggemaskan.
                        </p>
                        <Link to="/register" className="nt-btn green">Daftar Sekarang</Link>
                    </div>
                    <img src={mascotImage} alt="" style={{ width: "12rem", justifySelf: "center" }} />
                </section>
            </main>
        </PageShell>
    );
}

export function ShortsPage() {
    const { data, status } = useApiFallback(() => getVideos({ content_type: "short" }), shorts, []);
    const navigate = useNavigate();
    const [active, setActive] = useState(0);
    const items = Array.isArray(data) && data.length ? data : shorts;
    const current = items[active] ?? shorts[0];

    return (
        <PageShell active="Shorts" dark>
            <main className="nt-container" style={{ display: "grid", gridTemplateColumns: "19rem minmax(20rem, 38rem) 6rem", gap: "2.5rem", alignItems: "center", minHeight: "58rem", padding: "2rem 0" }}>
                <aside>
                    <StatusLine status={status} />
                    <section className="nt-card pad" style={{ color: "#111", marginBottom: "2rem" }}>
                        <ImageFrame src={current.image} style={{ height: "9rem", borderRadius: "1rem", marginBottom: "1rem" }} />
                        <h2 style={{ color: "var(--nt-brown)", margin: 0 }}>{current.title.replace("KISAH CINTA ", "Kisah Cinta ")}</h2>
                        <h3 style={{ margin: ".8rem 0 .2rem" }}>{current.genre}</h3>
                        <strong>Deskripsi :</strong>
                        <p style={{ lineHeight: 1.4, marginTop: ".4rem" }}>{current.description}</p>
                        <Link to="/series/kisah-seribu-candi" className="nt-btn ghost" style={{ width: "100%" }}>
                            Tonton Series Penuh
                            <Icon name="play" />
                        </Link>
                    </section>
                    <h3 style={{ color: "#fffdf7" }}>Kreator Serupa</h3>
                    <div style={{ display: "grid", gap: "0.8rem" }}>
                        {items.concat(items).slice(0, 6).map((item, index) => (
                            <button key={`${item.id}-${index}`} type="button" onClick={() => setActive(index % items.length)} style={{ display: "grid", gridTemplateColumns: "3rem 1fr", gap: ".55rem", alignItems: "center", background: "transparent", border: 0, color: index > 2 ? "rgba(255,255,255,.45)" : "#fff", textAlign: "left" }}>
                                <span className="nt-avatar" style={{ width: "3rem", height: "3rem" }}><img src={mockups.logo} alt="" /></span>
                                <span><strong>{item.creator}</strong><small style={{ display: "block" }}>{item.views}</small></span>
                            </button>
                        ))}
                    </div>
                </aside>
                <ShortVideoPlayer item={current} />
                <aside style={{ display: "grid", gap: "1.5rem", justifyItems: "center" }}>
                    <div className="nt-avatar" style={{ width: "4.6rem", height: "4.6rem" }}><img src={mockups.profile} alt="" /></div>
                    {[["heart", likeVideo], ["comment", () => navigate(`/watch/${current.slug ?? current.id}`)], ["save", saveWatchLater], ["share"]].map(([icon, action]) => (
                        <button key={icon} type="button" className="nt-icon-btn" style={{ width: "5rem", height: "5rem", color: "var(--nt-brown)" }} onClick={() => {
                            if (typeof action === "function" && icon === "comment") {
                                action();
                                return;
                            }
                            action?.(current.id).catch(() => null);
                        }}>
                            <Icon name={icon} size={32} />
                        </button>
                    ))}
                </aside>
            </main>
        </PageShell>
    );
}

export function ExplorePage() {
    const series = useApiFallback(getSeries, exploreCards, []);
    const genres = useApiFallback(getGenres, fallbackGenres, []);
    const [activeGenre, setActiveGenre] = useState("Semua Genre");

    return (
        <PageShell active="Jelajah">
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <StatusLine status={series.status} />
                <ImageFrame src={mockups.explore} style={{ minHeight: "29rem", borderRadius: "2rem", padding: "2.5rem", color: "#fff", display: "grid", alignItems: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(41,17,4,.7), rgba(41,17,4,.05))" }} />
                    <div style={{ position: "relative", maxWidth: "34rem" }}>
                        <span className="nt-pill green" style={{ padding: ".45rem .8rem" }}>SERIES POPULER</span>
                        <p style={{ display: "flex", alignItems: "center", gap: ".7rem", fontWeight: 950, marginTop: "1.4rem" }}>
                            <span className="nt-avatar"><img src={mascotImage} alt="" /></span>
                            ADI BAGAS KORO
                        </p>
                        <h1 className="nt-title" style={{ color: "#fff" }}>KISAH SERIBU CANDI</h1>
                        <p style={{ lineHeight: 1.5, fontWeight: 800 }}>Temukan rahasia di balik terciptanya seribu candi dalam satu malam melalui kisah cinta dan janji yang terlanggari.</p>
                        <Link to="/watch/kisah-seribu-candi" className="nt-btn green">Tonton Sekarang</Link>
                    </div>
                </ImageFrame>

                <div style={{ display: "flex", gap: "1rem", overflowX: "auto", padding: "2rem 0 1.5rem" }}>
                    {(Array.isArray(genres.data) ? genres.data : fallbackGenres).map((genre) => {
                        const label = genre.name ?? genre;
                        return (
                            <button key={label} type="button" className={`nt-pill ${activeGenre === label ? "" : "ghost"}`} style={{ background: activeGenre === label ? "var(--nt-gold)" : "#fff7e6", color: activeGenre === label ? "#fff" : "var(--nt-gold)", border: "1px solid rgba(214,155,8,.3)" }} onClick={() => setActiveGenre(label)}>
                                {label}
                            </button>
                        );
                    })}
                    <button type="button" className="nt-icon-btn">-&gt;</button>
                </div>

                <div className="nt-grid nt-grid-4">
                    {(Array.isArray(series.data) ? series.data : exploreCards).slice(0, 12).map((item) => <VideoCard key={item.id ?? item.slug} item={item} />)}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: ".8rem", marginTop: "2rem" }}>
                    {["<", "1", "2", "3", "4", ">"].map((page) => (
                        <button key={page} type="button" className={page === "1" ? "nt-pill" : "nt-icon-btn"} style={page === "1" ? { background: "var(--nt-gold)", color: "#fff" } : undefined}>{page}</button>
                    ))}
                </div>
            </main>
        </PageShell>
    );
}

export function FavoritPage() {
    const { isAuthenticated } = useAuth();
    const [mode, setMode] = useState("dashboard");
    const [segment, setSegment] = useState("Series");
    const favorites = useApiFallback(getFavorites, favoriteItems, []);

    if (!isAuthenticated) {
        return <LoginPrompt />;
    }

    return (
        <PageShell active="Favorit">
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                        {["Terbaru", "Unduhan", "Dibeli", "Kreator", "Komentar"].map((tab) => (
                            <button key={tab} type="button" className="nt-pill" style={{ background: tab === "Terbaru" ? "var(--nt-gold)" : "#fffdf7", color: tab === "Terbaru" ? "#fff" : "var(--nt-gold)" }} onClick={() => setMode("dashboard")}>{tab}</button>
                        ))}
                    </div>
                    <button type="button" className="nt-btn ghost" onClick={() => setMode(mode === "dashboard" ? "segmented" : "dashboard")}>
                        {mode === "dashboard" ? "Lihat Series/Kreator" : "Lihat Dashboard"}
                    </button>
                </div>
                <StatusLine status={favorites.status} />
                {mode === "dashboard" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 28rem)", gap: "1.5rem" }}>
                        <section style={{ display: "grid", gap: "1.5rem" }}>
                            {(Array.isArray(favorites.data) ? favorites.data : favoriteItems).map((item) => {
                                const target = item.target ?? item.video ?? item;

                                return (
                                <article key={item.id} className="nt-card" style={{ display: "grid", gridTemplateColumns: "17rem 1fr", overflow: "hidden" }}>
                                    <ImageFrame src={target.thumbnail_url ?? target.image ?? mockups.favorite} style={{ minHeight: "15rem" }} />
                                    <div style={{ padding: "1.2rem" }}>
                                        <h2 style={{ color: "var(--nt-brown)", margin: 0, fontSize: "1.7rem", fontWeight: 950 }}>{target.title ?? "Kisah Favorit"}</h2>
                                        <p className="nt-subtle" style={{ margin: ".2rem 0", fontWeight: 800 }}>{target.genre ?? target.category?.name ?? "Legenda"}</p>
                                        <small className="nt-subtle">{item.updated ?? item.created_at ?? "Terakhir diperbarui"}</small>
                                        <p style={{ lineHeight: 1.45, fontWeight: 750 }}>{target.description ?? "Cerita Nusantara yang kamu simpan."}</p>
                                        <Link to={`/watch/${target.slug ?? item.id}`} className="nt-btn" style={{ float: "right" }}>Lanjut Nonton</Link>
                                    </div>
                                </article>
                                );
                            })}
                        </section>
                        <aside className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fffdf7", overflow: "hidden" }}>
                            <h2 style={{ fontSize: "2rem", margin: 0 }}>Halo, Petualang Nusa!</h2>
                            <p style={{ marginTop: ".3rem", fontSize: "1.2rem" }}>Ternyata kamu tim ini ya!</p>
                            <div className="nt-card pad" style={{ background: "rgba(255,255,255,.14)", boxShadow: "none", marginBottom: "1.2rem" }}>
                                <h3>Genre Favoritmu :</h3>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: ".8rem" }}>
                                    {["Comedy", "Drama", "Horror", "Science Fiction", "Fantasy", "Thriller", "Romance"].map((genre) => <span key={genre} className="nt-pill green" style={{ padding: ".45rem 1.2rem" }}>{genre}</span>)}
                                </div>
                            </div>
                            <h3>Rekomendasi :</h3>
                            {seriesPopular.slice(0, 3).map((item) => (
                                <Link key={item.slug} to={`/watch/${item.slug}`} className="nt-card" style={{ display: "grid", gridTemplateColumns: "7rem 1fr", gap: "1rem", padding: ".5rem", marginBottom: ".8rem", textDecoration: "none", color: "var(--nt-brown)" }}>
                                    <ImageFrame src={item.image} style={{ height: "4.7rem", borderRadius: ".6rem" }} />
                                    <span><strong>{item.title}</strong><small style={{ display: "block" }}>{item.genre}</small><small style={{ color: "var(--nt-lime-dark)" }}>{item.likes}</small></span>
                                </Link>
                            ))}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 10rem", alignItems: "end" }}>
                                <div className="nt-card pad">
                                    <strong style={{ color: "var(--nt-gold)" }}>Supporter</strong>
                                    <p style={{ color: "#d94c12", fontSize: "1.5rem", fontWeight: 950, margin: ".2rem 0" }}>Rp15.000<small>/Bulan</small></p>
                                    <Link to="/premium" className="nt-btn dark" style={{ width: "100%" }}>Upgrade Paket</Link>
                                </div>
                                <img src={mascotImage} alt="" style={{ width: "10rem", marginLeft: "-2rem" }} />
                            </div>
                        </aside>
                    </div>
                ) : (
                    <>
                        <div className="nt-segmented" style={{ marginBottom: "2rem" }}>
                            {["Series", "Kreator"].map((item) => <button key={item} className={segment === item ? "active" : ""} type="button" onClick={() => setSegment(item)}>{item}</button>)}
                        </div>
                        {segment === "Series" ? (
                            <div className="nt-grid nt-grid-2">
                                {favoriteItems.concat(favoriteItems.slice(0, 1)).map((item, index) => (
                                    <article key={`${item.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "1rem", borderBottom: "1px solid var(--nt-line)", paddingBottom: "1.2rem" }}>
                                        <ImageFrame src={item.image} style={{ height: "9.5rem", borderRadius: ".35rem" }} />
                                        <div>
                                            <h2 style={{ color: "var(--nt-brown)", margin: "1.5rem 0 .3rem", fontSize: "1.55rem", fontWeight: 950 }}>{item.title}</h2>
                                            <h3 style={{ margin: 0, color: "var(--nt-brown)" }}>{item.creator}</h3>
                                            <p className="nt-subtle">Terakhir diperbarui pada 26 Maret 2026</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="nt-grid nt-grid-4">
                                {creators.concat(creators.slice(0, 2)).map((creator, index) => <CreatorCard key={`${creator.slug}-${index}`} creator={{ ...creator, name: "Afiananr", followers: "101K" }} />)}
                            </div>
                        )}
                    </>
                )}
            </main>
        </PageShell>
    );
}

function AuthCard({ mode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, setUser } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
    const [message, setMessage] = useState(location.state?.message ?? "");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const isRegister = mode === "register";

    function update(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function submit(event) {
        event.preventDefault();

        if (loading) {
            return;
        }

        setLoading(true);
        setError("");
        setFieldErrors({});
        setMessage("");

        try {
            const result = isRegister
                ? await register({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    password_confirmation: form.password_confirmation,
                })
                : await login({
                    email: form.email.trim(),
                    password: form.password,
                });

            if (result?.user) {
                setUser?.(result.user, result.token);
            }

            navigate("/dashboard", { replace: true });
        } catch (requestError) {
            if (import.meta.env.DEV) {
                console.error("API error:", requestError?.response?.status, requestError?.response?.data || requestError);
            }

            const errors = getApiValidationErrors(requestError);
            const passwordError = getFirstFieldError(errors, "password");
            const shouldMoveConfirmationError = isRegister
                && passwordError
                && /confirmation|konfirmasi|match/i.test(passwordError)
                && !errors.password_confirmation;
            const nextErrors = shouldMoveConfirmationError
                ? { ...errors, password_confirmation: [passwordError] }
                : errors;

            setFieldErrors(nextErrors);
            setError(getApiErrorMessage(requestError));
            setForm((current) => ({ ...current, password: "", password_confirmation: "" }));
        } finally {
            setLoading(false);
        }
    }

    const nameFieldError = getFirstFieldError(fieldErrors, "name");
    const emailFieldError = getFirstFieldError(fieldErrors, "email");
    const passwordFieldError = getFirstFieldError(fieldErrors, "password");
    const confirmationFieldError = getFirstFieldError(fieldErrors, "password_confirmation");
    const passwordConfirmationError = confirmationFieldError
        || (isRegister && passwordFieldError && /confirmation|konfirmasi|match/i.test(passwordFieldError) ? passwordFieldError : "");
    const visiblePasswordError = passwordConfirmationError === passwordFieldError ? "" : passwordFieldError;
    const submitText = loading
        ? (isRegister ? "Mendaftarkan..." : "Memasuki...")
        : (isRegister ? "Daftar" : "Masuk");
    const asideCopy = isRegister
        ? "Mulai sebagai Petualang Nusa. Saat siap berkarya, aktifkan Studio NusaKarya dari akunmu."
        : "Lanjutkan petualangan budaya dan kelola ruang NusaTales milikmu.";

    return (
        <PageShell active="">
            <main className="nt-container" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 21rem", gap: "2rem", alignItems: "center", padding: "2rem 0 5rem" }}>
                <section className="nt-card pad" style={{ border: "0.7rem solid rgba(199,243,106,.22)", background: "rgba(255,255,255,.7)" }}>
                    <h1 className="nt-title" style={{ textAlign: "center", fontSize: "3rem" }}>{isRegister ? "Daftar" : "Masuk"}</h1>
                    {message ? <div className="nt-status">{message}</div> : null}
                    {error ? <div className="nt-status nt-error">{error}</div> : null}
                    <form onSubmit={submit} style={{ display: "grid", gap: "1.3rem", marginTop: "1rem" }}>
                        {isRegister ? (
                            <label>
                                <input className="nt-form-field" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nama lengkap anda..." required />
                                {nameFieldError ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{nameFieldError}</small> : null}
                            </label>
                        ) : null}
                        <label>
                            <input className="nt-form-field" value={form.email} onChange={(event) => update("email", event.target.value)} type="email" placeholder="Masukkan email anda..." required />
                            {emailFieldError ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{emailFieldError}</small> : null}
                        </label>
                        <div>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="nt-form-field"
                                    value={form.password}
                                    onChange={(event) => update("password", event.target.value)}
                                    type={showPassword ? "text" : "password"}
                                    minLength={isRegister ? 8 : undefined}
                                    placeholder="Masukkan password anda..."
                                    required
                                    style={{ paddingRight: "7.5rem" }}
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    aria-pressed={showPassword}
                                    onClick={() => setShowPassword((value) => !value)}
                                    style={{ position: "absolute", right: ".65rem", top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "var(--nt-brown)", fontWeight: 900, cursor: "pointer" }}
                                >
                                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                                </button>
                            </div>
                            {visiblePasswordError ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{visiblePasswordError}</small> : null}
                        </div>
                        {isRegister ? (
                            <label style={{ display: "grid", gap: ".35rem" }}>
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="nt-form-field"
                                        value={form.password_confirmation}
                                        onChange={(event) => update("password_confirmation", event.target.value)}
                                        type={showPasswordConfirmation ? "text" : "password"}
                                        minLength={8}
                                        placeholder="Ulangi password anda..."
                                        required
                                        style={{ paddingRight: "7.5rem" }}
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPasswordConfirmation ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                                        aria-pressed={showPasswordConfirmation}
                                        onClick={() => setShowPasswordConfirmation((value) => !value)}
                                        style={{ position: "absolute", right: ".65rem", top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "var(--nt-brown)", fontWeight: 900, cursor: "pointer" }}
                                    >
                                        {showPasswordConfirmation ? "Sembunyikan" : "Tampilkan"}
                                    </button>
                                </div>
                                {passwordConfirmationError ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{passwordConfirmationError}</small> : null}
                            </label>
                        ) : (
                            <Link to="/login" style={{ justifySelf: "end", color: "#ff6975", textDecoration: "none", fontWeight: 850 }}>Lupa Password ?</Link>
                        )}
                        <button type="submit" className="nt-btn green" disabled={loading} style={{ width: "100%", boxShadow: "0 0.75rem 1.4rem rgba(90,127,7,.2)" }}>
                            {submitText}
                        </button>
                    </form>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem", margin: "1.4rem 0" }}>
                        <hr style={{ borderColor: "var(--nt-line)", width: "100%" }} />
                        <span className="nt-subtle">Atau masuk dengan akun</span>
                        <hr style={{ borderColor: "var(--nt-line)", width: "100%" }} />
                    </div>
                    <div className="nt-grid nt-grid-3">
                        {["Facebook", "Google", "Apple"].map((provider) => (
                            <button key={provider} type="button" className="nt-btn ghost" onClick={() => setMessage("Fitur login sosial segera hadir.")}>
                                {provider}
                            </button>
                        ))}
                    </div>
                    <p style={{ textAlign: "center", marginTop: "1.4rem" }}>
                        {isRegister ? "Sudah punya akun? " : "Tidak mempunyai akun? "}
                        <Link to={isRegister ? "/login" : "/register"} style={{ color: "#1a64d8", fontWeight: 850 }}>{isRegister ? "Masuk" : "Daftar"}</Link>
                    </p>
                </section>
                <aside style={{ textAlign: "center" }}>
                    <div className="nt-card pad" style={{ display: "inline-block", borderColor: "var(--nt-lime)", borderRadius: "50%", color: "var(--nt-lime-dark)", fontWeight: 950, marginBottom: "1rem" }}>
                        CERITA SERU<br />SIAP<br />DIMULAI !!!
                    </div>
                    <p style={{ color: "var(--nt-brown)", fontWeight: 850, lineHeight: 1.6 }}>{asideCopy}</p>
                    <img src={mascotImage} alt="" style={{ width: "15rem", margin: "0 auto" }} />
                </aside>
            </main>
        </PageShell>
    );
}

export function LoginPage() {
    return <AuthCard mode="login" />;
}

export function RegisterPage() {
    return <AuthCard mode="register" />;
}

export function PremiumPage() {
    const wallet = useApiFallback(getWallet, { balance: 1250 }, []);
    const packages = useApiFallback(getCoinPackages, koinPackages, []);
    const plans = useApiFallback(getSubscriptionPlans, subscriptionPlans, []);
    const history = useApiFallback(getWalletTransactions, undefined, []);
    const billing = useApiFallback(getBilling, [], []);
    const [message, setMessage] = useState("");

    async function checkout(type, item) {
        setMessage("Membuat pembayaran Midtrans Snap...");
        try {
            const response = type === "koin"
                ? await checkoutCoinPackage(item.id)
                : await checkoutSubscription(item.id);
            const token = response.data?.data?.snap_token;

            if (token && window.snap?.pay) {
                window.snap.pay(token);
                setMessage("Snap terbuka. Status akan diperbarui oleh webhook Midtrans.");
            } else {
                setMessage("Checkout dibuat. Snap token belum tersedia di mode dummy.");
            }
        } catch (_error) {
            setMessage("Mode dummy: checkout Midtrans belum menerima konfigurasi server key.");
        }
    }

    return (
        <PageShell active="">
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <h1 className="nt-title">Layanan Premium & Dompet</h1>
                <p style={{ fontSize: "1.35rem", fontWeight: 850 }}>
                    Kelola NusaKoin Anda untuk akses konten eksklusif dan tingkatkan pengalaman dengan langganan NusaAdhi.
                </p>
                {message ? <div className="nt-status" style={{ marginBottom: "1rem" }}>{message}</div> : null}
                <StatusLine status={wallet.status === "fallback" || packages.status === "fallback" || plans.status === "fallback" || billing.status === "fallback" ? "fallback" : "ready"} />
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 26rem)", gap: "1.5rem" }}>
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        <WalletBalanceCard onCheckout={(item) => checkout("koin", item)} />
                        <TransactionHistory items={Array.isArray(history.data) ? history.data : undefined} />
                    </div>
                    <NusaAdhiPanel onCheckout={(item) => checkout("subscription", item)} />
                </div>
            </main>
        </PageShell>
    );
}

export function StudioDashboardPage() {
    const { hasChannel } = useAuth();
    const dashboard = useApiFallback(getStudioDashboard, { stats: studioStats, episodes: studioEpisodes }, []);
    const analytics = useApiFallback(getStudioAnalytics, {}, []);
    const monetization = useApiFallback(getStudioMonetization, { active: false }, []);
    const [premium, setPremium] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [agreed, setAgreed] = useState(false);

    function selectPremium() {
        setPremium(true);
        if (!monetization.data?.active && !agreed) {
            setModalOpen(true);
        }
    }

    async function agree() {
        try {
            await agreeMonetization();
        } catch (_error) {
            // Dummy mode keeps the UI moving.
        }
        setAgreed(true);
        setModalOpen(false);
    }

    if (!hasChannel) {
        return <StudioActivationPrompt />;
    }

    return (
        <StudioShell active="Beranda">
            <StatusLine status={dashboard.status === "fallback" || analytics.status === "fallback" ? "fallback" : "ready"} />
            <h1 className="nt-title">Studio NusaKarya</h1>
            <p style={{ fontSize: "1.25rem", fontWeight: 850 }}>Kelola Animasi dan Cerita Nusantara</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 18rem", gap: "1.5rem", marginTop: "2rem" }}>
                <section className="nt-card pad">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                        <h2 style={{ margin: 0, color: "var(--nt-brown)", fontWeight: 950 }}><Icon name="chart" /> Ringkasan Performa Karya</h2>
                        <span className="nt-pill">7 Hari Terakhir</span>
                    </div>
                    <div className="nt-grid nt-grid-3">
                        {studioStats.map((stat) => (
                            <div key={stat.label} className="nt-card pad nt-soft">
                                <small className="nt-subtle" style={{ textTransform: "uppercase", fontWeight: 950 }}>{stat.label}</small>
                                <h3 style={{ margin: ".2rem 0", color: "var(--nt-brown)", fontSize: "2rem", fontWeight: 950 }}>{stat.value}</h3>
                                <small style={{ color: "var(--nt-lime-dark)", fontWeight: 900 }}>{stat.change}</small>
                            </div>
                        ))}
                    </div>
                    <div style={{ height: "15rem", display: "flex", alignItems: "end", gap: "1.5rem", marginTop: "2rem" }}>
                        {[22, 45, 30, 60, 82, 52, 68].map((height, index) => <div key={index} style={{ height: `${height}%`, flex: 1, borderRadius: "1.8rem 1.8rem 0 0", background: index === 4 ? "var(--nt-brown)" : "rgba(199,243,106,.65)" }} />)}
                    </div>
                </section>
                <section className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fffdf7" }}>
                    <h2 style={{ marginTop: 0 }}><Icon name="upload" /> Unggah Episode / Shorts</h2>
                    <div style={{ border: "2px dashed rgba(255,255,255,.3)", borderRadius: "2rem", minHeight: "9rem", display: "grid", placeItems: "center", textAlign: "center" }}>
                        <span><Icon name="upload" size={34} /><br />Tarik & lepas file di sini<br /><small>MP4, MOV (Maks. 2GB)</small></span>
                    </div>
                    <small>Mengunggah: Ep 4 - Lutung Kasarung... 75%</small>
                    <div style={{ height: ".45rem", borderRadius: "999px", background: "rgba(255,255,255,.22)", overflow: "hidden", marginTop: ".4rem" }}>
                        <div style={{ width: "75%", background: "var(--nt-lime)", height: "100%" }} />
                    </div>
                </section>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 23rem)", gap: "1.5rem", marginTop: "1.5rem" }}>
                <section className="nt-card pad nt-soft">
                    <SectionHeader title="Kelola Seri" link={{ to: "/studio/videos", label: "Lihat Semua" }} />
                    <div style={{ display: "grid", gap: "1rem" }}>
                        {studioEpisodes.map((episode) => (
                            <article key={episode.id} className="nt-card" style={{ display: "grid", gridTemplateColumns: "4.4rem 1fr auto auto", alignItems: "center", gap: "1rem", padding: ".8rem 1rem", borderRadius: "999px" }}>
                                <ImageFrame src={episode.image} style={{ height: "3.5rem", borderRadius: ".6rem" }} />
                                <span><strong>{episode.title}</strong><small className="nt-subtle" style={{ display: "block" }}>{episode.meta}</small></span>
                                <span className="nt-pill" style={{ background: episode.status === "PREMIUM" ? "var(--nt-brown)" : "var(--nt-lime)", color: episode.status === "PREMIUM" ? "#fff" : "var(--nt-lime-dark)", padding: ".35rem .6rem", fontSize: ".75rem" }}>{episode.status}</span>
                                <strong>...</strong>
                            </article>
                        ))}
                    </div>
                </section>
                <aside style={{ display: "grid", gap: "1.5rem" }}>
                    <section className="nt-card pad nt-soft">
                        <h2 style={{ marginTop: 0, color: "var(--nt-brown)" }}>Monetisasi</h2>
                        <label className="nt-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "999px", marginBottom: "1rem" }}>
                            <input type="radio" checked={!premium} onChange={() => setPremium(false)} />
                            <span><strong>Akses Gratis</strong><small className="nt-subtle" style={{ display: "block" }}>Tersedia untuk semua pembaca</small></span>
                        </label>
                        <label className="nt-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "999px", marginBottom: "1rem" }}>
                            <input type="radio" checked={premium} onChange={selectPremium} />
                            <span><strong>Akses Premium</strong><small className="nt-subtle" style={{ display: "block" }}>Berlangganan Koin Emas</small></span>
                        </label>
                        <button type="button" className="nt-btn dark" style={{ width: "100%" }}>Simpan Pengaturan</button>
                    </section>
                    <section className="nt-card pad" style={{ background: "rgba(199,243,106,.55)" }}>
                        <strong>Tips Kreator</strong>
                        <p><em>"Gunakan warna-warna hangat untuk adegan yang emosional agar pembaca lebih terhanyut!"</em></p>
                        <strong>- Penjaga Cerita</strong>
                    </section>
                </aside>
            </div>
            <MonetizationAgreementModal open={modalOpen} onClose={() => setModalOpen(false)} onAgree={agree} />
        </StudioShell>
    );
}

export function StudioUploadPage() {
    const { isAuthenticated, setUser } = useAuth();
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [demoLoading, setDemoLoading] = useState(false);
    const [premium, setPremium] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        tags: "",
        scheduled: false,
        date: "",
        contentType: "episode",
        visibility: "public",
        koinPrice: "",
        categoryId: "",
        genreIds: "",
        regionId: "",
        folkloreType: "",
        seriesId: "",
        episodeNumber: "",
        allowComments: true,
        videoFile: null,
        thumbnailFile: null,
    });

    function update(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function handleFile(file) {
        if (!file) {
            return;
        }
        update("videoFile", file);
        setProgress(8);
        const timer = window.setInterval(() => {
            setProgress((value) => {
                if (value >= 100) {
                    window.clearInterval(timer);
                    return 100;
                }
                return value + 12;
            });
        }, 220);
    }

    async function demoUploadLogin() {
        setDemoLoading(true);
        setError("");
        setFieldErrors({});

        try {
            const response = await api.post("/dev/demo-upload-login");
            const data = response.data?.data ?? {};
            const token = data.token;

            if (!token) {
                throw new Error("Token login tidak ditemukan dari server.");
            }

            setStoredToken(token);
            setUser?.(data.user ?? null, token);
            setMessage("Demo uploader siap digunakan.");
        } catch (requestError) {
            if (import.meta.env.DEV) {
                console.error("API error:", requestError?.response?.status, requestError?.response?.data || requestError);
            }

            setError(getApiErrorMessage(requestError, "Demo uploader belum bisa digunakan."));
        } finally {
            setDemoLoading(false);
        }
    }

    async function publish(draft = false) {
        setError("");
        setMessage("");
        setFieldErrors({});

        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/studio/upload", message: "Masuk terlebih dahulu untuk mengunggah karya." } });
            return;
        }

        if (!form.title.trim()) {
            setFieldErrors({ title: ["Judul karya wajib diisi."] });
            setError("Judul karya wajib diisi.");
            return;
        }

        if (!form.videoFile) {
            setFieldErrors({ video: ["File video wajib dipilih."] });
            setError("File video wajib dipilih.");
            return;
        }

        try {
            const status = draft ? "draft" : "published";
            const response = await createStudioVideo({
                title: form.title,
                description: form.description,
                tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                category_id: form.categoryId,
                genre_ids: form.genreIds.split(",").map((id) => id.trim()).filter(Boolean),
                region_id: form.regionId,
                folklore_type: form.folkloreType,
                series_id: form.seriesId,
                episode_number: form.episodeNumber,
                content_type: form.contentType,
                video: form.videoFile,
                thumbnail: form.thumbnailFile,
                visibility: form.visibility,
                status,
                scheduled_at: status === "scheduled" ? form.date : "",
                is_premium: premium ? 1 : 0,
                koin_price: premium ? form.koinPrice || 1 : 0,
                allow_comments: form.allowComments ? 1 : 0,
            }, {
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded * 100) / event.total));
                    }
                },
            });

            const slug = response.data?.data?.video?.slug;
            setMessage(draft ? "Draft tersimpan di Studio NusaKarya." : "Video berhasil diunggah.");
            window.setTimeout(() => navigate(slug && !draft ? `/watch/${slug}` : "/studio/karya"), 650);
        } catch (requestError) {
            if (import.meta.env.DEV) {
                console.error("API error:", requestError?.response?.status, requestError?.response?.data || requestError);
            }

            setFieldErrors(getApiValidationErrors(requestError));
            setError(getApiErrorMessage(requestError, "Unggahan belum berhasil."));
        }
    }

    async function agreePremium() {
        try {
            await agreeMonetization();
            setModalOpen(false);
            setMessage("Perjanjian monetisasi berhasil disetujui.");
        } catch (requestError) {
            if (import.meta.env.DEV) {
                console.error("API error:", requestError?.response?.status, requestError?.response?.data || requestError);
            }

            setError(getApiErrorMessage(requestError, "Perjanjian monetisasi belum berhasil."));
        }
    }

    if (!isAuthenticated) {
        return (
            <PageShell active="">
                <main className="nt-container" style={{ minHeight: "28rem", display: "grid", alignItems: "center", padding: "2rem 0 5rem" }}>
                    <section className="nt-card pad" style={{ maxWidth: "44rem", margin: "0 auto", textAlign: "center" }}>
                        <h1 className="nt-title" style={{ fontSize: "2.6rem" }}>Masuk untuk Mengunggah Karya</h1>
                        <p style={{ fontSize: "1.15rem", fontWeight: 850, lineHeight: 1.6 }}>
                            Gunakan akun NusaTales untuk mengunggah episode atau short ke Studio NusaKarya.
                        </p>
                        {error ? <div className="nt-status nt-error">{error}</div> : null}
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginTop: "1.2rem" }}>
                            <Link to="/login" state={{ from: "/studio/upload", message: "Masuk terlebih dahulu untuk mengunggah karya." }} className="nt-btn green">
                                Masuk
                            </Link>
                            <Link to="/register" className="nt-btn ghost">
                                Daftar
                            </Link>
                            {import.meta.env.DEV ? (
                                <button type="button" className="nt-btn dark" onClick={demoUploadLogin} disabled={demoLoading}>
                                    {demoLoading ? "Memproses..." : "Masuk sebagai Demo Uploader"}
                                </button>
                            ) : null}
                        </div>
                    </section>
                </main>
            </PageShell>
        );
    }

    return (
        <StudioShell active="Karya">
            <h1 className="nt-title">Unggah Animasi Baru</h1>
            <p style={{ fontSize: "1.25rem", fontWeight: 800 }}>Bagikan karya indahmu ke seluruh Nusantara.</p>
            {message ? <div className="nt-status">{message}</div> : null}
            {error ? <div className="nt-status nt-error">{error}</div> : null}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 24rem)", gap: "1.5rem", marginTop: "1.5rem" }}>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                    <UploadDropzone onFile={handleFile} progress={progress} />
                    {getFirstFieldError(fieldErrors, "video") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "video")}</small> : null}
                    {getFirstFieldError(fieldErrors, "video_file") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "video_file")}</small> : null}
                    <section className="nt-card pad">
                        <h2 style={{ marginTop: 0, color: "var(--nt-brown)" }}>Jenis Karya</h2>
                        <div className="nt-grid nt-grid-2" style={{ marginBottom: "1rem" }}>
                            {[
                                ["episode", "Episode / Series Panjang", "Cocok untuk NusaSaga, episode cerita, atau animasi berdurasi panjang."],
                                ["short", "Short / Video Pendek", "Cocok untuk Lakon pendek, cuplikan vertikal, dan konten cepat seperti Shorts."],
                            ].map(([value, label, helper]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`nt-card pad ${form.contentType === value ? "nt-soft" : ""}`}
                                    onClick={() => update("contentType", value)}
                                    style={{ textAlign: "left", borderColor: form.contentType === value ? "var(--nt-lime)" : "var(--nt-line)" }}
                                >
                                    <strong style={{ color: "var(--nt-brown)" }}>{label}</strong>
                                    <small className="nt-subtle" style={{ display: "block", marginTop: ".4rem" }}>{helper}</small>
                                </button>
                            ))}
                        </div>
                        <input className="nt-form-field" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Judul Karya" />
                        {getFirstFieldError(fieldErrors, "title") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "title")}</small> : null}
                        {getFirstFieldError(fieldErrors, "judul") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "judul")}</small> : null}
                        <textarea className="nt-form-field" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Deskripsi Cerita" style={{ marginTop: "1rem" }} />
                        {getFirstFieldError(fieldErrors, "description") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "description")}</small> : null}
                        {getFirstFieldError(fieldErrors, "deskripsi") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "deskripsi")}</small> : null}
                        <input className="nt-form-field" value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="Tagar Budaya" style={{ marginTop: "1rem" }} />
                        {getFirstFieldError(fieldErrors, "tags") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "tags")}</small> : null}
                    </section>
                    <section className="nt-card pad">
                        <h2 style={{ marginTop: 0, color: "var(--nt-brown)" }}>Detail Budaya</h2>
                        <div className="nt-grid nt-grid-2">
                            <input className="nt-form-field" value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} placeholder="Category ID" />
                            <input className="nt-form-field" value={form.genreIds} onChange={(event) => update("genreIds", event.target.value)} placeholder="Genre IDs, pisahkan koma" />
                            <input className="nt-form-field" value={form.regionId} onChange={(event) => update("regionId", event.target.value)} placeholder="Region ID" />
                            <input className="nt-form-field" value={form.folkloreType} onChange={(event) => update("folkloreType", event.target.value)} placeholder="Folklore type" />
                            <input className="nt-form-field" value={form.seriesId} onChange={(event) => update("seriesId", event.target.value)} placeholder="Series ID" />
                            <input className="nt-form-field" type="number" min="1" value={form.episodeNumber} onChange={(event) => update("episodeNumber", event.target.value)} placeholder="Nomor episode" />
                        </div>
                        {getFirstFieldError(fieldErrors, "category_id") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "category_id")}</small> : null}
                        {getFirstFieldError(fieldErrors, "genre_ids") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "genre_ids")}</small> : null}
                        {getFirstFieldError(fieldErrors, "region_id") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "region_id")}</small> : null}
                    </section>
                    <section className="nt-card pad">
                        <h2 style={{ marginTop: 0, color: "var(--nt-brown)" }}>Pilih Thumbnail</h2>
                        <ThumbnailSelector />
                        <input className="nt-form-field" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => update("thumbnailFile", event.target.files?.[0] ?? null)} style={{ marginTop: "1rem" }} />
                        {getFirstFieldError(fieldErrors, "thumbnail") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "thumbnail")}</small> : null}
                        {getFirstFieldError(fieldErrors, "thumbnail_file") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "thumbnail_file")}</small> : null}
                    </section>
                </div>
                <aside style={{ display: "grid", gap: "1.5rem" }}>
                    <section className="nt-card pad" style={{ textAlign: "center" }}>
                        <div className="nt-card pad" style={{ borderColor: "var(--nt-lime)", color: "var(--nt-lime-dark)", fontWeight: 950 }}>Karyamu siap menemui penjelajah baru!</div>
                        <img src={mascotImage} alt="" style={{ width: "11rem", margin: "1rem auto 0" }} />
                    </section>
                    <section className="nt-card pad nt-soft">
                        <h2 style={{ color: "var(--nt-brown)", marginTop: 0 }}>Pengaturan Rilis</h2>
                        <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontWeight: 900 }}>
                            Atur sebagai Premium
                            <input type="checkbox" checked={premium} onChange={(event) => {
                                setPremium(event.target.checked);
                                if (event.target.checked) {
                                    setModalOpen(true);
                                }
                            }} />
                        </label>
                        <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontWeight: 900 }}>
                            Rilis Sesuai Jadwal
                            <input type="checkbox" checked={form.scheduled} onChange={(event) => update("scheduled", event.target.checked)} />
                        </label>
                        {form.scheduled ? <input className="nt-form-field" type="datetime-local" value={form.date} onChange={(event) => update("date", event.target.value)} /> : null}
                        {getFirstFieldError(fieldErrors, "scheduled_at") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "scheduled_at")}</small> : null}
                        {premium ? <input className="nt-form-field" type="number" min="1" value={form.koinPrice} onChange={(event) => update("koinPrice", event.target.value)} placeholder="Harga NusaKoin" style={{ marginTop: "1rem" }} /> : null}
                        {getFirstFieldError(fieldErrors, "koin_price") ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{getFirstFieldError(fieldErrors, "koin_price")}</small> : null}
                        <select className="nt-form-field" value={form.visibility} onChange={(event) => update("visibility", event.target.value)} style={{ marginTop: "1rem" }}>
                            <option value="public">Publik</option>
                            <option value="unlisted">Tidak Terdaftar</option>
                            <option value="private">Privat</option>
                        </select>
                        <label style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontWeight: 900 }}>
                            Izinkan NusaRembug
                            <input type="checkbox" checked={form.allowComments} onChange={(event) => update("allowComments", event.target.checked)} />
                        </label>
                        <button type="button" className="nt-btn green" style={{ width: "100%", marginTop: "1rem" }} onClick={() => publish(false)}>Terbitkan Sekarang</button>
                        <button type="button" className="nt-btn ghost" style={{ width: "100%", marginTop: ".7rem" }} onClick={() => publish(true)}>Simpan Draft</button>
                        <div className="nt-status" style={{ marginTop: "1rem" }}>Validasi file, judul, deskripsi, thumbnail, kategori, dan tags aktif.</div>
                    </section>
                </aside>
            </div>
            <MonetizationAgreementModal open={modalOpen} onClose={() => setModalOpen(false)} onAgree={agreePremium} />
        </StudioShell>
    );
}

export function StudioKaryaPage() {
    const { hasChannel } = useAuth();
    const videos = useApiFallback(getStudioVideos, { videos: studioEpisodes }, []);

    if (!hasChannel) {
        return <StudioActivationPrompt />;
    }

    return (
        <StudioShell active="Karya">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
                <div>
                    <h1 className="nt-heading">Karya Terbaru</h1>
                    <p style={{ marginTop: ".2rem", fontWeight: 800 }}>Update terkini dari meja gambar Studio Jati</p>
                </div>
                <Link to="/studio/videos" style={{ color: "var(--nt-brown)", fontWeight: 950, textDecoration: "none" }}>Lihat Semua -&gt;</Link>
            </div>
            <StatusLine status={videos.status} />
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 17rem", gap: "1.5rem", marginTop: "2rem" }}>
                <ImageFrame src={mockups.karya} style={{ minHeight: "20rem", borderRadius: "2rem", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "end", color: "#fff", boxShadow: "var(--nt-shadow)" }}>
                    <span className="nt-pill green" style={{ width: "max-content" }}>EPISODE BARU</span>
                    <h2 style={{ fontSize: "2rem", maxWidth: "38rem", margin: ".8rem 0 .5rem" }}>Legenda Danau Toba: Bagian 3</h2>
                    <p style={{ maxWidth: "35rem" }}>Perjalanan Toba menemukan jati dirinya di tengah badai besar yang melanda desa.</p>
                </ImageFrame>
                <aside style={{ display: "grid", gap: "1.5rem" }}>
                    {karyaItems.map((item) => (
                        <article key={item.title} className="nt-card" style={{ display: "grid", gridTemplateColumns: "5.6rem 1fr", gap: "1rem", alignItems: "center", padding: "1rem" }}>
                            <ImageFrame src={item.image} style={{ height: "5.6rem", borderRadius: "1rem" }} />
                            <span><strong style={{ color: "var(--nt-brown)" }}>{item.title}</strong><small className="nt-subtle" style={{ display: "block" }}>{item.meta}</small></span>
                        </article>
                    ))}
                </aside>
            </div>
            <section style={{ marginTop: "4rem" }}>
                <h2 className="nt-heading">Seri Terpopuler</h2>
                <div className="nt-grid nt-grid-4" style={{ marginTop: "1.5rem" }}>
                    {popularStudioSeries.map((item) => (
                        <article key={item.title}>
                            <ImageFrame src={item.image} style={{ height: "17rem", borderRadius: "1.5rem", boxShadow: "var(--nt-shadow)" }} />
                            <h3 style={{ color: "var(--nt-brown)", fontSize: "1.3rem", marginBottom: ".2rem" }}>{item.title}</h3>
                            <small className="nt-subtle">{item.views} - {item.likes}</small>
                        </article>
                    ))}
                </div>
            </section>
        </StudioShell>
    );
}

export function ChannelPage() {
    const { slug } = useParams();
    const creator = creators.find((item) => item.slug === slug) ?? creators[0];
    const channel = useApiFallback(() => Promise.resolve({ data: { data: creator } }), creator, [slug]);
    const current = { ...creator, ...(channel.data ?? {}) };

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <StatusLine status={channel.status} />
                <section className="nt-card" style={{ overflow: "hidden" }}>
                    <ImageFrame src={current.banner_url ?? current.image ?? mockups.channel} style={{ height: "18rem" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "12rem 1fr auto", gap: "1.5rem", padding: "0 2rem 2rem", alignItems: "end" }}>
                        <div className="nt-avatar" style={{ width: "10rem", height: "10rem", marginTop: "-5rem", borderRadius: "2rem", borderColor: "#fff" }}>
                            <img src={current.avatar_url ?? current.avatar ?? mockups.studio} alt="" />
                        </div>
                        <div>
                            <h1 className="nt-title" style={{ fontSize: "3rem" }}>{current.name ?? "Kadek Wijaya"} {current.Terverifikasi || current.is_Terverifikasi ? <span style={{ color: "var(--nt-lime-dark)", fontSize: "1.4rem" }}>Terverifikasi</span> : null}</h1>
                            <p style={{ fontWeight: 850 }}>{current.subtitle ?? "Sang Penjaga Legenda (Guardian of Legends)"}</p>
                        </div>
                        <button type="button" className="nt-btn green">Ikuti</button>
                    </div>
                </section>
                <div className="nt-grid nt-grid-4" style={{ margin: "1.5rem 0" }}>
                    {[["Total Episode", current.totalEpisodes ?? current.video_count ?? "124"], ["Pengikut", current.followers ?? current.subscriber_count ?? "8.2K"], ["Jumlah Penayangan", current.views ?? current.total_views ?? "850rb"], ["Total Series", current.totalSeries ?? "12"]].map(([label, value]) => (
                        <div key={label} className="nt-card pad">
                            <p className="nt-subtle" style={{ margin: 0 }}>{label}</p>
                            <h2 style={{ color: "var(--nt-brown)", fontSize: "2.2rem", margin: ".2rem 0 0" }}>{value}</h2>
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    {["Portofolio Animasi", "Naskah Digital", "Tentang Kreator"].map((tab, index) => <span key={tab} className={`nt-pill ${index === 0 ? "green" : ""}`}>{tab}</span>)}
                </div>
                <div className="nt-grid nt-grid-3">
                    {["Misteri Candi Tersembunyi", "Tarian Sang Barong", "Phinisi: Samudera Harapan"].map((title, index) => (
                        <VideoCard key={title} item={{ ...seriesPopular[index], title, image: [mockups.explore, mockups.karya, mockups.watch][index] }} />
                    ))}
                </div>
                <section className="nt-card pad" style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <strong style={{ color: "var(--nt-brown)", fontSize: "1.35rem" }}>Master Storyteller Bronze Badge</strong>
                    <BadgeCard />
                </section>
            </main>
        </PageShell>
    );
}

export function ProfilePage() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
        } catch (_error) {
            // Token is cleared locally even if the API logout request fails.
        }
        navigate("/");
    }

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <section className="nt-card pad" style={{ display: "grid", gridTemplateColumns: "12rem 1fr", gap: "1.5rem", alignItems: "center", borderWidth: "4px" }}>
                    <div className="nt-avatar" style={{ width: "11rem", height: "11rem", borderRadius: "2rem" }}><img src={user?.profile_photo ?? mockups.studio} alt="" /></div>
                    <div>
                        <h1 className="nt-title" style={{ fontSize: "3.5rem", color: "#111" }}>{user?.name ?? "Kadek Wijaya"}</h1>
                        <p style={{ color: "var(--nt-brown)", fontSize: "1.35rem", fontWeight: 850 }}>Petualang Nusa yang siap menjelajahi cerita budaya Indonesia.</p>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <span className="nt-pill">Pelanggan Pro</span>
                            <span className="nt-pill green">12 Hari Beruntun</span>
                            <button type="button" className="nt-pill dark" onClick={handleLogout}>Keluar</button>
                        </div>
                    </div>
                </section>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 25rem)", gap: "1.5rem", marginTop: "2rem" }}>
                    <section className="nt-card pad">
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div><h2 className="nt-heading">Progres NusaLanglang</h2><p className="nt-subtle">Tingkat Pengetahuan Budaya</p></div>
                            <h2 style={{ color: "var(--nt-lime-dark)", fontSize: "2.4rem", margin: 0 }}>Lvl 42</h2>
                        </div>
                        {culturalProgress.knowledge.map((item) => (
                            <div key={item.label} style={{ marginTop: "1.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}><span>{item.label.toUpperCase()}</span><span>{item.value}%</span></div>
                                <div style={{ height: ".8rem", background: "rgba(117,71,37,.08)", borderRadius: "999px", overflow: "hidden" }}><div style={{ width: `${item.value}%`, height: "100%", background: item.value > 60 ? "var(--nt-brown)" : "var(--nt-lime-dark)" }} /></div>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                            <span className="nt-pill green"><Icon name="trophy" /> TERBARU Ahli Wayang</span>
                            <span className="nt-pill"><Icon name="trophy" /> TERBARU Ahli Wayang</span>
                        </div>
                    </section>
                    <aside className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fff" }}>
                        <h2><Icon name="box" /> Gudang Aset</h2>
                        <div className="nt-grid nt-grid-2">
                            <ImageFrame src={mockups.home} style={{ height: "10rem", borderRadius: "1rem", display: "grid", placeItems: "center" }}><strong>Stiker (24)</strong></ImageFrame>
                            <ImageFrame src={mockups.profile} style={{ height: "10rem", borderRadius: "1rem", display: "grid", placeItems: "center" }}><strong>Bingkai (3)</strong></ImageFrame>
                        </div>
                        <button type="button" className="nt-btn" style={{ width: "100%", marginTop: "1.5rem", background: "#fff", color: "var(--nt-brown)" }}>Lihat Semua Koleksi</button>
                    </aside>
                </div>
                <SectionHeader title="Lanjutkan Menonton" link={{ to: "/favorit", label: "Semua Kisah" }} />
                <div className="nt-grid nt-grid-3">
                    {[1, 2].map((item) => <VideoCard key={item} item={{ ...seriesPopular[4], title: "Rahasia Relief Borobudur", image: mockups.shorts }} />)}
                    <div className="nt-card pad" style={{ display: "grid", placeItems: "center", textAlign: "center", borderStyle: "dashed" }}>
                        <img src={mascotImage} alt="" style={{ width: "8rem" }} />
                        <h2 style={{ color: "var(--nt-brown)" }}>Temukan Kisah Baru</h2>
                    </div>
                </div>
                <div className="nt-grid nt-grid-2" style={{ marginTop: "1.5rem" }}>
                    <section className="nt-card pad">
                        <h2><Icon name="save" /> Kisah Disimpan</h2>
                        {seriesPopular.slice(0, 2).map((item) => <VideoCard key={item.slug} item={{ ...item, image: mockups.watch }} compact />)}
                    </section>
                    <section className="nt-card pad">
                        <h2><Icon name="user" /> Kreator Diikuti</h2>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            {creators.slice(0, 3).map((creator) => <Link key={creator.slug} to={`/channel/${creator.slug}`} className="nt-avatar"><img src={creator.avatar} alt="" /></Link>)}
                            <button className="nt-icon-btn" type="button">+</button>
                        </div>
                    </section>
                </div>
            </main>
        </PageShell>
    );
}

export function WatchPage() {
    const { slug } = useParams();
    const fallback = seriesPopular.find((item) => item.slug === slug) ?? { ...seriesPopular[0], title: "Kisah Gajah Mada : Bagian 1 - Lahirnya Sang Legenda Gajah Mada", image: mockups.watch };
    const video = useApiFallback(() => getVideo(slug), fallback, [slug]);
    const recommendations = useApiFallback(getRecommendedVideos, seriesPopular, []);
    const [paywall, setPaywall] = useState(false);
    const [message, setMessage] = useState("");
    const currentVideo = { ...fallback, ...(video.data ?? {}) };
    const videoId = currentVideo.id ?? slug;
    const creatorName = currentVideo.channel?.name ?? currentVideo.creator?.name ?? currentVideo.creator ?? "NusaTales Studio";
    const currentImage = currentVideo.thumbnail_url ?? currentVideo.image ?? mockups.watch;

    useEffect(() => {
        recordVideoView(videoId).catch(() => null);
    }, [slug, videoId]);

    async function unlock() {
        try {
            await unlockVideo(video.data.id ?? 1);
            setPaywall(false);
            setMessage("Video premium berhasil dibuka dengan NusaKoin.");
        } catch (_error) {
            setMessage("Mode dummy: koin tidak dikurangi karena API pembayaran belum aktif.");
            setPaywall(false);
        }
    }

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "1rem 0 3rem" }}>
                <div className="nt-status" style={{ marginBottom: "1rem" }}>Wah, kamu sedang menonton! Selesaikan video untuk +50 XP Budaya.</div>
                {message ? <div className="nt-status" style={{ marginBottom: "1rem" }}>{message}</div> : null}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 22rem)", gap: "1.5rem" }}>
                    <div style={{ display: "grid", gap: "1.5rem" }}>
                        <div style={{ position: "relative" }}>
                            <VideoPlayer item={{ ...currentVideo, image: currentImage }} />
                            {paywall ? (
                                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.65)", borderRadius: "2rem" }}>
                                    <section className="nt-card pad" style={{ textAlign: "center", maxWidth: "25rem" }}>
                                        <h2 style={{ color: "var(--nt-brown)" }}>Konten Premium</h2>
                                        <p>Unlock episode ini dengan NusaKoin atau paket NusaAdhi aktif.</p>
                                        <button type="button" className="nt-btn green" onClick={unlock}>Unlock dengan NusaKoin</button>
                                    </section>
                                </div>
                            ) : null}
                        </div>
                        <section className="nt-card pad">
                            <h1 style={{ color: "var(--nt-brown)", fontSize: "2rem", fontWeight: 950, margin: 0 }}>{currentVideo.title ?? fallback.title}</h1>
                            <p className="nt-subtle" style={{ fontWeight: 850 }}>{currentVideo.view_count ?? currentVideo.views ?? "850rb"} tayangan - {currentVideo.published_at ?? currentVideo.uploaded_at ?? "24 Okt 2024"}</p>
                            <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
                                <LikeButton />
                                <ShareButton />
                                <SaveButton />
                                <button type="button" className="nt-btn ghost" onClick={() => setPaywall(true)}>Lihat Paywall</button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                                <Link to={`/channel/${currentVideo.channel?.slug ?? "kadek-wijaya"}`} style={{ display: "flex", alignItems: "center", gap: ".8rem", color: "var(--nt-brown)", textDecoration: "none", fontWeight: 950 }}>
                                    <span className="nt-avatar"><img src={currentVideo.channel?.avatar_url ?? mockups.studio} alt="" /></span>
                                    {creatorName}
                                </Link>
                                <button type="button" className="nt-btn green">Ikuti</button>
                            </div>
                            <p style={{ lineHeight: 1.6 }}>{currentVideo.description ?? "Episode pembuka kisah Nusantara, menggabungkan ritme animasi modern dengan konteks budaya dan diskusi NusaRembug."}</p>
                        </section>
                        <CommentSection videoId={videoId} allowComments={currentVideo.allow_comments ?? true} seed={comments} />
                    </div>
                    <aside style={{ display: "grid", gap: "1.5rem", alignContent: "start" }}>
                        <section className="nt-card pad">
                            <h2 style={{ color: "var(--nt-brown)", marginTop: 0 }}>Daftar Episode</h2>
                            {latestEpisodes.map((episode) => <EpisodeCard key={episode.id} item={episode} />)}
                        </section>
                        <section className="nt-card pad">
                            <h2 style={{ color: "var(--nt-brown)", marginTop: 0 }}>Rekomendasi</h2>
                            {(Array.isArray(recommendations.data) ? recommendations.data : seriesPopular).slice(0, 4).map((item) => <VideoCard key={item.slug} item={item} compact />)}
                        </section>
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}

export function MapPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const apiRegions = useApiFallback(getRegions, regions, []);
    const [selectedRegion, setSelectedRegion] = useState(regions[0]);
    const [selectedStory, setSelectedStory] = useState(null);
    const region = selectedRegion ?? regions[0];

    function saveFavorite() {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/peta", message: "Masuk terlebih dahulu untuk menyimpan cerita favorit." } });
            return;
        }

        addFavorite({ target_type: "series", target_id: selectedStory?.id ?? 1 }).catch(() => null);
    }

    return (
        <div className="nt-map-page">
            <Navbar active="Peta" />
            <main className="nt-map-stage">
                <StatusLine status={apiRegions.status} />
                {["java", "kalimantan", "sulawesi"].map((pin) => (
                    <button key={pin} type="button" className={`nt-pin ${pin}`} onClick={() => {
                        setSelectedRegion(region);
                        setSelectedStory(null);
                    }}>
                        <Icon name={pin === "java" ? "trophy" : pin === "kalimantan" ? "home" : "map"} />
                    </button>
                ))}
                {selectedRegion && !selectedStory ? (
                    <section className="nt-map-panel">
                        <h1 className="nt-title" style={{ fontSize: "2.8rem" }}>{region.title}</h1>
                        <p style={{ fontSize: "1.25rem", lineHeight: 1.45, fontWeight: 850 }}>{region.description}</p>
                        <CulturalProgressPath levels={culturalProgress.levels} />
                        <h2 style={{ color: "var(--nt-brown)" }}>Series Tersedia</h2>
                        {(Array.isArray(region.series) ? region.series : regions[0].series).map((story) => (
                            <button key={story.title} type="button" onClick={() => setSelectedStory(story)} style={{ display: "grid", gridTemplateColumns: "3.4rem 1fr auto", gap: ".8rem", alignItems: "center", width: "100%", background: "transparent", border: 0, borderBottom: "1px solid var(--nt-line)", padding: ".65rem 0", textAlign: "left" }}>
                                <ImageFrame src={story.image} style={{ height: "3.4rem", borderRadius: ".5rem" }} />
                                <span><strong>{story.title}</strong><small className="nt-subtle" style={{ display: "block" }}>Menjelajahi legenda penguasa pantai...</small></span>
                                <strong style={{ color: "var(--nt-brown)" }}>{story.progress}</strong>
                            </button>
                        ))}
                    </section>
                ) : null}
                {selectedStory ? (
                    <section className="nt-map-panel">
                        <ImageFrame src={mockups.mapStory} style={{ height: "12rem", borderRadius: "1rem", marginBottom: "1rem" }}>
                            <span className="nt-pill green" style={{ margin: ".8rem" }}>KISAH LEGENDARIS</span>
                        </ImageFrame>
                        <h1 style={{ color: "var(--nt-brown)", fontSize: "2rem", margin: 0 }}>{selectedStory.title}</h1>
                        <p style={{ fontSize: "1.05rem", lineHeight: 1.4 }}>Menjelajahi legenda penguasa pantai selatan Jawa dalam balutan ombak yang agung.</p>
                        <div className="nt-grid nt-grid-2">
                            <div className="nt-card pad"><small>Cerita Terbuka</small><h2 style={{ margin: 0, color: "var(--nt-brown)" }}>12/48</h2></div>
                            <div className="nt-card pad"><small>Tingkat Eksplorasi</small><h2 style={{ margin: 0, color: "var(--nt-brown)" }}>25%</h2></div>
                        </div>
                        <h3 style={{ color: "var(--nt-brown)" }}>Imbalan Penjelajahan</h3>
                        <div className="nt-grid nt-grid-3">
                            {["+250", "Lencana", "Kartu"].map((item) => <div key={item} className="nt-card pad" style={{ textAlign: "center", boxShadow: "none" }}>{item}</div>)}
                        </div>
                        <Link to="/watch/misteri-ratu-kidul" className="nt-btn green" style={{ width: "100%", marginTop: "1rem" }}><Icon name="play" /> Mulai Perjalanan</Link>
                        <button type="button" className="nt-btn ghost" style={{ width: "100%", marginTop: ".7rem" }} onClick={saveFavorite}><Icon name="save" /> Simpan Ke Favorit</button>
                    </section>
                ) : null}
            </main>
        </div>
    );
}

function NavbarProxy(props) {
    return (
        <div className="nt-navbar-wrap">
            <nav className="nt-navbar nt-container">
                <Link to="/" className="nt-brand"><span className="nt-brand-mark" /><span>NusaTales</span></Link>
                <div className="nt-menu">
                    {[
                        ["Beranda", "/"],
                        ["Shorts", "/shorts"],
                        ["Jelajah", "/jelajah"],
                        ["Peta", "/peta"],
                        ["Favorit", "/favorit"],
                    ].map(([label, path]) => <Link key={label} className={props.active === label ? "active" : ""} to={path}>{label}</Link>)}
                </div>
                <div className="nt-actions">
                    <Link className="nt-pill" to="/premium"><Icon name="koin" /> 1,250 Koin</Link>
                    <Link className="nt-avatar" to="/profile"><img src={mascotImage} alt="" /></Link>
                </div>
            </nav>
        </div>
    );
}

export function LanglangPage() {
    const progress = useApiFallback(getCulturalProgress, culturalProgress, []);
    const missions = useApiFallback(getMissions, culturalProgress.missions, []);
    const badges = useApiFallback(getBadges, [1, 2, 3, null, null, null], []);
    const data = { ...culturalProgress, ...(progress.data ?? {}) };

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <StatusLine status={progress.status === "fallback" || missions.status === "fallback" || badges.status === "fallback" ? "fallback" : "ready"} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    <h1 className="nt-title" style={{ fontSize: "2.9rem" }}><Icon name="trophy" size={42} /> {data.score}</h1>
                    <h2 style={{ color: "var(--nt-muted)", fontSize: "1.7rem" }}>Tahap: {data.stage}</h2>
                </div>
                <CulturalProgressPath levels={data.levels} />
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 24rem)", gap: "2rem", marginTop: "2rem" }}>
                    <div style={{ display: "grid", gap: "2rem" }}>
                        <section>
                            <h2 className="nt-heading"><Icon name="map" /> Misi Berjalan</h2>
                            <div className="nt-card pad nt-soft" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
                                {(Array.isArray(missions.data) ? missions.data : culturalProgress.missions).slice(0, 2).map((mission) => (
                                    <article key={mission.number} className="nt-card pad" style={{ position: "relative" }}>
                                        <span className="nt-pill green">{mission.number}</span>
                                        <h3 style={{ color: "var(--nt-brown)", fontSize: "1.35rem" }}>{mission.title}</h3>
                                        <p className="nt-subtle">{mission.description}</p>
                                        <div style={{ height: ".45rem", background: "rgba(117,71,37,.08)", borderRadius: "999px", overflow: "hidden" }}><div style={{ width: `${mission.progress}%`, height: "100%", background: "var(--nt-brown)" }} /></div>
                                        <small style={{ float: "right", fontWeight: 900 }}>{mission.progress}%</small>
                                    </article>
                                ))}
                            </div>
                        </section>
                        <section className="nt-card pad nt-soft">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                <div>
                                    <h2 className="nt-heading">Progres NusaLanglang</h2>
                                    <p style={{ fontSize: "1.3rem" }}>Tingkat Pengetahuan Budaya</p>
                                </div>
                                <h2 style={{ color: "var(--nt-lime-dark)", fontSize: "2.4rem", margin: 0 }}>Lvl 42</h2>
                            </div>
                            {(Array.isArray(data.knowledge) ? data.knowledge : culturalProgress.knowledge).map((item) => (
                                <div key={item.label} style={{ marginTop: "1.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}><span>{item.label}</span><span>{item.value}%</span></div>
                                    <div style={{ height: ".8rem", background: "rgba(117,71,37,.08)", borderRadius: "999px", overflow: "hidden" }}><div style={{ width: `${item.value}%`, height: "100%", background: item.value > 60 ? "var(--nt-brown)" : "var(--nt-lime-dark)" }} /></div>
                                </div>
                            ))}
                        </section>
                    </div>
                    <aside style={{ display: "grid", gap: "1.5rem", alignContent: "start" }}>
                        <section>
                            <h2 className="nt-heading">Lencana Budaya</h2>
                            <div className="nt-card pad nt-soft" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                                {(Array.isArray(badges.data) ? badges.data : [1, 2, 3, null, null, null]).map((badge, index) => <BadgeCard key={index} unlocked={Boolean(badge)} />)}
                            </div>
                        </section>
                        <section>
                            <h2 className="nt-heading">Prasasti Budaya</h2>
                            {["Prasasti Kedukan Bukit", "Prasasti Mulawarman"].map((title, index) => (
                                <article key={title} className="nt-card" style={{ display: "grid", gridTemplateColumns: "4rem 1fr", gap: "1rem", padding: "1rem", marginTop: "1rem" }}>
                                    <ImageFrame src={index === 0 ? mockups.karya : mockups.profile} style={{ height: "4rem", borderRadius: "50%" }} />
                                    <span><strong style={{ color: "var(--nt-brown)" }}>{title}</strong><small className="nt-subtle" style={{ display: "block" }}>{index === 0 ? "BARU SAJA DIBUKA" : "DIBUKA 3 HARI LALU"}</small></span>
                                </article>
                            ))}
                        </section>
                        <section className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fff" }}>
                            <h2 style={{ marginTop: 0 }}>Peti Harta Budaya</h2>
                            <p>Kumpulkan 200 koin lagi untuk membuka peti harta legendaris.</p>
                            <div style={{ height: ".8rem", background: "rgba(255,255,255,.2)", borderRadius: "999px", overflow: "hidden" }}><div style={{ width: "78%", background: "var(--nt-lime)", height: "100%" }} /></div>
                        </section>
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}

export function StorePage() {
    const assetData = useApiFallback(getAssets, products, []);

    return (
        <PageShell>
            <main className="nt-container" style={{ display: "grid", gridTemplateColumns: "minmax(13rem, 16rem) minmax(0,1fr)", gap: "2rem", padding: "2rem 0 3rem" }}>
                <aside style={{ display: "grid", gap: "1.5rem", alignContent: "start" }}>
                    <section className="nt-card pad nt-soft">
                        <h2 style={{ color: "var(--nt-brown)" }}>Kategori</h2>
                        {["Kostum", "Penanda", "Emoji", "Efek"].map((item, index) => (
                            <button key={item} type="button" className={`nt-btn ${index === 0 ? "green" : "ghost"}`} style={{ width: "100%", justifyContent: "start", marginBottom: ".7rem", boxShadow: "none" }}>
                                <Icon name={index === 0 ? "user" : index === 1 ? "upload" : index === 2 ? "heart" : "trophy"} />
                                {item}
                            </button>
                        ))}
                    </section>
                    <section className="nt-card pad nt-soft">
                        <h2 style={{ color: "var(--nt-brown)" }}>Pencarian</h2>
                        <div className="nt-search"><input placeholder="Cari item..." /><Icon name="search" /></div>
                    </section>
                </aside>
                <section>
                    <StatusLine status={assetData.status} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h1 className="nt-heading">NusaToko</h1>
                            <p style={{ fontSize: "1.25rem", fontWeight: 850 }}>Lengkapi petualanganmu dengan aset pilihan</p>
                        </div>
                        <div style={{ display: "flex", gap: ".6rem" }}>
                            <button type="button" className="nt-icon-btn">&lt;</button>
                            <button type="button" className="nt-icon-btn">&gt;</button>
                        </div>
                    </div>
                    <div className="nt-grid nt-grid-4" style={{ marginTop: "2rem" }}>
                        {(Array.isArray(assetData.data) ? assetData.data : products).map((product) => <AssetCard key={product.id} item={product} />)}
                    </div>
                </section>
            </main>
        </PageShell>
    );
}

export function SayembaraPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const challengeList = useApiFallback(getChallenges, [fallbackChallenge], []);
    const challengeDetail = useApiFallback(() => getChallenge("sayembara-karakter-wayang-modern"), fallbackChallenge, []);
    const leaderboard = useApiFallback(() => getChallengeLeaderboard(1), fallbackChallenge.leaderboard, []);
    const data = { ...fallbackChallenge, ...(Array.isArray(challengeDetail.data) ? {} : challengeDetail.data) };
    const [joinMessage, setJoinMessage] = useState("");

    function joinChallenge() {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/sayembara", message: "Masuk terlebih dahulu untuk ikut SayembaraNusa." } });
            return;
        }

        setJoinMessage("Pendaftaran sayembara siap. Unggah karya dari Studio NusaKarya untuk melanjutkan.");
    }

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "1rem 0 4rem" }}>
                <StatusLine status={challengeList.status === "fallback" || challengeDetail.status === "fallback" ? "fallback" : "ready"} />
                {joinMessage ? <div className="nt-status" style={{ marginBottom: "1rem" }}>{joinMessage}</div> : null}
                <section className="nt-card pad" style={{ minHeight: "28rem", background: "var(--nt-brown)", color: "#fff0e5", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(18rem,28rem)", gap: "2rem", alignItems: "center" }}>
                    <div>
                        <span className="nt-pill green">SAYEMBARA AKTIF</span>
                        <h1 className="nt-title" style={{ color: "#ffe1d5", marginTop: "1.5rem" }}>{data.title}</h1>
                        <p style={{ maxWidth: "43rem", fontSize: "1.35rem", lineHeight: 1.4 }}>{data.description}</p>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
                            <button type="button" className="nt-btn green" onClick={joinChallenge}>Ikuti Sayembara</button>
                            <button type="button" className="nt-btn ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.28)" }}>Panduan Detail</button>
                        </div>
                    </div>
                    <div style={{ borderRadius: "50%", background: "var(--nt-lime)", minHeight: "23rem", display: "grid", placeItems: "center" }}>
                        <img src={mascotImage} alt="" style={{ width: "18rem" }} />
                    </div>
                </section>
                <SectionHeader title="Hadiah & Apresiasi" subtitle="Penghargaan tertinggi bagi para kreator terbaik NusaTales." />
                <div className="nt-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
                    {data.rewards.slice(0, 3).map((reward) => <ChallengeCard key={reward.title} reward={reward} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, 24rem)", gap: "2rem", marginTop: "2rem" }}>
                    <section>
                        <h2 className="nt-heading">Papan Peringkat Peserta</h2>
                        <p className="nt-subtle">Karya dengan dukungan suara terbanyak dari komunitas minggu ini.</p>
                        <div className="nt-card" style={{ overflow: "hidden" }}>
                            {(Array.isArray(leaderboard.data) ? leaderboard.data : data.leaderboard).map((entry) => (
                                <article key={entry.rank} style={{ display: "grid", gridTemplateColumns: "3rem 4rem 1fr auto", gap: "1rem", alignItems: "center", padding: "1.3rem 2rem", borderBottom: "1px solid var(--nt-line)" }}>
                                    <strong style={{ color: "var(--nt-gold)", fontSize: "1.8rem" }}>{entry.rank}</strong>
                                    <span className="nt-avatar"><img src={mockups.profile} alt="" /></span>
                                    <span><strong>{entry.name}</strong><small style={{ display: "block" }}>"{entry.work}"</small></span>
                                    <strong>{entry.votes} SUARA</strong>
                                </article>
                            ))}
                        </div>
                        <button type="button" className="nt-btn ghost" style={{ width: "100%", marginTop: "1.5rem" }}>Lihat Papan Peringkat Selengkapnya</button>
                    </section>
                    <aside style={{ display: "grid", gap: "1.5rem", alignContent: "start" }}>
                        <section className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fff" }}>
                            <h2>Mulai Perjalananmu</h2>
                            <p>Jangan biarkan ide hebatmu mengendap. Ikuti sayembara dan jadilah legenda baru di dunia NusaTales.</p>
                            <p><Icon name="check" /> Batas Waktu: {data.deadline}</p>
                            <p><Icon name="check" /> Format: {data.format}</p>
                            <button type="button" className="nt-btn green" style={{ width: "100%" }} onClick={joinChallenge}>Ikuti Sayembara</button>
                        </section>
                        <section className="nt-card pad nt-soft">
                            <h2>Juri Tamu</h2>
                            <div style={{ display: "flex" }}>
                                {creators.slice(0, 3).map((creator) => <span key={creator.slug} className="nt-avatar" style={{ marginLeft: "-.3rem" }}><img src={creator.avatar} alt="" /></span>)}
                            </div>
                            <p className="nt-subtle">Kurasi dilakukan oleh para ahli di bidang seni visual, sejarah, dan sastra Nusantara.</p>
                        </section>
                    </aside>
                </div>
            </main>
        </PageShell>
    );
}

export function SearchPage() {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get("q") ?? "";
    const results = useMemo(() => exploreCards.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || !query), [query]);

    return (
        <PageShell>
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <h1 className="nt-heading">Hasil Pencarian</h1>
                <p className="nt-subtle">Menampilkan kisah untuk "{query || "semua"}".</p>
                {results.length ? (
                    <div className="nt-grid nt-grid-4">
                        {results.map((item) => <VideoCard key={item.id} item={item} />)}
                    </div>
                ) : <EmptyState title="Kisah tidak ditemukan" body="Coba kata kunci legenda, mitologi, atau daerah Nusantara." />}
            </main>
        </PageShell>
    );
}

export function SeriesPage() {
    const { slug } = useParams();
    const fallback = seriesPopular.find((item) => item.slug === slug) ?? seriesPopular[0];
    const series = useApiFallback(() => getSeriesDetail(slug), fallback, [slug]);

    return (
        <PageShell active="Jelajah">
            <main className="nt-container" style={{ padding: "2rem 0 3rem" }}>
                <StatusLine status={series.status} />
                <section className="nt-card pad" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 24rem", gap: "2rem", alignItems: "center" }}>
                    <div>
                        <span className="nt-pill green">NusaSaga</span>
                        <h1 className="nt-title">{series.data.title}</h1>
                        <p style={{ fontSize: "1.2rem", lineHeight: 1.55 }}>{series.data.description}</p>
                        <Link to={`/watch/${series.data.slug}`} className="nt-btn green">Tonton Sekarang</Link>
                    </div>
                    <ImageFrame src={series.data.image ?? mockups.explore} style={{ height: "20rem", borderRadius: "1.5rem" }} />
                </section>
                <SectionHeader title="Episode" />
                <div className="nt-grid nt-grid-4">
                    {latestEpisodes.map((episode) => <EpisodeCard key={episode.id} item={episode} />)}
                </div>
            </main>
        </PageShell>
    );
}

export function SimpleStudioPage({ title = "Studio NusaKarya", active = "Beranda" }) {
    return (
        <StudioShell active={active}>
            <h1 className="nt-title">{title}</h1>
            <EmptyState title="Halaman studio siap dikembangkan" body="Struktur NusaKarya sudah terhubung dengan navigasi dan fallback data." />
        </StudioShell>
    );
}

export function NotFoundPage() {
    return (
        <PageShell>
            <main className="nt-container" style={{ minHeight: "28rem", display: "grid", gridTemplateColumns: "minmax(0,1fr) 14rem", gap: "2rem", alignItems: "center", padding: "3rem 0" }}>
                <section>
                    <span className="nt-pill green">404</span>
                    <h1 className="nt-title" style={{ marginTop: "1rem" }}>Kisah belum ditemukan</h1>
                    <p style={{ fontSize: "1.2rem", fontWeight: 850, lineHeight: 1.55 }}>
                        Halaman ini belum tersedia di peta NusaTales. Jelajahi cerita lain atau kembali ke beranda.
                    </p>
                    <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
                        <Link to="/" className="nt-btn green">Beranda</Link>
                        <Link to="/jelajah" className="nt-btn ghost">Jelajah Kisah</Link>
                    </div>
                </section>
                <img src={mascotImage} alt="" style={{ width: "13rem", justifySelf: "center" }} />
            </main>
        </PageShell>
    );
}

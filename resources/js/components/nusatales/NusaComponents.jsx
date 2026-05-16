import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    createVideoComment,
    deleteComment as deleteCommentRequest,
    getVideoComments,
    replyToComment,
} from "../../services/commentApi";
import {
    coinPackages,
    comments as fallbackComments,
    mascotImage,
    mockups,
    subscriptionPlans,
    transactions,
    unwrapApiData,
} from "../../data/nusatalesData";

export function Icon({ name, size = 20 }) {
    const icons = {
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        bell: <><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" /><path d="M9.5 20a3 3 0 0 0 5 0" /></>,
        upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
        play: <path d="M8 5v14l11-7Z" />,
        heart: <path d="M20 7.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 8 3.5Z" />,
        comment: <path d="M5 5h14v10H8l-3 3V5Z" />,
        save: <path d="M7 4h10v16l-5-3-5 3V4Z" />,
        share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 12 8-6" /><path d="m8 12 8 6" /></>,
        coin: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8" /><path d="M8 12h8" /></>,
        home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 14.5-4 16 0" /></>,
        karya: <><path d="M5 6h14v12H5z" /><path d="m8 14 3-3 2 2 3-4" /></>,
        chart: <><path d="M4 20V9" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" /></>,
        settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
        map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" /><path d="M9 4v14M15 6v14" /></>,
        trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 7H5a3 3 0 0 0 3 3" /><path d="M16 7h3a3 3 0 0 1-3 3" /><path d="M12 13v5" /><path d="M8 20h8" /></>,
        box: <><path d="M4 8h16v12H4z" /><path d="M4 8l3-4h10l3 4" /><path d="M12 8v12" /></>,
        check: <path d="m5 12 4 4L19 6" />,
    };

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[name] ?? <circle cx="12" cy="12" r="8" />}
        </svg>
    );
}

export function SearchBar({ placeholder = "Cari...", studio = false }) {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    function submit(event) {
        event.preventDefault();
        const q = query.trim();

        if (q) {
            navigate(`/search?q=${encodeURIComponent(q)}`);
            return;
        }

        navigate("/search");
    }

    return (
        <form className="nt-search" onSubmit={submit} role="search">
            <Icon name="search" size={19} />
            <input
                aria-label="Cari"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={studio ? "Cari Karya di Studio Anda..." : placeholder}
            />
        </form>
    );
}

export function CoinBalancePill({ balance = "1,250" }) {
    return (
        <Link to="/premium" className="nt-pill">
            <Icon name="coin" size={18} />
            {balance} Koin
        </Link>
    );
}

export function UserMenu() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <Link className="nt-avatar" to="/profile" aria-label="Buka profil">
            <img src={user.profile_photo ?? mascotImage} alt="" />
        </Link>
    );
}

export function Navbar({ active, studio = false, dark = false }) {
    const { activateStudio, hasChannel, isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [activationOpen, setActivationOpen] = useState(false);
    const [activationMessage, setActivationMessage] = useState("");
    const [activationLoading, setActivationLoading] = useState(false);
    const current = active ?? (
        location.pathname === "/" ? "Beranda" :
        location.pathname.startsWith("/shorts") ? "Shorts" :
        location.pathname.startsWith("/jelajah") ? "Jelajah" :
        location.pathname.startsWith("/peta") ? "Peta" :
        location.pathname.startsWith("/favorit") ? "Favorit" : ""
    );

    function handleCreate() {
        if (!isAuthenticated) {
            navigate("/login", { state: { message: "Masuk terlebih dahulu untuk membuat karya." } });
            return;
        }

        if (hasChannel) {
            navigate("/studio/upload");
            return;
        }

        setActivationOpen(true);
    }

    async function confirmActivation() {
        setActivationLoading(true);
        setActivationMessage("");

        try {
            await activateStudio();
            setActivationMessage("Studio NusaKarya berhasil diaktifkan.");
            setActivationOpen(false);
            navigate("/studio/upload");
        } catch (error) {
            setActivationMessage(error.response?.data?.message ?? "Studio belum bisa diaktifkan saat ini.");
        } finally {
            setActivationLoading(false);
        }
    }

    return (
        <div className="nt-navbar-wrap">
            <nav className="nt-navbar nt-container" style={dark ? { boxShadow: "0 12px 30px rgba(0,0,0,.35)" } : undefined}>
                <Link to="/" className="nt-brand" aria-label="NusaTales">
                    <span className="nt-brand-mark" />
                    <span>NusaTales</span>
                </Link>

                {studio ? (
                    <SearchBar studio />
                ) : (
                    <div className="nt-menu" aria-label="Menu utama">
                        {[
                            ["Beranda", "/"],
                            ["Shorts", "/shorts"],
                            ["Jelajah", "/jelajah"],
                            ["Peta", "/peta"],
                            ["Favorit", "/favorit"],
                        ].map(([label, path]) => (
                            <NavLink key={label} to={path} className={current === label ? "active" : undefined}>
                                {label}
                            </NavLink>
                        ))}
                    </div>
                )}

                <div className="nt-actions">
                    {!studio ? <SearchBar /> : null}
                    <CoinBalancePill />
                    <button
                        type="button"
                        className="nt-icon-btn"
                        aria-label="Notifikasi"
                        onClick={() => isAuthenticated ? navigate("/profile?tab=notifications") : navigate("/login", { state: { message: "Masuk terlebih dahulu untuk melihat notifikasi." } })}
                    >
                        <Icon name="bell" size={20} />
                    </button>
                    <button type="button" className="nt-pill" onClick={handleCreate}>
                        <Icon name="upload" size={18} />
                        Buat+
                    </button>
                    {isAuthenticated ? <UserMenu /> : <Link to="/login" className="nt-pill dark">Masuk</Link>}
                </div>
            </nav>
            {activationOpen ? (
                <div className="nt-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="nt-card pad nt-modal">
                        <h2 style={{ marginTop: 0, color: "var(--nt-brown)", fontWeight: 950 }}>Aktifkan Studio NusaKarya</h2>
                        <p style={{ fontWeight: 800, lineHeight: 1.7 }}>
                            Studio NusaKarya adalah ruang kreator NusaTales untuk mengunggah animasi, membuat episode NusaSaga, membagikan Shorts, dan membangun channel cerita Nusantara.
                        </p>
                        {activationMessage ? <div className="nt-status nt-error">{activationMessage}</div> : null}
                        <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", marginTop: "1.2rem", flexWrap: "wrap" }}>
                            <button type="button" className="nt-btn ghost" onClick={() => setActivationOpen(false)}>
                                Nanti Dulu
                            </button>
                            <button type="button" className="nt-btn dark" onClick={confirmActivation} disabled={activationLoading}>
                                {activationLoading ? "Mengaktifkan..." : "Aktifkan Studio"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function Footer() {
    return (
        <footer className="nt-footer">
            <h2>NusaTales</h2>
            <div className="nt-footer-links">
                <Link to="/#tentang">Tentang Kami</Link>
                <Link to="/#kredit-budaya">Kredit Budaya</Link>
                <Link to="/#privasi">Privasi</Link>
                <Link to="/#syarat">Syarat & Ketentuan</Link>
            </div>
            <div className="nt-footer-line" />
            <p>&copy; 2026 NusaTales: Sang Penjaga Cerita Nusantara.</p>
            <p>Dibuat dengan cinta untuk warisan budaya.</p>
            <button type="button" className="nt-footer-up" aria-label="Kembali ke atas" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                ^
            </button>
        </footer>
    );
}

export function PageShell({ active, children, footer = true, dark = false }) {
    return (
        <div className={dark ? "nt-page-dark" : "nt-page"}>
            <Navbar active={active} dark={dark} />
            {children}
            {footer ? <Footer /> : null}
        </div>
    );
}

export function StudioShell({ active = "Beranda", children, footer = true }) {
    return (
        <div className="nt-page">
            <Navbar studio />
            <main className="nt-container nt-section nt-sidebar-layout">
                <StudioSidebar active={active} />
                <div>{children}</div>
            </main>
            {footer ? <Footer /> : null}
        </div>
    );
}

export function StudioSidebar({ active = "Beranda" }) {
    const links = [
        ["Beranda", "/studio", "home"],
        ["Profil", "/studio/profile", "user"],
        ["Karya", "/studio/karya", "karya"],
        ["Analisis", "/studio/analytics", "chart"],
        ["Settings", "/studio/settings", "settings"],
    ];

    return (
        <aside className="nt-studio-sidebar">
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div className="nt-avatar" style={{ width: "6rem", height: "6rem", margin: "0 auto 1rem" }}>
                    <img src={mockups.studio} alt="" />
                </div>
                <h2 style={{ margin: 0, color: "var(--nt-brown)", fontSize: "1.55rem", fontWeight: 950 }}>Studio Anda</h2>
                <p style={{ margin: "0.35rem 0 0", fontWeight: 850 }}>Kadek Wijaya</p>
            </div>
            <nav style={{ display: "grid", gap: "0.55rem" }}>
                {links.map(([label, href, icon]) => (
                    <Link key={label} to={href} className={`side-link ${active === label ? "active" : ""}`}>
                        <Icon name={icon} size={19} />
                        {label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}

export function ImageFrame({ src, className = "", style = {}, children, alt = "" }) {
    return (
        <div
            className={`nt-thumb ${className}`}
            style={{
                backgroundImage: `url("${src}")`,
                ...style,
            }}
            role={alt ? "img" : undefined}
            aria-label={alt || undefined}
        >
            {children}
        </div>
    );
}

export function VideoCard({ item, compact = false }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.watch;
    const slug = item?.slug ?? item?.id ?? "demo-video";

    return (
        <Link to={`/watch/${slug}`} className="nt-card" style={{ display: "block", overflow: "hidden", textDecoration: "none", color: "inherit" }}>
            <ImageFrame src={image} style={{ height: compact ? "8.5rem" : "17rem", borderRadius: compact ? "1rem 1rem 0 0" : "1.1rem 1.1rem 0 0", position: "relative" }}>
                {item?.badge ? <span className="nt-pill green" style={{ position: "absolute", top: "0.75rem", left: "0.75rem", padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}>{item.badge}</span> : null}
            </ImageFrame>
            <div style={{ padding: compact ? "0.85rem" : "1rem" }}>
                <p className="nt-subtle" style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem" }}>{item?.genre ?? item?.category?.name ?? "Romance, Action, Drama"}</p>
                <h3 style={{ margin: "0.25rem 0", color: "var(--nt-brown)", fontWeight: 950, fontSize: compact ? "1rem" : "1.2rem" }}>{item?.title ?? "Kisah Nusantara"}</h3>
                <p style={{ margin: 0, color: "var(--nt-lime-dark)", fontWeight: 900 }}>
                    <Icon name="heart" size={15} /> {item?.likes ?? item?.like_count ?? "12.8 M"}
                </p>
            </div>
        </Link>
    );
}

export function SeriesCard({ item, rank, large = false }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.explore;

    return (
        <Link to={`/series/${item?.slug ?? item?.id ?? "kisah-seribu-candi"}`} className="nt-card" style={{ display: "block", overflow: "hidden", textDecoration: "none", color: "inherit" }}>
            <ImageFrame src={image} style={{ height: large ? "22rem" : "10rem", position: "relative" }}>
                {large ? <span className="nt-pill green" style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}>SERIES BARU</span> : null}
                <strong style={{ position: "absolute", right: "0.5rem", bottom: "-1.4rem", color: "#fff", fontSize: large ? "5.8rem" : "3.5rem", lineHeight: 1, textShadow: "0 6px 12px rgba(117,71,37,.45)" }}>
                    {rank}
                </strong>
            </ImageFrame>
            <div style={{ padding: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem", color: "var(--nt-brown)", fontWeight: 950 }}>{item?.title ?? "Kisah Seribu Candi"}</h3>
                <p style={{ margin: "0 0 0.8rem", color: "var(--nt-brown-dark)", fontSize: "0.9rem" }}>{item?.description ?? "Kisah animasi Nusantara pilihan."}</p>
                <p className="nt-subtle" style={{ margin: 0, fontSize: "0.8rem" }}>{item?.episodes ?? item?.episode_count ?? 10} Episode - {item?.views ?? item?.view_count ?? "850K"} Penonton</p>
            </div>
        </Link>
    );
}

export function EpisodeCard({ item }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.watch;

    return (
        <Link to={`/watch/${item?.slug ?? item?.id ?? "demo-video"}`} className="nt-card" style={{ display: "block", overflow: "hidden", borderColor: "rgba(90,127,7,.55)", textDecoration: "none", color: "inherit" }}>
            <ImageFrame src={image} style={{ height: "6rem", position: "relative" }}>
                <span className="nt-pill green" style={{ position: "absolute", top: "0.35rem", left: "0.35rem", padding: "0.25rem 0.45rem", fontSize: "0.65rem" }}>{item?.episode ?? `Ep ${item?.episode_number ?? 1}`}</span>
                <span className="nt-icon-btn" style={{ position: "absolute", right: "0.4rem", bottom: "0.4rem", width: "1.7rem", height: "1.7rem" }}>
                    <Icon name="play" size={12} />
                </span>
            </ImageFrame>
            <div style={{ padding: "0.65rem" }}>
                <p style={{ margin: 0, color: "var(--nt-muted)", fontSize: "0.7rem" }}>{item?.series?.title ?? item?.series ?? "NusaSaga"}</p>
                <h3 style={{ margin: "0.15rem 0", color: "var(--nt-brown)", fontSize: "0.82rem", fontWeight: 950 }}>{item?.title ?? "Episode NusaTales"}</h3>
                <p style={{ margin: 0, color: "var(--nt-brown)", fontSize: "0.65rem", fontWeight: 800 }}>{item?.age ?? item?.published_at ?? "Baru saja"}</p>
            </div>
        </Link>
    );
}

export function CreatorCard({ creator }) {
    return (
        <Link to={`/channel/${creator.slug}`} className="nt-card pad" style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
            <div className="nt-avatar" style={{ width: "8.4rem", height: "8.4rem", margin: "0 auto 1rem", borderWidth: 0 }}>
                <img src={creator.avatar ?? mockups.favorite} alt="" />
            </div>
            <h3 style={{ margin: 0, color: "var(--nt-brown)", fontSize: "1.45rem", fontWeight: 950 }}>{creator.name}</h3>
            <p className="nt-subtle" style={{ margin: "0.3rem 0 0", fontWeight: 800 }}>{creator.followers} Pengikut</p>
        </Link>
    );
}

export function LoginPrompt() {
    return (
        <PageShell active="Favorit">
            <main className="nt-container" style={{ minHeight: "28rem", display: "grid", gridTemplateColumns: "minmax(12rem, 22rem) minmax(0, 1fr)", alignItems: "center", gap: "4rem" }}>
                <img src={mascotImage} alt="" style={{ width: "16rem", justifySelf: "end" }} />
                <div>
                    <h1 className="nt-title" style={{ maxWidth: "34rem" }}>Jangan Lewatkan Cerita Seru !!!</h1>
                    <p style={{ fontSize: "1.35rem", lineHeight: 1.45, fontWeight: 850, maxWidth: "34rem" }}>
                        Masuk terlebih dahulu untuk melihat kelanjutan dari series favoritmu
                    </p>
                    <Link to="/login" className="nt-btn green">
                        Masuk
                        <span aria-hidden="true">-&gt;</span>
                    </Link>
                </div>
            </main>
        </PageShell>
    );
}

export function LoadingSkeleton({ label = "Memuat data NusaTales..." }) {
    return <div className="nt-status">{label}</div>;
}

export function ErrorState({ message = "Data utama belum tersedia. Menampilkan data dummy NusaTales." }) {
    return <div className="nt-status nt-error">{message}</div>;
}

export function EmptyState({ title = "Belum ada data", body = "Data dummy NusaTales disiapkan agar halaman tetap terisi." }) {
    return (
        <div className="nt-card pad" style={{ textAlign: "center" }}>
            <img src={mascotImage} alt="" style={{ width: "7rem", margin: "0 auto 1rem" }} />
            <h3 style={{ color: "var(--nt-brown)", margin: 0 }}>{title}</h3>
            <p className="nt-subtle">{body}</p>
        </div>
    );
}

export function LikeButton({ count = "12.8 M" }) {
    return <button type="button" className="nt-icon-btn" aria-label="Suka"><Icon name="heart" /> <span className="nt-hide-mobile">{count}</span></button>;
}

export function SaveButton() {
    return <button type="button" className="nt-icon-btn" aria-label="Simpan"><Icon name="save" /></button>;
}

export function ShareButton() {
    return <button type="button" className="nt-icon-btn" aria-label="Bagikan"><Icon name="share" /></button>;
}

export function FavoriteButton() {
    return <button type="button" className="nt-icon-btn" aria-label="Favorit"><Icon name="heart" /></button>;
}

export function ShortVideoPlayer({ item }) {
    const image = item?.thumbnail_url ?? item?.image ?? mockups.shorts;

    return (
        <section className="nt-card" style={{ position: "relative", width: "min(100%, 38rem)", aspectRatio: "9 / 16", overflow: "hidden", border: "4px solid #fff7e6", boxShadow: "0 0 3rem rgba(214, 155, 8, .35)" }}>
            <ImageFrame src={image} style={{ height: "100%", borderRadius: "1.8rem", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem 1.4rem", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <span><Icon name="play" size={32} /></span>
                    <span style={{ fontSize: "2rem", lineHeight: 1 }}>...</span>
                </div>
                <div style={{ textShadow: "0 3px 14px rgba(0,0,0,.7)" }}>
                    <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 4vw, 2.1rem)", fontWeight: 950 }}>{item?.title ?? "Short NusaTales"}</h1>
                    <p style={{ margin: "0.4rem 0 1rem", maxWidth: "28rem", lineHeight: 1.45 }}>{item?.description ?? "Cuplikan kisah Nusantara dalam format pendek."}</p>
                    <p style={{ margin: 0, display: "flex", gap: ".6rem", alignItems: "center", fontWeight: 900 }}>
                        <Icon name="play" /> {item?.audio ?? "NusaTales Original"}
                    </p>
                </div>
            </ImageFrame>
        </section>
    );
}

export function VideoPlayer({ item }) {
    return (
        <div className="nt-card" style={{ position: "relative", overflow: "hidden", borderRadius: "2rem" }}>
            <ImageFrame src={item.image ?? mockups.watch} style={{ aspectRatio: "16 / 9", borderRadius: "2rem", display: "grid", placeItems: "center" }}>
                <button type="button" className="nt-icon-btn" style={{ width: "5rem", height: "5rem", color: "#fff", background: "rgba(117,71,37,.75)", borderColor: "#fff" }} aria-label="Putar video">
                    <Icon name="play" size={34} />
                </button>
                <div style={{ position: "absolute", right: "1rem", bottom: "1rem", display: "flex", gap: ".65rem" }}>
                    <LikeButton />
                    <ShareButton />
                </div>
            </ImageFrame>
        </div>
    );
}

export function CommentSection({ videoId, allowComments = true, seed = fallbackComments }) {
    const { isAdmin, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState(Array.isArray(seed) ? seed : fallbackComments);
    const [body, setBody] = useState("");
    const [replyingId, setReplyingId] = useState(null);
    const [replyBody, setReplyBody] = useState("");
    const [message, setMessage] = useState("");
    const [fieldError, setFieldError] = useState("");

    useEffect(() => {
        let ignore = false;
        const fallback = Array.isArray(seed) ? seed : fallbackComments;

        async function loadComments() {
            if (!videoId) {
                setItems(fallback);
                return;
            }

            try {
                const response = await getVideoComments(videoId);
                const nextItems = unwrapApiData(response, fallback);

                if (!ignore) {
                    setItems(Array.isArray(nextItems) ? nextItems : fallback);
                }
            } catch (_error) {
                if (!ignore) {
                    setItems(fallback);
                }
            }
        }

        loadComments();

        return () => {
            ignore = true;
        };
    }, [videoId, seed]);

    async function submit(event) {
        event.preventDefault();
        const text = body.trim();
        setFieldError("");
        setMessage("");

        if (!allowComments) {
            setMessage("Komentar untuk video ini sedang dinonaktifkan.");
            return;
        }

        if (!isAuthenticated) {
            navigate("/login", { state: { message: "Masuk terlebih dahulu untuk ikut NusaRembug." } });
            return;
        }

        if (!text) {
            setFieldError("Komentar wajib diisi.");
            return;
        }

        try {
            const response = await createVideoComment(videoId, { body: text });
            const saved = response.data?.data?.comment ?? response.data?.data ?? { id: `local-${Date.now()}`, body: text, user };
            setItems((current) => [saved, ...(Array.isArray(current) ? current : [])]);
            setBody("");
        } catch (error) {
            const errors = error.response?.data?.errors ?? {};
            setFieldError(errors.body?.[0] ?? errors.content?.[0] ?? "");
            setMessage(error.response?.data?.message ?? "Komentar belum berhasil dikirim.");
        }
    }

    async function submitReply(commentId) {
        const text = replyBody.trim();
        setFieldError("");
        setMessage("");

        if (!isAuthenticated) {
            navigate("/login", { state: { message: "Masuk terlebih dahulu untuk membalas komentar." } });
            return;
        }

        if (!text) {
            setFieldError("Balasan wajib diisi.");
            return;
        }

        try {
            const response = await replyToComment(commentId, { body: text });
            const saved = response.data?.data?.comment ?? response.data?.data ?? { id: `reply-${Date.now()}`, body: text, user };
            setItems((current) => (Array.isArray(current) ? current : []).map((comment) => (
                comment.id === commentId
                    ? { ...comment, replies: [...(Array.isArray(comment.replies) ? comment.replies : []), saved] }
                    : comment
            )));
            setReplyBody("");
            setReplyingId(null);
        } catch (error) {
            const errors = error.response?.data?.errors ?? {};
            setFieldError(errors.body?.[0] ?? errors.content?.[0] ?? "");
            setMessage(error.response?.data?.message ?? "Balasan belum berhasil dikirim.");
        }
    }

    async function removeComment(commentId) {
        try {
            await deleteCommentRequest(commentId);
            setItems((current) => (Array.isArray(current) ? current : []).filter((comment) => comment.id !== commentId));
        } catch (error) {
            setMessage(error.response?.data?.message ?? "Komentar belum berhasil dihapus.");
        }
    }

    const comments = Array.isArray(items) ? items : [];

    return (
        <section className="nt-card pad">
            <h2 className="nt-heading" style={{ fontSize: "1.8rem" }}>NusaRembug</h2>
            {message ? <div className="nt-status nt-error">{message}</div> : null}
            <form onSubmit={submit} style={{ display: "grid", gap: "0.8rem", margin: "1rem 0 1.4rem" }}>
                <textarea
                    className="nt-form-field"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={isAuthenticated ? "Tulis komentar budaya..." : "Masuk untuk ikut NusaRembug."}
                    disabled={!allowComments || !isAuthenticated}
                />
                {fieldError ? <small style={{ color: "#9a3b22", fontWeight: 850 }}>{fieldError}</small> : null}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="button" className="nt-icon-btn" aria-label="Lampirkan gambar"><Icon name="box" /></button>
                        <button type="button" className="nt-icon-btn" aria-label="Tambahkan stiker"><Icon name="heart" /></button>
                    </div>
                    <button className="nt-btn green" type="submit">{isAuthenticated ? "Kirim" : "Masuk"}</button>
                </div>
            </form>
            <div style={{ display: "grid", gap: "0.85rem" }}>
                {comments.length === 0 ? <EmptyState title="Belum ada komentar" body="Jadilah penjelajah pertama yang membuka NusaRembug di video ini." /> : null}
                {comments.map((comment) => {
                    const canDelete = isAdmin || comment.user?.id === user?.id;
                    const replies = Array.isArray(comment.replies) ? comment.replies : [];

                    return (
                        <article key={comment.id} className="nt-card pad" style={{ background: comment.admin || comment.is_admin_reply ? "#fff0dc" : "#fffdf7", boxShadow: "none" }}>
                            <strong style={{ color: "var(--nt-brown)" }}>{comment.author ?? comment.user?.name ?? "Penjelajah Nusa"}</strong>
                            <p style={{ margin: "0.35rem 0", lineHeight: 1.45 }}>{comment.body ?? comment.content ?? "Komentar NusaRembug"}</p>
                            <small className="nt-subtle">{comment.time ?? comment.created_at ?? "Baru saja"}</small>
                            <div style={{ display: "flex", gap: ".7rem", marginTop: ".65rem", flexWrap: "wrap" }}>
                                <button type="button" className="nt-btn ghost" style={{ padding: ".45rem .8rem" }} onClick={() => setReplyingId(replyingId === comment.id ? null : comment.id)}>Balas</button>
                                {canDelete ? <button type="button" className="nt-btn ghost" style={{ padding: ".45rem .8rem" }} onClick={() => removeComment(comment.id)}>Hapus</button> : null}
                            </div>
                            {replyingId === comment.id ? (
                                <div style={{ display: "grid", gap: ".6rem", marginTop: ".8rem" }}>
                                    <textarea className="nt-form-field" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Tulis balasan..." />
                                    <button type="button" className="nt-btn green" style={{ justifySelf: "end" }} onClick={() => submitReply(comment.id)}>Kirim Balasan</button>
                                </div>
                            ) : null}
                            {replies.length ? (
                                <div style={{ display: "grid", gap: ".65rem", marginTop: ".8rem", paddingLeft: "1rem", borderLeft: "3px solid var(--nt-line)" }}>
                                    {replies.map((reply) => (
                                        <article key={reply.id} className="nt-card pad" style={{ boxShadow: "none", background: "#fffaf0" }}>
                                            <strong style={{ color: "var(--nt-brown)" }}>{reply.user?.name ?? reply.author ?? "Penjelajah Nusa"}</strong>
                                            <p style={{ margin: ".25rem 0" }}>{reply.body ?? reply.content}</p>
                                            <small className="nt-subtle">{reply.created_at ?? reply.time ?? "Baru saja"}</small>
                                        </article>
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export function CoinPackageCard({ item, onCheckout }) {
    return (
        <button type="button" className="nt-card pad" style={{ position: "relative", textAlign: "center", minHeight: "11rem" }} onClick={() => onCheckout?.(item)}>
            {item.featured ? <span className="nt-icon-btn" style={{ position: "absolute", right: "-1rem", top: "-1rem", background: "#fff6cc", color: "var(--nt-gold)" }}><Icon name="trophy" /></span> : null}
            <Icon name="coin" size={30} />
            <h3 style={{ color: "var(--nt-brown)", fontSize: "1.8rem", margin: ".6rem 0 .2rem" }}>{item.coins}</h3>
            {item.bonus ? <p style={{ margin: 0, color: "var(--nt-gold)", fontWeight: 900 }}>{item.bonus}</p> : null}
            <strong>{item.priceLabel}</strong>
        </button>
    );
}

export function SubscriptionPlanCard({ item, onCheckout }) {
    const features = Array.isArray(item?.features) ? item.features : ["Bebas iklan", "Akses cerita premium", "Dukung kreator lokal"];

    return (
        <article className="nt-card pad" style={{ background: item.featured ? "var(--nt-lime)" : "rgba(255,255,255,.12)", color: item.featured ? "#111" : "#fffdf7", borderColor: "rgba(255,255,255,.16)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 950 }}>{item.name}</h3>
                {item.badge ? <span className="nt-pill dark" style={{ padding: ".25rem .6rem", fontSize: ".7rem" }}>{item.badge}</span> : null}
            </div>
            <p style={{ margin: "1rem 0", fontSize: "2rem", color: item.featured ? "var(--nt-brown)" : "var(--nt-lime)", fontWeight: 950 }}>
                {item.price}<small style={{ fontSize: ".8rem" }}>{item.suffix}</small>
            </p>
            <ul style={{ padding: 0, margin: "0 0 1.2rem", listStyle: "none", display: "grid", gap: ".55rem" }}>
                {features.map((feature) => (
                    <li key={feature} style={{ display: "flex", gap: ".5rem", alignItems: "start", fontWeight: 800 }}>
                        <Icon name="check" size={16} /> {feature}
                    </li>
                ))}
            </ul>
            <button type="button" className={`nt-btn ${item.featured ? "dark" : "ghost"}`} style={{ width: "100%", background: item.featured ? "var(--nt-brown)" : "#fffdf7", color: "var(--nt-brown)" }} onClick={() => onCheckout?.(item)}>
                {item.featured ? "Berlangganan Sekarang" : "Pilih Paket"}
            </button>
        </article>
    );
}

export function WalletBalanceCard({ onCheckout }) {
    return (
        <section className="nt-card pad">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ margin: 0, color: "var(--nt-brown)", fontSize: "1.75rem", fontWeight: 950 }}>
                        <Icon name="coin" /> Saldo Saat Ini
                    </h2>
                    <p style={{ margin: ".2rem 0 1rem", color: "var(--nt-brown)", fontSize: "4rem", fontWeight: 950, lineHeight: 1 }}>
                        1.250 <span style={{ fontSize: "1rem", color: "var(--nt-gold)" }}>NusaKoin</span>
                    </p>
                </div>
                <button className="nt-btn dark" type="button">Tukarkan Kode</button>
            </div>
            <div className="nt-grid nt-grid-3">
                {coinPackages.map((pack) => <CoinPackageCard key={pack.id} item={pack} onCheckout={onCheckout} />)}
            </div>
        </section>
    );
}

export function TransactionHistory({ items = transactions }) {
    return (
        <section className="nt-card pad nt-soft">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "var(--nt-brown)", fontSize: "1.7rem", fontWeight: 950 }}>Riwayat Transaksi</h2>
                <Link to="/premium" style={{ color: "var(--nt-brown)", fontWeight: 900 }}>Lihat Semua</Link>
            </div>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                {items.map((item) => (
                    <div key={item.id} className="nt-card" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", borderRadius: "999px", boxShadow: "none" }}>
                        <span className="nt-icon-btn" style={{ background: item.tone === "plus" ? "#e4edff" : "#dff8e4", color: item.tone === "plus" ? "#2748cc" : "#2ea849" }}>
                            <Icon name="box" />
                        </span>
                        <span>
                            <strong>{item.title}</strong>
                            <small className="nt-subtle" style={{ display: "block" }}>{item.date}</small>
                        </span>
                        <strong style={{ color: item.tone === "plus" ? "#3b7b05" : "#c00017", fontSize: "1.45rem" }}>{item.amount}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function MonetizationAgreementModal({ open, onClose, onAgree }) {
    if (!open) {
        return null;
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, display: "grid", placeItems: "center", padding: "1rem" }}>
            <section className="nt-card pad" style={{ width: "min(100%, 36rem)" }}>
                <h2 className="nt-heading">Persetujuan Monetisasi</h2>
                <p style={{ lineHeight: 1.55 }}>
                    Saya menyetujui bahwa setiap pendapatan dari video/aset yang dimonetisasi akan dibagi 60% untuk kreator dan 40% untuk platform NusaTales.
                </p>
                <div style={{ display: "flex", justifyContent: "end", gap: ".8rem", flexWrap: "wrap" }}>
                    <button type="button" className="nt-btn ghost" onClick={onClose}>Batal</button>
                    <button type="button" className="nt-btn green" onClick={onAgree}>Saya Setuju 60/40</button>
                </div>
            </section>
        </div>
    );
}

export function UploadDropzone({ onFile, progress = 0 }) {
    return (
        <label className="nt-card pad" style={{ display: "grid", placeItems: "center", minHeight: "18rem", border: "2px dashed rgba(117,71,37,.35)", textAlign: "center" }}>
            <input type="file" accept="video/mp4,video/quicktime,video/x-msvideo" style={{ display: "none" }} onChange={(event) => onFile?.(event.target.files?.[0] ?? null)} />
            <Icon name="upload" size={52} />
            <h2 style={{ color: "var(--nt-brown)", margin: "1rem 0 .4rem" }}>Tarik & lepas file di sini</h2>
            <p className="nt-subtle">MP4, MOV, AVI - Maksimal 500MB</p>
            <UploadProgress progress={progress} />
        </label>
    );
}

export function UploadProgress({ progress = 0 }) {
    return (
        <div style={{ width: "100%", maxWidth: "30rem", marginTop: "1rem" }}>
            <div style={{ height: ".6rem", background: "rgba(117,71,37,.12)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: "var(--nt-lime)" }} />
            </div>
            <small className="nt-subtle">Mengunggah: {Math.min(100, progress)}%</small>
        </div>
    );
}

export function ThumbnailSelector({ images = [mockups.home, mockups.explore, mockups.shorts] }) {
    const [selected, setSelected] = useState(0);

    return (
        <div className="nt-grid nt-grid-3">
            {images.map((image, index) => (
                <button
                    type="button"
                    key={image}
                    onClick={() => setSelected(index)}
                    className="nt-thumb"
                    style={{
                        backgroundImage: `url("${image}")`,
                        height: "7rem",
                        borderRadius: "1rem",
                        border: selected === index ? "4px solid var(--nt-lime)" : "2px solid transparent",
                    }}
                    aria-label={`Pilih thumbnail ${index + 1}`}
                />
            ))}
        </div>
    );
}

export function AssetCard({ item }) {
    const image = item?.preview_url ?? item?.image ?? mockups.store;

    return (
        <article className="nt-card" style={{ overflow: "hidden" }}>
            <ImageFrame src={image} style={{ height: "16rem", position: "relative" }}>
                <button type="button" className="nt-icon-btn" style={{ position: "absolute", right: ".8rem", top: ".8rem" }} aria-label="Favorit aset">
                    <Icon name="heart" />
                </button>
                {item?.hot ? <span className="nt-pill dark" style={{ position: "absolute", left: "1rem", bottom: ".8rem", padding: ".3rem .65rem", fontSize: ".75rem" }}>HOT ITEM</span> : null}
            </ImageFrame>
            <div style={{ padding: "1.35rem" }}>
                <p style={{ margin: 0, display: "flex", gap: ".75rem", color: "var(--nt-brown)", fontWeight: 900 }}>
                    <span className="nt-pill green" style={{ padding: ".25rem .55rem", fontSize: ".7rem" }}>{item?.category ?? "ASET"}</span>
                    <span>* {item?.rating ?? "4.9"}</span>
                </p>
                <h3 style={{ margin: ".8rem 0 .5rem", fontWeight: 950 }}>{item?.title ?? "Aset NusaTales"}</h3>
                <p className="nt-subtle">{item?.description ?? "Aura kebangsawanan yang meningkatkan status petualanganmu."}</p>
                <p style={{ margin: 0, color: "var(--nt-brown)", fontWeight: 950 }}><Icon name="coin" size={18} /> {item?.price ?? `${item?.coin_price ?? 4} NusaKoin`}</p>
            </div>
        </article>
    );
}

export function ChallengeCard({ reward }) {
    return (
        <article className="nt-card pad" style={{ minHeight: "10rem" }}>
            <h3 style={{ margin: 0, color: "var(--nt-brown)", fontSize: "1.45rem", fontWeight: 950 }}>{reward.title}</h3>
            <p className="nt-subtle" style={{ lineHeight: 1.5 }}>{reward.body}</p>
            {reward.value ? <strong style={{ color: "#7c6500", fontSize: "2rem" }}>{reward.value}</strong> : null}
        </article>
    );
}

export function CulturalProgressPath({ levels = [], activeIndex = 2 }) {
    return (
        <div className="nt-card pad nt-soft">
            <div className="nt-progress-line">
                {levels.map((level, index) => (
                    <div key={level} className={`nt-progress-step ${index < activeIndex ? "done" : ""} ${index === activeIndex ? "active" : ""}`}>
                        <span className="nt-progress-dot">{index === activeIndex ? "*" : index < activeIndex ? "✓" : "□"}</span>
                        {level}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function BadgeCard({ unlocked = true }) {
    return (
        <div className="nt-card" style={{ display: "grid", placeItems: "center", minHeight: "5rem", boxShadow: "none" }}>
            {unlocked ? <Icon name="trophy" size={44} /> : "?"}
        </div>
    );
}

export function NusaAdhiPanel({ onCheckout }) {
    const plans = useMemo(() => subscriptionPlans, []);

    return (
        <aside className="nt-card pad" style={{ background: "var(--nt-brown)", color: "#fffdf7" }}>
            <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 950 }}>NusaAdhi</h2>
            <p style={{ lineHeight: 1.35 }}>Buka semua potensi petualangan budaya Anda dengan paket premium.</p>
            <div style={{ display: "grid", gap: "1rem" }}>
                {plans.map((plan) => <SubscriptionPlanCard key={plan.id} item={plan} onCheckout={onCheckout} />)}
            </div>
        </aside>
    );
}

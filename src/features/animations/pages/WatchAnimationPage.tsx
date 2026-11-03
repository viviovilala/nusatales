import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ChevronDown, Film, Layers3, Loader2, Sparkles } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import AppNavbar from "../../../components/AppNavbar";
import Footer from "../../../components/Footer";
import Reveal from "../../../components/Reveal";
import CreatorQuickView from "../../reels/components/CreatorQuickView";
import ReelAvatar from "../../reels/components/ReelAvatar";
import type { ReelCreator } from "../../reels/reelTypes";
import { catalogDate } from "../catalog/catalogTypes";
import { useViewerSuspended, useWatchAnimation } from "../watch/useWatchAnimation";
import AnimationPlayer from "../watch/AnimationPlayer";
import AnimationActions from "../watch/AnimationActions";
import AnimationDiscussion from "../watch/AnimationDiscussion";
import WatchSidebar from "../watch/WatchSidebar";
import { episodeLabel } from "../animationTypes";
import "../../reels/reels.css";
import "../watch/watch.css";

export default function WatchAnimationPage() {
    const { videoId } = useParams();
    return <WatchWorkspace key={videoId || "missing"} videoId={videoId || ""} />;
}

function WatchWorkspace({ videoId }: { videoId: string }) {
    const navigate = useNavigate();
    const { video, loading, error, refreshError, retry } = useWatchAnimation(videoId);
    const suspended = useViewerSuspended();
    const [creator, setCreator] = useState<ReelCreator | null>(null), [expanded, setExpanded] = useState(false);
    return <div className="site-page watch-page animation-watch-page">
        <AppNavbar />
        <main id="main-content" className="animation-watch-main" tabIndex={-1}>
            <nav className="watch-breadcrumb" aria-label="Lokasi menonton"><AppLink to="/animations"><ArrowLeft size={14} />Jelajah animasi</AppLink><span>/</span><span>Ruang menonton</span></nav>
            {refreshError && <p role="status" className="watch-related-state">Status tayangan belum berhasil diperbarui. <button type="button" onClick={retry}>Coba lagi</button></p>}
            {loading ? <div className="watch-workspace-loading" role="status"><div><Loader2 size={28} className="ui-spinner" />Menyiapkan ruang menonton...</div><aside /></div>
                : error || !video ? <section className="watch-unavailable" role="alert"><Film size={36} strokeWidth={1.3} /><h1>Animasi belum bisa ditonton.</h1><p>{error || "Tayangan ini belum tersedia."}</p><div><button type="button" onClick={retry}>Coba lagi</button><AppLink to="/animations">Kembali ke Jelajah <ArrowUpRight size={14} /></AppLink></div></section>
                    : <div className="watch-layout">
                        <div className="watch-viewing-note"><Sparkles size={15} /><span>Ruang untuk menikmati cerita dan mengenal budaya.</span><a href="#watch-episodes-title"><Layers3 size={13} />Episode</a></div>
                        <AnimationPlayer video={video} suspended={suspended || Boolean(creator)} />
                        <Reveal className="watch-summary watch-panel"><div className="watch-summary-heading"><span className="watch-kicker">{video.animation.title} · {episodeLabel(video.current, video.animation.format)}</span>{catalogDate(video.publishedAt) && <time dateTime={video.publishedAt || undefined}>{catalogDate(video.publishedAt)}</time>}</div><h1>{video.title}</h1>
                            <div className="watch-title-metadata">{video.animation.genres.map((genre) => <span key={genre}>{genre}</span>)}<span>{video.animation.age_guidance === "all" ? "Semua umur" : video.animation.age_guidance}</span><span>{video.animation.language}</span>{video.animation.release_year && <span>{video.animation.release_year}</span>}<span>{video.animation.story_status === "completed" ? "Tamat" : "Berlanjut"}</span>{video.animation.origin_region && <span>{video.animation.origin_region}</span>}{video.animation.cultures.map((culture) => <span key={culture}>{culture}</span>)}</div>
                            <AnimationActions video={video} />
                            <div className="watch-creator-row"><button type="button" className="watch-creator" onClick={() => setCreator(video.creator)}><ReelAvatar creator={video.creator} /><span><strong>{video.creator.displayName}</strong>{video.creator.username && <small>@{video.creator.username}</small>}</span></button><button type="button" className="watch-profile-button" onClick={() => setCreator(video.creator)}>Profil kreator <ArrowUpRight size={12} /></button></div>
                            <div className="watch-synopsis"><h2>Tentang animasi</h2><p className={expanded ? "is-expanded" : ""}>{video.animation.synopsis || "Kreator belum menambahkan sinopsis untuk animasi ini."}</p>{video.animation.synopsis && video.animation.synopsis.length > 220 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}<ChevronDown size={13} /></button>}{video.animation.format === "series" && video.description && <><h2>Tentang episode ini</h2><p>{video.description}</p></>}</div>
                        </Reveal>
                        <WatchSidebar video={video} />
                        <AnimationDiscussion videoId={video.id} onCreator={setCreator} />
                    </div>}
        </main>
        <Footer />
        <CreatorQuickView creator={creator} open={Boolean(creator)} onClose={() => setCreator(null)} onReel={(id) => { setCreator(null); navigate(`/reels/${id}`); }} />
    </div>;
}

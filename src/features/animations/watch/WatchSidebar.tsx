import { useEffect, useState } from "react";
import { ArrowRight, Film, Layers3, Play } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { videoRepository } from "../../videos/videoRepository";
import { catalogDuration } from "../catalog/catalogTypes";
import type { CatalogVideo } from "../catalog/catalogTypes";
import type { WatchAnimation } from "./watchTypes";
import { episodeLabel } from "../animationTypes";

export function WatchCover({ path }: { path: string | null }) {
    const image = useStorageImageUrl(path); const [failed, setFailed] = useState<string | null>(null);
    return <span className="watch-cover">{image && image !== failed ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <Film size={22} strokeWidth={1.3} />}</span>;
}
export default function WatchSidebar({ video }: { video: WatchAnimation }) {
    const [works, setWorks] = useState<CatalogVideo[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const [season, setSeason] = useState(video.current.season_number);
    const seasons = [...new Set(video.episodes.map((episode) => episode.season_number))];
    const currentIndex = video.episodes.findIndex((episode) => episode.video_id === video.id);
    const next = currentIndex >= 0 ? video.episodes[currentIndex + 1] : undefined;
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setLoading(true); setError("");
        async function load() {
            try {
                const response = await videoRepository.getAnimationCatalog({ limit: 7, signal: controller.signal });
                if (!active) return;
                if (response.error) throw response.error;
                setWorks(response.data.filter((item) => item.contentType === "animation" && item.id !== video.animation.id).slice(0, 6) as CatalogVideo[]);
            } catch { if (active) setError("Animasi lain belum berhasil dimuat."); }
            finally { if (active) setLoading(false); }
        }
        void load();
        return () => { active = false; controller.abort(); };
    }, [video.id, revision]);
    return <aside className="watch-sidebar" aria-label="Episode dan animasi lain">
        <section className="watch-episodes watch-panel" aria-labelledby="watch-episodes-title"><header><h2 id="watch-episodes-title"><Layers3 size={17} />Daftar episode</h2></header>
            <div className="watch-current-title"><WatchCover path={video.animation.poster_path || video.thumbnailPath} /><div><small>{video.animation.format === "series" ? "SERIAL ANIMASI" : "FILM ANIMASI"}</small><strong>{video.animation.title}</strong><span><Play size={10} fill="currentColor" />{video.episodes.length} {video.animation.format === "series" ? "episode terbit" : "tayangan"}</span></div></div>
            {video.animation.format === "series" && seasons.length > 1 && <label className="watch-season-label">Musim<select aria-label="Musim tayangan" value={season} onChange={(event) => setSeason(Number(event.target.value))}>{seasons.map((number) => <option value={number} key={number}>Musim {number}</option>)}</select></label>}
            <div className="watch-episode-list">{video.episodes.filter((episode) => episode.season_number === season).map((episode) => <AppLink key={episode.video_id} to={`/watch/${episode.video_id}`} className="watch-episode-link" aria-current={episode.video_id === video.id ? "page" : undefined}>
                <WatchCover path={episode.video.thumbnail_path} /><span><small>{episodeLabel(episode, video.animation.format)}</small><strong>{episode.video.title}</strong><em>{episode.video_id === video.id ? "Sedang ditonton" : episode.video.duration_seconds ? catalogDuration(episode.video.duration_seconds) : "Tonton"}</em></span></AppLink>)}</div>
            {next && <AppLink to={`/watch/${next.video_id}`} className="watch-next-episode">Episode berikutnya <ArrowRight size={14} /></AppLink>}
            <AppLink to="/animations" className="watch-sidebar-link">Jelajah animasi <ArrowRight size={14} /></AppLink>
        </section>
        <section className="watch-related" aria-labelledby="watch-related-title"><header><h2 id="watch-related-title">Animasi lain untukmu</h2><AppLink to="/animations" aria-label="Lihat koleksi animasi"><ArrowRight size={16} /></AppLink></header>
            {loading ? <div className="watch-related-skeletons" role="status" aria-label="Memuat animasi lain">{[0, 1, 2].map((value) => <span key={value} />)}</div>
                : error ? <div className="watch-related-state"><p role="alert">{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Coba lagi</button></div>
                    : !works.length ? <p className="watch-related-state">Belum ada animasi lain untuk ditampilkan.</p>
                        : <div className="watch-related-list">{works.map((work) => <AppLink key={work.id} to={`/watch/${work.watchVideoId}`} className="watch-related-card"><WatchCover path={work.thumbnailPath} /><span><strong>{work.title}</strong><small>{work.creator.displayName}</small><em>{work.format === "series" ? `${work.episodeCount} episode` : "Film animasi"}</em></span></AppLink>)}</div>}
        </section>
    </aside>;
}

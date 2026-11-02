import { useEffect, useState } from "react";
import { ArrowRight, Film, Layers3, Play } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { videoRepository } from "../../videos/videoRepository";
import { catalogDuration } from "../catalog/catalogTypes";
import type { CatalogVideo } from "../catalog/catalogTypes";
import type { WatchAnimation } from "./watchTypes";

export function WatchCover({ path }: { path: string | null }) {
    const image = useStorageImageUrl(path); const [failed, setFailed] = useState<string | null>(null);
    return <span className="watch-cover">{image && image !== failed ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <Film size={22} strokeWidth={1.3} />}</span>;
}
export default function WatchSidebar({ video }: { video: WatchAnimation }) {
    const [works, setWorks] = useState<CatalogVideo[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setLoading(true); setError("");
        async function load() {
            try {
                const response = await videoRepository.getAnimationCatalog({ limit: 7, signal: controller.signal });
                if (!active) return;
                if (response.error) throw response.error;
                setWorks(response.data.filter((item) => item.contentType === "animation" && item.id !== video.id).slice(0, 6) as CatalogVideo[]);
            } catch { if (active) setError("Animasi lain belum berhasil dimuat."); }
            finally { if (active) setLoading(false); }
        }
        void load();
        return () => { active = false; controller.abort(); };
    }, [video.id, revision]);
    return <aside className="watch-sidebar" aria-label="Episode dan animasi lain">
        <section className="watch-episodes watch-panel" aria-labelledby="watch-episodes-title"><header><h2 id="watch-episodes-title"><Layers3 size={17} />Daftar episode</h2></header>
            <div className="watch-current-title"><WatchCover path={video.thumbnailPath} /><div><small>TAYANGAN SAAT INI</small><strong>{video.title}</strong><span><Play size={10} fill="currentColor" />{video.durationSeconds ? catalogDuration(video.durationSeconds) : "Animasi"}</span></div></div>
            <div className="watch-episodes-empty"><Layers3 size={23} strokeWidth={1.3} /><strong>Episode belum tersedia.</strong><p>Daftar episode untuk animasi ini akan tampil di sini saat tersedia.</p></div>
            <AppLink to="/animations" className="watch-sidebar-link">Jelajah animasi <ArrowRight size={14} /></AppLink>
        </section>
        <section className="watch-related" aria-labelledby="watch-related-title"><header><h2 id="watch-related-title">Animasi lain untukmu</h2><AppLink to="/animations" aria-label="Lihat koleksi animasi"><ArrowRight size={16} /></AppLink></header>
            {loading ? <div className="watch-related-skeletons" role="status" aria-label="Memuat animasi lain">{[0, 1, 2].map((value) => <span key={value} />)}</div>
                : error ? <div className="watch-related-state"><p role="alert">{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Coba lagi</button></div>
                    : !works.length ? <p className="watch-related-state">Belum ada animasi lain untuk ditampilkan.</p>
                        : <div className="watch-related-list">{works.map((work) => <AppLink key={work.id} to={`/watch/${work.id}`} className="watch-related-card"><WatchCover path={work.thumbnailPath} /><span><strong>{work.title}</strong><small>{work.creator.displayName}</small><em>{work.durationSeconds ? catalogDuration(work.durationSeconds) : "Animasi"}</em></span></AppLink>)}</div>}
        </section>
    </aside>;
}

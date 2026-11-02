import { useState } from "react";
import { ArrowUpRight, Film, Play } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { catalogDate, catalogDuration, isNewPublication } from "./catalogTypes";
import type { CatalogVideo } from "./catalogTypes";

export default function CatalogCard({ video, onCreator }: { video: CatalogVideo; onCreator: (creator: CatalogVideo["creator"]) => void }) {
    const image = useStorageImageUrl(video.thumbnailPath);
    const [failed, setFailed] = useState<string | null>(null);
    return <article className="catalog-card" aria-label={`Animasi ${video.title}`}>
        <AppLink to={`/watch/${video.watchVideoId}`} className="catalog-poster" aria-label={`Tonton ${video.title}`}>
            {image && failed !== image ? <img src={image} alt="" loading="lazy" onError={() => setFailed(image)} /> : <div className="catalog-poster-placeholder"><Film size={38} strokeWidth={1.2} /><span>Animasi</span></div>}
            {isNewPublication(video.publishedAt) && <span className="catalog-new">Baru tayang</span>}
            <span className="catalog-poster-shade" /><span className="catalog-play"><Play size={24} fill="currentColor" /></span>
            {video.durationSeconds != null && video.durationSeconds > 0 && <span className="catalog-duration">{catalogDuration(video.durationSeconds)}</span>}
        </AppLink>
        <div className="catalog-card-info"><div className="catalog-card-meta"><span>{video.format === "series" ? `Serial · ${video.episodeCount} episode` : "Film animasi"}</span>{catalogDate(video.publishedAt) && <time dateTime={video.publishedAt || undefined}>{catalogDate(video.publishedAt)}</time>}</div>
            <h3><AppLink to={`/watch/${video.watchVideoId}`}>{video.title}</AppLink></h3>
            {video.genres.length > 0 && <p className="catalog-card-genres">{video.genres.join(" · ")}</p>}
            <button type="button" className="catalog-card-creator" onClick={() => onCreator(video.creator)}><span>{video.creator.displayName}</span><ArrowUpRight size={12} /></button>
        </div>
    </article>;
}

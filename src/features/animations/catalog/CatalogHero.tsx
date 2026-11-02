import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Play, Sparkles } from "lucide-react";
import { AppLink } from "../../../app/ModalContext";
import Reveal from "../../../components/Reveal";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { videoRepository } from "../../videos/videoRepository";
import type { CatalogVideo } from "./catalogTypes";

export default function CatalogHero({ onCreator }: { onCreator: (creator: CatalogVideo["creator"]) => void }) {
    const [stories, setStories] = useState<CatalogVideo[]>([]);
    const [index, setIndex] = useState(0);
    const [revision, setRevision] = useState(0);
    const active = stories[index] || stories[0];
    const cover = useStorageImageUrl(active?.thumbnailPath);
    const avatar = useStorageImageUrl(active?.creator.avatarPath);
    const [failedCover, setFailedCover] = useState<string | null>(null);
    const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
    useEffect(() => {
        let current = true;
        const controller = new AbortController();
        async function load() {
            try {
                const result = await videoRepository.getAnimationCatalog({ limit: 3, signal: controller.signal });
                if (!current) return;
                setStories(result.error ? [] : result.data as CatalogVideo[]); setIndex(0);
            } catch { if (current) setStories([]); }
        }
        void load();
        return () => { current = false; controller.abort(); };
    }, [revision]);
    useEffect(() => {
        const refresh = () => setRevision((value) => value + 1);
        window.addEventListener("nusatales:videos-changed", refresh);
        return () => window.removeEventListener("nusatales:videos-changed", refresh);
    }, []);
    function move(delta: number) { setIndex((value) => (value + delta + stories.length) % stories.length); }
    return <Reveal as="section" className="catalog-hero" aria-label="Cerita pilihan">
        {active ? cover && failedCover !== cover ? <img key={cover} className="catalog-hero-art" src={cover} alt="" onError={() => setFailedCover(cover)} /> : <div className="catalog-hero-no-cover"><Film size={80} strokeWidth={1} /></div>
            : <img className="catalog-hero-art" src="/poto/hero-roro-closeup.webp" alt="" />}
        <div className="catalog-hero-shade" />
        <div className="catalog-hero-copy">
            <span className="catalog-hero-badge"><Sparkles size={12} />{active ? "CERITA PILIHAN" : "JELAJAH NUSATALES"}</span>
            {active && <button type="button" className="catalog-hero-creator" onClick={() => onCreator(active.creator)}>
                <span>{avatar && failedAvatar !== avatar ? <img src={avatar} alt="" onError={() => setFailedAvatar(avatar)} /> : active.creator.displayName.charAt(0).toUpperCase()}</span>{active.creator.displayName}
            </button>}
            <h1>{active?.title || "Selalu ada kisah untukmu."}</h1>
            <p>{active?.description || (active ? "Kenali pesan dan budaya di balik cerita. Nikmati karya animasi dari kreator Nusantara." : "Temukan legenda, petualangan, dan cerita yang membawa budaya Nusantara lebih dekat.")}</p>
            {active ? <AppLink to={`/watch/${active.id}`} className="nusa-button"><Play size={15} fill="currentColor" />Tonton sekarang</AppLink>
                : <a href="#koleksi" className="nusa-button">Jelajahi koleksi <ChevronRight size={16} /></a>}
        </div>
        {stories.length > 1 && <div className="catalog-carousel" role="group" aria-label="Navigasi cerita pilihan">
            <button type="button" aria-label="Cerita pilihan sebelumnya" onClick={() => move(-1)}><ChevronLeft size={19} /></button>
            <div>{stories.map((story, number) => <button key={story.id} type="button" aria-label={`Cerita pilihan ${number + 1}: ${story.title}`} aria-pressed={index === number} onClick={() => setIndex(number)}><span /></button>)}</div>
            <button type="button" aria-label="Cerita pilihan berikutnya" onClick={() => move(1)}><ChevronRight size={19} /></button>
        </div>}
    </Reveal>;
}

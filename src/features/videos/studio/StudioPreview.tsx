import { useEffect, useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { Button, Notice } from "../../../components/ui/form";
import { useStorageImageUrl } from "../../../components/StorageImage";
import { videoRepository } from "../videoRepository";
import StudioDialog from "./StudioDialog";
import type { StudioVideo } from "./studioTypes";

export default function StudioPreview({ video, onClose }: { video: StudioVideo; onClose: () => void }) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const poster = useStorageImageUrl(video.thumbnail_path);
    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setUrl(null);
        async function resolve() {
            try {
                if (!video.storage_path) throw new Error("Berkas video belum tersedia. Selesaikan unggahan terlebih dahulu.");
                const signed = await videoRepository.getMediaSignedUrl(video.storage_path);
                if (!signed) throw new Error("Video belum berhasil dimuat. Coba muat ulang preview.");
                if (active) setUrl(signed);
            } catch (error) { if (active) setError(error instanceof Error ? error.message : "Video belum berhasil dimuat."); }
            finally { if (active) setLoading(false); }
        }
        void resolve();
        return () => { active = false; };
    }, [video.id, video.storage_path, revision]);
    return <StudioDialog title="Preview karya" description={video.status === "draft" ? "Preview pribadi. Karya ini belum dipublikasikan." : "Periksa video dan informasi karyamu sebelum membagikannya."} onClose={onClose} wide>
        <div className={`studio-preview-media ${video.content_type === "reel" ? "is-portrait" : ""}`}>
            {loading ? <div role="status"><Loader2 className="ui-spinner" size={24} />Menyiapkan preview...</div> : url && !error
                ? <video key={url} src={url} poster={poster || undefined} controls playsInline preload="metadata" aria-label={`Preview ${video.title}`} onError={() => setError("Video tidak bisa diputar. Coba muat ulang preview.")} /> : <Film size={34} />}
        </div>
        {error && <div className="studio-preview-error"><Notice>{error}</Notice>{video.storage_path && <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Muat ulang preview</Button>}</div>}
        <div className="studio-preview-copy"><span className="studio-eyebrow">{video.content_type === "animation" ? "FILM ANIMASI" : "SHORTS"}</span><h3>{video.title}</h3><p>{video.description || "Belum ada deskripsi untuk karya ini."}</p></div>
    </StudioDialog>;
}

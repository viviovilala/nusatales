import React, { useEffect, useState } from "react";
import { ArrowUpRight, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { profileRepository } from "../../profile/profileRepository";
import { videoRepository } from "../../videos/videoRepository";
import StorageImage from "../../../components/StorageImage";
import { Button, Notice } from "../../../components/ui/form";
import ReelsDialog from "./ReelsDialog";
import ReelAvatar from "./ReelAvatar";
import type { ReelCreator } from "../reelTypes";
import { useContentUpdates } from "../../../lib/contentSync";

type PublicWork = { id: string; title: string; content_type: string; thumbnail_path: string | null };
export default function CreatorQuickView({ creator, open, onClose, onReel }: {
    creator: ReelCreator | null; open: boolean; onClose: () => void; onReel: (id: string) => void;
}) {
    const [bio, setBio] = useState("");
    const [works, setWorks] = useState<PublicWork[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    useContentUpdates(() => { if (open) setRevision((value) => value + 1); });
    useEffect(() => {
        if (!open || !creator) return;
        let current = true;
        setLoading(true);
        setError("");
        setBio("");
        setWorks([]);
        async function load() {
            try {
                const result = creator?.id ? await profileRepository.getProfile(creator.id) : creator?.username ? await profileRepository.getProfileByUsername(creator.username) : null;
                if (!current) return;
                if (result?.error) throw result.error;
                setBio(result?.data?.bio || "");
                const id = result?.data?.id || creator?.id;
                if (id) {
                    const videos = await videoRepository.getCreatorPublishedVideos(id);
                    if (!current) return;
                    if (videos.error) throw videos.error;
                    setWorks(videos.data as PublicWork[]);
                }
            } catch { if (current) setError("Profil kreator belum berhasil dimuat."); }
            finally { if (current) setLoading(false); }
        }
        load();
        return () => { current = false; };
    }, [creator?.id, creator?.username, open, revision]);

    return <ReelsDialog open={open} title="Profil kreator" onClose={onClose}>
        <div className="reels-creator-profile">
            {creator && <><ReelAvatar creator={creator} /><h3>{creator.displayName}</h3>{creator.username && <span>@{creator.username}</span>}</>}
            {bio && <p>{bio}</p>}
            <Notice>{error}</Notice>
            {error && <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Coba lagi</Button>}
            <div className="reels-creator-works-heading"><h4>Karya yang dipublikasikan</h4>{!loading && !error && <span>{works.length} karya</span>}</div>
            {loading ? <p role="status" className="ui-hint">Memuat karya...</p> : <div className="reels-creator-works">
                {works.map((work) => work.content_type === "reel" ? <button type="button" key={work.id} onClick={() => onReel(work.id)}>
                    <StorageImage path={work.thumbnail_path} alt="" /><span>{work.title}</span><small>Shorts <ArrowUpRight size={12} /></small>
                </button> : <Link key={work.id} to={`/watch/${work.id}`}>
                    <StorageImage path={work.thumbnail_path} alt="" /><span>{work.title}</span><small>Film animasi <ArrowUpRight size={12} /></small>
                </Link>)}
                {!works.length && !error && <div className="reels-creator-no-work"><Film size={22} /><p>Belum ada karya yang bisa ditampilkan.</p></div>}
            </div>}
        </div>
    </ReelsDialog>;
}

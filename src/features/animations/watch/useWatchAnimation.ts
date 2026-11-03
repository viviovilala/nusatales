import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppModal } from "../../../app/ModalContext";
import { videoRepository } from "../../videos/videoRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import type { WatchAnimation } from "./watchTypes";
import { animationRepository } from "../animationRepository";
import { useContentUpdates } from "../../../lib/contentSync";
type CreatorRow = { id?: string; username?: string | null; display_name?: string | null; avatar_path?: string | null };

export function useWatchAnimation(videoId: string) {
    const navigate = useNavigate();
    const [video, setVideo] = useState<WatchAnimation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const loaded = useRef(false);
    const loadedId = useRef(videoId);
    const [refreshError, setRefreshError] = useState("");
    useContentUpdates(() => setRevision((value) => value + 1));
    useEffect(() => {
        let active = true;
        if (loadedId.current !== videoId) { loadedId.current = videoId; loaded.current = false; setVideo(null); }
        if (!loaded.current) { setLoading(true); setError(""); }
        setRefreshError("");
        async function load() {
            try {
                const result = await videoRepository.getVideoById(videoId);
                if (!active) return;
                if (result.error) throw result.error;
                const data = result.data;
                if (!data || data.status !== "published" || data.publicly_available === false) {
                    loaded.current = false; setVideo(null);
                    throw new Error("Animasi ini belum tersedia untuk ditonton.");
                }
                if (data.content_type === "reel") { navigate(`/reels/${videoId}`, { replace: true }); return; }
                if (data.content_type !== "animation") throw new Error("Tayangan ini bukan bagian dari koleksi animasi.");
                let context;
                try { context = await animationRepository.context(videoId); }
                catch (cause) {
                    // Context can become inaccessible after an unpublish. The
                    // repository's explicit unavailable errors stop playback.
                    if (active && cause instanceof Error && /belum|tidak ditemukan/.test(cause.message)) { loaded.current = false; setVideo(null); }
                    throw cause;
                }
                if (!active) return;
                // The JS repository has no generated database schema types;
                // normalize the joined relation at this typed API boundary.
                const relation = data.creator as unknown as CreatorRow | CreatorRow[] | null;
                const creator = Array.isArray(relation) ? relation[0] : relation;
                setVideo({ id: data.id, title: data.title, description: data.description, storagePath: data.storage_path,
                    thumbnailPath: data.thumbnail_path, durationSeconds: data.duration_seconds, publishedAt: data.published_at,
                    animation: context.animation, episodes: context.episodes, current: context.current,
                    creator: { id: creator?.id || data.creator_id, username: creator?.username,
                        displayName: creator?.display_name || "Kreator NusaTales", avatarPath: creator?.avatar_path } });
                loaded.current = true; setError("");
            } catch (error) { if (active) {
                const message = normalizeSupabaseError(error, "Animasi belum berhasil dimuat.") || "Animasi belum berhasil dimuat.";
                if (loaded.current) setRefreshError(message); else setError(message);
            } }
            finally { if (active) setLoading(false); }
        }
        void load();
        return () => { active = false; };
    }, [videoId, revision, navigate]);
    return { video, loading, error, refreshError, retry: () => setRevision((value) => value + 1) };
}

export function useViewerSuspended() {
    const modal = useAppModal();
    const [blocked, setBlocked] = useState(false);
    useEffect(() => {
        const update = () => setBlocked(document.hidden || Boolean(document.querySelector('dialog[open], .nusa-sheet-content[data-state="open"], .nusa-plan-dialog[data-state="open"]')));
        const observer = new MutationObserver(update);
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "data-state"] });
        document.addEventListener("visibilitychange", update); update();
        return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
    }, []);
    return Boolean(modal?.isOpen || blocked);
}

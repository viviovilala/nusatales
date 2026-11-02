import { useCallback, useEffect, useRef, useState } from "react";
import { videoRepository } from "../videoRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import type { StudioAction, StudioChange, StudioVideo } from "./studioTypes";

/** A workspace is keyed by account. Ignore obsolete requests and serialize writes. */
export function useStudioWorks(userId: string) {
    const [videos, setVideos] = useState<StudioVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [pending, setPending] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const active = useRef(false);
    const request = useRef(0);
    const pendingRef = useRef<string | null>(null);
    const deferredRefresh = useRef(false);

    const load = useCallback(async (initial = false) => {
        if (pendingRef.current) { deferredRefresh.current = true; return; }
        const version = ++request.current;
        if (initial) setLoading(true);
        else setRefreshing(true);
        setLoadError("");
        try {
            const result = await videoRepository.getMyStudioVideos(userId);
            if (!active.current || version !== request.current) return;
            if (result.error) throw result.error;
            setVideos(result.data as StudioVideo[]);
            setLoaded(true);
        } catch (error) {
            if (active.current && version === request.current) setLoadError(normalizeSupabaseError(error, "Karya belum berhasil dimuat.") || "Karya belum berhasil dimuat.");
        } finally {
            if (active.current && version === request.current) { setLoading(false); setRefreshing(false); }
        }
    }, [userId]);

    useEffect(() => {
        active.current = true;
        void load(true);
        const refresh = () => { void load(); };
        window.addEventListener("nusatales:videos-changed", refresh);
        return () => { active.current = false; request.current++; window.removeEventListener("nusatales:videos-changed", refresh); };
    }, [load]);

    async function mutate(video: StudioVideo, action: StudioAction): Promise<string | null> {
        if (pendingRef.current) return "Tunggu sampai perubahan sebelumnya selesai.";
        pendingRef.current = video.id;
        request.current++;
        setRefreshing(false);
        setPending(video.id);
        setMessage("");
        try {
            const result = action === "publish" ? await videoRepository.publishVideo(video.id)
                : action === "unpublish" ? await videoRepository.unpublishVideo(video.id) : await videoRepository.softDeleteVideo(video.id);
            if (result.error) throw result.error;
            if (!active.current) return null;
            const status = action === "publish" ? "published" : "draft";
            setVideos((items) => action === "delete" ? items.filter((item) => item.id !== video.id)
                : items.map((item) => item.id === video.id ? { ...item, status, published_at: action === "publish" ? new Date().toISOString() : null } : item));
            setMessage(action === "delete" ? `“${video.title}” berhasil dihapus.` : action === "publish" ? `“${video.title}” sudah dipublikasikan.` : `“${video.title}” dikembalikan ke draf.`);
            const detail: StudioChange = action === "delete" ? { id: video.id, deleted: true } : { id: video.id, status };
            window.dispatchEvent(new CustomEvent<StudioChange>("nusatales:videos-changed", { detail }));
            return null;
        } catch (error) {
            return normalizeSupabaseError(error, "Perubahan belum berhasil disimpan. Coba lagi.") || "Perubahan belum berhasil disimpan.";
        } finally {
            pendingRef.current = null;
            if (active.current) {
                setPending(null);
                if (deferredRefresh.current) { deferredRefresh.current = false; void load(); }
            }
        }
    }
    return { videos, loading, refreshing, loaded, loadError, pending, message, load, mutate };
}

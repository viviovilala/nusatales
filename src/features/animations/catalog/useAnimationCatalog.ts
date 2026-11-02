import { useCallback, useEffect, useState } from "react";
import { videoRepository } from "../../videos/videoRepository";
import { normalizeSupabaseError } from "../../../lib/errors";
import { CATALOG_PAGE_SIZE, catalogParams } from "./catalogTypes";
import type { CatalogQuery, CatalogVideo } from "./catalogTypes";

type Result = { key: string; videos: CatalogVideo[]; count: number; loading: boolean; error: string };
export function useAnimationCatalog(query: CatalogQuery) {
    const key = catalogParams(query).toString();
    const [revision, setRevision] = useState(0);
    const retry = useCallback(() => setRevision((value) => value + 1), []);
    const [result, setResult] = useState<Result>({ key: "", videos: [], count: 0, loading: true, error: "" });
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setResult({ key, videos: [], count: 0, loading: true, error: "" });
        async function load() {
            try {
                const response = await videoRepository.getAnimationCatalog({ limit: CATALOG_PAGE_SIZE, offset: (query.page - 1) * CATALOG_PAGE_SIZE,
                    search: query.search, duration: query.duration, sort: query.sort, genre: query.genre, signal: controller.signal });
                if (!active) return;
                if (response.error) throw response.error;
                // Duplicate IDs cannot create duplicate links even if a server
                // response is inconsistent during concurrent publications.
                const seen = new Set<string>();
                const videos = (response.data as CatalogVideo[]).filter((video) => { if (seen.has(video.id)) return false; seen.add(video.id); return true; });
                setResult({ key, videos, count: response.count, loading: false, error: "" });
            } catch (error) {
                if (active) setResult({ key, videos: [], count: 0, loading: false, error: normalizeSupabaseError(error, "Koleksi belum berhasil dimuat.") || "Koleksi belum berhasil dimuat." });
            }
        }
        void load();
        return () => { active = false; controller.abort(); };
    }, [key, revision]);
    useEffect(() => {
        window.addEventListener("nusatales:videos-changed", retry);
        return () => window.removeEventListener("nusatales:videos-changed", retry);
    }, [retry]);
    // A URL change must never show the previous query's cards/count under a
    // new heading, including the render before the request effect starts.
    return result.key === key ? { ...result, retry } : { key, videos: [], count: 0, loading: true, error: "", retry };
}

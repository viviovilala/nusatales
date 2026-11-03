import { useCallback, useEffect, useRef, useState } from "react";
import { reelsRepository } from "./reelsRepository";
import type { ReelVideo } from "./reelTypes";
import { useContentUpdates } from "../../lib/contentSync";

const PAGE_SIZE = 10;

export function useReelsFeed(videoId?: string) {
    const [videos, setVideos] = useState<ReelVideo[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState("");
    const [moreError, setMoreError] = useState("");
    const [notice, setNotice] = useState("");
    const [animationId, setAnimationId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const generation = useRef(0);
    const offset = useRef(0);
    const loadingMore = useRef(false);
    const advanceAfterLoad = useRef<number | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshing = useRef(false), refreshed = useRef(0), loadedRoute = useRef<string | null>(null);
    const latest = useRef({ videos, activeIndex }); latest.current = { videos, activeIndex };
    useContentUpdates(() => { if (error) setRevision((value) => value + 1); else setRefreshTick((value) => value + 1); });

    useEffect(() => {
        const request = ++generation.current;
        const current = () => request === generation.current;
        offset.current = 0;
        loadingMore.current = false;
        advanceAfterLoad.current = null;
        loadedRoute.current = null; refreshing.current = false; setIsRefreshing(false);
        setHasMore(false);
        setIsLoading(true);
        setIsLoadingMore(false);
        setVideos([]);
        setActiveIndex(0);
        setError("");
        setMoreError("");
        setNotice("");
        setAnimationId(null);

        async function load() {
            try {
                let first: ReelVideo[] = [];
                if (videoId) {
                    const result = await reelsRepository.getPublishedVideoById(videoId);
                    if (!current()) return;
                    if (result.error) throw result.error;
                    if (result.data?.contentType === "animation") {
                        setAnimationId(result.data.id);
                        return;
                    }
                    if (result.data) first = [result.data];
                    else setNotice("Reel ini tidak tersedia. Kamu tetap bisa menjelajahi cerita lainnya.");
                }
                const result = await reelsRepository.getFeedVideos({ limit: PAGE_SIZE, offset: 0 });
                if (!current()) return;
                if (result.error) throw result.error;
                const records: ReelVideo[] = result.data || [];
                const seen = new Set(first.map((video) => video.id));
                setVideos([...first, ...records.filter((video) => {
                    if (seen.has(video.id)) return false;
                    seen.add(video.id);
                    return true;
                })]);
                offset.current = records.length;
                setHasMore(records.length === PAGE_SIZE);
                loadedRoute.current = videoId || "";
            } catch {
                if (current()) setError("Shorts belum berhasil dimuat. Periksa koneksimu dan coba lagi.");
            } finally {
                if (current()) setIsLoading(false);
            }
        }
        load();
        return () => { generation.current++; };
    }, [videoId, revision]);

    const loadMore = useCallback(async () => {
        if (loadingMore.current || refreshing.current || !hasMore || isLoading) return false;
        const request = generation.current;
        loadingMore.current = true;
        setIsLoadingMore(true);
        setMoreError("");
        try {
            const result = await reelsRepository.getFeedVideos({ limit: PAGE_SIZE, offset: offset.current });
            if (request !== generation.current) return false;
            if (result.error) throw result.error;
            const records: ReelVideo[] = result.data || [];
            offset.current += records.length;
            setHasMore(records.length === PAGE_SIZE);
            setVideos((previous) => {
                const seen = new Set(previous.map((video) => video.id));
                return [...previous, ...records.filter((video) => {
                    if (seen.has(video.id)) return false;
                    seen.add(video.id);
                    return true;
                })];
            });
            return records.length > 0;
        } catch {
            if (request === generation.current) setMoreError("Cerita berikutnya belum berhasil dimuat.");
            return false;
        } finally {
            if (request === generation.current) {
                loadingMore.current = false;
                setIsLoadingMore(false);
            }
        }
    }, [hasMore, isLoading]);

    // Background changes replace the loaded page, but keep the same mounted
    // player by ID and verify a deep-linked/current clip before retaining it.
    useEffect(() => {
        if (refreshTick === refreshed.current || isLoading || isLoadingMore || loadedRoute.current !== (videoId || "")) return;
        refreshed.current = refreshTick;
        const version = ++generation.current;
        let active = true;
        refreshing.current = true; setIsRefreshing(true);
        async function refresh() {
            try {
                const limit = Math.max(PAGE_SIZE, offset.current);
                const result = await reelsRepository.getFeedVideos({ limit, offset: 0 });
                if (!active || version !== generation.current) return;
                if (result.error) throw result.error;
                const records = (result.data || []) as ReelVideo[];
                const next = [...records];
                const current = latest.current.videos[latest.current.activeIndex];
                if (current && !next.some((item) => item.id === current.id)) {
                    const check = await reelsRepository.getPublishedVideoById(current.id);
                    if (!active || version !== generation.current) return;
                    if (check.error) throw check.error;
                    if (latest.current.videos[latest.current.activeIndex]?.id !== current.id) { setRefreshTick((value) => value + 1); return; }
                    if (check.data?.contentType === "reel") next.push(check.data as ReelVideo);
                }
                const unique = [...new Map(next.map((item) => [item.id, item])).values()];
                const index = unique.findIndex((item) => item.id === current?.id);
                setVideos(unique);
                setActiveIndex(index >= 0 ? index : Math.min(latest.current.activeIndex, Math.max(0, unique.length - 1)));
                if (current && index < 0) setNotice("Reel ini tidak lagi tersedia untuk publik.");
                offset.current = records.length;
                setHasMore(records.length === limit);
                setMoreError("");
            } catch { if (active) setNotice("Daftar Shorts belum berhasil diperbarui. Coba lagi saat koneksi pulih."); }
            finally { if (active && version === generation.current) { refreshing.current = false; setIsRefreshing(false); } }
        }
        void refresh();
        return () => { active = false; refreshing.current = false; };
    }, [refreshTick, isLoading, isLoadingMore, videoId]);

    useEffect(() => {
        if (videos.length && activeIndex >= videos.length - 3 && hasMore && !isLoadingMore && !isRefreshing && !moreError) loadMore();
    }, [activeIndex, videos.length, hasMore, isLoadingMore, isRefreshing, moreError, loadMore]);

    useEffect(() => {
        const from = advanceAfterLoad.current;
        if (from !== null && from < videos.length - 1) {
            advanceAfterLoad.current = null;
            setActiveIndex((index) => index === from ? from + 1 : index);
        }
    }, [videos.length]);
    const next = useCallback(async () => {
        if (activeIndex < videos.length - 1) setActiveIndex((index) => Math.min(videos.length - 1, index + 1));
        else {
            advanceAfterLoad.current = activeIndex;
            if (!loadingMore.current && !await loadMore()) advanceAfterLoad.current = null;
        }
    }, [activeIndex, videos.length, loadMore]);
    const previous = useCallback(() => { advanceAfterLoad.current = null; setActiveIndex((index) => Math.max(0, index - 1)); }, []);

    return { videos, activeIndex, isLoading, isLoadingMore, hasMore, error, moreError, notice, animationId,
        next, previous, loadMore, retry: () => setRevision((value) => value + 1), dismissNotice: () => setNotice("") };
}

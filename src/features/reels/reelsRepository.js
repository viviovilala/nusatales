import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import { videoRepository } from "../videos/videoRepository";
import { profileRepository } from "../profile/profileRepository";

// In-memory cache for signed URLs to prevent refetching during rapid scrolling
const signedUrlCache = new Map();
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

export const reelsRepository = {
    async getFeedVideos({ limit = 10, offset = 0 } = {}) {
        if (!isSupabaseConfigured) return { data: [], error: null };

        const { data, error } = await supabase
            .from("videos")
            .select(`
                id,
                title,
                description,
                storage_path,
                thumbnail_path,
                duration_seconds,
                content_type,
                status,
                published_at,
                creator:profiles!videos_creator_id_fkey (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .eq("status", "published")
            .eq("content_type", "reel")
            .is("deleted_at", null)
            .order("published_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            // Graceful compatibility fallback if migration 7 has not yet been applied on remote database
            if (error.code === "42703") {
                const fallbackQuery = await supabase
                    .from("videos")
                    .select(`
                        id,
                        title,
                        description,
                        storage_path,
                        thumbnail_path,
                        duration_seconds,
                        status,
                        published_at,
                        creator:profiles!videos_creator_id_fkey (
                            id,
                            username,
                            display_name,
                            avatar_path
                        )
                    `)
                    .eq("status", "published")
                    .is("deleted_at", null)
                    .order("published_at", { ascending: false })
                    .order("id", { ascending: false })
                    .range(offset, offset + limit - 1);

                if (fallbackQuery.error) return { data: [], error: fallbackQuery.error };

                const normalizedFallback = (fallbackQuery.data || []).map((v) => ({
                    id: v.id,
                    title: v.title,
                    description: v.description,
                    storagePath: v.storage_path,
                    thumbnailUrl: videoRepository.getThumbnailPublicUrl(v.thumbnail_path),
                    durationSeconds: v.duration_seconds,
                    contentType: "reel",
                    publishedAt: v.published_at,
                    creator: {
                        id: v.creator?.id,
                        username: v.creator?.username,
                        displayName: v.creator?.display_name || "Kreator NusaTales",
                        avatarUrl: profileRepository.getAvatarPublicUrl(v.creator?.avatar_path),
                    },
                }));
                return { data: normalizedFallback, error: null };
            }
            return { data: [], error };
        }

        const normalized = (data || []).map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            storagePath: v.storage_path,
            thumbnailUrl: videoRepository.getThumbnailPublicUrl(v.thumbnail_path),
            durationSeconds: v.duration_seconds,
            contentType: v.content_type || "reel",
            publishedAt: v.published_at,
            creator: {
                id: v.creator?.id,
                username: v.creator?.username,
                displayName: v.creator?.display_name || "Kreator NusaTales",
                avatarUrl: profileRepository.getAvatarPublicUrl(v.creator?.avatar_path),
            },
        }));

        return { data: normalized, error: null };
    },

    async getPublishedVideoById(videoId) {
        if (!isSupabaseConfigured || !videoId) return { data: null, error: null };

        const { data, error } = await supabase
            .from("videos")
            .select(`
                id,
                title,
                description,
                storage_path,
                thumbnail_path,
                duration_seconds,
                content_type,
                status,
                published_at,
                creator:profiles!videos_creator_id_fkey (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .eq("id", videoId)
            .eq("status", "published")
            .is("deleted_at", null)
            .maybeSingle();

        if (error || !data) return { data: null, error };

        const normalized = {
            id: data.id,
            title: data.title,
            description: data.description,
            storagePath: data.storage_path,
            thumbnailUrl: videoRepository.getThumbnailPublicUrl(data.thumbnail_path),
            durationSeconds: data.duration_seconds,
            contentType: data.content_type || "reel",
            publishedAt: data.published_at,
            creator: {
                id: data.creator?.id,
                username: data.creator?.username,
                displayName: data.creator?.display_name || "Kreator NusaTales",
                avatarUrl: profileRepository.getAvatarPublicUrl(data.creator?.avatar_path),
            },
        };

        return { data: normalized, error: null };
    },

    async getSignedVideoUrl(storagePath) {
        if (!storagePath) return null;

        const cached = signedUrlCache.get(storagePath);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.url;
        }

        const url = await videoRepository.getMediaSignedUrl(storagePath, 3600);
        if (url) {
            signedUrlCache.set(storagePath, {
                url,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });
        }

        return url;
    },
};

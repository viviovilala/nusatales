import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import { videoRepository } from "../videos/videoRepository";
import { profileRepository } from "../profile/profileRepository";

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
                status,
                published_at,
                creator:profiles (
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

        if (error) return { data: [], error };

        const normalized = (data || []).map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            storagePath: v.storage_path,
            thumbnailUrl: videoRepository.getThumbnailPublicUrl(v.thumbnail_path),
            durationSeconds: v.duration_seconds,
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
                status,
                published_at,
                creator:profiles (
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
        return await videoRepository.getMediaSignedUrl(storagePath, 3600);
    },
};

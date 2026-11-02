import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const videoRepository = {
    async getPublishedFeed({ limit = 10, offset = 0 } = {}) {
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
            .range(offset, offset + limit - 1);

        return { data: data || [], error };
    },

    async getCreatorPublishedVideos(creatorId) {
        if (!isSupabaseConfigured || !creatorId) return { data: [], error: null };

        const { data, error } = await supabase
            .from("videos")
            .select("id, title, description, storage_path, thumbnail_path, duration_seconds, published_at")
            .eq("creator_id", creatorId)
            .eq("status", "published")
            .is("deleted_at", null)
            .order("published_at", { ascending: false });

        return { data: data || [], error };
    },

    async getMyStudioVideos(creatorId) {
        if (!isSupabaseConfigured || !creatorId) return { data: [], error: null };

        const { data, error } = await supabase
            .from("videos")
            .select("id, title, description, storage_path, thumbnail_path, duration_seconds, status, created_at, published_at")
            .eq("creator_id", creatorId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    },

    async getVideoById(videoId) {
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
                creator_id,
                creator:profiles (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .eq("id", videoId)
            .is("deleted_at", null)
            .maybeSingle();

        return { data, error };
    },

    async createDraft({ title, description, creatorId }) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const { data, error } = await supabase
            .from("videos")
            .insert({
                creator_id: creatorId,
                title: title.trim(),
                description: description?.trim() || null,
                status: "draft",
            })
            .select()
            .single();

        return { data, error };
    },

    async updateVideo(videoId, updates) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const payload = {
            ...updates,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("videos")
            .update(payload)
            .eq("id", videoId)
            .select()
            .single();

        return { data, error };
    },

    async softDeleteVideo(videoId) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const { data, error } = await supabase
            .from("videos")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", videoId)
            .select()
            .single();

        return { data, error };
    },

    async publishVideo(videoId) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const { data, error } = await supabase.rpc("publish_video", {
            p_video_id: videoId,
        });

        if (error && (error.code === "PGRST202" || error.message?.includes("function") || error.message?.includes("not found"))) {
            return await supabase
                .from("videos")
                .update({
                    status: "published",
                    published_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", videoId)
                .select()
                .single();
        }

        return { data, error };
    },

    async unpublishVideo(videoId) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const { data, error } = await supabase.rpc("unpublish_video", {
            p_video_id: videoId,
        });

        if (error && (error.code === "PGRST202" || error.message?.includes("function") || error.message?.includes("not found"))) {
            return await supabase
                .from("videos")
                .update({
                    status: "draft",
                    published_at: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", videoId)
                .select()
                .single();
        }

        return { data, error };
    },

    getMediaSignedUrl(storagePath, expiresIn = 3600) {
        if (!isSupabaseConfigured || !storagePath) return Promise.resolve(null);

        return supabase.storage
            .from("videos")
            .createSignedUrl(storagePath, expiresIn)
            .then(({ data }) => data?.signedUrl || null)
            .catch(() => null);
    },

    getThumbnailPublicUrl(thumbnailPath) {
        if (!thumbnailPath) return null;
        if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
            return thumbnailPath;
        }
        if (!isSupabaseConfigured) return null;

        const { data } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(thumbnailPath);

        return data?.publicUrl || null;
    },
};

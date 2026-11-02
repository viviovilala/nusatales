import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const videoRepository = {
    async getPublishedFeed({ limit = 10, offset = 0, contentType = "reel" } = {}) {
        if (!isSupabaseConfigured) return { data: [], error: null };

        let query = supabase
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
            .is("deleted_at", null);

        if (contentType) {
            query = query.eq("content_type", contentType);
        }

        const { data, error } = await query
            .order("published_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + limit - 1);

        return { data: data || [], error };
    },

    async getAnimationCatalog({ limit = 12, offset = 0, search = "" } = {}) {
        if (!isSupabaseConfigured) return { data: [], count: 0, error: null };

        let query = supabase
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
            `, { count: "exact" })
            .eq("status", "published")
            .eq("content_type", "animation")
            .is("deleted_at", null);

        const cleanSearch = search.trim();
        if (cleanSearch) {
            query = query.ilike("title", `%${cleanSearch}%`);
        }

        const { data, count, error } = await query
            .order("published_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return { data: [], count: 0, error };

        const normalized = (data || []).map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            storagePath: v.storage_path,
            thumbnailUrl: videoRepository.getThumbnailPublicUrl(v.thumbnail_path),
            durationSeconds: v.duration_seconds,
            contentType: v.content_type || "animation",
            publishedAt: v.published_at,
            creator: {
                id: v.creator?.id,
                username: v.creator?.username,
                displayName: v.creator?.display_name || "Kreator NusaTales",
                avatarUrl: videoRepository.getThumbnailPublicUrl(v.creator?.avatar_path),
            },
        }));

        return { data: normalized, count: count || 0, error: null };
    },

    async getCreatorPublishedVideos(creatorId, contentType = null) {
        if (!isSupabaseConfigured || !creatorId) return { data: [], error: null };

        let query = supabase
            .from("videos")
            .select("id, title, description, storage_path, thumbnail_path, duration_seconds, content_type, published_at")
            .eq("creator_id", creatorId)
            .eq("status", "published")
            .is("deleted_at", null);

        if (contentType) {
            query = query.eq("content_type", contentType);
        }

        const { data, error } = await query.order("published_at", { ascending: false });

        return { data: data || [], error };
    },

    async getMyStudioVideos(creatorId, contentType = null) {
        if (!isSupabaseConfigured || !creatorId) return { data: [], error: null };

        let query = supabase
            .from("videos")
            .select("id, title, description, storage_path, thumbnail_path, duration_seconds, content_type, status, created_at, published_at")
            .eq("creator_id", creatorId)
            .is("deleted_at", null);

        if (contentType && contentType !== "all") {
            query = query.eq("content_type", contentType);
        }

        let { data, error } = await query.order("created_at", { ascending: false });

        if (error && error.code === "42703") {
            const fallbackQuery = await supabase
                .from("videos")
                .select("id, title, description, storage_path, thumbnail_path, duration_seconds, status, created_at, published_at")
                .eq("creator_id", creatorId)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            data = (fallbackQuery.data || []).map((v) => ({ ...v, content_type: "reel" }));
            error = fallbackQuery.error;
        }

        return { data: data || [], error };
    },

    async getVideoById(videoId) {
        if (!isSupabaseConfigured || !videoId) return { data: null, error: null };

        let { data, error } = await supabase
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
                creator_id,
                creator:profiles!videos_creator_id_fkey (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .eq("id", videoId)
            .is("deleted_at", null)
            .maybeSingle();

        if (error && error.code === "42703") {
            const fallback = await supabase
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
                    creator:profiles!videos_creator_id_fkey (
                        id,
                        username,
                        display_name,
                        avatar_path
                    )
                `)
                .eq("id", videoId)
                .is("deleted_at", null)
                .maybeSingle();

            if (fallback.data) {
                data = { ...fallback.data, content_type: "reel" };
                error = null;
            } else {
                error = fallback.error;
            }
        }

        return { data, error };
    },

    async createDraft({ title, description, creatorId, contentType = "reel" }) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const validContentType = ["animation", "reel"].includes(contentType) ? contentType : "reel";

        const { data, error } = await supabase
            .from("videos")
            .insert({
                creator_id: creatorId,
                title: title.trim(),
                description: description?.trim() || null,
                content_type: validContentType,
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

        // Whitelist allowed metadata fields only (content_type is immutable after creation)
        const allowedFields = ["title", "description", "thumbnail_path", "storage_path", "duration_seconds"];
        const payload = {};
        for (const key of allowedFields) {
            if (key in updates) {
                payload[key] = updates[key];
            }
        }
        payload.updated_at = new Date().toISOString();

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

        // Trusted RPC execution - strictly NO direct DB update fallback
        return await supabase.rpc("soft_delete_video", { p_video_id: videoId });
    },

    async publishVideo(videoId) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        // Trusted RPC execution - strictly NO direct DB update fallback
        const { data, error } = await supabase.rpc("publish_video", {
            p_video_id: videoId,
        });

        return { data, error };
    },

    async unpublishVideo(videoId) {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        // Trusted RPC execution - strictly NO direct DB update fallback
        const { data, error } = await supabase.rpc("unpublish_video", {
            p_video_id: videoId,
        });

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

    getThumbnailSignedUrl(thumbnailPath, expiresIn = 3600) {
        if (!isSupabaseConfigured || !thumbnailPath) return Promise.resolve(null);
        if (thumbnailPath.startsWith("http://") || thumbnailPath.startsWith("https://")) {
            return Promise.resolve(thumbnailPath);
        }

        return supabase.storage
            .from("thumbnails")
            .createSignedUrl(thumbnailPath, expiresIn)
            .then(({ data }) => data?.signedUrl || null)
            .catch(() => null);
    },
};

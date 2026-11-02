import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import { profileRepository } from "../profile/profileRepository";

export const interactionRepository = {
    async getLikeStats(videoId, currentUserId = null) {
        if (!isSupabaseConfigured || !videoId) {
            return { count: 0, hasLiked: false };
        }

        // Get total like count
        const { count, error: countErr } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", videoId);

        let hasLiked = false;

        // Check if current user has liked
        if (currentUserId) {
            const { data, error: userLikeErr } = await supabase
                .from("video_likes")
                .select("video_id")
                .eq("video_id", videoId)
                .eq("user_id", currentUserId)
                .maybeSingle();

            if (!userLikeErr && data) {
                hasLiked = true;
            }
        }

        return {
            count: count || 0,
            hasLiked,
            error: countErr,
        };
    },

    async toggleLike(videoId, currentUserId, currentLiked) {
        if (!isSupabaseConfigured || !videoId || !currentUserId) {
            return { error: { message: "Harus masuk untuk menyukai video." } };
        }

        if (currentLiked) {
            // Unlike
            const { error } = await supabase
                .from("video_likes")
                .delete()
                .eq("video_id", videoId)
                .eq("user_id", currentUserId);

            return { liked: false, error };
        } else {
            // Like
            const { error } = await supabase
                .from("video_likes")
                .insert({
                    video_id: videoId,
                    user_id: currentUserId,
                });

            return { liked: true, error };
        }
    },

    async getComments(videoId) {
        if (!isSupabaseConfigured || !videoId) {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from("video_comments")
            .select(`
                id,
                content,
                created_at,
                user_id,
                user:profiles (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .eq("video_id", videoId)
            .order("created_at", { ascending: false });

        if (error) return { data: [], error };

        const normalized = (data || []).map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.created_at,
            userId: c.user_id,
            user: {
                id: c.user?.id,
                username: c.user?.username,
                displayName: c.user?.display_name || "Penonton",
                avatarUrl: profileRepository.getAvatarPublicUrl(c.user?.avatar_path),
            },
        }));

        return { data: normalized, error: null };
    },

    async addComment(videoId, currentUserId, content) {
        if (!isSupabaseConfigured || !videoId || !currentUserId) {
            return { data: null, error: { message: "Harus masuk untuk berkomentar." } };
        }

        const cleanContent = content.trim();
        if (!cleanContent) {
            return { data: null, error: { message: "Komentar tidak boleh kosong." } };
        }

        const { data, error } = await supabase
            .from("video_comments")
            .insert({
                video_id: videoId,
                user_id: currentUserId,
                content: cleanContent,
            })
            .select(`
                id,
                content,
                created_at,
                user_id,
                user:profiles (
                    id,
                    username,
                    display_name,
                    avatar_path
                )
            `)
            .single();

        if (error) return { data: null, error };

        const normalized = {
            id: data.id,
            content: data.content,
            createdAt: data.created_at,
            userId: data.user_id,
            user: {
                id: data.user?.id,
                username: data.user?.username,
                displayName: data.user?.display_name || "Penonton",
                avatarUrl: profileRepository.getAvatarPublicUrl(data.user?.avatar_path),
            },
        };

        return { data: normalized, error: null };
    },

    async deleteComment(commentId, currentUserId) {
        if (!isSupabaseConfigured || !commentId || !currentUserId) {
            return { error: { message: "Aksi tidak diizinkan." } };
        }

        const { error } = await supabase
            .from("video_comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", currentUserId);

        return { error };
    },
};

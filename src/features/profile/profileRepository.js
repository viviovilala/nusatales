import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const profileRepository = {
    async getProfile(userId) {
        if (!isSupabaseConfigured || !userId) return { data: null, error: null };

        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, display_name, bio, avatar_path, created_at, updated_at")
            .eq("id", userId)
            .maybeSingle();

        return { data, error };
    },

    async updateProfile(userId, updates) {
        if (!isSupabaseConfigured || !userId) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        const payload = {
            ...updates,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", userId)
            .select()
            .single();

        return { data, error };
    },
};

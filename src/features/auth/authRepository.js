import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const authRepository = {
    async getSession() {
        if (!isSupabaseConfigured) return { data: { session: null }, error: null };
        return await supabase.auth.getSession();
    },

    async getUser() {
        if (!isSupabaseConfigured) return { data: { user: null }, error: null };
        return await supabase.auth.getUser();
    },

    async signInWithPassword({ email, password }) {
        if (!isSupabaseConfigured) {
            return {
                data: null,
                error: { message: "Supabase belum dikonfigurasi. Hubungkan project Supabase terlebih dahulu." },
            };
        }
        return await supabase.auth.signInWithPassword({ email, password });
    },

    async signInWithGoogle() {
        if (!isSupabaseConfigured) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }
        if (typeof window === "undefined" || !window.location?.origin) {
            return { data: null, error: { message: "Login Google hanya tersedia di browser." } };
        }
        // Only the current site's callback can receive the OAuth response.
        // Google Client ID/Secret are configured in Supabase, never shipped to Vite.
        return await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    },

    async signUp({ email, password, displayName }) {
        if (!isSupabaseConfigured) {
            return {
                data: null,
                error: { message: "Supabase belum dikonfigurasi. Hubungkan project Supabase terlebih dahulu." },
            };
        }
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || "Pengguna NusaTales",
                },
            },
        });
    },

    async signOut() {
        if (!isSupabaseConfigured) return { error: null };
        return await supabase.auth.signOut();
    },

    async resetPasswordForEmail(email) {
        if (!isSupabaseConfigured) {
            return { error: { message: "Supabase belum dikonfigurasi." } };
        }
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    },

    async updatePassword(newPassword) {
        if (!isSupabaseConfigured) {
            return { error: { message: "Supabase belum dikonfigurasi." } };
        }
        return await supabase.auth.updateUser({
            password: newPassword,
        });
    },

    onAuthStateChange(callback) {
        if (!isSupabaseConfigured) {
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
        return supabase.auth.onAuthStateChange(callback);
    },
};

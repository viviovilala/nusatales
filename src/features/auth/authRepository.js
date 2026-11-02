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

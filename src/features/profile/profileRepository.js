import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

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

    async getProfileByUsername(username) {
        if (!isSupabaseConfigured || !username) return { data: null, error: null };

        const cleanUsername = username.trim().toLowerCase();
        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, display_name, bio, avatar_path, created_at, updated_at")
            .ilike("username", cleanUsername)
            .maybeSingle();

        return { data, error };
    },

    async isUsernameAvailable(username, currentUserId) {
        if (!isSupabaseConfigured || !username) return false;

        const cleanUsername = username.trim().toLowerCase();
        if (!USERNAME_REGEX.test(cleanUsername)) return false;

        let query = supabase
            .from("profiles")
            .select("id")
            .ilike("username", cleanUsername);

        if (currentUserId) {
            query = query.neq("id", currentUserId);
        }

        const { data, error } = await query;
        if (error) {
            console.error("[isUsernameAvailable] Query error:", error);
            return false;
        }

        return !data || data.length === 0;
    },

    async updateProfile(userId, updates) {
        if (!isSupabaseConfigured || !userId) {
            return { data: null, error: { message: "Supabase belum dikonfigurasi." } };
        }

        // Whitelist allowed fields only
        const allowedFields = ["display_name", "username", "bio", "avatar_path"];
        const payload = {};

        for (const field of allowedFields) {
            if (field in updates) {
                payload[field] = updates[field];
            }
        }

        // Validation: username format
        if (payload.username !== undefined && payload.username !== null) {
            const cleanUser = payload.username.trim().toLowerCase();
            if (cleanUser.length > 0 && !USERNAME_REGEX.test(cleanUser)) {
                return {
                    data: null,
                    error: { message: "Format username tidak valid. Gunakan 3-24 karakter huruf kecil, angka, atau underscore." },
                };
            }
            payload.username = cleanUser.length > 0 ? cleanUser : null;
        }

        // Validation: display_name non-empty
        if (payload.display_name !== undefined) {
            const cleanDisplay = payload.display_name?.trim();
            if (!cleanDisplay || cleanDisplay.length > 60) {
                return {
                    data: null,
                    error: { message: "Nama tampilan harus antara 1 sampai 60 karakter." },
                };
            }
            payload.display_name = cleanDisplay;
        }

        // Validation: avatar_path ownership check (must reside in caller's folder)
        if (payload.avatar_path) {
            const expectedPrefix = `${userId}/`;
            if (!payload.avatar_path.startsWith(expectedPrefix)) {
                return {
                    data: null,
                    error: { message: "Berkas avatar tidak valid atau bukan milik akun Anda." },
                };
            }
        }

        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", userId)
            .select()
            .single();

        return { data, error };
    },

    async uploadAvatar(userId, file) {
        if (!isSupabaseConfigured || !userId || !file) {
            return { data: null, error: { message: "Kredensial atau berkas tidak valid." } };
        }

        // Validate MIME type
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            return {
                data: null,
                error: { message: "Format foto harus JPG, PNG, atau WebP." },
            };
        }

        // Validate max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return {
                data: null,
                error: { message: "Ukuran foto maksimal 5 MB." },
            };
        }

        const ext = file.name.split(".").pop().toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const filePath = `${userId}/avatar-${fileName}`;

        const { data, error } = await supabase.storage
            .from("thumbnails")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) {
            return { data: null, error };
        }

        return { data: { path: data.path }, error: null };
    },

    getAvatarPublicUrl(avatarPath) {
        if (!avatarPath) return null;
        if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
            return avatarPath;
        }
        if (!isSupabaseConfigured) return null;

        const { data } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(avatarPath);

        return data?.publicUrl || null;
    },
};

import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const IMAGE_URL_TTL_SECONDS = 300;

/** Resolve private covers and avatars through Storage RLS, never /object/public. */
export async function getStorageImageUrl(path, expiresIn = IMAGE_URL_TTL_SECONDS) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) {
        // Old stored public URLs from this bucket also need signing after 000010.
        const marker = "/storage/v1/object/public/thumbnails/";
        const index = path.indexOf(marker);
        if (index === -1) return path;
        try {
            path = decodeURIComponent(new URL(path).pathname.split(marker)[1]);
        } catch {
            return null;
        }
    }
    if (!isSupabaseConfigured) return null;
    try {
        const { data, error } = await supabase.storage.from("thumbnails").createSignedUrl(path, expiresIn);
        return error ? null : data?.signedUrl || null;
    } catch {
        return null;
    }
}

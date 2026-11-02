import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
    url &&
    publicKey &&
    !url.includes("your-project-ref") &&
    url.startsWith("http")
);

if (!isSupabaseConfigured) {
    console.warn(
        "[NusaTales Supabase] VITE_SUPABASE_URL atau VITE_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi. Buat file .env.local dengan kredensial Supabase Anda."
    );
}

export const supabase = createClient(
    url || "https://placeholder-project.supabase.co",
    publicKey || "placeholder-anon-key",
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);

/**
 * Standard error normalizer for Supabase responses and network failures.
 */
export function normalizeSupabaseError(error, defaultMessage = "Terjadi kesalahan pada sistem.") {
    if (!error) return null;

    if (typeof error === "string") return error;

    // Supabase auth specific errors
    if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
            return "Email atau kata sandi tidak cocok.";
        }
        if (msg.includes("user already registered")) {
            return "Email sudah terdaftar. Silakan masuk.";
        }
        if (msg.includes("password should be at least")) {
            return "Kata sandi minimal 6 karakter.";
        }
        if (msg.includes("email not confirmed")) {
            return "Email belum dikonfirmasi. Periksa kotak masuk email Anda.";
        }
        if (msg.includes("network") || msg.includes("failed to fetch")) {
            return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
        }
        return error.message;
    }

    return defaultMessage;
}

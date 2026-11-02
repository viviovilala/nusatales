/**
 * Comprehensive error normalizer for Supabase responses, PostgreSQL error codes, and network failures.
 */
export function normalizeSupabaseError(error, defaultMessage = "Terjadi kesalahan pada sistem.") {
    if (!error) return null;

    if (typeof error === "string") return error;

    // PostgREST / PostgreSQL specific error codes
    const code = error.code || "";
    if (code === "23505") {
        if (`${error.message || ""} ${error.details || ""}`.includes("animation_episodes")) {
            return "Nomor musim dan episode sudah dipakai pada animasi ini. Pilih nomor lain.";
        }
        if (error.message?.includes("username") || error.details?.includes("username")) {
            return "Username ini sudah digunakan oleh pengguna lain. Silakan pilih username lain.";
        }
        return "Data ini sudah terdaftar sebelumnya.";
    }

    if (code === "42501") {
        return "Anda tidak memiliki izin (hak akses) untuk melakukan tindakan ini.";
    }

    if (code === "23514") {
        // Only known application messages are shown verbatim; PostgreSQL check
        // details and internal constraint names retain the generic fallback.
        const animationMessages = ["Lengkapi sinopsis, poster, genre, dan minimal satu tayangan terbit sebelum menerbitkan animasi.",
            "Animasi terbit memerlukan sinopsis, poster, dan genre.", "Format tidak dapat diubah setelah memiliki tayangan.",
            "Film hanya memiliki satu tayangan utama.", "Pilih maksimal 3 genre dan 5 tema budaya.",
            "Pilihan genre atau tema budaya tidak valid.", "Unggah sampul sebelum menyimpan.",
            "Tayangan harus memiliki animasi yang aktif.", "Relasi tayangan tidak ditemukan."];
        if (animationMessages.includes(error.message)) return error.message;
        if (error.message?.includes("duration") || error.details?.includes("duration")) {
            return "Durasi video tidak sesuai dengan batasan kategori konten.";
        }
        if (error.message?.includes("username_format")) {
            return "Format username tidak valid. Gunakan 3-24 karakter alfanumerik.";
        }
        return "Data yang dimasukkan tidak memenuhi kriteria validasi sistem.";
    }

    if (code === "PGRST116") {
        return "Data yang diminta tidak ditemukan.";
    }

    if (code === "PGRST202" || code === "PGRST204") {
        return "Fungsi backend belum terpasang atau sedang dalam pemeliharaan.";
    }

    // Message-based parsing
    if (error.message) {
        const msg = error.message.toLowerCase();

        // Auth
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

        // Storage
        if (
            msg.includes("payload too large") ||
            msg.includes("entity too large") ||
            msg.includes("413") ||
            msg.includes("exceeded the maximum allowed size")
        ) {
            return "Ukuran berkas melebihi batas 50 MB yang tersedia pada NusaTales MVP (Supabase Free Tier). Harap kompres video menjadi di bawah 50 MB.";
        }
        if (msg.includes("bucket not found")) {
            return "Penyimpanan server belum siap. Hubungi administrator.";
        }

        // Network / Connectivity
        if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("abort")) {
            return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
        }

        // Direct database exception messages from plpgsql raise exception
        if (error.message.startsWith("Exception: ") || error.message.includes("Autentikasi diperlukan") || error.message.includes("tidak ditemukan")) {
            return error.message.replace(/^Exception:\s*/i, "");
        }

        return error.message;
    }

    return defaultMessage;
}

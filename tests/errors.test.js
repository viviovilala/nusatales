import { describe, it, expect } from "vitest";
import { normalizeSupabaseError } from "../src/lib/errors";

describe("normalizeSupabaseError", () => {
    it("returns null when error is null or undefined", () => {
        expect(normalizeSupabaseError(null)).toBeNull();
        expect(normalizeSupabaseError(undefined)).toBeNull();
    });

    it("returns raw string if error is a string", () => {
        expect(normalizeSupabaseError("Kesalahan jaringan")).toBe("Kesalahan jaringan");
    });

    it("maps 23505 unique constraint violation for username", () => {
        const error = { code: "23505", message: "duplicate key value violates unique constraint on username" };
        expect(normalizeSupabaseError(error)).toContain("Username ini sudah digunakan");
    });

    it("maps 42501 insufficient privilege violation", () => {
        const error = { code: "42501", message: "permission denied for table videos" };
        expect(normalizeSupabaseError(error)).toContain("tidak memiliki izin");
    });

    it("maps 23514 check constraint violation for duration", () => {
        const error = { code: "23514", message: "check constraint valid_content_duration failed" };
        expect(normalizeSupabaseError(error)).toContain("Durasi video tidak sesuai");
    });

    it("maps PGRST116 not found", () => {
        const error = { code: "PGRST116", message: "Results contain 0 rows" };
        expect(normalizeSupabaseError(error)).toContain("tidak ditemukan");
    });

    it("keeps animation publish guidance actionable without exposing raw check details", () => {
        const message = "Lengkapi sinopsis, poster, genre, dan minimal satu tayangan terbit sebelum menerbitkan animasi.";
        expect(normalizeSupabaseError({ code: "23514", message })).toBe(message);
        expect(normalizeSupabaseError({ code: "23514", message: "new row violates secret_check" })).not.toContain("secret_check");
        expect(normalizeSupabaseError({ code: "23505", message: "duplicate key violates animation_episodes_animation_id_season_number_episode_number_key" })).toContain("Nomor musim dan episode sudah dipakai");
    });

    it("maps Supabase Auth invalid credentials", () => {
        const error = { message: "Invalid login credentials" };
        expect(normalizeSupabaseError(error)).toBe("Email atau kata sandi tidak cocok.");
    });

    it("maps network failures", () => {
        const error = { message: "Failed to fetch" };
        expect(normalizeSupabaseError(error)).toContain("Gagal terhubung ke server");
    });

    it("maps Storage maximum allowed size exceeded to 50 MB guidance", () => {
        const error = { message: "The object exceeded the maximum allowed size" };
        expect(normalizeSupabaseError(error)).toContain("50 MB");
        expect(normalizeSupabaseError(error)).toContain("Supabase Free Tier");
    });

    it("returns default message when object is empty or unmapped", () => {
        expect(normalizeSupabaseError({}, "Pesan default")).toBe("Pesan default");
    });
});

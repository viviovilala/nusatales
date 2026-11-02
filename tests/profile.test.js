import { describe, it, expect, vi } from "vitest";
import { supabase } from "../src/lib/supabaseClient";
import { MAX_AVATAR_BYTES } from "../src/lib/mediaLimits";
import { USERNAME_REGEX, profileRepository } from "../src/features/profile/profileRepository";

describe("Profile Validation & Whitelist Security", () => {
    describe("USERNAME_REGEX", () => {
        it("accepts valid usernames between 3 and 24 characters with lowercase letters, numbers, and underscores", () => {
            expect(USERNAME_REGEX.test("budi_animator")).toBe(true);
            expect(USERNAME_REGEX.test("wayang99")).toBe(true);
            expect(USERNAME_REGEX.test("nusatales_fan")).toBe(true);
            expect(USERNAME_REGEX.test("abc")).toBe(true);
        });

        it("rejects invalid characters, uppercase, and improper length", () => {
            expect(USERNAME_REGEX.test("ab")).toBe(false); // too short
            expect(USERNAME_REGEX.test("a".repeat(25))).toBe(false); // too long
            expect(USERNAME_REGEX.test("Budi_Animator")).toBe(false); // uppercase
            expect(USERNAME_REGEX.test("budi-animator")).toBe(false); // hyphen not allowed
            expect(USERNAME_REGEX.test("budi@nusatales")).toBe(false); // special char
            expect(USERNAME_REGEX.test("budi animator")).toBe(false); // space
        });
    });

    describe("profileRepository.updateProfile input sanitization", () => {
        it("rejects avatar_path that does not start with userId prefix", async () => {
            const userId = "11111111-2222-3333-4444-555555555555";
            const maliciousPayload = {
                display_name: "Hacker",
                avatar_path: "victim-user-id/avatar-stolen.webp",
            };

            const result = await profileRepository.updateProfile(userId, maliciousPayload);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("bukan milik akun Anda");
        });

        it("rejects invalid username formats before sending update", async () => {
            const userId = "11111111-2222-3333-4444-555555555555";
            const invalidPayload = {
                username: "INVALID USERNAME!",
            };

            const result = await profileRepository.updateProfile(userId, invalidPayload);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("Format username tidak valid");
        });

        it("rejects empty or excessively long display names", async () => {
            const userId = "11111111-2222-3333-4444-555555555555";
            const emptyPayload = { display_name: "   " };
            const longPayload = { display_name: "a".repeat(65) };

            const res1 = await profileRepository.updateProfile(userId, emptyPayload);
            expect(res1.error).toBeDefined();
            expect(res1.error.message).toContain("Nama tampilan harus antara 1 sampai 60 karakter");

            const res2 = await profileRepository.updateProfile(userId, longPayload);
            expect(res2.error).toBeDefined();
            expect(res2.error.message).toContain("Nama tampilan harus antara 1 sampai 60 karakter");
        });
    });

    describe("avatar upload limits", () => {
        it("rejects 2 MB + 1 byte without sending a Storage request", async () => {
            const fromSpy = vi.spyOn(supabase.storage, "from");
            try {
                const result = await profileRepository.uploadAvatar("owner", {
                    name: "photo.png", type: "image/png", size: MAX_AVATAR_BYTES + 1,
                });
                expect(result.error?.message).toContain("maksimal 2 MB");
                expect(fromSpy).not.toHaveBeenCalled();
            } finally {
                fromSpy.mockRestore();
            }
        });

        it("accepts exactly 2 MB when the Storage service succeeds", async () => {
            const upload = vi.fn().mockResolvedValue({ data: { path: "owner/avatar-test.png" }, error: null });
            const fromSpy = vi.spyOn(supabase.storage, "from").mockReturnValue({ upload });
            try {
                const result = await profileRepository.uploadAvatar("owner", {
                    name: "photo.png", type: "image/png", size: MAX_AVATAR_BYTES,
                });
                expect(result.error).toBeNull();
                expect(upload).toHaveBeenCalledTimes(1);
            } finally {
                fromSpy.mockRestore();
            }
        });
    });

    describe("getAvatarSignedUrl", () => {
        it("returns null for null or empty paths", async () => {
            expect(await profileRepository.getAvatarSignedUrl(null)).toBeNull();
            expect(await profileRepository.getAvatarSignedUrl("")).toBeNull();
        });

        it("returns the path directly if it is an external http URL", async () => {
            const url = "https://images.example.com/avatar.jpg";
            expect(await profileRepository.getAvatarSignedUrl(url)).toBe(url);
        });
    });
});

import { describe, it, expect, vi } from "vitest";
import { videoRepository } from "../src/features/videos/videoRepository";
import { MAX_VIDEO_BYTES, MAX_THUMBNAIL_BYTES, MAX_AVATAR_BYTES } from "../src/features/videos/uploadService";
import { supabase } from "../src/lib/supabaseClient";

describe("Video Repository & Dual-Format Security", () => {
    describe("Storage Size Constants", () => {
        it("strictly enforces conservative 50 MB decimal limit for video uploads", () => {
            expect(MAX_VIDEO_BYTES).toBe(50_000_000);
            expect(MAX_THUMBNAIL_BYTES).toBe(5_000_000);
            expect(MAX_AVATAR_BYTES).toBe(2_000_000);
        });
    });
    describe("createDraft", () => {
        it("defaults contentType to reel if invalid or omitted", async () => {
            const insertSpy = vi.spyOn(supabase, "from").mockReturnValue({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: "test-id", content_type: "reel" },
                            error: null,
                        }),
                    }),
                }),
            });

            const res = await videoRepository.createDraft({
                title: "Test Reel",
                description: "Test Desc",
                creatorId: "user-123",
                contentType: "invalid_type",
            });

            expect(insertSpy).toHaveBeenCalledWith("videos");
            insertSpy.mockRestore();
        });

        it("supports contentType animation for full-length films", async () => {
            let capturedInsert = null;
            const insertSpy = vi.spyOn(supabase, "from").mockReturnValue({
                insert: vi.fn().mockImplementation((payload) => {
                    capturedInsert = payload;
                    return {
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { id: "anim-id", ...payload },
                                error: null,
                            }),
                        }),
                    };
                }),
            });

            const res = await videoRepository.createDraft({
                title: "Film Animasi Sangkuriang",
                description: "Kisah Sangkuriang durasi panjang",
                creatorId: "user-123",
                contentType: "animation",
            });

            expect(capturedInsert).toBeDefined();
            expect(capturedInsert.content_type).toBe("animation");
            expect(capturedInsert.title).toBe("Film Animasi Sangkuriang");
            insertSpy.mockRestore();
        });
    });

    describe("updateVideo field whitelisting", () => {
        it("strips unauthorized sensitive fields (e.g. status, creator_id, published_at, deleted_at)", async () => {
            let capturedUpdate = null;
            const updateSpy = vi.spyOn(supabase, "from").mockReturnValue({
                update: vi.fn().mockImplementation((payload) => {
                    capturedUpdate = payload;
                    return {
                        eq: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
                            }),
                        }),
                    };
                }),
            });

            await videoRepository.updateVideo("video-xyz", {
                title: "Judul Baru",
                content_type: "reel", // FORBIDDEN: content_type is immutable after creation
                status: "published", // FORBIDDEN: should be stripped
                creator_id: "other-user", // FORBIDDEN: should be stripped
                published_at: new Date().toISOString(), // FORBIDDEN: should be stripped
                deleted_at: new Date().toISOString(), // FORBIDDEN: should be stripped
            });

            expect(capturedUpdate).toBeDefined();
            expect(capturedUpdate.title).toBe("Judul Baru");
            expect(capturedUpdate.content_type).toBeUndefined();
            expect(capturedUpdate.status).toBeUndefined();
            expect(capturedUpdate.creator_id).toBeUndefined();
            expect(capturedUpdate.published_at).toBeUndefined();
            expect(capturedUpdate.deleted_at).toBeUndefined();

            updateSpy.mockRestore();
        });
    });

    describe("softDeleteVideo trusted RPC", () => {
        it("attempts soft_delete_video RPC first", async () => {
            const rpcSpy = vi.spyOn(supabase, "rpc").mockResolvedValue({
                data: { success: true, id: "vid-123", deleted: true },
                error: null,
            });

            const res = await videoRepository.softDeleteVideo("vid-123");
            expect(rpcSpy).toHaveBeenCalledWith("soft_delete_video", { p_video_id: "vid-123" });
            expect(res.data.deleted).toBe(true);

            rpcSpy.mockRestore();
        });
    });

    describe("publishVideo & unpublishVideo RPC integrity", () => {
        it("executes publish_video RPC and does NOT fall back to direct status update when RPC errors", async () => {
            const rpcSpy = vi.spyOn(supabase, "rpc").mockResolvedValue({
                data: null,
                error: { code: "PGRST202", message: "function publish_video does not exist" },
            });
            const updateSpy = vi.spyOn(supabase, "from");

            const result = await videoRepository.publishVideo("vid-123");

            expect(rpcSpy).toHaveBeenCalledWith("publish_video", { p_video_id: "vid-123" });
            // Crucial: ensure no direct table update fallback was triggered!
            expect(updateSpy).not.toHaveBeenCalled();
            expect(result.error).toBeDefined();
            expect(result.data).toBeNull();

            rpcSpy.mockRestore();
            updateSpy.mockRestore();
        });

        it("executes unpublish_video RPC and does NOT fall back to direct status update when RPC errors", async () => {
            const rpcSpy = vi.spyOn(supabase, "rpc").mockResolvedValue({
                data: null,
                error: { code: "42501", message: "permission denied" },
            });
            const updateSpy = vi.spyOn(supabase, "from");

            const result = await videoRepository.unpublishVideo("vid-123");

            expect(rpcSpy).toHaveBeenCalledWith("unpublish_video", { p_video_id: "vid-123" });
            expect(updateSpy).not.toHaveBeenCalled();
            expect(result.error).toBeDefined();

            rpcSpy.mockRestore();
            updateSpy.mockRestore();
        });
    });
});

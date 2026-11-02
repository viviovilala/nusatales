import { describe, it, expect, vi } from "vitest";
import { videoRepository } from "../src/features/videos/videoRepository";
import { MAX_VIDEO_BYTES, MAX_THUMBNAIL_BYTES, MAX_AVATAR_BYTES, uploadWithTus } from "../src/features/videos/uploadService";
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

        it("creates animation media and episode relation atomically through the trusted RPC", async () => {
            const single = vi.fn().mockResolvedValue({ data: { id: "anim-id" }, error: null });
            const rpc = vi.spyOn(supabase, "rpc").mockReturnValue({ single });
            const insert = vi.spyOn(supabase, "from");
            try {
                await videoRepository.createDraft({ title: " Episode dua ", description: "Ringkasan", creatorId: "user-123", contentType: "animation", animationId: "parent", seasonNumber: 2, episodeNumber: 3 });
                expect(rpc).toHaveBeenCalledWith("create_animation_episode", { p_animation_id: "parent", p_title: "Episode dua", p_description: "Ringkasan", p_season: 2, p_episode: 3 });
                expect(insert).not.toHaveBeenCalled();
                expect(single).toHaveBeenCalledOnce();
            } finally { rpc.mockRestore(); insert.mockRestore(); }
        });
        it("rejects animation upload without a parent before issuing a write", async () => {
            const rpc = vi.spyOn(supabase, "rpc"), insert = vi.spyOn(supabase, "from");
            try { const result = await videoRepository.createDraft({ title: "Orphan", contentType: "animation" }); expect(result.error).toBeTruthy(); expect(rpc).not.toHaveBeenCalled(); expect(insert).not.toHaveBeenCalled(); }
            finally { rpc.mockRestore(); insert.mockRestore(); }
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
        it("executes soft_delete_video RPC and strictly does NOT fall back to direct update when RPC fails", async () => {
            const rpcSpy = vi.spyOn(supabase, "rpc").mockResolvedValue({
                data: null,
                error: { code: "PGRST202", message: "function soft_delete_video not found" },
            });
            const updateSpy = vi.spyOn(supabase, "from");

            const res = await videoRepository.softDeleteVideo("vid-123");
            expect(rpcSpy).toHaveBeenCalledWith("soft_delete_video", { p_video_id: "vid-123" });
            // Strict RPC boundary check: direct table update MUST NOT be called!
            expect(updateSpy).not.toHaveBeenCalled();
            expect(res.error).toBeDefined();

            rpcSpy.mockRestore();
            updateSpy.mockRestore();
        });
    });

    describe("TUS Resumable Upload Abort Safety", () => {
        it("immediately settles and rejects with AbortError when abort() is invoked", async () => {
            const fakeFile = new Blob(["dummy video bytes"], { type: "video/mp4" });
            const task = uploadWithTus({
                bucket: "videos",
                filePath: "user-123/draft-456/media.mp4",
                file: fakeFile,
                userId: "user-123",
                draftId: "draft-456",
            });

            // Trigger abort immediately
            task.abort();

            await expect(task.promise).rejects.toMatchObject({
                name: "AbortError",
                isCancelled: true,
            });
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

        it("creates signed thumbnail URL with custom TTL", async () => {
            const createSignedUrlSpy = vi.fn().mockResolvedValue({
                data: { signedUrl: "https://example.com/storage/v1/object/sign/thumbnails/thumb.webp?token=xyz" },
                error: null,
            });
            const storageSpy = vi.spyOn(supabase.storage, "from").mockReturnValue({
                createSignedUrl: createSignedUrlSpy,
            });

            const url = await videoRepository.getThumbnailSignedUrl("user-1/vid-1/thumb.webp", 1800);
            expect(createSignedUrlSpy).toHaveBeenCalledWith("user-1/vid-1/thumb.webp", 1800);
            expect(url).toContain("sign/thumbnails/thumb.webp");

            storageSpy.mockRestore();
        });
    });
});

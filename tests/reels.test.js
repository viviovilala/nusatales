import { describe, it, expect, vi } from "vitest";
import { reelsRepository } from "../src/features/reels/reelsRepository";
import { supabase } from "../src/lib/supabaseClient";

describe("Reels Repository & Feed Pagination", () => {
    it("filters feed exclusively for published reels (content_type = 'reel')", async () => {
        let appliedFilters = {};
        const queryMock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col, val) => {
                appliedFilters[col] = val;
                return queryMock;
            }),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
                data: [
                    {
                        id: "reel-1",
                        title: "Reel 1",
                        content_type: "reel",
                        status: "published",
                        creator: { id: "c1", username: "animator" },
                    },
                ],
                error: null,
            }),
        };

        const fromSpy = vi.spyOn(supabase, "from").mockReturnValue(queryMock);

        const res = await reelsRepository.getFeedVideos({ limit: 5, offset: 0 });

        expect(appliedFilters.status).toBe("published");
        expect(appliedFilters.content_type).toBe("reel");
        expect(res.data.length).toBe(1);
        expect(res.data[0].contentType).toBe("reel");

        fromSpy.mockRestore();
    });

    it("caches signed media URLs to prevent repeated network requests during feed scrolling", async () => {
        let callCount = 0;
        const storageSpy = vi.spyOn(supabase.storage, "from").mockReturnValue({
            createSignedUrl: vi.fn().mockImplementation((path) => {
                callCount++;
                return Promise.resolve({ data: { signedUrl: `https://storage.supabase.co/${path}?token=mock` } });
            }),
        });

        const path = "creator-uuid/vid-uuid/media.mp4";

        const url1 = await reelsRepository.getSignedVideoUrl(path);
        const url2 = await reelsRepository.getSignedVideoUrl(path);

        expect(url1).toBe(url2);
        // Only one fetch should have happened due to memory cache!
        expect(callCount).toBe(1);

        storageSpy.mockRestore();
    });

    it("gracefully falls back when content_type column is missing (error 42703)", async () => {
        let firstCall = true;
        const fromSpy = vi.spyOn(supabase, "from").mockImplementation(() => {
            if (firstCall) {
                firstCall = false;
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    is: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: "42703", message: "column videos.content_type does not exist" },
                    }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({
                    data: [
                        { id: "legacy-reel", title: "Legacy", status: "published" },
                    ],
                    error: null,
                }),
            };
        });

        const res = await reelsRepository.getFeedVideos({ limit: 5 });

        expect(res.error).toBeNull();
        expect(res.data.length).toBe(1);
        expect(res.data[0].contentType).toBe("reel");

        fromSpy.mockRestore();
    });
});

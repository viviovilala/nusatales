import { describe, it, expect, vi } from "vitest";
import { videoRepository } from "../src/features/videos/videoRepository";
import { supabase } from "../src/lib/supabaseClient";

describe("Animation Catalog & Full-Video Features", () => {
    it.each([
        ["short", [["lte", "duration_seconds", 300]]],
        ["medium", [["gt", "duration_seconds", 300], ["lte", "duration_seconds", 900]]],
        ["long", [["gt", "duration_seconds", 900]]],
    ])("filters %s films using non-overlapping duration boundaries", async (duration, expected) => {
        const filters = [];
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            lte: vi.fn((...args) => { filters.push(["lte", ...args]); return query; }),
            gt: vi.fn((...args) => { filters.push(["gt", ...args]); return query; }),
            range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
        const spy = vi.spyOn(supabase, "from").mockReturnValue(query);
        try { await videoRepository.getAnimationCatalog({ duration }); expect(filters).toEqual(expected); }
        finally { spy.mockRestore(); }
    });

    it.each([["newest", "published_at", false, false], ["oldest", "published_at", true, true], ["title", "title", true, true]])("paginates %s films with a stable ID tie-breaker", async (sort, column, ascending, idAscending) => {
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
        const spy = vi.spyOn(supabase, "from").mockReturnValue(query);
        try {
            await videoRepository.getAnimationCatalog({ sort, offset: 12, limit: 12 });
            expect(query.order.mock.calls).toEqual([[column, { ascending }], ["id", { ascending: idAscending }]]);
            expect(query.range).toHaveBeenCalledWith(12, 23);
        } finally { spy.mockRestore(); }
    });

    it("queries published animation content with exact count", async () => {
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
                        id: "anim-1",
                        title: "Kisah Malin Kundang",
                        content_type: "animation",
                        status: "published",
                        duration_seconds: 900,
                        creator: { id: "c1", display_name: "Studio Nusantara" },
                    },
                ],
                count: 1,
                error: null,
            }),
        };

        const fromSpy = vi.spyOn(supabase, "from").mockReturnValue(queryMock);

        const res = await videoRepository.getAnimationCatalog({ limit: 12, offset: 0 });

        expect(fromSpy).toHaveBeenCalledWith("animation_catalog");
        expect(appliedFilters.status).toBe("published");
        expect(appliedFilters.content_type).toBe("animation");
        expect(res.data.length).toBe(1);
        expect(res.data[0].contentType).toBe("animation");
        expect(res.data[0].durationSeconds).toBe(900);

        fromSpy.mockRestore();
    });

    it("filters genre membership on the parent catalog, not episode titles", async () => {
        const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), contains: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
        const spy = vi.spyOn(supabase, "from").mockReturnValue(query);
        try { await videoRepository.getAnimationCatalog({ genre: "fantasi" }); expect(query.contains).toHaveBeenCalledWith("genre_slugs", ["fantasi"]); }
        finally { spy.mockRestore(); }
    });

    it("applies search filtering when search keyword is supplied", async () => {
        let searchPattern = null;
        const queryMock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockImplementation((col, pattern) => {
                searchPattern = pattern;
                return queryMock;
            }),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        const fromSpy = vi.spyOn(supabase, "from").mockReturnValue(queryMock);

        await videoRepository.getAnimationCatalog({ search: "Sangkuriang" });

        expect(searchPattern).toBe("%Sangkuriang%");

        fromSpy.mockRestore();
    });
});

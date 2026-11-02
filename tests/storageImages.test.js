import { afterEach, describe, expect, it, vi } from "vitest";
import { getStorageImageUrl } from "../src/lib/storageImages";
import { supabase } from "../src/lib/supabaseClient";

afterEach(() => vi.restoreAllMocks());
describe("Private thumbnail and avatar URLs", () => {
    it("signs covers using the caller's Storage permissions", async () => {
        const sign = vi.fn().mockResolvedValue({ data: { signedUrl: "signed-cover" }, error: null });
        const bucket = vi.spyOn(supabase.storage, "from").mockReturnValue({ createSignedUrl: sign });
        expect(await getStorageImageUrl("owner/video/thumb.webp")).toBe("signed-cover");
        expect(bucket).toHaveBeenCalledWith("thumbnails");
        expect(sign).toHaveBeenCalledWith("owner/video/thumb.webp", 300);
    });
    it("does not return a public URL when Storage denies a private draft", async () => {
        vi.spyOn(supabase.storage, "from").mockReturnValue({
            createSignedUrl: vi.fn().mockResolvedValue({ error: { message: "not found" } }),
        });
        expect(await getStorageImageUrl("another-owner/draft/thumb.webp")).toBeNull();
    });
    it("re-signs legacy public bucket URLs rather than passing them through", async () => {
        const sign = vi.fn().mockResolvedValue({ data: { signedUrl: "signed-avatar" } });
        vi.spyOn(supabase.storage, "from").mockReturnValue({ createSignedUrl: sign });
        expect(await getStorageImageUrl("https://project.supabase.co/storage/v1/object/public/thumbnails/owner/avatar-a.webp"))
            .toBe("signed-avatar");
        expect(sign).toHaveBeenCalledWith("owner/avatar-a.webp", 300);
    });
    it("does not cache an owner's signed URL for a later anonymous request", async () => {
        const sign = vi.fn().mockResolvedValueOnce({ data: { signedUrl: "owner-only" } })
            .mockResolvedValueOnce({ error: { message: "denied" } });
        vi.spyOn(supabase.storage, "from").mockReturnValue({ createSignedUrl: sign });
        expect(await getStorageImageUrl("owner/draft/thumb.webp")).toBe("owner-only");
        expect(await getStorageImageUrl("owner/draft/thumb.webp")).toBeNull();
        expect(sign).toHaveBeenCalledTimes(2);
    });
});

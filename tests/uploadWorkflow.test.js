import { describe, it, expect, vi } from "vitest";
import { createUploadOperation, runVideoUpload } from "../src/features/videos/uploadWorkflow";

const input = {
    userId: "owner", title: "Cerita", contentType: "reel", duration: 10, publish: true,
    file: { name: "cerita.mp4", type: "video/mp4" }, thumbnail: { type: "image/jpeg" },
};
function fixture() {
    const repository = {
        createDraft: vi.fn().mockResolvedValue({ data: { id: "draft" } }),
        updateVideo: vi.fn().mockResolvedValue({ data: {} }),
        publishVideo: vi.fn().mockResolvedValue({ data: { success: true } }),
        softDeleteVideo: vi.fn().mockResolvedValue({ data: {} }),
    };
    return { repository, upload: vi.fn().mockResolvedValue({}), cleanup: vi.fn().mockResolvedValue({}) };
}

describe("Upload operation cancellation", () => {
    it("passes the selected title and numbering into the atomic draft operation", async () => {
        const deps = fixture();
        await runVideoUpload({ ...input, contentType: "animation", animationId: "parent", seasonNumber: 2, episodeNumber: 4 }, createUploadOperation(), vi.fn(), deps);
        expect(deps.repository.createDraft).toHaveBeenCalledWith(expect.objectContaining({ contentType: "animation", animationId: "parent", seasonNumber: 2, episodeNumber: 4 }));
    });
    it("releases an animation episode slot after a failed transfer before publication", async () => {
        const deps = fixture(); deps.upload.mockRejectedValue(new Error("Transfer failed"));
        await expect(runVideoUpload({ ...input, contentType: "animation", animationId: "parent", episodeNumber: 2 }, createUploadOperation(), vi.fn(), deps)).rejects.toMatchObject({ message: "Transfer failed", cleanupErrors: [] });
        expect(deps.repository.softDeleteVideo).toHaveBeenCalledWith("draft");
        expect(deps.cleanup).toHaveBeenCalledWith("thumbnails", expect.stringContaining("owner/draft/"));
        expect(deps.repository.publishVideo).not.toHaveBeenCalled();
    });
    it.each(["draft", "thumbnail", "video", "metadata"])(
        "never publishes when cancelled during %s and cleans its own resources", async (stage) => {
            const deps = fixture();
            const operation = createUploadOperation();
            let release;
            const pending = new Promise((resolve) => { release = resolve; });
            if (stage === "draft") deps.repository.createDraft.mockReturnValue(pending);
            if (stage === "thumbnail") deps.upload.mockReturnValueOnce(pending);
            if (stage === "video") deps.upload.mockResolvedValueOnce({}).mockReturnValueOnce(pending);
            if (stage === "metadata") deps.repository.updateVideo.mockReturnValue(pending);
            const work = runVideoUpload(input, operation, vi.fn(), deps);
            const rejected = expect(work).rejects.toMatchObject({ isCancelled: true, cleanupErrors: [] });
            await vi.waitFor(() => {
                if (stage === "draft") expect(deps.repository.createDraft).toHaveBeenCalled();
                if (stage === "thumbnail") expect(deps.upload).toHaveBeenCalledTimes(1);
                if (stage === "video") expect(deps.upload).toHaveBeenCalledTimes(2);
                if (stage === "metadata") expect(deps.repository.updateVideo).toHaveBeenCalled();
            });
            expect(operation.cancel()).toBe(true);
            release(stage === "draft" ? { data: { id: "draft" } } : { data: {} });
            await rejected;
            expect(deps.repository.publishVideo).not.toHaveBeenCalled();
            expect(deps.repository.softDeleteVideo).toHaveBeenCalledWith("draft");
            if (stage === "draft") expect(deps.upload).not.toHaveBeenCalled();
            if (stage === "thumbnail") {
                expect(deps.upload).toHaveBeenCalledTimes(1);
                expect(deps.repository.updateVideo).not.toHaveBeenCalled();
                expect(deps.cleanup).toHaveBeenCalledWith("thumbnails", expect.stringMatching(/^owner\/draft\/thumb-.*\.jpg$/));
            }
        },
    );

    it("propagates cancellation to the active transfer and ignores late progress", async () => {
        const deps = fixture();
        const operation = createUploadOperation();
        const phase = vi.fn();
        deps.upload.mockImplementationOnce(async ({ signal, onProgress }) => {
            operation.cancel();
            expect(signal.aborted).toBe(true);
            onProgress(99);
        });
        await expect(runVideoUpload({ ...input, thumbnail: null }, operation, phase, deps))
            .rejects.toMatchObject({ isCancelled: true });
        expect(phase.mock.calls.some(([, , percent]) => percent === 99)).toBe(false);
        expect(deps.repository.updateVideo).not.toHaveBeenCalled();
    });

    it("does not pretend an already-sent publication can be cancelled", async () => {
        const deps = fixture();
        const operation = createUploadOperation();
        deps.repository.publishVideo.mockImplementation(async () => {
            expect(operation.cancel()).toBe(false);
            return { data: { success: true } };
        });
        await expect(runVideoUpload(input, operation, vi.fn(), deps))
            .resolves.toEqual({ draftId: "draft", published: true });
        expect(deps.cleanup).not.toHaveBeenCalled();
    });

    it("preserves the uploaded draft when publishing fails", async () => {
        const deps = fixture();
        deps.repository.publishVideo.mockResolvedValue({ error: { message: "Publish denied" } });
        await expect(runVideoUpload(input, createUploadOperation(), vi.fn(), deps))
            .rejects.toMatchObject({ phase: "PUBLISH_FAILED", draftId: "draft" });
        expect(deps.cleanup).not.toHaveBeenCalled();
        expect(deps.repository.softDeleteVideo).not.toHaveBeenCalled();
    });

    it("preserves retry context when publication throws a transport error", async () => {
        const deps = fixture();
        deps.repository.publishVideo.mockRejectedValue(new TypeError("Network unavailable"));
        await expect(runVideoUpload(input, createUploadOperation(), vi.fn(), deps))
            .rejects.toMatchObject({ phase: "PUBLISH_FAILED", draftId: "draft" });
        expect(deps.cleanup).not.toHaveBeenCalled();
    });

    it("saving a draft does not invoke publication", async () => {
        const deps = fixture();
        await expect(runVideoUpload({ ...input, publish: false }, createUploadOperation(), vi.fn(), deps))
            .resolves.toEqual({ draftId: "draft", published: false });
        expect(deps.repository.publishVideo).not.toHaveBeenCalled();
        expect(deps.cleanup).not.toHaveBeenCalled();
    });

    it.each(["reel", "animation"])("removes %s draft and files after a non-cancel video transfer failure", async (contentType) => {
        const deps = fixture();
        deps.upload.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Transfer interrupted"));
        const work = runVideoUpload({ ...input, contentType, animationId: contentType === "animation" ? "parent" : undefined }, createUploadOperation(), vi.fn(), deps);
        await expect(work).rejects.toMatchObject({ message: "Transfer interrupted", cleanupErrors: [] });
        expect(deps.repository.softDeleteVideo).toHaveBeenCalledExactlyOnceWith("draft");
        expect(deps.cleanup).toHaveBeenCalledWith("videos", expect.stringMatching(/^owner\/draft\/media-.*\.mp4$/));
        expect(deps.cleanup).toHaveBeenCalledWith("thumbnails", expect.stringMatching(/^owner\/draft\/thumb-.*\.jpg$/));
        expect(deps.repository.publishVideo).not.toHaveBeenCalled();
    });

    it("cleans up a Reel after a failed metadata update, before publication", async () => {
        const deps = fixture();
        deps.repository.updateVideo.mockResolvedValue({ error: { message: "Metadata rejected" } });
        await expect(runVideoUpload(input, createUploadOperation(), vi.fn(), deps))
            .rejects.toMatchObject({ message: "Metadata rejected", cleanupErrors: [] });
        expect(deps.repository.softDeleteVideo).toHaveBeenCalledWith("draft");
        expect(deps.cleanup).toHaveBeenCalledTimes(2);
        expect(deps.repository.publishVideo).not.toHaveBeenCalled();
    });

    it("reports cleanup failures for non-cancel transfer errors", async () => {
        const deps = fixture();
        deps.upload.mockRejectedValueOnce(new Error("Storage unavailable"));
        deps.repository.softDeleteVideo.mockResolvedValue({ error: { code: "42501" } });
        deps.cleanup.mockRejectedValueOnce(new Error("Storage cleanup unavailable"));
        await expect(runVideoUpload(input, createUploadOperation(), vi.fn(), deps))
            .rejects.toMatchObject({ message: "Storage unavailable", cleanupErrors: ["draf", "videos"] });
        expect(deps.repository.publishVideo).not.toHaveBeenCalled();
    });

    it("reports cleanup failure instead of claiming all cancelled resources were removed", async () => {
        const deps = fixture();
        const operation = createUploadOperation();
        deps.repository.createDraft.mockImplementation(async () => {
            operation.cancel();
            return { data: { id: "draft" } };
        });
        deps.repository.softDeleteVideo.mockResolvedValue({ error: { code: "42501" } });
        await expect(runVideoUpload(input, operation, vi.fn(), deps))
            .rejects.toMatchObject({ isCancelled: true, cleanupErrors: ["draf"] });
    });
});

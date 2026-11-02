import { videoRepository } from "./videoRepository";
import { uploadMediaWithProgress, cleanupStorageObject } from "./uploadService";

export function uploadCancelledError() {
    return Object.assign(new Error("Pengunggahan dibatalkan oleh pengguna."), {
        name: "AbortError", isCancelled: true,
    });
}

export function createUploadOperation() {
    const controller = new AbortController();
    let publishing = false;
    return {
        signal: controller.signal,
        cancel() {
            if (publishing) return false;
            controller.abort();
            return true;
        },
        beginPublish() {
            if (controller.signal.aborted) throw uploadCancelledError();
            publishing = true;
        },
    };
}

/** One operation owns its resources until completion, including cancellation cleanup. */
export async function runVideoUpload(input, operation, onPhase, dependencies = {}) {
    const repository = dependencies.repository || videoRepository;
    const upload = dependencies.upload || uploadMediaWithProgress;
    const cleanup = dependencies.cleanup || cleanupStorageObject;
    const { signal } = operation;
    let draftId = null;
    let thumbnailPath = null;
    let storagePath = null;
    const check = () => { if (signal.aborted) throw uploadCancelledError(); };
    const phase = (name, message, percent) => { check(); onPhase(name, message, percent); };
    const requireSuccess = (result) => { if (result.error) throw result.error; return result.data; };

    try {
        phase("CREATING_DRAFT", "Menyiapkan draf karya...", 5);
        const draft = requireSuccess(await repository.createDraft({
            creatorId: input.userId, title: input.title, description: input.description,
            contentType: input.contentType,
        }));
        if (!draft?.id) throw new Error("Draf tidak berhasil dibuat.");
        draftId = draft.id;
        check();
        const stamp = Date.now();
        const extension = input.file.name.split(".").pop() || "mp4";
        storagePath = `${input.userId}/${draftId}/media-${stamp}.${extension}`;
        if (input.thumbnail) {
            const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[input.thumbnail.type] || "webp";
            thumbnailPath = `${input.userId}/${draftId}/thumb-${stamp}.${ext}`;
            phase("UPLOADING", "Mengunggah sampul karya...", 5);
            await upload({ bucket: "thumbnails", filePath: thumbnailPath, file: input.thumbnail,
                contentType: input.thumbnail.type, signal });
            check();
        }
        phase("UPLOADING", "Mengunggah berkas video...", 5);
        await upload({
            bucket: "videos", filePath: storagePath, file: input.file,
            contentType: input.file.type, userId: input.userId, draftId, signal,
            onProgress: (percent) => {
                if (!signal.aborted) onPhase("UPLOADING", "Mengunggah berkas video...", percent);
            },
        });
        check();
        phase("METADATA_SAVED", "Menyimpan metadata media...", 100);
        requireSuccess(await repository.updateVideo(draftId, {
            storage_path: storagePath, thumbnail_path: thumbnailPath, duration_seconds: input.duration,
        }));
        check();
        if (input.publish) {
            // Once sent, an RPC can commit even if the browser disconnects.
            operation.beginPublish();
            phase("PUBLISHING", "Mengonfirmasi publikasi karya...", 100);
            try {
                requireSuccess(await repository.publishVideo(draftId));
            } catch (error) {
                throw Object.assign(new Error(error.message || "Publikasi gagal. Draf tetap tersimpan."), {
                    phase: "PUBLISH_FAILED", draftId,
                });
            }
        }
        return { draftId, published: Boolean(input.publish) };
    } catch (error) {
        if (!signal.aborted) throw error;
        const cleanupErrors = [];
        // Draft insertion/image upload may finish after cancellation. Wait for
        // that await first, then remove precisely this operation's resources.
        if (draftId) {
            try {
                const result = await repository.softDeleteVideo(draftId);
                if (result.error) cleanupErrors.push("draf");
            } catch { cleanupErrors.push("draf"); }
        }
        for (const [bucket, path] of [["videos", storagePath], ["thumbnails", thumbnailPath]]) {
            if (!path) continue;
            try {
                const result = await cleanup(bucket, path);
                if (result?.error) cleanupErrors.push(bucket);
            } catch { cleanupErrors.push(bucket); }
        }
        throw Object.assign(uploadCancelledError(), { cleanupErrors });
    }
}

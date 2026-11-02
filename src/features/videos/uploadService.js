import * as tus from "tus-js-client";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
export { MAX_VIDEO_BYTES, MAX_THUMBNAIL_BYTES, MAX_AVATAR_BYTES } from "../../lib/mediaLimits";

/**
 * Extracts duration, dimensions, and auto-generates a first-frame thumbnail from a video file.
 */
export async function extractVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
        // Never synthesize a plausible duration or dimensions. Server/test
        // callers must mock metadata extraction explicitly.
        if (typeof window === "undefined" || typeof document === "undefined" ||
            typeof URL.createObjectURL !== "function") {
            return reject(new Error("Metadata video hanya dapat diperiksa di browser."));
        }

        const videoUrl = URL.createObjectURL(videoFile);
        const video = document.createElement("video");

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.src = videoUrl;

        const timer = setTimeout(() => {
            URL.revokeObjectURL(videoUrl);
            reject(new Error("Gagal membaca berkas video (waktu pemuatan habis)."));
        }, 15000);

        video.onloadedmetadata = () => {
            const rawDuration = video.duration;
            if (!Number.isFinite(rawDuration) || rawDuration < 1 ||
                !Number.isFinite(video.videoWidth) || video.videoWidth <= 0 ||
                !Number.isFinite(video.videoHeight) || video.videoHeight <= 0) {
                clearTimeout(timer);
                URL.revokeObjectURL(videoUrl);
                reject(new Error("Durasi atau dimensi video tidak valid."));
                return;
            }
            try {
                video.currentTime = Math.min(0.5, rawDuration / 2);
            } catch {
                clearTimeout(timer);
                URL.revokeObjectURL(videoUrl);
                reject(new Error("Gagal membaca frame video."));
            }
        };

        video.onseeked = () => {
            clearTimeout(timer);

            try {
                const width = video.videoWidth || 1280;
                const height = video.videoHeight || 720;
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0, width, height);
                }

                canvas.toBlob(
                    (thumbnailBlob) => {
                        URL.revokeObjectURL(videoUrl);

                        const durationSeconds = Math.max(1, Math.round(video.duration || 0));
                        resolve({
                            durationSeconds,
                            thumbnailBlob,
                            width,
                            height,
                            aspectRatio: width / height,
                        });
                    },
                    "image/webp",
                    0.85
                );
            } catch (err) {
                URL.revokeObjectURL(videoUrl);
                resolve({
                    durationSeconds: Math.max(1, Math.round(video.duration || 0)),
                    thumbnailBlob: null,
                    width: video.videoWidth || 1280,
                    height: video.videoHeight || 720,
                    aspectRatio: (video.videoWidth || 1280) / (video.videoHeight || 720),
                });
            }
        };

        video.onerror = () => {
            clearTimeout(timer);
            URL.revokeObjectURL(videoUrl);
            reject(new Error("Format video tidak didukung oleh peramban ini."));
        };
    });
}

/**
 * Resumable upload using TUS protocol for video media.
 * Supports resumeFromPreviousUpload(), auto-retry on network transient drops,
 * and clean cancellation without silent fallbacks.
 */
export function uploadWithTus({
    bucket,
    filePath,
    file,
    userId,
    draftId,
    onProgress,
}) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase belum dikonfigurasi.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    let uploadInstance = null;
    let isSettled = false;
    let isAborted = false;
    let outerReject = null;
    let abortPromise = Promise.resolve();

    const promise = new Promise(async (resolve, reject) => {
        outerReject = reject;
        try {
            if (isAborted) {
                isSettled = true;
                const cancelErr = new Error("Pengunggahan dibatalkan oleh pengguna.");
                cancelErr.name = "AbortError";
                cancelErr.isCancelled = true;
                return reject(cancelErr);
            }

            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token || anonKey;

            if (isAborted) {
                isSettled = true;
                const cancelErr = new Error("Pengunggahan dibatalkan oleh pengguna.");
                cancelErr.name = "AbortError";
                cancelErr.isCancelled = true;
                return reject(cancelErr);
            }

            const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

            // Derive user and draft keys for scoped resume fingerprint
            const resolvedUser = userId || (filePath.includes("/") ? filePath.split("/")[0] : "anon");
            const resolvedDraft = draftId || (filePath.includes("/") ? filePath.split("/")[1] : "nodraft");

            uploadInstance = new tus.Upload(file, {
                endpoint,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${token}`,
                    apikey: anonKey,
                    "x-upsert": "false",
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                fingerprint: (f) =>
                    Promise.resolve(
                        `tus-${resolvedUser}-${resolvedDraft}-${filePath}-${f.size}-${f.lastModified || ""}`
                    ),
                metadata: {
                    bucketName: bucket,
                    objectName: filePath,
                    contentType: file.type || "video/mp4",
                    cacheControl: "3600",
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                onError: (error) => {
                    if (isSettled) return;
                    isSettled = true;
                    if (isAborted) {
                        const cancelErr = new Error("Pengunggahan dibatalkan oleh pengguna.");
                        cancelErr.name = "AbortError";
                        cancelErr.isCancelled = true;
                        return reject(cancelErr);
                    }
                    console.error("[TUS Upload Error]", error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    if (isSettled || isAborted) return;
                    const percent = Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100));
                    if (onProgress) {
                        onProgress({
                            bytesUploaded,
                            bytesTotal,
                            percent,
                        });
                    }
                },
                onSuccess: () => {
                    if (isSettled) return;
                    isSettled = true;
                    resolve({ path: filePath });
                },
            });

            // Attempt to resume previous unfinished upload if fingerprint matches
            if (uploadInstance.findPreviousUploads) {
                uploadInstance
                    .findPreviousUploads()
                    .then((previousUploads) => {
                        if (isSettled || isAborted) return;
                        if (previousUploads && previousUploads.length > 0) {
                            uploadInstance.resumeFromPreviousUpload(previousUploads[0]);
                        }
                        uploadInstance.start();
                    })
                    .catch(() => {
                        if (!isSettled && !isAborted) uploadInstance.start();
                    });
            } else {
                uploadInstance.start();
            }
        } catch (err) {
            if (isSettled) return;
            isSettled = true;
            reject(err);
        }
    });

    return {
        promise,
        abort: () => {
            if (isAborted) return abortPromise;
            if (isSettled) return Promise.resolve();
            isSettled = true;
            isAborted = true;
            if (uploadInstance) {
                try {
                    abortPromise = uploadInstance.abort(true).catch(() => undefined);
                } catch (e) {
                    // Suppress synchronous abort errors from tus
                }
            }
            const cancelErr = new Error("Pengunggahan dibatalkan oleh pengguna.");
            cancelErr.name = "AbortError";
            cancelErr.isCancelled = true;
            if (outerReject) {
                outerReject(cancelErr);
            }
            return abortPromise;
        },
    };
}

/**
 * Uploads a file with progress reporting.
 * For video media ('videos' bucket), strictly uses TUS with NO silent standard upload fallback.
 * For small images ('thumbnails' bucket), uses standard upload.
 */
export async function uploadMediaWithProgress({
    bucket,
    filePath,
    file,
    contentType,
    userId,
    draftId,
    onProgress,
    onUploadInstance,
    signal,
}) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase belum dikonfigurasi.");
    }

    const checkCancelled = () => {
        if (signal?.aborted) throw Object.assign(new Error("Pengunggahan dibatalkan."), {
            name: "AbortError", isCancelled: true,
        });
    };
    checkCancelled();

    const determinedType = contentType || file.type || (bucket === "thumbnails" ? "image/webp" : "video/mp4");

    // VIDEO: Pure TUS upload — strictly NO standard upload fallback on network failure or cancel!
    if (bucket === "videos") {
        const tusTask = uploadWithTus({
            bucket,
            filePath,
            file,
            userId,
            draftId,
            onProgress: (prog) => {
                if (onProgress) onProgress(prog.percent, prog);
            },
        });

        if (onUploadInstance) {
            onUploadInstance(tusTask);
        }

        const abort = () => { tusTask.abort(); };
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) abort();
        try {
            const result = await tusTask.promise;
            checkCancelled();
            return result;
        } finally {
            signal?.removeEventListener("abort", abort);
            if (signal?.aborted) await tusTask.abort();
        }
    }

    // THUMBNAILS / IMAGES: Standard Supabase client upload
    if (onProgress) onProgress(30, { percent: 30 });

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: determinedType,
            upsert: false,
        });

    if (error) {
        throw error;
    }

    checkCancelled();
    if (onProgress) onProgress(100, { percent: 100 });

    return { path: data.path };
}

/**
 * Deletes a storage object with error validation (used for cleanup when upload is aborted or rejected).
 */
export async function cleanupStorageObject(bucket, filePath) {
    if (!isSupabaseConfigured || !filePath) return { data: null, error: null };
    try {
        const { data, error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) {
            console.error("[cleanupStorageObject] Removal error:", error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error("[cleanupStorageObject] Exception during cleanup:", err);
        return { data: null, error: err };
    }
}

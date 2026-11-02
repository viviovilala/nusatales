import * as tus from "tus-js-client";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

// Strict conservative storage limits (decimal aligned with Supabase Free Tier)
export const MAX_VIDEO_BYTES = 50_000_000; // 50 MB
export const MAX_THUMBNAIL_BYTES = 5_000_000; // 5 MB
export const MAX_AVATAR_BYTES = 2_000_000; // 2 MB

/**
 * Extracts duration, dimensions, and auto-generates a first-frame thumbnail from a video file.
 */
export async function extractVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.URL) {
            return resolve({
                durationSeconds: 15,
                thumbnailBlob: null,
                width: 1920,
                height: 1080,
                aspectRatio: 16 / 9,
            });
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
            const rawDuration = video.duration || 0;
            video.currentTime = Math.min(0.5, rawDuration / 2);
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
    onProgress,
}) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase belum dikonfigurasi.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    let uploadInstance = null;
    let isAborted = false;

    const promise = new Promise(async (resolve, reject) => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token || anonKey;

            const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

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
                metadata: {
                    bucketName: bucket,
                    objectName: filePath,
                    contentType: file.type || "video/mp4",
                    cacheControl: "3600",
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                onError: (error) => {
                    if (isAborted) {
                        const cancelErr = new Error("Pengunggahan dibatalkan oleh pengguna.");
                        cancelErr.isCancelled = true;
                        return reject(cancelErr);
                    }
                    console.error("[TUS Upload Error]", error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    if (isAborted) return;
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
                    if (isAborted) {
                        const cancelErr = new Error("Pengunggahan dibatalkan.");
                        cancelErr.isCancelled = true;
                        return reject(cancelErr);
                    }
                    resolve({ path: filePath });
                },
            });

            // Attempt to resume previous unfinished upload if fingerprint matches
            if (uploadInstance.findPreviousUploads) {
                uploadInstance.findPreviousUploads().then((previousUploads) => {
                    if (isAborted) return;
                    if (previousUploads && previousUploads.length > 0) {
                        uploadInstance.resumeFromPreviousUpload(previousUploads[0]);
                    }
                    uploadInstance.start();
                }).catch(() => {
                    if (!isAborted) uploadInstance.start();
                });
            } else {
                uploadInstance.start();
            }
        } catch (err) {
            reject(err);
        }
    });

    return {
        promise,
        abort: () => {
            isAborted = true;
            if (uploadInstance) {
                uploadInstance.abort();
            }
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
    onProgress,
    onUploadInstance,
}) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase belum dikonfigurasi.");
    }

    const determinedType = contentType || file.type || (bucket === "thumbnails" ? "image/webp" : "video/mp4");

    // VIDEO: Pure TUS upload — strictly NO standard upload fallback on network failure or cancel!
    if (bucket === "videos") {
        const tusTask = uploadWithTus({
            bucket,
            filePath,
            file,
            onProgress: (prog) => {
                if (onProgress) onProgress(prog.percent, prog);
            },
        });

        if (onUploadInstance) {
            onUploadInstance(tusTask);
        }

        return await tusTask.promise;
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

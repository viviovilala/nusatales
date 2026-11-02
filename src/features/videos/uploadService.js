import * as tus from "tus-js-client";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

/**
 * Extracts duration, dimensions, and auto-generates a first-frame thumbnail from a video file.
 */
export async function extractVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.URL) {
            // Non-browser environment fallback
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
            // Seek to 0.5s or halfway
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
 * Resumable upload using TUS protocol for large media files (Supabase Storage TUS endpoint).
 * Returns an object with { promise, abort }.
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
                    console.error("[TUS Upload Error]", error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
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
                    resolve({ path: filePath });
                },
            });

            uploadInstance.start();
        } catch (err) {
            reject(err);
        }
    });

    return {
        promise,
        abort: () => {
            if (uploadInstance) {
                uploadInstance.abort();
            }
        },
    };
}

/**
 * Uploads a file with progress reporting.
 * Prefers TUS resumable upload for video media in the 'videos' bucket,
 * and falls back to standard Supabase client upload for images or if TUS encounters an environment issue.
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

    // For video files, attempt TUS resumable upload
    if (bucket === "videos" && typeof window !== "undefined") {
        try {
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
        } catch (tusErr) {
            console.warn("[uploadMediaWithProgress] TUS upload failed or interrupted, trying standard upload fallback:", tusErr);
            // Fall back to standard upload
        }
    }

    // Standard client upload fallback (also used for thumbnails)
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
 * Deletes a storage object (used for cleanup when upload is aborted or rejected).
 */
export async function cleanupStorageObject(bucket, filePath) {
    if (!isSupabaseConfigured || !filePath) return;
    try {
        await supabase.storage.from(bucket).remove([filePath]);
    } catch (err) {
        console.warn("[cleanupStorageObject] Cleanup warning:", err);
    }
}

import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

/**
 * Extracts duration and auto-generates a first-frame thumbnail from a video file.
 */
export async function extractVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
        const videoUrl = URL.createObjectURL(videoFile);
        const video = document.createElement("video");

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        video.src = videoUrl;

        // Fallback safety timeout if browser stalls
        const timer = setTimeout(() => {
            URL.revokeObjectURL(videoUrl);
            reject(new Error("Gagal membaca berkas video (waktu pemuatan habis)."));
        }, 12000);

        video.onloadedmetadata = () => {
            const rawDuration = video.duration || 0;
            const durationSeconds = Math.max(1, Math.round(rawDuration));

            // Seek to 0.5s (or start) to capture first frame
            video.currentTime = Math.min(0.5, rawDuration / 2);
        };

        video.onseeked = () => {
            clearTimeout(timer);

            try {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth || 720;
                canvas.height = video.videoHeight || 1280;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }

                canvas.toBlob(
                    (thumbnailBlob) => {
                        URL.revokeObjectURL(videoUrl);

                        const durationSeconds = Math.max(1, Math.round(video.duration || 0));
                        resolve({
                            durationSeconds,
                            thumbnailBlob,
                            width: video.videoWidth,
                            height: video.videoHeight,
                        });
                    },
                    "image/webp",
                    0.85
                );
            } catch (err) {
                URL.revokeObjectURL(videoUrl);
                // Return metadata even if canvas capture fails
                resolve({
                    durationSeconds: Math.max(1, Math.round(video.duration || 0)),
                    thumbnailBlob: null,
                    width: video.videoWidth,
                    height: video.videoHeight,
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
 * Uploads a file to Supabase Storage using the official Supabase SDK client.
 * Guarantees correct apikey headers, authentication JWT, and MIME types.
 */
export async function uploadMediaWithProgress({
    bucket,
    filePath,
    file,
    contentType,
    onProgress,
}) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase belum dikonfigurasi.");
    }

    if (onProgress) onProgress(20);

    const determinedType = contentType || file.type || (bucket === "thumbnails" ? "image/webp" : "video/mp4");

    if (onProgress) onProgress(45);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: determinedType,
            upsert: false,
        });

    if (error) {
        throw error;
    }

    if (onProgress) onProgress(100);

    return { path: data.path };
}

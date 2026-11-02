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
                // Return metadata even if canvas capture is blocked
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
 * Uploads a file to Supabase Storage with progress tracking.
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

    if (onProgress) onProgress(15);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;

    // Use XMLHttpRequest for real progress events if auth token and projectUrl are available
    if (token && projectUrl && typeof XMLHttpRequest !== "undefined") {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `${projectUrl}/storage/v1/object/${bucket}/${filePath}`;

            xhr.open("POST", url, true);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            if (contentType || file.type) {
                xhr.setRequestHeader("Content-Type", contentType || file.type);
            }
            xhr.setRequestHeader("x-upsert", "false");

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percent = Math.round((event.loaded / event.total) * 90);
                    onProgress(Math.max(15, percent));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (onProgress) onProgress(100);
                    resolve({ path: filePath });
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        reject(new Error(err.message || "Gagal mengunggah berkas ke penyimpanan."));
                    } catch {
                        reject(new Error(`Gagal mengunggah berkas (${xhr.status}).`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error("Terjadi kesalahan jaringan saat mengunggah berkas."));
            };

            xhr.send(file);
        });
    }

    // Fallback using Supabase client
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: contentType || file.type,
            upsert: false,
        });

    if (error) throw error;
    if (onProgress) onProgress(100);
    return { path: data.path };
}

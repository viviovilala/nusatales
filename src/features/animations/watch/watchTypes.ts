import type { ReelCreator } from "../../reels/reelTypes";

// The current API exposes standalone video records. Series/episode identity
// must come from a future persisted relation, never title matching or creator.
export type WatchAnimation = {
    id: string; title: string; description: string | null; storagePath: string | null;
    thumbnailPath: string | null; durationSeconds: number | null; publishedAt: string | null;
    creator: ReelCreator;
};
export type WatchComment = { id: string; content: string; createdAt: string; userId: string; user: ReelCreator };

export function watchTime(value: number) {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

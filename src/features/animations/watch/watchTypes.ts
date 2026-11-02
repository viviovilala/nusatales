import type { ReelCreator } from "../../reels/reelTypes";
import type { AnimationEpisode, AnimationTitle } from "../animationTypes";

// Series identity comes only from the persisted relation, never title matching.
export type WatchAnimation = {
    id: string; title: string; description: string | null; storagePath: string | null;
    thumbnailPath: string | null; durationSeconds: number | null; publishedAt: string | null;
    creator: ReelCreator;
    animation: AnimationTitle; episodes: AnimationEpisode[];
    current: { season_number: number; episode_number: number };
};
export type WatchComment = { id: string; content: string; createdAt: string; userId: string; user: ReelCreator };

export function watchTime(value: number) {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds / 60) % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

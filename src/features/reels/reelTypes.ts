export type ReelCreator = {
    id?: string | null;
    username?: string | null;
    displayName: string;
    avatarPath?: string | null;
};

export type ReelVideo = {
    id: string;
    title: string;
    description: string | null;
    storagePath: string | null;
    thumbnailPath: string | null;
    durationSeconds: number | null;
    contentType: "reel" | "animation";
    publishedAt: string | null;
    creator: ReelCreator;
};

export type ReelComment = {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    user: ReelCreator;
};

export type ReelPanel = { kind: "comments" } | { kind: "creator"; creator: ReelCreator } | null;

export function formatReelTime(seconds: number): string {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

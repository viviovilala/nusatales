export type StudioVideo = {
    id: string;
    title: string;
    description: string | null;
    storage_path: string | null;
    thumbnail_path: string | null;
    duration_seconds: number | null;
    content_type: "animation" | "reel";
    status: "published" | "draft";
    created_at: string | null;
    published_at: string | null;
    publicly_available?: boolean;
};

export type StudioAction = "publish" | "unpublish" | "delete";
export type StudioChange = { id: string; status?: StudioVideo["status"]; deleted?: boolean };

export function studioDate(value: string | null) {
    const date = value ? new Date(value) : null;
    return date && Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date) : "Tanggal belum tersedia";
}

export function studioDuration(value: number | null) {
    if (!value || !Number.isFinite(value) || value < 0) return "—";
    const seconds = Math.floor(value);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

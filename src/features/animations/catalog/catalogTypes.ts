export type CatalogVideo = {
    id: string;
    title: string;
    description: string | null;
    thumbnailPath: string | null;
    durationSeconds: number | null;
    publishedAt: string | null;
    creator: { id?: string; username?: string; displayName: string; avatarPath?: string | null };
};
export type CatalogDuration = "all" | "short" | "medium" | "long";
export type CatalogSort = "newest" | "oldest" | "title";
export type CatalogQuery = { search: string; page: number; duration: CatalogDuration; sort: CatalogSort };
export const CATALOG_PAGE_SIZE = 12;
export const durationFilters: ReadonlyArray<{ value: CatalogDuration; label: string }> = [
    { value: "all", label: "Semua durasi" }, { value: "short", label: "Hingga 5 menit" },
    { value: "medium", label: "5–15 menit" }, { value: "long", label: "Lebih dari 15 menit" },
];

export function readCatalogQuery(params: URLSearchParams): CatalogQuery {
    const page = Number(params.get("page"));
    const duration = params.get("durasi"); const sort = params.get("urut");
    return {
        search: (params.get("q") || "").trim().slice(0, 120),
        page: Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1,
        duration: duration === "short" || duration === "medium" || duration === "long" ? duration : "all",
        sort: sort === "oldest" || sort === "title" ? sort : "newest",
    };
}
export function catalogParams(query: CatalogQuery) {
    const params = new URLSearchParams();
    if (query.search) params.set("q", query.search);
    if (query.duration !== "all") params.set("durasi", query.duration);
    if (query.sort !== "newest") params.set("urut", query.sort);
    if (query.page > 1) params.set("page", String(query.page));
    return params;
}
export function catalogDuration(value: number | null) {
    if (!value || !Number.isFinite(value) || value < 0) return "Durasi belum tersedia";
    const seconds = Math.floor(value);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
        : `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
export function catalogDate(value: string | null) {
    const date = value ? new Date(value) : null;
    return date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date) : "";
}
export function isNewPublication(value: string | null) {
    const age = value ? Date.now() - Date.parse(value) : NaN;
    return Number.isFinite(age) && age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
}

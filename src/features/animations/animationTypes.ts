export type Taxonomy = { id: string; name: string; slug: string; active: boolean };
export type AnimationTitle = {
    id: string; creator_id: string; title: string; slug: string; synopsis: string | null;
    format: "film" | "series"; poster_path: string | null; banner_path: string | null;
    release_year: number | null; language: string; origin_region: string | null;
    age_guidance: "all" | "13+" | "17+"; story_status: "ongoing" | "completed";
    status: "draft" | "published"; created_at: string; published_at: string | null;
    genreIds: string[]; cultureIds: string[]; genres: string[]; cultures: string[];
};
export type AnimationInput = Pick<AnimationTitle, "title" | "synopsis" | "format" | "poster_path" | "banner_path" | "release_year" | "language" | "origin_region" | "age_guidance" | "story_status">;
export type AnimationEpisode = {
    video_id: string; animation_id: string; season_number: number; episode_number: number;
    video: { id: string; title: string; description: string | null; status: "draft" | "published";
        thumbnail_path: string | null; storage_path: string | null; duration_seconds: number | null; deleted_at: string | null };
};
export function episodeLabel(episode: Pick<AnimationEpisode, "season_number" | "episode_number">, format: AnimationTitle["format"]) {
    return format === "film" ? "Film utama" : `Musim ${episode.season_number} · Episode ${episode.episode_number}`;
}
export function animationChanged() { window.dispatchEvent(new Event("nusatales:videos-changed")); }

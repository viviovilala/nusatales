import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import type { AnimationEpisode, AnimationInput, AnimationTitle, Taxonomy } from "./animationTypes";

type Link = { genre_id?: string; culture_tag_id?: string; genre?: { name: string } | null; culture?: { name: string } | null };
type TitleRow = Omit<AnimationTitle, "genreIds" | "cultureIds" | "genres" | "cultures"> & { animation_genres?: Link[]; animation_culture_tags?: Link[] };
const titleSelect = "*, animation_genres(genre_id,genre:genres(name)), animation_culture_tags(culture_tag_id,culture:culture_tags(name))";
function title(row: TitleRow): AnimationTitle {
    return { ...row, genreIds: (row.animation_genres || []).flatMap((link) => link.genre_id ? [link.genre_id] : []),
        cultureIds: (row.animation_culture_tags || []).flatMap((link) => link.culture_tag_id ? [link.culture_tag_id] : []),
        genres: (row.animation_genres || []).flatMap((link) => link.genre ? [link.genre.name] : []),
        cultures: (row.animation_culture_tags || []).flatMap((link) => link.culture ? [link.culture.name] : []) };
}
function configured() { if (!isSupabaseConfigured) throw new Error("Supabase belum dikonfigurasi."); }
function requireData<T>(data: T | null, error: { message: string } | null): T {
    if (error) throw error;
    if (data === null) throw new Error("Animasi tidak ditemukan atau belum tersedia.");
    return data;
}

export const animationRepository = {
    async taxonomies() {
        configured();
        const [genres, cultures] = await Promise.all([supabase.from("genres").select("*").eq("active", true).order("sort_order"),
            supabase.from("culture_tags").select("*").eq("active", true).order("sort_order")]);
        return { genres: requireData(genres.data, genres.error) as Taxonomy[], cultures: requireData(cultures.data, cultures.error) as Taxonomy[] };
    },
    async mine(userId: string) {
        configured();
        const result = await supabase.from("animations").select(titleSelect).eq("creator_id", userId).is("deleted_at", null).order("created_at", { ascending: false });
        return (requireData(result.data, result.error) as unknown as TitleRow[]).map(title);
    },
    async get(id: string) {
        configured();
        const result = await supabase.from("animations").select(titleSelect).eq("id", id).is("deleted_at", null).maybeSingle();
        return title(requireData(result.data, result.error) as unknown as TitleRow);
    },
    async episodes(id: string) {
        configured();
        const result = await supabase.from("animation_episodes").select("*,video:videos!animation_episodes_video_id_fkey(id,title,description,status,thumbnail_path,storage_path,duration_seconds,deleted_at)")
            .eq("animation_id", id).order("season_number").order("episode_number");
        type Row = Omit<AnimationEpisode, "video"> & { video: AnimationEpisode["video"] | AnimationEpisode["video"][] | null };
        return (requireData(result.data, result.error) as unknown as Row[]).flatMap((row) => {
            const video = Array.isArray(row.video) ? row.video[0] : row.video;
            return video && !video.deleted_at ? [{ ...row, video }] : [];
        });
    },
    async context(videoId: string) {
        configured();
        const result = await supabase.from("animation_episodes").select("animation_id,season_number,episode_number").eq("video_id", videoId).maybeSingle();
        const link = requireData(result.data, result.error) as { animation_id: string; season_number: number; episode_number: number };
        const [animation, episodes] = await Promise.all([this.get(link.animation_id), this.episodes(link.animation_id)]);
        if (animation.status !== "published") throw new Error("Animasi ini belum dipublikasikan.");
        if (!episodes.some((episode) => episode.video_id === videoId && episode.video.status === "published")) throw new Error("Episode ini belum tersedia untuk ditonton.");
        return { animation, episodes: episodes.filter((episode) => episode.video.status === "published"), current: link };
    },
    async save(id: string | null, input: AnimationInput, genreIds: string[], cultureIds: string[]) {
        configured();
        const result = await supabase.rpc("save_animation", { p_id: id, p_input: input, p_genre_ids: genreIds, p_culture_ids: cultureIds }).single();
        return requireData(result.data, result.error) as unknown as TitleRow;
    },
    async status(id: string, action: "publish" | "unpublish" | "delete") {
        configured();
        const result = await supabase.rpc("set_animation_status", { p_id: id, p_action: action }).single();
        return requireData(result.data, result.error) as unknown as TitleRow;
    },
    async move(videoId: string, animationId: string, season: number, episode: number) {
        configured();
        const result = await supabase.rpc("move_animation_episode", { p_video_id: videoId, p_animation_id: animationId, p_season: season, p_episode: episode });
        if (result.error) throw result.error;
    },
};

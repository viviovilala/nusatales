// Mock the title/episode API contract. Authorization is tested separately in
// database-security.mjs against real PostgreSQL, never inferred from this mock.
export const taxonomy = [{ id: "genre-fantasi", name: "Fantasi", slug: "fantasi", active: true }, { id: "genre-drama", name: "Drama", slug: "drama", active: true }];
export function animationTitles(videos) {
    const groups = new Map();
    for (const video of videos.filter((item) => item.content_type === "animation" && !item.deleted_at)) {
        const id = video.animation_id || video.id;
        if (!groups.has(id)) groups.set(id, { id, creator_id: video.creator_id, title: video.animation_title || video.title,
            slug: `animasi-${id}`, synopsis: video.description, poster_path: video.thumbnail_path, banner_path: null, format: video.animation_format || "film",
            status: video.animation_status || video.status, language: "Bahasa Indonesia", age_guidance: "all", story_status: "ongoing", origin_region: null, release_year: 2026,
            created_at: video.published_at || "2026-11-02T00:00:00Z", published_at: video.published_at, creator: video.creator,
            animation_genres: [{ genre_id: taxonomy[0].id, genre: { name: "Fantasi" } }], animation_culture_tags: [], episodes: [] });
        groups.get(id).episodes.push({ video_id: video.id, animation_id: id, season_number: video.season_number || 1, episode_number: video.episode_number || 1, video });
    }
    return [...groups.values()];
}
export function animationCatalogRows(videos) {
    return animationTitles(videos).filter((title) => title.status === "published").flatMap((title) => {
        const published = title.episodes.filter((episode) => episode.video.status === "published");
        if (!published.length) return [];
        return [{ ...title, description: title.synopsis, thumbnail_path: title.poster_path, content_type: "animation", deleted_at: null,
            genre_slugs: ["fantasi"], genres: ["Fantasi"], episode_count: published.length, first_video_id: published[0].video_id,
            duration_seconds: published.reduce((total, episode) => total + (episode.video.duration_seconds || 0), 0) }];
    });
}
export async function mockAnimationRelations(page, getVideos) {
    for (const name of ["animations", "animation_episodes", "genres", "culture_tags"]) await page.route(`**/rest/v1/${name}?*`, async (route) => {
        const url = new URL(route.request().url()), titles = animationTitles(getVideos());
        if (name === "genres") return route.fulfill({ json: taxonomy });
        if (name === "culture_tags") return route.fulfill({ json: [] });
        if (name === "animations") {
            const id = url.searchParams.get("id")?.replace("eq.", "");
            return route.fulfill({ json: id ? titles.find((title) => title.id === id) || null : titles });
        }
        const videoId = url.searchParams.get("video_id")?.replace("eq.", ""), parent = url.searchParams.get("animation_id")?.replace("eq.", "");
        const episodes = titles.flatMap((title) => title.episodes);
        return route.fulfill({ json: videoId ? episodes.find((episode) => episode.video_id === videoId) || null : episodes.filter((episode) => episode.animation_id === parent) });
    });
}

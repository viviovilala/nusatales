import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { animationCatalogRows, mockAnimationRelations } from "./helpers/animation-api";

const creators = [0, 1, 2].map((index) => ({ id: `creator-${index}`, username: `studio_${index}`, display_name: ["Studio Nusantara", "Sanggar Rimba", "Pijar Animasi"][index], avatar_path: null, bio: "Menghidupkan cerita rakyat lewat karya animasi." }));
const records = Array.from({ length: 30 }, (_, index) => ({
    id: `film-${String(index).padStart(2, "0")}`, title: ["Kisah Seribu Candi", "Sangkuriang", "Timun Mas"][index] || `Legenda ${String(index).padStart(2, "0")}`,
    description: "Sebuah kisah tentang keberanian, cinta, dan budaya Nusantara.", content_type: "animation", status: "published",
    duration_seconds: [120, 600, 1200][index % 3], thumbnail_path: `owner/film-${index}/thumb.png`, storage_path: `owner/film-${index}/media.webm`,
    published_at: new Date(Date.UTC(2026, 10, 2) - index * 86400000).toISOString(), creator_id: creators[index % 3].id, creator: creators[index % 3],
}));

async function project(page) {
    const state = { videos: structuredClone(records), failList: false, requests: [], heldSearch: "", release: null, badThumbnail: "", publicImages: [] };
    await page.route("**/auth/v1/**", (route) => route.fulfill({ status: 401, json: { message: "Anonymous fixture" } }));
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request(); const url = new URL(request.url());
        if (url.pathname.endsWith("/profiles")) {
            const id = url.searchParams.get("id")?.replace("eq.", "");
            return route.fulfill({ json: creators.find((creator) => creator.id === id) || creators[0] });
        }
        if (!url.pathname.endsWith("/videos") && !url.pathname.endsWith("/animation_catalog")) return route.fulfill({ json: [] });
        if (url.searchParams.has("id")) return route.fulfill({ json: state.videos.find((video) => `eq.${video.id}` === url.searchParams.get("id")) || null });
        const limit = Number(url.searchParams.get("limit") || 12), offset = Number(url.searchParams.get("offset") || 0);
        const search = (url.searchParams.get("title") || "").replace(/^ilike\.%|%$/g, "");
        const filters = url.searchParams.getAll("duration_seconds");
        const order = url.searchParams.get("order") || "published_at.desc,id.desc";
        state.requests.push({ limit, offset, search, filters, order });
        let data = (url.pathname.endsWith("/animation_catalog") ? animationCatalogRows(state.videos) : state.videos).filter((video) => video.status === "published" && video.content_type === "animation" && (!search || video.title.toLowerCase().includes(search.toLowerCase())));
        const genre = url.searchParams.get("genre_slugs");
        if (genre) data = data.filter((video) => genre.includes("fantasi"));
        const creator = url.searchParams.get("creator_id")?.replace("eq.", "");
        if (creator) data = data.filter((video) => video.creator_id === creator);
        for (const filter of filters) { const [operator, value] = filter.split("."); data = data.filter((video) => operator === "lte" ? video.duration_seconds <= Number(value) : video.duration_seconds > Number(value)); }
        data.sort((a, b) => order.startsWith("title") ? a.title.localeCompare(b.title, "id") : order.startsWith("published_at.asc") ? a.published_at.localeCompare(b.published_at) : b.published_at.localeCompare(a.published_at));
        const count = data.length;
        const snapshot = structuredClone(creator ? data : data.slice(offset, offset + limit));
        if (search && search === state.heldSearch) await new Promise((resolve) => { state.release = resolve; });
        if (state.failList && limit === 12) return route.fulfill({ status: 400, json: { code: "PGRST100", message: "Koneksi katalog sedang bermasalah." } });
        try { await route.fulfill({ json: snapshot, headers: { "content-range": `${offset}-${Math.max(offset, offset + snapshot.length - 1)}/${count}`, "access-control-expose-headers": "content-range" } }); }
        catch { /* A superseded search may already have been aborted by its owner. */ }
    });
    await page.route("**/storage/v1/**", (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.includes("/object/public/")) state.publicImages.push(url.pathname);
        if (route.request().method() === "POST") {
            if (state.badThumbnail && url.pathname.includes(state.badThumbnail)) return route.fulfill({ status: 400, json: { message: "Fixture image unavailable" } });
            return route.fulfill({ json: { signedURL: url.pathname.replace("/storage/v1", "") + "?token=fixture" } });
        }
        return route.fulfill({ contentType: "image/png", path: fileURLToPath(new URL("./fixtures/reels-art-2.png", import.meta.url)) });
    });
    await mockAnimationRelations(page, () => state.videos);
    return state;
}
const card = (page, title) => page.getByRole("article", { name: `Animasi ${title}`, exact: true });
const ready = (page, count = 12) => expect(page.locator(".catalog-card")).toHaveCount(count);

test("Jelajah uses a four-column poster grid, real featured films and signed artwork", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const state = await project(page); const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/animations"); await ready(page);
    await expect(page.locator(".catalog-hero h1")).toHaveText("Kisah Seribu Candi");
    await expect(page.locator(".catalog-hero").getByRole("link", { name: "Tonton sekarang" })).toHaveAttribute("href", "/watch/film-00");
    await expect(card(page, "Kisah Seribu Candi").getByRole("link", { name: "Tonton Kisah Seribu Candi" })).toHaveAttribute("href", "/watch/film-00");
    expect(await page.locator(".catalog-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
    await expect.poll(() => card(page, "Kisah Seribu Candi").locator(".catalog-poster img").evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    await page.getByRole("button", { name: "Cerita pilihan berikutnya" }).click();
    await expect(page.locator(".catalog-hero h1")).toHaveText("Sangkuriang");
    await page.getByRole("button", { name: "Cerita pilihan sebelumnya" }).click();
    await expect(page.locator(".catalog-hero h1")).toHaveText("Kisah Seribu Candi");
    await page.getByRole("button", { name: "Cerita pilihan 3: Timun Mas", exact: true }).click();
    await expect(page.locator(".catalog-hero").getByRole("link", { name: "Tonton sekarang" })).toHaveAttribute("href", "/watch/film-02");
    expect(await page.locator("h1").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Plus Jakarta Sans");
    await expect(page.locator(".nusa-original-logo")).toHaveAttribute("src", "/poto/logo.png");
    await expect(page.getByRole("navigation", { name: "Halaman koleksi" }).getByRole("link", { name: "Halaman 1", exact: true })).toHaveAttribute("aria-current", "page");
    await page.screenshot({ path: info.outputPath("jelajah-desktop.png"), fullPage: true });
    expect(state.publicImages).toEqual([]); expect(errors).toEqual([]);
});

test("search, duration, order and numbered pages use server data and survive history", async ({ page }) => {
    const state = await project(page); await page.goto("/animations"); await ready(page);
    await page.getByRole("link", { name: "Halaman 2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/); await ready(page);
    await expect(card(page, "Legenda 12")).toBeVisible();
    expect(state.requests.some((request) => request.limit === 12 && request.offset === 12)).toBe(true);
    await page.getByRole("button", { name: "Hingga 5 menit", exact: true }).click();
    await expect(page).toHaveURL(/durasi=short$/); await ready(page, 10);
    await expect(card(page, "Sangkuriang")).toHaveCount(0);
    await page.getByRole("combobox", { name: "Urutkan animasi" }).selectOption("oldest");
    await expect(page.locator(".catalog-card").first()).toHaveAccessibleName("Animasi Legenda 27");
    await page.getByRole("searchbox", { name: "Cari judul animasi" }).fill("Legenda");
    await page.getByRole("button", { name: "Cari animasi", exact: true }).click(); await ready(page, 9);
    await expect(page.getByRole("heading", { name: "Hasil pencarian: “Legenda”" })).toBeVisible();
    await page.goBack(); await ready(page, 10);
    await expect(page.getByRole("searchbox", { name: "Cari judul animasi" })).toHaveValue("");
    await page.goForward(); await ready(page, 9);
    await expect(page.getByRole("searchbox", { name: "Cari judul animasi" })).toHaveValue("Legenda");
    await page.getByRole("button", { name: "Reset filter", exact: true }).click(); await ready(page);
    await expect(page).toHaveURL(/\/animations$/);
});

test("out-of-range and malformed page links recover without empty-state confusion", async ({ page }) => {
    const state = await project(page);
    await page.goto("/animations?page=999"); await ready(page, 6);
    await expect(page).toHaveURL(/page=3$/);
    await expect(card(page, "Legenda 24")).toBeVisible();
    await page.reload(); await ready(page, 6);
    await page.goto("/animations?page=-2&durasi=invalid&urut=invalid"); await ready(page);
    await expect(card(page, "Kisah Seribu Candi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Semua durasi", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(state.requests.at(-1).offset).toBe(0);
});

test("a late search response cannot replace the current results", async ({ page }) => {
    const state = await project(page); await page.goto("/animations"); await ready(page);
    state.heldSearch = "Kisah";
    const input = page.getByRole("searchbox", { name: "Cari judul animasi" });
    await input.fill("Kisah"); await page.getByRole("button", { name: "Cari animasi", exact: true }).click();
    await expect.poll(() => Boolean(state.release)).toBe(true);
    await expect(page.getByRole("status", { name: "Memuat koleksi animasi" })).toBeVisible();
    await input.fill("Timun"); await page.getByRole("button", { name: "Cari animasi", exact: true }).click(); await ready(page, 1);
    await expect(card(page, "Timun Mas")).toBeVisible();
    state.release();
    await expect(page.getByRole("heading", { name: "Hasil pencarian: “Timun”" })).toBeVisible();
    await expect(card(page, "Kisah Seribu Candi")).toHaveCount(0);
});

test("failure, no matches and an empty catalog expose distinct recovery actions", async ({ page }, info) => {
    const state = await project(page); state.failList = true;
    await page.goto("/animations");
    await expect(page.getByRole("alert")).toContainText("Koneksi katalog sedang bermasalah");
    await expect(page.getByRole("heading", { name: "Koleksi cerita segera hadir." })).toHaveCount(0);
    state.failList = false; await page.getByRole("button", { name: "Coba lagi", exact: true }).click(); await ready(page);
    state.failList = true;
    await page.getByRole("link", { name: "Halaman 2", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(".catalog-card")).toHaveCount(0);
    state.failList = false; await page.getByRole("button", { name: "Coba lagi", exact: true }).click(); await ready(page);
    await expect(card(page, "Legenda 12")).toBeVisible();
    const input = page.getByRole("searchbox", { name: "Cari judul animasi" });
    await input.fill("Tidak tersedia"); await page.getByRole("button", { name: "Cari animasi", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kisahnya belum ketemu." })).toBeVisible();
    await page.getByRole("button", { name: "Lihat semua animasi", exact: true }).click(); await ready(page);
    state.videos = []; await page.reload();
    await expect(page.getByRole("heading", { name: "Koleksi cerita segera hadir." })).toBeVisible();
    await expect(page.locator(".catalog-hero-art")).toHaveAttribute("src", "/poto/hero-roro-closeup.webp");
    await page.screenshot({ path: info.outputPath("jelajah-empty.png") });
    await page.getByRole("link", { name: "Bagikan karyamu", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Masuk", exact: true })).toBeVisible();
});

test("missing artwork stays honest and creator profiles open in a popup without resetting the catalog", async ({ page }, info) => {
    const state = await project(page); state.videos[0].thumbnail_path = null; state.badThumbnail = "film-1/";
    await page.goto("/animations"); await ready(page);
    await expect(card(page, "Kisah Seribu Candi").locator(".catalog-poster-placeholder")).toBeVisible();
    await expect(card(page, "Sangkuriang").locator(".catalog-poster-placeholder")).toBeVisible();
    await expect(card(page, "Kisah Seribu Candi").locator("img")).toHaveCount(0);
    await card(page, "Kisah Seribu Candi").getByRole("button", { name: "Studio Nusantara", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Profil kreator", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Menghidupkan cerita rakyat lewat karya animasi.")).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Kisah Seribu Candi/ })).toHaveAttribute("href", "/watch/film-00");
    await page.screenshot({ path: info.outputPath("jelajah-creator-popup.png") });
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/animations$/); await ready(page);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
    state.videos[0].title = "Cerita diperbarui";
    await page.evaluate(() => window.dispatchEvent(new Event("nusatales:videos-changed")));
    await expect(card(page, "Cerita diperbarui")).toBeVisible();
});

test("mobile and tablet keep the poster grid, filter scrolling and batik behind content", async ({ page }, info) => {
    await project(page); await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/animations"); await ready(page);
    for (const width of [320, 390, 700, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const columns = await page.locator(".catalog-grid").evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(width <= 560 ? 2 : width <= 760 ? 3 : 4);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Lebih dari 15 menit", exact: true }).click(); await ready(page, 10);
    await expect(card(page, "Timun Mas")).toBeVisible();
    await page.getByRole("button", { name: "Semua durasi", exact: true }).click(); await ready(page);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: info.outputPath("jelajah-mobile.png"), fullPage: true });
    const pattern = await page.locator(".app-surface").evaluate((element) => { const style = getComputedStyle(element, "::before"); return [style.zIndex, style.pointerEvents, style.maskImage]; });
    expect(pattern).toEqual(["0", "none", expect.stringContaining("kawung.svg")]);
    await card(page, "Timun Mas").getByRole("link", { name: "Tonton Timun Mas", exact: true }).click();
    await expect(page).toHaveURL(/\/watch\/film-02$/);
    await expect(page.locator(".watch-summary").getByRole("heading", { name: "Timun Mas", exact: true })).toBeVisible();
    expect(await page.locator(".app-surface").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(25, 23, 19)");
});

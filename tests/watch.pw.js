import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mockMediaPlayback } from "./helpers/media-mock";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "watch@example.test", aud: "authenticated", role: "authenticated", user_metadata: { display_name: "Studio Uji" } };
const creator = { id: user.id, display_name: "Studio Uji", username: "studio_uji", bio: "Cerita dari Nusantara.", avatar_path: "owner/avatar.png" };
const other = { id: "22222222-2222-4222-8222-222222222222", display_name: "Sari", username: "sari", avatar_path: null };
const films = [0, 1, 2].map((index) => ({ id: `animation-${index}`, creator_id: creator.id, title: ["Kisah Gajah Mada", "Kisah Seribu Candi", "Petualangan Timun Mas"][index],
    description: "Gajah Mada memulai perjalanan panjang mengenal Nusantara.\n".repeat(6), content_type: "animation", status: "published", duration_seconds: 30,
    storage_path: `owner/animation-${index}/media.webm`, thumbnail_path: `owner/animation-${index}/thumb.png`, published_at: "2026-11-02T01:00:00Z", creator }));
const reel = { ...films[1], id: "short-1", content_type: "reel", title: "Reel terpisah" };
async function project(page) {
    const state = { signs: 0, signFail: false, recordFail: false, relatedFail: false, likesFail: false, commentLoadFail: false, commentFail: false, deleteFail: false,
        liked: false, likes: 4, deletes: [], inserts: 0, holdRecord: false, releaseRecord: null, reads: [],
        comments: [{ id: "own-1", content: "Komentarku sendiri.", created_at: "2026-11-02T02:00:00Z", user_id: user.id, user: creator },
            { id: "other-1", content: "Ceritanya menarik!", created_at: "2026-11-02T01:00:00Z", user_id: other.id, user: other }] };
    await mockMediaPlayback(page);
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.fixture`;
    await page.route("**/auth/v1/**", (route) => route.fulfill({ json: route.request().url().includes("/token") ? { access_token: token, refresh_token: "fixture", expires_in: 3600, token_type: "bearer", user } : user }));
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.pathname.endsWith("/profiles")) return route.fulfill({ json: creator });
        if (url.pathname.endsWith("/videos")) {
            const id = url.searchParams.get("id")?.replace("eq.", "");
            if (id) {
                if (state.holdRecord && id === "slow-reel") { await new Promise((resolve) => { state.releaseRecord = resolve; }); try { return await route.fulfill({ json: reel }); } catch { return; } }
                if (state.recordFail) return route.fulfill({ status: 400, json: { message: "Animasi sementara tidak tersedia." } });
                return route.fulfill({ json: id === "draft" ? { ...films[0], status: "draft" } : id === reel.id ? reel : films.find((film) => film.id === id) || null });
            }
            state.reads.push(url.search);
            if (state.relatedFail) return route.fulfill({ status: 400, json: { message: "Rekomendasi belum tersedia." } });
            // Include a bad reel in this fixture to verify the viewer filters it
            // defensively and never presents it as an episode or animation.
            return route.fulfill({ json: [...films, reel], headers: { "content-range": "0-3/4", "access-control-expose-headers": "content-range" } });
        }
        if (url.pathname.endsWith("/video_likes")) {
            if (request.method() === "HEAD") return route.fulfill({ body: "", headers: { "content-range": `*/${state.likes}`, "access-control-expose-headers": "content-range" } });
            if (request.method() === "GET") return route.fulfill({ json: state.liked ? { video_id: "animation-0" } : null });
            if (state.likesFail) return route.fulfill({ status: 400, json: { message: "Suka ditolak." } });
            state.liked = request.method() === "POST"; state.likes += state.liked ? 1 : -1;
            return route.fulfill({ json: null });
        }
        if (url.pathname.endsWith("/video_comments")) {
            if (request.method() === "POST") {
                state.inserts++;
                if (state.commentFail) return route.fulfill({ status: 400, json: { message: "Komentar gagal disimpan." } });
                const comment = { id: `new-${state.inserts}`, content: request.postDataJSON().content, created_at: "2026-11-02T04:00:00Z", user_id: user.id, user: creator };
                state.comments.unshift(comment); return route.fulfill({ json: comment });
            }
            if (request.method() === "DELETE") {
                if (state.deleteFail) return route.fulfill({ status: 400, json: { message: "Komentar belum berhasil dihapus." } });
                const id = url.searchParams.get("id")?.replace("eq.", ""); state.deletes.push({ id, userId: url.searchParams.get("user_id") });
                state.comments = state.comments.filter((comment) => comment.id !== id); return route.fulfill({ json: null });
            }
            if (state.commentLoadFail) return route.fulfill({ status: 400, json: { message: "Diskusi gagal dimuat." } });
            return route.fulfill({ json: state.comments });
        }
        return route.fulfill({ json: [] });
    });
    await page.route("**/storage/v1/**", (route) => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() === "POST") {
            if (url.pathname.includes("/videos/")) { state.signs++; if (state.signFail) return route.fulfill({ status: 400, json: { message: "Fixture signing failed" } }); }
            return route.fulfill({ json: { signedURL: url.pathname.replace("/storage/v1", "") + `?token=fixture-${state.signs}` } });
        }
        if (url.pathname.includes("/videos/")) return route.fulfill({ body: "fixture", contentType: "video/webm" });
        return route.fulfill({ path: fileURLToPath(new URL("./fixtures/reels-art-2.png", import.meta.url)), contentType: "image/png" });
    });
    return state;
}
async function ready(page, id = 0) {
    await expect(page).toHaveURL(new RegExp(`/watch/animation-${id}$`));
    await expect(page.locator(".watch-summary").getByRole("heading", { name: films[id].title, exact: true })).toBeVisible();
    await expect(page.locator("video")).toHaveAttribute("src", /object\/sign\/videos/);
    await page.locator("video").evaluate((element) => element.dispatchEvent(new Event("loadedmetadata")));
}
async function login(page) {
    const dialog = page.getByRole("dialog", { name: "Masuk", exact: true });
    await dialog.getByPlaceholder("nama@email.com").fill(user.email); await dialog.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await dialog.getByRole("button", { name: "Masuk", exact: true }).click(); await expect(dialog).not.toBeVisible();
}

test("dark animation workspace matches the two-column structure without invented episodes or reels", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const state = await project(page); await page.goto("/watch/animation-0"); await ready(page);
    await expect(page.getByRole("heading", { name: "Daftar episode", exact: true })).toBeVisible();
    await expect(page.getByText("Episode belum tersedia.", { exact: true })).toBeVisible();
    await expect(page.locator(".watch-current-title")).toContainText("TAYANGAN SAAT INI");
    await expect(page.locator(".watch-related-card")).toHaveCount(2);
    await expect(page.locator(".watch-related-card").first()).toHaveAttribute("href", "/watch/animation-1");
    await expect(page.locator(".watch-related")).not.toContainText("Reel terpisah");
    expect(state.reads.some((query) => query.includes("content_type=eq.animation") && query.includes("status=eq.published"))).toBe(true);
    const player = await page.locator(".animation-player").boundingBox(), sidebar = await page.locator(".watch-sidebar").boundingBox();
    expect(Math.abs(player.width / player.height - 16 / 9)).toBeLessThan(.01); expect(sidebar.x).toBeGreaterThan(player.x + player.width);
    expect(await page.locator("video").evaluate((element) => getComputedStyle(element).objectFit)).toBe("contain");
    expect(await page.locator(".app-surface").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(25, 23, 19)");
    await expect(page.getByRole("button", { name: "Simpan, belum tersedia" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: /NusaRembug/ })).toBeVisible();
    await page.getByRole("button", { name: "Baca selengkapnya" }).click(); await expect(page.getByRole("button", { name: "Tampilkan lebih sedikit" })).toHaveAttribute("aria-expanded", "true");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const note = await page.locator(".watch-viewing-note").boundingBox(), initialSidebar = await page.locator(".watch-sidebar").boundingBox();
    expect(Math.abs(note.y - initialSidebar.y)).toBeLessThan(2);
    await page.screenshot({ path: info.outputPath("watch-desktop.png"), fullPage: true });
});

test("playback, seeking, speed and resume survive authentication and creator popups", async ({ page }) => {
    await project(page); await page.goto("/watch/animation-0"); await ready(page);
    const video = page.locator("video"); await page.getByRole("button", { name: "Mulai menonton", exact: true }).click();
    await expect(video).toHaveAttribute("data-playing", "true");
    await video.evaluate((element) => { element.currentTime = 12; element.dispatchEvent(new Event("timeupdate")); });
    await page.getByRole("button", { name: "Profil kreator", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Profil kreator", exact: true })).toBeVisible(); await expect(video).toHaveAttribute("data-playing", "false");
    await page.keyboard.press("Escape"); await expect(video).toHaveAttribute("data-playing", "true"); expect(await video.evaluate((element) => element.currentTime)).toBe(12);
    await page.getByRole("button", { name: "Sukai animasi", exact: true }).click(); await expect(video).toHaveAttribute("data-playing", "false");
    await login(page); await expect(video).toHaveAttribute("data-playing", "true"); expect(await video.evaluate((element) => element.currentTime)).toBe(12);
    await page.getByRole("button", { name: "Jeda video", exact: true }).click();
    await page.getByRole("button", { name: "Profil kreator", exact: true }).click(); await page.keyboard.press("Escape"); await expect(video).toHaveAttribute("data-playing", "false");
    await page.getByRole("region", { name: "Pemutar animasi", exact: true }).focus(); await page.keyboard.press("k"); await expect(video).toHaveAttribute("data-playing", "true");
    await page.keyboard.press("ArrowRight"); expect(await video.evaluate((element) => element.currentTime)).toBe(17);
    await page.getByRole("button", { name: "Pengaturan pemutaran" }).click(); await page.getByRole("menuitemradio", { name: "1.5×", exact: true }).click();
    expect(await video.evaluate((element) => element.playbackRate)).toBe(1.5);
    await page.getByRole("button", { name: "Bisukan video" }).click(); expect(await video.evaluate((element) => element.muted)).toBe(true);
    await page.reload(); await ready(page); expect(await page.locator("video").evaluate((element) => element.currentTime)).toBe(17);
    await expect(page.getByRole("status").filter({ hasText: "Melanjutkan dari 00:17" })).toBeVisible();
});

test("media signing and decoding failures expose retry and preserve the playback position", async ({ page }) => {
    const state = await project(page); state.signFail = true;
    await page.goto("/watch/animation-0");
    await expect(page.getByRole("region", { name: "Pemutar animasi" }).getByRole("alert")).toContainText("Video belum berhasil dimuat");
    await expect(page.locator("video")).toHaveCount(0);
    state.signFail = false; await page.getByRole("button", { name: "Muat ulang video" }).click(); await ready(page);
    const before = state.signs;
    await page.locator("video").evaluate((element) => { element.currentTime = 11; element.dispatchEvent(new Event("timeupdate")); const event = new Event("error"); event.testMediaError = true; element.dispatchEvent(event); });
    await expect(page.getByRole("region", { name: "Pemutar animasi" }).getByRole("alert")).toContainText("Animasi ini belum bisa diputar");
    await page.getByRole("button", { name: "Muat ulang video" }).click(); await ready(page);
    expect(state.signs).toBeGreaterThan(before); expect(await page.locator("video").evaluate((element) => element.currentTime)).toBe(11);
});

test("likes roll back, failed comments retain text, and only owned comments can be deleted", async ({ page }, info) => {
    const state = await project(page); await page.goto("/watch/animation-0"); await ready(page);
    await page.locator(".watch-comment-login").getByRole("link", { name: "Masuk", exact: true }).click(); await login(page);
    const own = page.getByRole("article", { name: "Komentar Studio Uji", exact: true }).filter({ hasText: "Komentarku sendiri." });
    await expect(own.getByRole("button", { name: "Hapus", exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: "Komentar Sari", exact: true }).getByRole("button", { name: "Hapus", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sukai animasi" })).toBeEnabled();
    state.likesFail = true; await page.getByRole("button", { name: "Sukai animasi" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Suka belum tersimpan" })).toBeVisible(); await expect(page.getByRole("button", { name: "Sukai animasi" })).toHaveAttribute("aria-pressed", "false");
    state.likesFail = false; await page.getByRole("button", { name: "Sukai animasi" }).click(); await expect(page.getByRole("button", { name: "Batalkan suka" })).toHaveAttribute("aria-pressed", "true");
    const input = page.getByRole("textbox", { name: "Tulis diskusi", exact: true }); await input.fill("Animasi ini menarik sekali.");
    state.commentFail = true; await page.getByRole("button", { name: "Kirim", exact: true }).click(); await expect(page.getByRole("alert").filter({ hasText: "Komentar gagal disimpan" })).toBeVisible(); await expect(input).toHaveValue("Animasi ini menarik sekali.");
    state.commentFail = false; await page.getByRole("button", { name: "Kirim", exact: true }).click(); await expect(page.getByText("Animasi ini menarik sekali.", { exact: true })).toBeVisible(); await expect(input).toHaveValue("");
    state.deleteFail = true; await own.getByRole("button", { name: "Hapus", exact: true }).click(); await own.getByRole("button", { name: "Ya, hapus", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Komentar belum berhasil dihapus" })).toBeVisible();
    state.deleteFail = false; await own.getByRole("button", { name: "Ya, hapus", exact: true }).click(); await expect(page.getByText("Komentarku sendiri.", { exact: true })).toHaveCount(0);
    expect(state.deletes).toEqual([{ id: "own-1", userId: `eq.${user.id}` }]);
    await page.screenshot({ path: info.outputPath("watch-discussion.png"), fullPage: true });
});

test("record errors, missing and draft animations recover; Reels redirect to their own player", async ({ page }) => {
    const state = await project(page); state.recordFail = true;
    await page.goto("/watch/animation-0"); await expect(page.getByRole("heading", { name: "Animasi belum bisa ditonton." })).toBeVisible();
    state.recordFail = false; await page.getByRole("button", { name: "Coba lagi", exact: true }).click(); await ready(page);
    await page.goto("/watch/missing"); await expect(page.getByRole("alert")).toContainText("Animasi ini belum tersedia"); await expect(page.locator("video")).toHaveCount(0);
    await page.goto("/watch/draft"); await expect(page.getByRole("alert")).toContainText("Animasi ini belum tersedia"); await expect(page.locator("video")).toHaveCount(0);
    await page.goto("/watch/short-1"); await expect(page).toHaveURL(/\/reels\/short-1$/);
});

test("recommendation and discussion failures are not presented as empty results", async ({ page }) => {
    const state = await project(page); state.relatedFail = true; state.commentLoadFail = true;
    await page.goto("/watch/animation-0"); await ready(page);
    const related = page.locator(".watch-related"), discussion = page.locator(".animation-discussion");
    await expect(related.getByRole("alert")).toContainText("Animasi lain belum berhasil dimuat");
    await expect(discussion.getByRole("alert")).toContainText("Diskusi belum berhasil dimuat");
    state.relatedFail = false; state.commentLoadFail = false;
    await related.getByRole("button", { name: "Coba lagi", exact: true }).click(); await expect(page.locator(".watch-related-card")).toHaveCount(2);
    await discussion.getByRole("button", { name: "Coba lagi", exact: true }).click(); await expect(page.getByText("Ceritanya menarik!", { exact: true })).toBeVisible();
});

test("mobile keeps the 16:9 player and pauses for navigation and background visibility", async ({ page }, info) => {
    await project(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/watch/animation-0"); await ready(page);
    for (const width of [320, 390, 768, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const frame = await page.locator(".animation-player").boundingBox(); expect(Math.abs(frame.width / frame.height - 16 / 9)).toBeLessThan(.015);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Mulai menonton", exact: true }).click(); await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    await page.getByRole("button", { name: "Buka menu navigasi" }).click(); await expect(page.locator("video")).toHaveAttribute("data-playing", "false");
    await page.keyboard.press("Escape"); await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(page.locator("video")).toHaveAttribute("data-playing", "false");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    await page.getByRole("button", { name: "Jeda video", exact: true }).click();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.screenshot({ path: info.outputPath("watch-mobile.png"), fullPage: true });
});

test("a late Reel record cannot redirect a newer animation workspace", async ({ page }) => {
    const state = await project(page); state.holdRecord = true;
    await page.goto("/watch/slow-reel"); await expect.poll(() => Boolean(state.releaseRecord)).toBe(true);
    await page.locator(".nusa-desktop-links").getByRole("link", { name: "Jelajah", exact: true }).click();
    await page.locator(".catalog-card").first().getByRole("link", { name: `Tonton ${films[0].title}`, exact: true }).click(); await ready(page);
    state.releaseRecord(); await expect(page).toHaveURL(/\/watch\/animation-0$/); await expect(page.locator(".watch-summary").getByRole("heading", { name: films[0].title, exact: true })).toBeVisible();
});

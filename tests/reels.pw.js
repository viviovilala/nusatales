import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mockMediaPlayback } from "./helpers/media-mock";

const viewer = { id: "11111111-1111-4111-8111-111111111111", email: "reels-test@example.test", aud: "authenticated", role: "authenticated", user_metadata: { display_name: "Sanggar Kisah" } };
const creators = [
    { id: viewer.id, display_name: "Sanggar Kisah", username: "sanggar_kisah", avatar_path: null, bio: "Menghidupkan kembali cerita dan budaya Nusantara lewat animasi." },
    { id: "22222222-2222-4222-8222-222222222222", display_name: "Studio Rimba", username: "studio_rimba", avatar_path: null, bio: "Dari cerita rakyat, untuk semua." },
    { id: "33333333-3333-4333-8333-333333333333", display_name: "Pijar Animasi", username: "pijar_animasi", avatar_path: null, bio: "Kisah kecil yang penuh makna." },
];
const records = Array.from({ length: 24 }, (_, index) => ({
    id: `clip-${index}`, title: index === 0 ? "Kisah Cinta Kian Santang" : `Cerita Nusantara ${index}`,
    description: index === 0 ? "Kian Santang, putra Prabu Siliwangi yang gagah perkasa, justru jatuh hati pada sosok yang paling tak terduga." : "Sebuah cerita rakyat tentang keberanian, persahabatan, dan warisan budaya Nusantara.",
    content_type: "reel", status: "published", duration_seconds: 30,
    storage_path: `owner/clip-${index}/media.webm`, thumbnail_path: `owner/clip-${index}/thumb.png`,
    published_at: "2026-11-02T01:00:00Z", creator_id: creators[index % 3].id, creator: creators[index % 3],
}));

async function project(page, mockPlayback = true) {
    const state = { mode: "ready", moreFail: false, likeFail: false, commentFail: false, liked: false, likes: 2, offsets: [], signs: 0,
        comments: [{ id: "comment-1", video_id: "clip-0", user_id: creators[1].id, content: "Ceritanya menarik!", created_at: "2026-11-02T02:00:00Z", user: creators[1] }] };
    if (mockPlayback) await mockMediaPlayback(page);
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: viewer.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.fixture`;
    await page.route("**/auth/v1/**", async (route) => {
        if (route.request().url().includes("/token")) return route.fulfill({ json: { access_token: token, refresh_token: "fixture-refresh", expires_in: 3600, token_type: "bearer", user: viewer } });
        return route.fulfill({ json: viewer });
    });
    await page.route("**/storage/v1/**", async (route) => {
        const url = new URL(route.request().url());
        if (route.request().method() === "POST") {
            if (url.pathname.includes("/videos/")) state.signs++;
            return route.fulfill({ json: { signedURL: `/object/sign/${url.pathname.includes("/videos/") ? "videos" : "thumbnails"}/fixture?token=${state.signs}` } });
        }
        if (url.pathname.includes("/videos/")) return route.fulfill({ contentType: "video/webm", body: "fixture" });
        return route.fulfill({ contentType: "image/png", path: fileURLToPath(new URL("./fixtures/reels-art-2.png", import.meta.url)) });
    });
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.endsWith("/profiles")) {
            const id = url.searchParams.get("id")?.replace(/^eq\./, "");
            return route.fulfill({ json: creators.find((creator) => creator.id === id) || creators[0] });
        }
        if (url.pathname.endsWith("/video_likes")) {
            if (request.method() === "HEAD") return route.fulfill({ headers: { "Access-Control-Expose-Headers": "Content-Range", "content-range": `0-0/${state.likes}` } });
            if (request.method() === "GET") return route.fulfill({ json: state.liked ? { video_id: "clip-0", user_id: viewer.id } : null });
            if (state.likeFail) return route.fulfill({ status: 403, json: { code: "42501", message: "Fixture rejects like" } });
            state.liked = request.method() === "POST";
            state.likes += state.liked ? 1 : -1;
            return route.fulfill({ status: 204 });
        }
        if (url.pathname.endsWith("/video_comments")) {
            const id = url.searchParams.get("video_id")?.replace(/^eq\./, "");
            if (request.method() === "HEAD") return route.fulfill({ headers: { "Access-Control-Expose-Headers": "Content-Range", "content-range": `0-0/${state.comments.filter((comment) => comment.video_id === id).length}` } });
            if (request.method() === "POST") {
                if (state.commentFail) return route.fulfill({ status: 503, json: { message: "Fixture rejects comment" } });
                const record = { ...request.postDataJSON(), id: "comment-new", created_at: new Date().toISOString(), user: creators[0] };
                state.comments.unshift(record);
                return route.fulfill({ json: record });
            }
            if (request.method() === "DELETE") {
                const commentId = url.searchParams.get("id").replace(/^eq\./, "");
                state.comments = state.comments.filter((comment) => comment.id !== commentId);
                return route.fulfill({ status: 204 });
            }
            return route.fulfill({ json: state.comments.filter((comment) => comment.video_id === id) });
        }
        if (url.pathname.endsWith("/videos")) {
            const id = url.searchParams.get("id")?.replace(/^eq\./, "");
            if (id) return route.fulfill({ json: id === "film-1" ? { ...records[0], id, content_type: "animation" } : records.find((video) => video.id === id) || null });
            const creator = url.searchParams.get("creator_id")?.replace(/^eq\./, "");
            if (creator) return route.fulfill({ json: records.filter((video) => video.creator_id === creator) });
            const offset = Number(url.searchParams.get("offset") || 0);
            if (url.searchParams.get("content_type") === "eq.animation") return route.fulfill({ json: [], headers: { "content-range": "0-0/0" } });
            state.offsets.push(offset);
            if (state.mode === "error" || offset > 0 && state.moreFail) return route.fulfill({ status: 500, json: { code: "PGRST100", message: "Fixture feed failed" } });
            return route.fulfill({ json: state.mode === "empty" ? [] : records.slice(offset, offset + 10) });
        }
        return route.fulfill({ json: [] });
    });
    return state;
}

async function bodyFocus(page) {
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
}
async function signIn(page) {
    await page.goto("/login");
    const dialog = page.getByRole("dialog", { name: "Masuk", exact: true });
    await dialog.getByPlaceholder("nama@email.com").fill(viewer.email);
    await dialog.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await dialog.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(dialog).not.toBeVisible();
}

async function recordedClip(page, width, height) {
    // Encode real video locally so the test exercises loadeddata/videoWidth,
    // rather than only measuring the placeholder while a mock codec fails.
    const bytes = await page.evaluate(async ({ width, height }) => {
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        const stream = canvas.captureStream(12);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
        const chunks = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);
        const done = new Promise((resolve) => { recorder.onstop = resolve; });
        recorder.start();
        context.fillStyle = "#567638"; context.fillRect(0, 0, width, height);
        context.fillStyle = "#c0e876"; context.fillRect(width / 3, 0, width / 3, height);
        await new Promise((resolve) => setTimeout(resolve, 220));
        recorder.stop(); await done;
        stream.getTracks().forEach((track) => track.stop());
        return [...new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer())];
    }, { width, height });
    return Buffer.from(bytes);
}

for (const [label, width, height] of [["landscape", 640, 360], ["square", 360, 360], ["portrait", 360, 640]]) {
    test(`decoded ${label} video stays inside a 9:16 viewport across screen sizes`, async ({ page }, info) => {
        const bytes = await recordedClip(page, width, height);
        await project(page, false);
        await page.route("**/storage/v1/object/sign/videos/**", (route) => route.request().method() === "GET"
            ? route.fulfill({ body: bytes, contentType: "video/webm" }) : route.fallback());
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto("/reels");
        const video = page.locator("video");
        await expect(video).toHaveClass("is-ready");
        expect(await video.evaluate((element) => [element.videoWidth, element.videoHeight])).toEqual([width, height]);
        await expect(page.locator(".reel-loading-poster")).toHaveCount(0);
        for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 800, height: 1100 }, { width: 320, height: 568 }]) {
            await page.setViewportSize(viewport);
            const bounds = await video.boundingBox();
            const frame = await page.locator(".reel-frame").boundingBox();
            expect(Math.abs(bounds.width / bounds.height - 9 / 16)).toBeLessThan(.002);
            expect(bounds.width).toBeLessThanOrEqual(frame.width + 1);
            expect(bounds.height).toBeLessThanOrEqual(frame.height + 1);
            expect(Math.abs(bounds.x + bounds.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(1);
            expect(await video.evaluate((element) => getComputedStyle(element).objectFit)).toBe("cover");
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.screenshot({ path: info.outputPath(`reels-${label}-locked-desktop.png`) });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: info.outputPath(`reels-${label}-locked-mobile.png`) });
    });
}

test("desktop Reels uses a wide viewport, left navigation and the existing cream action rail without a footer", async ({ page }, info) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await project(page);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/reels");
    await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    await expect(page.locator(".reel-loading-poster")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const frame = await page.locator(".reel-frame").boundingBox();
    const sidebar = await page.locator(".reels-side-nav").boundingBox();
    const poster = await page.locator(".reel-loading-poster").boundingBox();
    const actions = await page.locator(".reels-actions").boundingBox();
    expect(Math.abs(frame.width - 1580)).toBeLessThan(2);
    expect(Math.abs(frame.height - 952)).toBeLessThan(2);
    const video = await page.locator("video").boundingBox();
    expect(Math.abs(video.width / video.height - 9 / 16)).toBeLessThan(.002);
    expect(Math.abs(video.x - poster.x)).toBeLessThan(1);
    expect(Math.abs(video.width - poster.width)).toBeLessThan(1);
    await expect(page.locator(".reels-feed-hint")).toHaveCount(0);
    await expect(page.getByText("Shorts Nusantara", { exact: true })).toHaveCount(0);
    expect(Math.abs(sidebar.width - 300)).toBeLessThan(2);
    expect(sidebar.x + sidebar.width).toBeLessThan(frame.x);
    expect(actions.x).toBeGreaterThan(poster.x + poster.width);
    await expect(page.locator(".reels-side-nav .nusa-original-logo")).toHaveAttribute("src", "/poto/logo.png");
    await expect(page.locator(".reels-nav-creators")).toContainText("Studio Rimba");
    expect(await page.locator(".reels-action-circle").first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 249, 231)");
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Simpan, belum tersedia" })).toBeDisabled();
    await expect(page.locator("video")).toHaveCount(1);
    await page.screenshot({ path: info.outputPath("reels-wide-desktop.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test("mobile fits the viewport and supports vertical swipe without hijacking seeking", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await project(page);
    await page.goto("/reels");
    await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    await expect(page.locator(".reels-side-nav")).not.toBeVisible();
    await page.screenshot({ path: info.outputPath("reels-mobile.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const swipe = (selector, dx, dy) => page.locator(selector).evaluate((element, delta) => {
        const start = new Event("touchstart", { bubbles: true });
        Object.defineProperty(start, "touches", { value: [{ clientX: 120, clientY: 400 }] });
        element.dispatchEvent(start);
        const end = new Event("touchend", { bubbles: true });
        Object.defineProperty(end, "changedTouches", { value: [{ clientX: 120 + delta.dx, clientY: 400 + delta.dy }] });
        element.dispatchEvent(end);
    }, { dx, dy });
    await swipe("video", 200, -10);
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[0].title}`);
    await swipe("video", 0, -200);
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[1].title}`);
    await swipe(".reel-seek", 0, -200);
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[1].title}`);
    await expect(page.locator("video")).toHaveCount(1);
    await page.getByRole("button", { name: "Buka menu Reels" }).click();
    const navigation = page.getByRole("dialog", { name: "Navigasi Reels", exact: true });
    await expect(navigation).toBeVisible();
    await expect(page.locator("video")).toHaveAttribute("data-playing", "false");
    await page.keyboard.press("Escape");
    await expect(navigation).not.toBeVisible();
    await expect(page.locator("video")).toHaveAttribute("data-playing", "true");
    for (const viewport of [{ width: 1024, height: 1366 }, { width: 800, height: 1100 }, { width: 320, height: 568 }]) {
        await page.setViewportSize(viewport);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const frame = await page.locator(".reel-frame").boundingBox();
        expect(frame.width).toBeLessThanOrEqual(viewport.width);
        expect(frame.height).toBeLessThanOrEqual(viewport.height);
        const share = await page.getByRole("button", { name: "Bagikan Cerita" }).boundingBox();
        expect(share.x + share.width).toBeLessThanOrEqual(viewport.width);
    }
});

test("feed errors differ from empty state and deep links redirect by content type", async ({ page }) => {
    const state = await project(page);
    state.mode = "error";
    await page.goto("/reels");
    await expect(page.getByRole("heading", { name: "Cerita belum berhasil dimuat" })).toBeVisible();
    state.mode = "empty";
    await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Cerita pendek, makna panjang." })).toBeVisible();
    await page.getByRole("link", { name: "Bagikan karyamu", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Masuk", exact: true })).toBeVisible();
    state.mode = "ready";
    await page.goto("/reels/missing");
    await expect(page.getByRole("status").filter({ hasText: "Reel ini tidak tersedia" })).toBeVisible();
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[0].title}`);
    await page.goto("/reels/film-1");
    await expect(page).toHaveURL(/\/watch\/film-1$/);
});

test("pagination retries the same offset, deduplicates a deep link and mounts one player", async ({ page }) => {
    const state = await project(page);
    state.moreFail = true;
    await page.goto("/reels/clip-2");
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[2].title}`);
    await bodyFocus(page);
    for (let index = 0; index < 7; index++) await page.keyboard.press("ArrowDown");
    await expect(page.locator(".reels-more-error")).toContainText("Cerita berikutnya belum berhasil dimuat.");
    expect(state.offsets).toEqual([0, 10]);
    state.moreFail = false;
    await page.locator(".reels-more-error").getByRole("button", { name: "Coba lagi" }).click();
    await expect.poll(() => state.offsets.length).toBe(3);
    expect(state.offsets).toEqual([0, 10, 10]);
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[7].title}`);
    await bodyFocus(page);
    for (let index = 0; index < 13; index++) await page.keyboard.press("ArrowDown");
    await expect(page.locator("video")).toHaveAttribute("aria-label", `Video ${records[20].title}`);
    expect(state.offsets).toEqual([0, 10, 10, 20]);
    await expect(page.locator("video")).toHaveCount(1);
});

test("like rollback, comments and creator quick view preserve playback and update counts", async ({ page }, info) => {
    const state = await project(page);
    await signIn(page);
    await page.goto("/reels");
    const clip = page.locator("video");
    await expect(clip).toHaveAttribute("data-playing", "true");
    await expect(page.locator(".reels-action").filter({ has: page.getByRole("button", { name: "Suka", exact: true }) })).toContainText("2");
    await clip.evaluate((element) => { element.currentTime = 17; element.dispatchEvent(new Event("timeupdate")); });
    state.likeFail = true;
    await page.getByRole("button", { name: "Suka", exact: true }).click();
    await expect(page.getByRole("button", { name: "Suka", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("status").filter({ hasText: "Suka belum tersimpan" })).toBeVisible();
    state.likeFail = false;
    await page.getByRole("button", { name: "Suka", exact: true }).click();
    await expect(page.getByRole("button", { name: "Suka", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(state.likes).toBe(3);
    await page.getByRole("button", { name: "Komentar", exact: true }).click();
    const comments = page.getByRole("dialog", { name: "Komentar", exact: true });
    await expect(comments.getByText("Ceritanya menarik!", { exact: true })).toBeVisible();
    await expect(clip).toHaveAttribute("data-playing", "false");
    await expect(comments.getByRole("button", { name: "Hapus komentarmu" })).toHaveCount(0);
    await comments.getByLabel("Tulis komentar").fill("Animasi yang indah.");
    await page.keyboard.press("ArrowDown");
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[0].title}`);
    state.commentFail = true;
    await comments.getByRole("button", { name: "Kirim", exact: true }).click();
    await expect(comments.getByRole("alert")).toContainText("Komentar belum terkirim");
    await expect(comments.getByLabel("Tulis komentar")).toHaveValue("Animasi yang indah.");
    state.commentFail = false;
    await comments.getByRole("button", { name: "Kirim", exact: true }).click();
    await expect(comments.getByText("Animasi yang indah.", { exact: true })).toBeVisible();
    await comments.getByRole("button", { name: "Hapus komentarmu" }).click();
    await expect(comments.getByText("Animasi yang indah.", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("reels-comments.png") });
    await page.keyboard.press("Escape");
    await expect(clip).toHaveAttribute("data-playing", "true");
    expect(await clip.evaluate((element) => element.currentTime)).toBe(17);
    await page.locator(".reels-creator-action").click();
    const creator = page.getByRole("dialog", { name: "Profil kreator", exact: true });
    await expect(creator.getByRole("heading", { name: "Sanggar Kisah", exact: true })).toBeVisible();
    await expect(creator.getByText(creators[0].bio, { exact: true })).toBeVisible();
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.screenshot({ path: info.outputPath("reels-creator.png") });
    await creator.getByRole("button", { name: /Cerita Nusantara 3/ }).click();
    await expect(page).toHaveURL(/\/reels\/clip-3$/);
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[3].title}`);
});

test("media retry renews its URL and popups preserve manual pause and visibility state", async ({ page }) => {
    const state = await project(page);
    await page.goto("/reels");
    const clip = page.locator("video");
    await expect(clip).toHaveAttribute("data-playing", "true");
    await page.getByRole("button", { name: "Jeda video", exact: true }).click();
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.getByRole("button", { name: "Opsi video" }).click();
    await page.getByRole("menuitem", { name: "Tentang cerita" }).click();
    await expect(page.getByRole("dialog", { name: "Tentang cerita", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.getByRole("button", { name: "Lanjutkan video", exact: true }).click();
    await expect(clip).toHaveAttribute("data-playing", "true");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(clip).toHaveAttribute("data-playing", "true");
    const before = state.signs;
    await clip.evaluate((element) => element.dispatchEvent(Object.assign(new Event("error"), { testMediaError: true })));
    await expect(page.getByRole("alert")).toContainText("Cerita ini belum bisa diputar");
    await page.getByRole("button", { name: "Muat ulang video" }).click();
    await expect(clip).toHaveAttribute("data-playing", "true");
    await expect.poll(() => state.signs).toBe(before + 1);
    await expect(page.locator(".reel-media-state")).toHaveCount(0);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Bagikan Cerita" }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("http://127.0.0.1:4173/reels/clip-0");
    await page.getByRole("button", { name: "Kecepatan: 1x", exact: true }).click();
    await expect(clip).toHaveJSProperty("playbackRate", 1.25);
    await page.getByRole("switch", { name: "Gulir otomatis" }).click();
    await expect(clip).toHaveJSProperty("loop", false);
    await clip.evaluate((element) => element.dispatchEvent(new Event("ended")));
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[1].title}`);
    await expect(clip).toHaveJSProperty("playbackRate", 1.25);
});

test("wheel navigation keeps its cooldown across clips and leaves seek controls alone", async ({ page }) => {
    await project(page);
    await page.goto("/reels");
    const clip = page.locator("video");
    await expect(clip).toHaveAttribute("data-playing", "true");
    await page.evaluate(() => {
        let now = 1000;
        Object.defineProperty(performance, "now", { configurable: true, value: () => now });
        window.advanceReelsTestTime = () => { now += 600; };
    });
    await page.locator(".reels-video-area").dispatchEvent("wheel", { deltaY: 100 });
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[1].title}`);
    await page.locator(".reels-video-area").dispatchEvent("wheel", { deltaY: 100 });
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[1].title}`);
    await page.evaluate(() => window.advanceReelsTestTime());
    await page.locator(".reels-video-area").dispatchEvent("wheel", { deltaY: 100 });
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[2].title}`);
    await page.evaluate(() => window.advanceReelsTestTime());
    await page.locator(".reel-seek").dispatchEvent("wheel", { deltaY: 100 });
    await expect(clip).toHaveAttribute("aria-label", `Video ${records[2].title}`);
});

test("guest comments can open login above the popup and return to the same conversation", async ({ page }) => {
    await project(page);
    await page.goto("/reels");
    const clip = page.locator("video");
    await expect(clip).toHaveAttribute("data-playing", "true");
    await clip.evaluate((element) => { element.currentTime = 12; });
    await page.getByRole("button", { name: "Suka", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Masuk", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(clip).toHaveAttribute("data-playing", "true");
    await page.getByRole("button", { name: "Komentar", exact: true }).click();
    const comments = page.getByRole("dialog", { name: "Komentar", exact: true });
    await comments.getByRole("link", { name: "Masuk / Daftar", exact: true }).click();
    const login = page.getByRole("dialog", { name: "Masuk", exact: true });
    await login.getByPlaceholder("nama@email.com").fill(viewer.email);
    await login.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await login.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(login).not.toBeVisible();
    await expect(comments.getByText("Ceritanya menarik!", { exact: true })).toBeVisible();
    await expect(comments.getByLabel("Tulis komentar")).toBeVisible();
    expect(await comments.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.keyboard.press("Escape");
    await expect(clip).toHaveAttribute("data-playing", "true");
    expect(await clip.evaluate((element) => element.currentTime)).toBe(12);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

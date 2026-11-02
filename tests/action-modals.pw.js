import { test, expect } from "@playwright/test";
import { mockMediaPlayback } from "./helpers/media-mock";
import { screenshotPixel } from "./helpers/screenshot-pixel";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "modal-test@example.test", aud: "authenticated", role: "authenticated", user_metadata: { display_name: "Studio Uji" } };
const profile = { id: user.id, username: "studio_uji", display_name: "Studio Uji", bio: "Cerita Nusantara", avatar_path: null };
const video = { id: "22222222-2222-4222-8222-222222222222", creator_id: user.id, title: "Karya Awal", description: "Cerita", status: "draft", content_type: "animation", thumbnail_path: null, duration_seconds: 30 };

async function project(page) {
    const state = { profile: { ...profile }, video: { ...video }, feed: [], inserts: 0, patches: 0, uploads: 0, deleted: 0, releaseUpload: null };
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.fixture`;
    await page.route("**/auth/v1/**", async (route) => {
        if (route.request().url().includes("/token")) return route.fulfill({ json: { access_token: token, refresh_token: "fixture-refresh", expires_in: 3600, token_type: "bearer", user } });
        if (route.request().url().includes("/logout")) return route.fulfill({ json: {} });
        return route.fulfill({ json: user });
    });
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.endsWith("/profiles")) {
            if (request.method() === "PATCH") Object.assign(state.profile, request.postDataJSON());
            const single = request.headers().accept?.includes("object");
            return route.fulfill({ json: single || url.searchParams.has("id") && !url.searchParams.has("username") ? state.profile : [] });
        }
        if (url.pathname.includes("/rpc/")) {
            if (url.pathname.endsWith("soft_delete_video")) state.deleted++;
            return route.fulfill({ json: null });
        }
        if (url.pathname.endsWith("/videos")) {
            if (request.method() === "POST") { state.inserts++; Object.assign(state.video, request.postDataJSON()); return route.fulfill({ json: state.video }); }
            if (request.method() === "PATCH") { state.patches++; Object.assign(state.video, request.postDataJSON()); return route.fulfill({ json: state.video }); }
            if (url.searchParams.has("id")) return route.fulfill({ json: state.video });
            return route.fulfill({ json: url.searchParams.has("creator_id") ? [state.video] : state.feed, headers: { "content-range": "0-0/0" } });
        }
        return route.fulfill({ json: [] });
    });
    await page.route("**/storage/v1/**", async (route) => {
        if (route.request().method() === "DELETE") { state.deleted++; return route.fulfill({ json: [] }); }
        if (route.request().url().includes("/upload/resumable")) {
            if (route.request().method() === "PATCH") return route.fulfill({ status: 204, headers: { "Access-Control-Expose-Headers": "Upload-Offset", "Tus-Resumable": "1.0.0", "Upload-Offset": "10" } });
            state.uploads++;
            await new Promise((resolve) => { state.releaseUpload = resolve; });
            return route.fulfill({ status: 201, headers: {
                "Access-Control-Expose-Headers": "Location,Upload-Offset,Tus-Resumable",
                "Tus-Resumable": "1.0.0", "Upload-Offset": String(route.request().postDataBuffer()?.length || 0),
                Location: route.request().url() + "/fixture",
            } });
        }
        return route.fulfill({ json: { Key: "fixture", path: "fixture" } });
    });
    return state;
}

async function login(page) {
    const dialog = page.getByRole("dialog", { name: "Masuk", exact: true });
    await dialog.getByPlaceholder("nama@email.com").fill(user.email);
    await dialog.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await dialog.getByRole("button", { name: "Masuk", exact: true }).click();
}

test("modal keeps the background, scroll, form and history; auth switches use one entry", async ({ page }, info) => {
    await project(page);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const trigger = page.getByRole("link", { name: "Jadi kreator", exact: true });
    // Measure after the actual trigger is in view. Clicking an offscreen link
    // can scroll it by itself, independently of modal/history restoration.
    await trigger.scrollIntoViewIfNeeded();
    const scroll = await page.evaluate(() => scrollY);
    await trigger.click();
    await expect(page).toHaveURL(/\/login$/);
    const dialog = page.getByRole("dialog", { name: "Masuk", exact: true });
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: info.outputPath("login-desktop.png") });
    await dialog.getByPlaceholder("nama@email.com").fill("draft@example.test");
    await dialog.getByRole("button", { name: "Tutup popup" }).focus();
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.locator("#story-search").evaluate((element) => element.focus());
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await dialog.getByRole("link", { name: "Daftar Sekarang" }).click();
    await expect(page.getByRole("dialog", { name: "Daftar akun", exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("register-desktop.png") });
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".action-dialog")).not.toBeVisible();
    expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(5);
    await page.goForward();
    await page.getByRole("dialog").getByRole("link", { name: "Masuk", exact: true }).click();
    await expect(page.getByRole("dialog").locator("[hidden]")).toHaveCount(1);
    await expect(page.getByRole("dialog").getByPlaceholder("nama@email.com").filter({ visible: true })).toHaveValue("draft@example.test");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Jadi kreator", exact: true })).toBeFocused();
    await page.getByRole("link", { name: "Jadi kreator", exact: true }).click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(page).toHaveURL(/\/$/);
});

test("mobile direct protected link survives refresh and resumes upload after sign-in", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await project(page);
    await page.goto("/studio/upload");
    await expect(page.getByRole("dialog", { name: "Masuk", exact: true })).toBeVisible();
    await page.reload();
    await login(page);
    const dialog = page.getByRole("dialog", { name: "Unggah karya", exact: true });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/studio\/upload$/);
    await expect(dialog.getByRole("heading", { name: "Unggah karya", exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath("upload-mobile.png") });
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.getByRole("button", { name: "Tutup popup" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".upload-resume")).toHaveCount(0);
    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    await page.locator(".nusa-sheet-content").getByRole("link", { name: "Bagikan karyamu" }).click();
    await expect(dialog).toBeVisible();
});

test("profile draft survives closing, saves in place and clears on logout", async ({ page }, info) => {
    await project(page);
    await page.goto("/settings/profile");
    await login(page);
    const dialog = page.getByRole("dialog", { name: "Edit profil", exact: true });
    const name = dialog.getByPlaceholder("Contoh: Sanggar Animasi Borobudur");
    await expect(name).toHaveValue("Studio Uji");
    await page.screenshot({ path: info.outputPath("profile-desktop.png") });
    await name.fill("Nama Belum Disimpan");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Menu akun Studio Uji" }).click();
    await page.getByRole("menuitem", { name: "Pengaturan profil" }).click();
    await expect(name).toHaveValue("Nama Belum Disimpan");
    await dialog.getByRole("button", { name: "Simpan Profil" }).click();
    await expect(dialog.getByText("Profil berhasil disimpan!", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Menu akun Nama Belum Disimpan" }).click();
    await page.getByRole("menuitem", { name: "Keluar", exact: true }).click();
    await expect(page.locator(".action-dialog input")).toHaveCount(0);
});

test("closing an active upload preserves its file and job; Studio updates after completion", async ({ page }, info) => {
    const state = await project(page);
    // Stub the browser's media decoder, while exercising the real workflow,
    // persistent file input, Supabase requests and TUS client.
    await page.route("**/src/features/videos/uploadService.js*", async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replace("export async function extractVideoMetadata(videoFile)", "async function originalExtractVideoMetadata(videoFile)");
        await route.fulfill({ response, body: body + "\nexport async function extractVideoMetadata() { return { durationSeconds: 12, width: 160, height: 90, aspectRatio: 16/9, thumbnailBlob: null }; }\n" });
    });
    await page.goto("/login");
    await login(page);
    await page.getByRole("link", { name: "Studio", exact: true }).click();
    await page.locator(".nusa-upload-link").click();
    const dialog = page.getByRole("dialog", { name: "Unggah karya", exact: true });
    await dialog.getByRole("button", { name: /Reels/ }).click();
    await dialog.locator('input[type="file"]').first().setInputFiles({ name: "kisah-uji.webm", mimeType: "video/webm", buffer: Buffer.from("test-media") });
    await expect(dialog.getByRole("button", { name: "Simpan Draf Saja" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Simpan Draf Saja" }).click();
    await expect.poll(() => state.uploads).toBe(1);
    await dialog.getByRole("button", { name: "Tutup popup" }).click();
    await expect(page).toHaveURL(/\/studio$/);
    expect(state.deleted).toBe(0);
    await expect(page.locator(".upload-resume")).toHaveCount(0);
    await page.locator(".nusa-upload-link").click();
    await expect(dialog.getByRole("heading", { name: "kisah-uji.webm", exact: true })).toBeVisible();
    state.releaseUpload();
    await expect(dialog.getByText("Draf karya berhasil disimpan!", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Lihat di Studio", exact: true })).toBeVisible();
    expect(state.inserts).toBe(1);
    expect(state.uploads).toBe(1);
    expect(state.patches).toBe(1);
    expect(state.deleted).toBe(0);
    await expect(dialog.getByRole("button", { name: "Simpan Draf Saja" })).toBeDisabled();
    await page.screenshot({ path: info.outputPath("upload-complete-desktop.png") });
    await dialog.getByRole("button", { name: "Unggah karya lain", exact: true }).click();
    await expect(dialog.locator('input[accept="video/mp4,video/webm,video/quicktime"]')).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "Simpan Draf Saja" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Kisah uji", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit karya", exact: true });
    await expect(editor).toBeVisible();
    await page.screenshot({ path: info.outputPath("edit-video-desktop.png") });
    await editor.getByPlaceholder("Judul karya cerita rakyat").fill("Karya Diperbarui");
    await editor.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
    await expect(editor.getByText("Perubahan informasi berhasil disimpan.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Karya Diperbarui", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Shorts", exact: true }).click();
    await expect(page.locator(".upload-resume")).toHaveCount(0);
});

test("menus and dialogs keep the background and gutter stable on desktop and mobile", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await project(page);
    await page.goto("/login"); await login(page);
    await page.getByRole("link", { name: "Studio", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Studio ceritamu." })).toBeVisible();
    const measure = () => page.locator(".app-surface").evaluate((element) => ({ width: element.getBoundingClientRect().width, margin: getComputedStyle(document.body).marginRight }));
    const baseline = await measure();
    const cream = [255, 249, 233];
    await page.getByRole("button", { name: "Menu akun Studio Uji" }).click();
    await expect(page.getByRole("menuitem", { name: "Pengaturan profil", exact: true })).toBeVisible();
    await expect.poll(measure).toEqual(baseline);
    expect(await screenshotPixel(page, 1438, 890)).toEqual(cream);
    await page.screenshot({ path: info.outputPath("studio-account-menu-background.png") });
    await page.getByRole("menuitem", { name: "Pengaturan profil", exact: true }).click();
    const profileDialog = page.getByRole("dialog", { name: "Edit profil", exact: true });
    await expect(profileDialog).toBeVisible();
    await expect.poll(measure).toEqual(baseline);
    // The native dialog backdrop also covers the gutter; compare it with an
    // uncovered cream area at the opposite edge to catch a pale right strip.
    const right = await screenshotPixel(page, 1438, 890);
    const left = await screenshotPixel(page, 1, 890);
    // Allow the subtle batik line under the translucent backdrop at one edge.
    for (let channel = 0; channel < 3; channel++) expect(Math.abs(right[channel] - left[channel])).toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
    await expect.poll(measure).toEqual(baseline);
    expect(await screenshotPixel(page, 1438, 890)).toEqual(cream);
    for (let index = 0; index < 2; index++) {
        await page.locator(".nusa-upload-link").click();
        await expect(page.getByRole("dialog", { name: "Unggah karya", exact: true })).toBeVisible();
        await expect.poll(measure).toEqual(baseline);
        await page.keyboard.press("Escape");
    }
    await expect(page.locator(".upload-resume")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await measure();
    await page.getByRole("button", { name: "Buka menu navigasi" }).click();
    await expect(page.locator(".nusa-sheet-content")).toBeVisible();
    await expect.poll(measure).toEqual(mobile);
    await page.keyboard.press("Escape");
    await expect.poll(measure).toEqual(mobile);
    expect(await screenshotPixel(page, 388, 834)).toEqual(cream);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(".nusa-brand").click();
    const home = await measure();
    await page.getByRole("button", { name: "Lihat paket Supporter", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Paket Supporter", exact: true })).toBeVisible();
    await expect.poll(measure).toEqual(home);
    const planRight = await screenshotPixel(page, 1438, 10);
    const planLeft = await screenshotPixel(page, 1, 10);
    for (let channel = 0; channel < 3; channel++) expect(Math.abs(planRight[channel] - planLeft[channel])).toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
    await expect.poll(measure).toEqual(home);
    expect(await page.evaluate(() => ({ overflow: document.documentElement.style.overflow, padding: document.documentElement.style.paddingRight, gutter: document.documentElement.style.scrollbarGutter }))).toEqual({ overflow: "", padding: "", gutter: "" });
});

test("account forms handle validation and recovery errors with a global batik background", async ({ page }, info) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await project(page);
    await page.goto("/register");
    const register = page.getByRole("dialog", { name: "Daftar akun", exact: true });
    await register.getByLabel("Nama lengkap / studio").fill("Studio Uji");
    await register.getByLabel(/^Email/).fill(user.email);
    await register.getByLabel(/^Kata sandi/).fill("fixture-password");
    await register.getByLabel(/^Konfirmasi kata sandi/).fill("different-password");
    await register.getByRole("button", { name: "Daftar Akun", exact: true }).click();
    await expect(register.getByRole("alert")).toContainText("Konfirmasi kata sandi tidak cocok.");
    expect(await register.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("register-mobile.png") });
    await register.getByRole("link", { name: "Masuk", exact: true }).click();
    await page.getByRole("link", { name: "Lupa kata sandi?", exact: true }).click();
    await page.route("**/auth/v1/recover*", (route) => route.fulfill({ status: 503, json: { message: "Coba lagi nanti." } }));
    const forgot = page.getByRole("dialog", { name: "Lupa kata sandi", exact: true });
    await forgot.getByLabel("Email terdaftar").fill(user.email);
    await forgot.getByRole("button", { name: "Kirim Tautan Reset" }).click();
    await expect(forgot.getByRole("alert")).toBeVisible();
    await expect(forgot.getByRole("button", { name: "Kirim Tautan Reset" })).toBeEnabled();
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "Buat kata sandi baru" })).toBeVisible();
    await page.screenshot({ path: info.outputPath("reset-mobile.png") });
    for (const path of ["/reset-password", "/animations", "/missing-page"]) {
        await page.goto(path);
        const surface = await page.locator(".app-surface").evaluate((element) => {
            const pattern = getComputedStyle(element, "::before");
            const page = getComputedStyle(element.querySelector(".site-page"));
            return { mask: pattern.maskImage, pointer: pattern.pointerEvents, layer: pattern.zIndex, pageBackground: page.backgroundColor };
        });
        expect(surface.mask).toContain("kawung.svg");
        expect(surface.pointer).toBe("none");
        expect(surface.layer).toBe("0");
        expect(surface.pageBackground).toBe("rgba(0, 0, 0, 0)");
        expect(await page.locator("footer").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(111, 70, 39)");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
});

test("action popup pauses Reels without resetting the clip or moving the feed", async ({ page }) => {
    const state = await project(page);
    state.feed = [0, 1].map((index) => ({ ...video, id: `clip-${index}`, title: `Kisah Reel ${index}`, content_type: "reel", status: "published", storage_path: `owner/clip-${index}/media.webm` }));
    await mockMediaPlayback(page);
    await page.route("**/storage/v1/**", (route) => route.fulfill({ json: { signedURL: "/object/sign/videos/fixture?token=fixture" } }));
    await page.goto("/reels");
    const clip = page.locator("video").first();
    await expect(clip).toHaveAttribute("data-playing", "true");
    await clip.evaluate((element) => { element.currentTime = 17; });
    await page.getByRole("link", { name: "Unggah", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Masuk", exact: true })).toBeVisible();
    await expect(clip).toHaveAttribute("data-playing", "false");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/reels$/);
    await expect(clip).toHaveAttribute("data-playing", "true");
    expect(await clip.evaluate((element) => element.currentTime)).toBe(17);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.keyboard.press("ArrowDown");
    await expect(clip).toHaveAttribute("aria-label", "Video Kisah Reel 1");
    await expect(page.locator("video")).toHaveCount(1);
});

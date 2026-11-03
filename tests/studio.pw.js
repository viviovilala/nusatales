import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mockMediaPlayback } from "./helpers/media-mock";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "studio@example.test", aud: "authenticated", role: "authenticated", user_metadata: { display_name: "Studio Jati" } };
const profile = { id: user.id, username: "studio_jati", display_name: "Studio Jati", bio: "Cerita dari Nusantara", avatar_path: null };
function works(count = 15) {
    return Array.from({ length: count }, (_, index) => ({
        id: `22222222-2222-4222-8222-${String(index).padStart(12, "0")}`, creator_id: user.id,
        title: index === 0 ? "Roro Jonggrang" : index === 1 ? "Jejak Batik" : `Cerita ${String(index).padStart(2, "0")}`,
        description: index % 2 === 0 ? "Legenda dan budaya Nusantara." : "Cerita singkat tentang perjalanan budaya.",
        content_type: index % 2 === 0 ? "animation" : "reel", status: index % 3 === 0 ? "published" : "draft", publicly_available: index % 3 === 0,
        thumbnail_path: `owner/${index}/thumbnail.png`, storage_path: index === 14 ? null : `owner/${index}/media.webm`, duration_seconds: 70 + index,
        created_at: `2026-10-${String(index + 1).padStart(2, "0")}T12:00:00Z`, published_at: index % 3 === 0 ? "2026-10-20T12:00:00Z" : null,
    }));
}

async function project(page, initial = works()) {
    const state = { videos: structuredClone(initial), calls: [], signed: 0, failLoad: false, failAction: false, holdAction: false, releaseAction: null, holdNextList: false, releaseList: null };
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.fixture`;
    await mockMediaPlayback(page);
    await page.route("**/auth/v1/**", (route) => route.fulfill({ json: route.request().url().includes("/token")
        ? { access_token: token, refresh_token: "fixture", expires_in: 3600, token_type: "bearer", user } : user }));
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request(); const url = new URL(request.url());
        if (url.pathname.endsWith("/profiles")) return route.fulfill({ json: profile });
        if (url.pathname.includes("/rpc/")) {
            const action = url.pathname.split("/").at(-1);
            const id = request.postDataJSON().p_video_id;
            state.calls.push({ action, id });
            if (state.holdAction) await new Promise((resolve) => { state.releaseAction = resolve; });
            if (state.failAction) return route.fulfill({ status: 400, json: { message: "Perubahan ditolak, coba lagi." } });
            if (action === "soft_delete_video") state.videos = state.videos.filter((video) => video.id !== id);
            else { const video = state.videos.find((video) => video.id === id); if (video) { video.status = action === "publish_work" ? "published" : "draft"; video.publicly_available = action === "publish_work"; } }
            return route.fulfill({ json: null });
        }
        if (url.pathname.endsWith("/videos")) {
            const id = url.searchParams.get("id")?.replace("eq.", "");
            if (id) {
                const video = state.videos.find((video) => video.id === id);
                if (request.method() === "PATCH" && video) Object.assign(video, request.postDataJSON());
                return route.fulfill({ json: video || null });
            }
            if (!url.searchParams.has("creator_id")) return route.fulfill({ json: [] });
            const snapshot = structuredClone(state.videos);
            if (state.holdNextList) { state.holdNextList = false; await new Promise((resolve) => { state.releaseList = resolve; }); }
            // Non-retryable status isolates the UI's error/retry flow from the
            // Supabase client's exponential retries for transient 5xx responses.
            if (state.failLoad) return route.fulfill({ status: 400, json: { message: "Studio sementara tidak tersedia." } });
            return route.fulfill({ json: snapshot });
        }
        return route.fulfill({ json: [] });
    });
    await page.route("**/storage/v1/**", (route) => {
        if (route.request().method() === "POST") {
            state.signed++;
            const bucket = route.request().url().includes("/videos/") ? "videos" : "thumbnails";
            return route.fulfill({ json: { signedURL: `/object/sign/${bucket}/fixture?token=fixture-${state.signed}` } });
        }
        if (route.request().url().includes("/thumbnails/")) return route.fulfill({ path: fileURLToPath(new URL("./fixtures/reels-art-2.png", import.meta.url)), contentType: "image/png" });
        return route.fulfill({ body: "", contentType: "video/webm" });
    });
    return state;
}
async function openStudio(page) {
    await page.goto("/studio");
    const login = page.getByRole("dialog", { name: "Masuk", exact: true });
    await login.getByPlaceholder("nama@email.com").fill(user.email);
    await login.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await login.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Studio ceritamu." })).toBeVisible();
    await expect(page.locator(".studio-skeleton")).toHaveCount(0);
}
const work = (page, title) => page.getByRole("article", { name: `Karya ${title}`, exact: true });
async function action(page, title, label) {
    await work(page, title).getByRole("button", { name: `Aksi ${title}`, exact: true }).click();
    await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test("Studio combines search, format, status and sorting, paginates and preserves popup context", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1050 });
    await project(page);
    await openStudio(page);
    await page.screenshot({ path: info.outputPath("studio-desktop.png") });
    await expect(page.locator(".studio-stats")).toContainText("15");
    await expect(page.getByRole("article")).toHaveCount(12);
    await page.getByRole("button", { name: "Halaman karya berikutnya" }).click();
    await expect(page.getByRole("article")).toHaveCount(3);
    await page.getByRole("button", { name: "Tayangan animasi", exact: true }).click();
    await page.getByLabel("Status karya").selectOption("published");
    await page.getByLabel("Cari karya").fill("Nusantara");
    await expect(page.getByRole("article")).toHaveCount(3);
    await page.getByLabel("Urutan karya").selectOption("oldest");
    await expect(page.getByRole("article").first()).toHaveAccessibleName("Karya Roro Jonggrang");
    await page.getByRole("button", { name: "Tampilan grid" }).click();
    await expect(page.locator(".studio-works-grid")).toBeVisible();
    await work(page, "Roro Jonggrang").getByRole("link", { name: "Edit", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit karya", exact: true });
    await editor.getByPlaceholder("Judul karya cerita rakyat").fill("Legenda Roro Jonggrang");
    await editor.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
    await expect(editor.getByText("Perubahan informasi berhasil disimpan.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.getByLabel("Cari karya")).toHaveValue("Nusantara");
    await expect(page.getByLabel("Status karya")).toHaveValue("published");
    await expect(work(page, "Legenda Roro Jonggrang")).toBeVisible();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: info.outputPath("studio-desktop-grid.png"), fullPage: true });
    await page.getByRole("button", { name: "Tampilan daftar" }).click();
    await page.getByRole("button", { name: "Reset filter", exact: true }).click();
    await page.getByLabel("Urutan karya").selectOption("newest");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: info.outputPath("studio-desktop-list.png"), fullPage: true });
    await page.getByLabel("Cari karya").fill("tidak-ada");
    await expect(page.getByRole("heading", { name: "Belum menemukan ceritanya?" })).toBeVisible();
    await page.getByRole("button", { name: "Reset pencarian & filter" }).click();
    await expect(page.getByRole("article")).toHaveCount(12);
});

test("publication and deletion confirm, lock duplicate writes and keep failed actions retryable", async ({ page }, info) => {
    const state = await project(page, works(2));
    await openStudio(page);
    await action(page, "Jejak Batik", "Publikasikan");
    let dialog = page.getByRole("dialog", { name: "Siap membagikan cerita?" });
    await expect(dialog.getByRole("button", { name: "Batal", exact: true })).toBeFocused();
    await dialog.getByRole("button", { name: "Batal", exact: true }).click();
    expect(state.calls).toHaveLength(0);
    await action(page, "Jejak Batik", "Publikasikan");
    state.failAction = true;
    await dialog.getByRole("button", { name: "Ya, publikasikan" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Perubahan ditolak");
    await expect(work(page, "Jejak Batik").locator(".studio-status")).toHaveText("Draf");
    state.failAction = false; state.holdAction = true;
    await dialog.getByRole("button", { name: "Ya, publikasikan" }).click();
    await expect.poll(() => state.calls.length).toBe(2);
    await expect(dialog.getByRole("button", { name: "Menyimpan..." })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Menyimpan..." }).evaluate((element) => element.click());
    expect(state.calls).toHaveLength(2);
    state.releaseAction(); state.holdAction = false;
    await expect(dialog).not.toBeVisible();
    await expect(work(page, "Jejak Batik").locator(".studio-status")).toHaveText("Dipublikasikan");
    await action(page, "Jejak Batik", "Tarik ke draf");
    dialog = page.getByRole("dialog", { name: "Kembalikan ke draf?" });
    await dialog.getByRole("button", { name: "Tarik ke draf", exact: true }).click();
    await expect(work(page, "Jejak Batik").locator(".studio-status")).toHaveText("Draf");
    await action(page, "Jejak Batik", "Hapus karya");
    dialog = page.getByRole("dialog", { name: "Hapus karya?" });
    await page.screenshot({ path: info.outputPath("studio-delete-confirmation.png") });
    state.failAction = true;
    await dialog.getByRole("button", { name: "Hapus karya", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(work(page, "Jejak Batik")).toHaveCount(1);
    state.failAction = false;
    await dialog.getByRole("button", { name: "Hapus karya", exact: true }).click();
    await expect(work(page, "Jejak Batik")).toHaveCount(0);
    await expect(page.locator("#studio-library-title")).toBeFocused();
    expect(state.calls.map((call) => call.action)).toEqual(["publish_work", "publish_work", "unpublish_video", "soft_delete_video", "soft_delete_video"]);
});

test("loading errors stay distinct from empty; refresh keeps the last collection", async ({ page }, info) => {
    const state = await project(page, works(2)); state.failLoad = true;
    await openStudio(page);
    await expect(page.getByRole("alert")).toContainText("Studio sementara tidak tersedia");
    await expect(page.getByRole("heading", { name: "Koleksimu dimulai dari satu cerita." })).toHaveCount(0);
    state.failLoad = false;
    await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(2);
    state.failLoad = true;
    await page.getByRole("button", { name: "Muat ulang karya" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2);
    state.failLoad = false; state.videos = [];
    await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Koleksimu dimulai dari satu cerita." })).toBeVisible();
    await page.screenshot({ path: info.outputPath("studio-empty.png"), fullPage: true });
    await page.getByRole("link", { name: "Unggah karya pertama" }).click();
    await expect(page.getByRole("dialog", { name: "Unggah karya", exact: true })).toBeVisible();
});

test("private preview signs media, retries errors, and cleans up its dialog", async ({ page }, info) => {
    const state = await project(page, works(2));
    await openStudio(page);
    await work(page, "Jejak Batik").getByRole("button", { name: "Preview Jejak Batik" }).click();
    const dialog = page.getByRole("dialog", { name: "Preview karya", exact: true });
    await expect(dialog).toContainText("Preview pribadi");
    const video = dialog.getByLabel("Preview Jejak Batik");
    await expect(video).toHaveAttribute("src", /object\/sign\/videos/);
    const before = state.signed;
    await page.screenshot({ path: info.outputPath("studio-preview.png") });
    await video.evaluate((element) => { const event = new Event("error"); event.testMediaError = true; element.dispatchEvent(event); });
    await expect(dialog.getByRole("alert")).toContainText("Video tidak bisa diputar");
    await dialog.getByRole("button", { name: "Muat ulang preview" }).click();
    await expect.poll(() => state.signed).toBeGreaterThan(before);
    await expect(video).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("video")).toHaveCount(0);
    await expect(work(page, "Jejak Batik").getByRole("button", { name: "Preview Jejak Batik" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test("cached editors receive publication and deletion changes without losing unsaved text", async ({ page }) => {
    await project(page, works(2)); await openStudio(page);
    await work(page, "Jejak Batik").getByRole("link", { name: "Edit", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit karya", exact: true });
    await editor.getByPlaceholder("Judul karya cerita rakyat").fill("Judul belum disimpan");
    await page.keyboard.press("Escape");
    await action(page, "Jejak Batik", "Publikasikan");
    await page.getByRole("dialog", { name: "Siap membagikan cerita?" }).getByRole("button", { name: "Ya, publikasikan" }).click();
    await expect(page.locator(".studio-dialog")).toHaveCount(0);
    await work(page, "Jejak Batik").getByRole("link", { name: "Edit", exact: true }).click();
    await expect(editor.getByPlaceholder("Judul karya cerita rakyat")).toHaveValue("Judul belum disimpan");
    await expect(editor.getByRole("button", { name: "Tarik ke Draf", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await action(page, "Jejak Batik", "Hapus karya");
    await page.getByRole("dialog", { name: "Hapus karya?" }).getByRole("button", { name: "Hapus karya", exact: true }).click();
    await expect(work(page, "Jejak Batik")).toHaveCount(0);
    await page.goForward();
    await expect(editor.getByRole("alert")).toContainText("Karya ini sudah dihapus");
    await expect(editor.getByRole("button", { name: "Simpan Perubahan", exact: true })).toHaveCount(0);
});

test("late collection requests cannot overwrite a completed publication change", async ({ page }) => {
    const state = await project(page, works(2)); await openStudio(page);
    state.holdNextList = true;
    await page.getByRole("button", { name: "Muat ulang karya" }).click();
    await expect.poll(() => Boolean(state.releaseList)).toBe(true);
    await action(page, "Jejak Batik", "Publikasikan");
    await page.getByRole("dialog", { name: "Siap membagikan cerita?" }).getByRole("button", { name: "Ya, publikasikan" }).click();
    await expect(work(page, "Jejak Batik").locator(".studio-status")).toHaveText("Dipublikasikan");
    state.releaseList();
    await expect(page.getByRole("button", { name: "Muat ulang karya" })).toBeEnabled();
    await expect(work(page, "Jejak Batik").locator(".studio-status")).toHaveText("Dipublikasikan");
});

test("Studio fits mobile and tablet, keeps batik behind content and handles incomplete drafts", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await project(page); await openStudio(page);
    for (const width of [320, 390, 768, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator(".studio-library").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath("studio-mobile.png"), fullPage: true });
    await work(page, "Cerita 14").getByRole("button", { name: "Aksi Cerita 14" }).click();
    await expect(page.getByRole("menuitem", { name: "Publikasikan", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await work(page, "Cerita 14").getByRole("button", { name: "Preview Cerita 14" }).click();
    const dialog = page.getByRole("dialog", { name: "Preview karya", exact: true });
    await expect(dialog.getByRole("alert")).toContainText("Berkas video belum tersedia");
    await expect(dialog.getByRole("button", { name: "Muat ulang preview" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    const layers = await page.locator(".app-surface").evaluate((element) => { const style = getComputedStyle(element, "::before"); return [style.zIndex, style.pointerEvents, style.maskImage]; });
    expect(layers[0]).toBe("0"); expect(layers[1]).toBe("none"); expect(layers[2]).toContain("kawung.svg");
    await page.getByRole("link", { name: "Pengaturan profil", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Edit profil", exact: true })).toBeVisible();
});

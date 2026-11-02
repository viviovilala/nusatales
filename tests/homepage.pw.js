import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

const records = Array.from({ length: 5 }, (_, index) => ({
    id: `story-${index}`, title: ["Kisah Seribu Candi", "Sangkuriang", "Timun Mas", "Legenda Nusantara", "Jejak Budaya"][index],
    description: "Sebuah perjalanan mengenal cerita rakyat dan warisan budaya Nusantara.",
    content_type: index % 2 ? "reel" : "animation", status: "published", duration_seconds: 75,
    thumbnail_path: `owner/story-${index}/thumb.png`, storage_path: `owner/story-${index}/media.mp4`,
    published_at: "2026-11-02T01:00:00Z", creator: { display_name: "Studio Nusantara", username: "studio_nusantara" },
}));
async function mockProject(page, state = { mode: "ready" }) {
    const publicRequests = [];
    await page.route("**/storage/v1/**", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.includes("/object/public/thumbnails/")) publicRequests.push(url.pathname);
        if (route.request().method() === "POST") {
            await route.fulfill({ json: { signedURL: url.pathname.replace("/storage/v1", "") + "?token=test-fixture" } });
        } else await route.fulfill({ contentType: "image/webp", path: fileURLToPath(new URL("../public/poto/hero-roro-action.webp", import.meta.url)) });
    });
    await page.route("**/auth/v1/**", (route) => route.fulfill({ status: 401, json: { error: "Test is anonymous" } }));
    await page.route("**/rest/v1/**", async (route) => {
        const url = new URL(route.request().url());
        if (!url.pathname.endsWith("/videos")) return route.fulfill({ json: [], headers: { "content-range": "0-0/0" } });
        if (state.mode === "error") return route.fulfill({ status: 400, json: { message: "Test query failed", code: "PGRST100" } });
        let data = state.mode === "empty" ? [] : records;
        if (url.searchParams.has("content_type")) data = data.filter((video) => `eq.${video.content_type}` === url.searchParams.get("content_type"));
        if (url.searchParams.has("title")) {
            const term = url.searchParams.get("title").replace(/^ilike\.%|%$/g, "").toLowerCase();
            data = data.filter((video) => video.title.toLowerCase().includes(term));
        }
        if (url.searchParams.has("id")) data = data.filter((video) => `eq.${video.id}` === url.searchParams.get("id"));
        const single = route.request().headers().accept?.includes("application/vnd.pgrst.object+json");
        await route.fulfill({ json: single ? data[0] || null : data, headers: { "content-range": `0-${Math.max(0, data.length - 1)}/${data.length}` } });
    });
    return publicRequests;
}

async function settleIllustrations(page) {
    // Scroll naturally so lazy artwork is loaded before a full-page export.
    const mascot = page.locator(".home-creator-mascot img");
    await mascot.scrollIntoViewIfNeeded();
    await expect.poll(() => mascot.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

test("desktop home uses published data, format filters, private covers and correct playback links", async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const publicRequests = await mockProject(page);
    await page.goto("/");
    await expect(page.locator(".home-bento .home-story-card")).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator("h1").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Plus Jakarta Sans");
    expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Be Vietnam Pro");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("heading", { name: "Pilihan Paket NusaAdhi" })).toBeVisible();
    expect(await page.locator("footer").evaluate((element) => getComputedStyle(element, "::before").content)).toBe("none");
    await expect(page.locator(".nusa-navbar .nusa-brand img")).toHaveAttribute("src", "/poto/logo.png");
    await settleIllustrations(page);
    await page.screenshot({ path: info.outputPath("home-desktop.png"), fullPage: true });
    await page.locator("#langganan").screenshot({ path: info.outputPath("subscription-desktop.png") });
    await page.getByRole("button", { name: "Lihat paket Explorer", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("belum tersedia untuk pembelian");
    await page.getByRole("button", { name: "Tutup detail paket" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Film animasi", exact: true }).click();
    await expect(page.locator(".home-bento .home-story-card")).toHaveCount(3);
    await expect(page.locator(".home-bento a").first()).toHaveAttribute("href", "/watch/story-0");
    await page.getByRole("button", { name: "Shorts budaya", exact: true }).click();
    await expect(page.locator(".home-bento .home-story-card")).toHaveCount(2);
    await expect(page.locator(".home-bento a").first()).toHaveAttribute("href", "/reels/story-1");
    await page.locator("#story-search").fill("Timun Mas");
    await page.getByRole("button", { name: "Cari cerita", exact: true }).click();
    await expect(page).toHaveURL(/\/animations\?q=Timun%20Mas/);
    await expect(page.getByPlaceholder("Cari judul cerita (misal: Sangkuriang, Roro Jonggrang)...")).toHaveValue("Timun Mas");
    await expect(page.getByRole("heading", { name: 'Hasil Pencarian: "Timun Mas"' })).toBeVisible();
    expect(publicRequests).toEqual([]);
    expect(errors).toEqual([]);
});

test("mobile menu supports keyboard dismissal and search without page overflow", async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockProject(page);
    await page.goto("/");
    await expect(page.locator(".home-bento .home-story-card")).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await settleIllustrations(page);
    await page.screenshot({ path: info.outputPath("home-mobile.png"), fullPage: true });
    const trigger = page.getByRole("button", { name: "Buka menu navigasi" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.locator("#mobile-story-search").fill("Timun Mas");
    await page.getByRole("dialog").getByRole("button", { name: "Cari cerita", exact: true }).click();
    await expect(page).toHaveURL(/\/animations\?q=Timun%20Mas/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto("/");
    await page.getByRole("link", { name: "Jadi kreator", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
});

test("failed and empty feeds expose honest recovery actions", async ({ page }) => {
    const state = { mode: "error" };
    await mockProject(page, state);
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText("Cerita belum berhasil dimuat");
    expect(await page.locator(".home-story-card").count()).toBe(0);
    state.mode = "empty";
    await page.getByRole("button", { name: "Coba lagi" }).click();
    await expect(page.getByRole("heading", { name: "Kisah baru sedang menanti" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bagikan ceritamu" })).toHaveAttribute("href", "/register");
    await expect(page.locator(".home-story-card")).toHaveCount(0);
});

test("entrance motion reveals once on scroll and reduced motion keeps content readable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockProject(page);
    await page.goto("/");
    const plans = page.locator("#langganan");
    await expect.poll(() => plans.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
    await plans.scrollIntoViewIfNeeded();
    await expect.poll(() => plans.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    await expect.poll(() => plans.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    expect(await plans.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect.poll(() => page.locator("#langganan").evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

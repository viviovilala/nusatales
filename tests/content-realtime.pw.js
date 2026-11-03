import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { mockMediaPlayback } from "./helpers/media-mock";
import { animationTitles, animationCatalogRows, taxonomy } from "./helpers/animation-api";

// Shared server state; each browser has its own auth session and websocket.
// PostgreSQL authorization and atomic rollback are tested in database-security.mjs.
const accounts = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"].map((id, index) => ({
    id, email: `viewer-${index}@example.test`, aud: "authenticated", role: "authenticated", user_metadata: {},
}));
const profiles = accounts.map((user, index) => ({ id: user.id, username: `creator_${index}`, display_name: `Kreator ${index}`, avatar_path: null }));
function work(id, index, content_type = "reel", status = "draft") {
    return { id: id.toLowerCase().replaceAll(" ", "-"), creator_id: accounts[index].id, creator: profiles[index], title: id, description: "Cerita Nusantara.",
        content_type, status, animation_status: content_type === "animation" ? "draft" : undefined, storage_path: `owner/${id}/media.webm`,
        thumbnail_path: `owner/${id}/poster.png`, duration_seconds: 30, created_at: "2026-11-03T00:00:00Z", published_at: "2026-11-03T00:00:00Z" };
}
function sharedProject() {
    const state = { videos: [work("Film Akun A", 0, "animation", "published"), work("Reel Awal", 0, "reel", "published"), work("Reel Akun B", 1)],
        revision: 0, sockets: new Set(), reads: [], failPublish: false, failFeed: false, signs: 0 };
    state.isPublic = (video) => video.status === "published" && !video.deleted_at && (video.content_type === "reel" || video.animation_status === "published");
    state.invalidate = () => {
        state.revision++;
        for (const send of state.sockets) send(state.revision);
    };
    return state;
}
async function project(page, state, account) {
    const user = accounts[account], profile = profiles[account];
    await mockMediaPlayback(page);
    await page.routeWebSocket("**/realtime/v1/websocket?*", (socket) => {
        let joined = null;
        const send = (revision) => { if (joined) socket.send(JSON.stringify([joined.ref, null, joined.topic, "postgres_changes", {
            ids: [1], data: { schema: "public", table: "public_content_revision", type: "UPDATE", commit_timestamp: new Date().toISOString(),
                columns: [{ name: "id", type: "bool" }, { name: "revision", type: "int8" }], record: { id: true, revision }, old_record: { id: true } },
        }])); };
        socket.onMessage((raw) => {
            const [join, ref, topic, event, payload] = JSON.parse(String(raw));
            if (event === "phx_join") {
                joined = { ref: join, topic }; state.sockets.add(send);
                socket.send(JSON.stringify([join, ref, topic, "phx_reply", { status: "ok", response: { postgres_changes: payload.config.postgres_changes.map((filter) => ({ ...filter, id: 1 })) } }]));
            } else if (event === "phx_leave") { state.sockets.delete(send); joined = null; socket.send(JSON.stringify([join, ref, topic, "phx_reply", { status: "ok", response: {} }])); }
            else if (event === "heartbeat") socket.send(JSON.stringify([join, ref, topic, "phx_reply", { status: "ok", response: {} }]));
        });
        socket.onClose(() => state.sockets.delete(send));
    });
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.fixture`;
    await page.route("**/auth/v1/**", (route) => route.fulfill({ json: route.request().url().includes("/token") ? { access_token: token, refresh_token: "fixture", expires_in: 3600, token_type: "bearer", user } : user }));
    await page.route("**/rest/v1/**", async (route) => {
        const request = route.request(), url = new URL(request.url()), name = url.pathname.split("/").at(-1);
        state.reads.push({ account, name, query: url.search });
        const single = request.headers().accept?.includes("object"), eq = (key) => url.searchParams.get(key)?.replace(/^eq\./, "");
        if (name === "public_content_revision") return route.fulfill({ json: { revision: state.revision } });
        if (name === "profiles") return route.fulfill({ json: single || eq("id") ? profiles.find((row) => row.id === eq("id")) || profile : profiles });
        if (name === "genres" || name === "culture_tags") return route.fulfill({ json: name === "genres" ? taxonomy : [] });
        if (["publish_work", "unpublish_video"].includes(name)) {
            const item = state.videos.find((video) => video.id === request.postDataJSON().p_video_id);
            if (item.creator_id !== user.id) return route.fulfill({ status: 403, json: { message: "Akses ditolak." } });
            if (state.failPublish) return route.fulfill({ status: 400, json: { message: "Lengkapi sinopsis, poster, dan genre." } });
            item.status = name === "publish_work" ? "published" : "draft";
            if (name === "publish_work" && item.content_type === "animation") item.animation_status = "published";
            state.invalidate(); return route.fulfill({ json: { publicly_available: state.isPublic(item) } });
        }
        const readable = state.videos.filter((video) => !video.deleted_at && (video.creator_id === user.id || state.isPublic(video)));
        if (name === "videos") {
            if (state.failFeed && !eq("id")) return route.fulfill({ status: 400, json: { message: "Koneksi terputus." } });
            let rows = readable.map((video) => ({ ...video, publicly_available: state.isPublic(video) }));
            if (eq("id")) rows = rows.filter((video) => video.id === eq("id"));
            if (eq("creator_id")) rows = rows.filter((video) => video.creator_id === eq("creator_id"));
            if (eq("content_type")) rows = rows.filter((video) => video.content_type === eq("content_type"));
            if (eq("status")) rows = rows.filter((video) => video.status === eq("status"));
            if (eq("video_is_public") === "true") rows = rows.filter(state.isPublic);
            const offset = Number(url.searchParams.get("offset") || 0), limit = Number(url.searchParams.get("limit") || rows.length);
            return route.fulfill({ json: single ? rows[0] || null : rows.slice(offset, offset + limit) });
        }
        if (name === "animations") {
            const rows = animationTitles(readable).filter((title) => title.status === "published" || title.creator_id === user.id);
            return route.fulfill({ json: single ? rows.find((title) => title.id === eq("id")) || null : rows });
        }
        if (name === "animation_episodes") {
            const links = animationTitles(readable).flatMap((title) => title.episodes);
            return route.fulfill({ json: single || eq("video_id") ? links.find((link) => link.video_id === eq("video_id")) || null : links.filter((link) => link.animation_id === eq("animation_id")) });
        }
        if (name === "animation_catalog") {
            let rows = animationCatalogRows(state.videos.filter(state.isPublic));
            if (eq("id")) rows = rows.filter((row) => row.id === eq("id"));
            const search = url.searchParams.get("or"); if (search && !decodeURIComponent(search).includes("Film")) rows = [];
            return route.fulfill({ json: rows, headers: { "content-range": `0-${rows.length}/${rows.length}`, "access-control-expose-headers": "content-range" } });
        }
        if (request.method() === "HEAD") return route.fulfill({ headers: { "content-range": "*/0", "access-control-expose-headers": "content-range" } });
        return route.fulfill({ json: single ? null : [] });
    });
    await page.route("**/storage/v1/**", (route) => {
        const url = new URL(route.request().url());
        if (route.request().method() === "POST") { if (url.pathname.includes("/videos/")) state.signs++; return route.fulfill({ json: { signedURL: url.pathname.replace("/storage/v1", "") + "?token=fixture" } }); }
        return url.pathname.includes("/videos/") ? route.fulfill({ body: "fixture", contentType: "video/webm" }) : route.fulfill({ path: fileURLToPath(new URL("./fixtures/reels-art-2.png", import.meta.url)), contentType: "image/png" });
    });
    await page.goto("/login");
    const dialog = page.getByRole("dialog", { name: "Masuk", exact: true });
    await dialog.getByPlaceholder("nama@email.com").fill(user.email); await dialog.getByPlaceholder("Masukkan kata sandi...").fill("fixture-password");
    await dialog.getByRole("button", { name: "Masuk", exact: true }).click(); await expect(dialog).not.toBeVisible();
}
async function edit(page, id) { await page.goto(`/studio/videos/${id.toLowerCase().replaceAll(" ", "-")}/edit`); return page.getByRole("dialog", { name: "Edit karya", exact: true }); }

test("two online accounts see atomic publication, preserve catalog filters, and stop an unpublished film", async ({ browser }) => {
    const state = sharedProject(), a = await browser.newContext(), b = await browser.newContext();
    try {
        const owner = await a.newPage(), viewer = await b.newPage(); await project(owner, state, 0); await project(viewer, state, 1);
        const editor = await edit(owner, "Film Akun A"); await expect(editor.getByText("Belum publik", { exact: true })).toBeVisible();
        await expect(editor.getByRole("link", { name: "Lihat karya" })).toHaveCount(0);
        await viewer.goto("/animations"); await viewer.getByLabel("Cari judul animasi").fill("Film");
        await expect(viewer.locator(".catalog-card")).toHaveCount(0); await expect.poll(() => state.sockets.size).toBe(2);
        state.failPublish = true; await editor.getByRole("button", { name: "Terbitkan animasi & tayangan", exact: true }).click();
        await expect(editor.getByRole("alert")).toContainText("Lengkapi sinopsis"); expect(state.videos[0].animation_status).toBe("draft");
        state.failPublish = false; await editor.getByRole("button", { name: "Terbitkan animasi & tayangan", exact: true }).click();
        await expect(editor.getByText("Dipublikasikan", { exact: true })).toBeVisible();
        await expect(viewer.locator(".catalog-card")).toHaveCount(1); await expect(viewer.getByLabel("Cari judul animasi")).toHaveValue("Film");
        await viewer.locator(".catalog-poster").click(); await expect(viewer.locator(".watch-summary h1")).toHaveText("Film Akun A");
        const player = viewer.locator(".animation-player video"); await expect(player).toBeVisible();
        await player.evaluate((element) => { window.originalPlayer = element; element.currentTime = 11; }); const signs = state.signs;
        const reads = () => state.reads.filter((read) => read.account === 1 && read.name === "videos" && read.query.includes("id=eq.film-akun-a")).length;
        const before = reads(); state.invalidate(); await expect.poll(reads).toBeGreaterThan(before);
        expect(await player.evaluate((element) => element === window.originalPlayer && element.currentTime === 11)).toBe(true); expect(state.signs).toBe(signs);
        await editor.getByRole("button", { name: "Tarik ke Draf", exact: true }).click();
        await expect(viewer.getByRole("heading", { name: "Animasi belum bisa ditonton." })).toBeVisible(); await expect(viewer.locator("video")).toHaveCount(0);
    } finally { await Promise.all([a.close(), b.close()]); }
});

test("reverse publication updates Shorts without resetting playback or an unsaved popup; removal advances safely", async ({ browser }) => {
    const state = sharedProject(), a = await browser.newContext(), b = await browser.newContext();
    try {
        const viewer = await a.newPage(), owner = await b.newPage(); await project(viewer, state, 0); await project(owner, state, 1);
        await viewer.goto("/reels"); const player = viewer.getByLabel("Video Reel Awal", { exact: true }); await expect(player).toBeVisible();
        await player.evaluate((element) => { window.originalPlayer = element; element.currentTime = 9; });
        const editor = await edit(owner, "Reel Akun B"); await editor.getByPlaceholder("Judul karya cerita rakyat").fill("Belum disimpan");
        await expect.poll(() => state.sockets.size).toBe(2); const before = state.reads.filter((read) => read.account === 0 && read.name === "videos").length;
        await editor.getByRole("button", { name: "Publikasikan Karya", exact: true }).click();
        await expect.poll(() => state.reads.filter((read) => read.account === 0 && read.name === "videos").length).toBeGreaterThan(before);
        await expect(viewer.getByRole("button", { name: "Video Selanjutnya", exact: true })).toBeEnabled();
        expect(await player.evaluate((element) => element === window.originalPlayer && element.currentTime === 9)).toBe(true);
        await expect(editor.getByPlaceholder("Judul karya cerita rakyat")).toHaveValue("Belum disimpan");
        await viewer.getByRole("button", { name: "Video Selanjutnya", exact: true }).click(); await expect(viewer.getByLabel("Video Reel Akun B", { exact: true })).toBeVisible();
        await editor.getByRole("button", { name: "Tarik ke Draf", exact: true }).click();
        await expect(viewer.getByLabel("Video Reel Akun B", { exact: true })).toHaveCount(0); await expect(viewer.getByLabel("Video Reel Awal", { exact: true })).toBeVisible();
        expect(state.reads.filter((read) => read.account === 0 && read.name === "videos" && read.query.includes("content_type=eq.reel")).every((read) => read.query.includes("video_is_public=eq.true"))).toBe(true);
    } finally { await Promise.all([a.close(), b.close()]); }
});

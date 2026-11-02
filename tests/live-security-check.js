/** Dedicated-account integration test; never mutates pre-existing app content.
 * node --env-file=.env.local tests/live-security-check.js
 * Requires SECURITY_TEST_ALLOW_WRITES=true and TEST_USER_{A,B}_{EMAIL,PASSWORD}.
 * Exit 2 = blocked; 1 = failed (including cleanup); 0 = passed.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY",
    "TEST_USER_A_EMAIL", "TEST_USER_A_PASSWORD", "TEST_USER_B_EMAIL", "TEST_USER_B_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length || process.env.SECURITY_TEST_ALLOW_WRITES !== "true") {
    console.error("BLOCKED: dedicated accounts and explicit fixture-write opt-in required.");
    console.error("Missing settings:", [...missing,
        ...(process.env.SECURITY_TEST_ALLOW_WRITES === "true" ? [] : ["SECURITY_TEST_ALLOW_WRITES=true"])].join(", "));
    process.exit(2);
}
const client = () => createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const anon = client(), a = client(), b = client();
const results = [], fixtures = [], interactionFixtures = [];
const runId = randomUUID();
const ok = (result) => {
    assert.equal(result.error, null, `Unexpected API error: ${result.error?.code || result.error?.name || "unknown"}`);
    return result.data;
};
async function test(name, action) {
    try { await action(); results.push({ name, status: "PASS" }); }
    catch (error) { results.push({ name, status: "FAIL", details: error.message }); }
}
function deniedWrite(result) {
    assert.equal(result.error?.code, "42501", "Expected authorization denial (42501), not an arbitrary API/FK/network error");
    assert.ok(!result.data || result.data.length === 0);
}
async function deniedStorage(c, path) {
    const result = await c.storage.from("thumbnails").createSignedUrl(path, 60);
    assert.ok(!result.data?.signedUrl, "Private image unexpectedly signed");
    assert.equal(result.error?.name, "StorageApiError", "Transport failure does not prove access denial");
    assert.match(result.error.message, /not found|unauthorized|permission|row.level.security/i);
}
async function login(c, label) {
    const data = ok(await c.auth.signInWithPassword({
        email: process.env[`TEST_USER_${label}_EMAIL`], password: process.env[`TEST_USER_${label}_PASSWORD`],
    }));
    assert.ok(data.session?.access_token && data.user?.id, `Account ${label} did not authenticate`);
    assert.equal(ok(await c.auth.getUser()).user?.id, data.user.id);
    return data.user.id;
}
async function makeFixture(c, owner) {
    const id = randomUUID();
    const fixture = { c, id, owner, paths: [] };
    ok(await c.from("videos").insert({ id, creator_id: owner, title: `SECURITY-TEST-${runId}`, content_type: "reel" }).select().single());
    fixtures.push(fixture);
    const thumbnail = `${owner}/${id}/thumb-test.png`, media = `${owner}/${id}/media-test.mp4`;
    // Tiny authorization fixtures; these do not exercise media decoding.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1kAAAAASUVORK5CYII=", "base64");
    for (const [bucket, path, bytes, type] of [
        ["thumbnails", thumbnail, png, "image/png"],
        ["videos", media, Buffer.from("NusaTales authorization fixture"), "video/mp4"],
    ]) {
        ok(await c.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: false }));
        fixture.paths.push({ bucket, path });
    }
    ok(await c.from("videos").update({ storage_path: media, thumbnail_path: thumbnail, duration_seconds: 10 })
        .eq("id", id).select().single());
    return { ...fixture, thumbnail, media };
}
try {
    const ownerA = await login(a, "A"), ownerB = await login(b, "B");
    assert.notEqual(ownerA, ownerB, "Two different accounts are required");
    const published = await makeFixture(a, ownerA), draft = await makeFixture(b, ownerB);
    ok(await a.rpc("publish_video", { p_video_id: published.id }));
    await test("Anon reads known published fixture", async () => {
        assert.equal(ok(await anon.from("videos").select("id").eq("id", published.id)).length, 1);
    });
    await test("Anon cannot read known draft fixture", async () => {
        assert.deepEqual(ok(await anon.from("videos").select("id").eq("id", draft.id)), []);
    });
    await test("Owner can sign its draft cover", async () => {
        assert.ok(ok(await b.storage.from("thumbnails").createSignedUrl(draft.thumbnail, 60)).signedUrl);
    });
    await test("Published cover can be signed anonymously", async () => {
        assert.ok(ok(await anon.storage.from("thumbnails").createSignedUrl(published.thumbnail, 60)).signedUrl);
    });
    await test("Anon and another user cannot sign private draft cover", async () => {
        await deniedStorage(anon, draft.thumbnail); await deniedStorage(a, draft.thumbnail);
    });
    await test("Published video cannot launder another owner's draft cover", async () => {
        deniedWrite(await a.from("videos").update({ thumbnail_path: draft.thumbnail }).eq("id", published.id).select());
        assert.equal(ok(await a.from("videos").select("thumbnail_path").eq("id", published.id).single()).thumbnail_path, published.thumbnail);
        await deniedStorage(anon, draft.thumbnail);
    });
    await test("Draft cannot reference another owner's cover", async () => {
        deniedWrite(await b.from("videos").update({ thumbnail_path: published.thumbnail }).eq("id", draft.id).select());
        assert.equal(ok(await b.from("videos").select("thumbnail_path").eq("id", draft.id).single()).thumbnail_path, draft.thumbnail);
    });
    await test("Anon cannot insert draft with valid owner", async () => {
        const id = randomUUID();
        const result = await anon.from("videos").insert({ id, creator_id: ownerA, title: `SECURITY-TEST-${runId}` }).select();
        // If the assertion uncovers a real leak, clean that unexpected insert too.
        const existing = ok(await a.from("videos").select("id").eq("id", id));
        if (existing.length) fixtures.push({ c: a, id, owner: ownerA, paths: [] });
        deniedWrite(result);
    });
    for (const [table, payload] of [
        ["video_likes", { video_id: published.id, user_id: ownerB }],
        ["video_comments", { video_id: published.id, user_id: ownerB, content: `SECURITY-TEST-${runId}` }],
    ]) await test(`Anon cannot insert ${table} with valid foreign keys`, async () => {
        interactionFixtures.push({ table, videoId: published.id, userId: ownerB });
        deniedWrite(await anon.from(table).insert(payload).select());
    });
    for (const [name, attacker, fixture, owner] of [
        ["Anon", anon, published, a], ["Cross-user", a, draft, b],
    ]) await test(`${name} UPDATE preserves the owner's fixture`, async () => {
        const result = await attacker.from("videos").update({ title: "UNAUTHORIZED" }).eq("id", fixture.id).select();
        if (result.error) deniedWrite(result); else assert.deepEqual(result.data, []);
        assert.equal(ok(await owner.from("videos").select("title").eq("id", fixture.id).single()).title, `SECURITY-TEST-${runId}`);
    });
    await test("Published duration is immutable", async () => {
        deniedWrite(await a.from("videos").update({ duration_seconds: 11 }).eq("id", published.id).select());
        assert.equal(ok(await a.from("videos").select("duration_seconds").eq("id", published.id).single()).duration_seconds, 10);
    });
    for (const [column, value] of [["status", "draft"], ["creator_id", ownerB], ["published_at", null], ["deleted_at", new Date().toISOString()]]) {
        await test(`Grants deny direct ${column} changes`, async () => {
            deniedWrite(await a.from("videos").update({ [column]: value }).eq("id", published.id).select());
        });
    }
} catch (error) {
    results.push({ name: "Fixture/authentication setup", status: "FAIL", details: error.message });
} finally {
    for (const { table, videoId, userId } of interactionFixtures) await test(`Cleanup ${table} fixture`, async () => {
        ok(await b.from(table).delete().eq("video_id", videoId).eq("user_id", userId));
        assert.deepEqual(ok(await b.from(table).select("video_id").eq("video_id", videoId).eq("user_id", userId)), []);
    });
    for (const fixture of fixtures) await test(`Cleanup fixture ${fixture.id}`, async () => {
        const errors = [];
        try {
            ok(await fixture.c.rpc("soft_delete_video", { p_video_id: fixture.id }));
            assert.ok(ok(await fixture.c.from("videos").select("deleted_at").eq("id", fixture.id).single()).deleted_at);
        } catch (error) { errors.push(error.message); }
        for (const { bucket, path } of fixture.paths) {
            try {
                ok(await fixture.c.storage.from(bucket).remove([path]));
                const directory = path.slice(0, path.lastIndexOf("/")), filename = path.slice(path.lastIndexOf("/") + 1);
                const remaining = ok(await fixture.c.storage.from(bucket).list(directory, { search: filename }));
                assert.ok(!remaining.some((object) => object.name === filename));
            } catch (error) { errors.push(error.message); }
        }
        assert.deepEqual(errors, [], "Fixture cleanup incomplete");
    });
    await Promise.allSettled([a.auth.signOut(), b.auth.signOut()]);
}
console.table(results);
process.exitCode = results.some((result) => result.status !== "PASS") ? 1 : 0;

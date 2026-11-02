/** Isolated PostgreSQL regression suite. PGlite runs real SQL/RLS, not mocks.
 * Set PGLITE_MODULE_PATH to an installed @electric-sql/pglite module entry,
 * or install that optional verification dependency before running this file.
 * Supabase Auth/Storage schemas are minimal local fixtures; remote Storage HTTP
 * behavior still requires tests/live-security-check.js against a test project.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const moduleName = process.env.PGLITE_MODULE_PATH
    ? pathToFileURL(process.env.PGLITE_MODULE_PATH).href : "@electric-sql/pglite";
const { PGlite } = await import(moduleName);
const db = new PGlite();
let passed = 0;
const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const V = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", W = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ap = `${A}/${V}/thumb.png`, bp = `${B}/${W}/thumb.png`;
async function as(role, uid, action) {
    await db.exec("begin");
    try {
        await db.exec(`set local role ${role}`);
        await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid || ""]);
        const result = await action();
        await db.exec("commit");
        return result;
    } catch (error) { await db.exec("rollback"); throw error; }
}
async function test(name, action) {
    await action(); passed++; console.log(`PASS ${name}`);
}
async function deny(action, code = "42501") {
    await assert.rejects(action, (error) => error.code === code);
}
try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table storage.buckets (id text primary key, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid default gen_random_uuid() primary key,
        bucket_id text references storage.buckets(id), name text not null, unique(bucket_id, name));
      create function storage.foldername(name text) returns text[] language sql immutable as
        $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1] $$;
      alter table storage.objects enable row level security;
      grant usage on schema public, auth, storage to anon, authenticated;
      grant all on storage.objects to anon, authenticated;
      alter default privileges in schema public grant all on tables to anon, authenticated;
    `);
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) {
        await db.exec(await readFile(new URL(file, directory), "utf8"));
    }
    console.log("Applied every repository migration to isolated PostgreSQL.");
    await db.query("insert into auth.users(id) values ($1), ($2)", [A, B]);
    for (const [owner, id] of [[A, V], [B, W]]) {
        await as("authenticated", owner, async () => {
            await db.query("insert into public.videos (id,creator_id,title,content_type) values ($1,$2,'Security fixture','reel')", [id, owner]);
            await db.query("insert into storage.objects(bucket_id,name) values ('thumbnails',$1),('videos',$2)",
                [`${owner}/${id}/thumb.png`, `${owner}/${id}/media.mp4`]);
            await db.query("update public.videos set storage_path=$1,thumbnail_path=$2,duration_seconds=10 where id=$3",
                [`${owner}/${id}/media.mp4`, `${owner}/${id}/thumb.png`, id]);
        });
    }
    await test("valid draft ownership and upload flow", async () => {
        const row = await as("authenticated", A, () => db.query("select * from public.videos where id=$1", [V]));
        assert.equal(row.rows[0].thumbnail_path, ap);
    });
    await test("owner cannot reference another user's cover", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set thumbnail_path=$1 where id=$2", [bp, V]))));
    await test("owner cannot reference another video's cover within their own folder", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set thumbnail_path=$1 where id=$2", [`${A}/${W}/thumb.png`, V]))));
    await test("owned but missing thumbnail cannot be attached", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set thumbnail_path=$1 where id=$2", [`${A}/${V}/missing.png`, V])), "23514"));
    await test("INSERT trigger independently rejects a forged thumbnail", () => deny(() =>
        db.query("insert into public.videos(creator_id,title,thumbnail_path) values ($1,'forged',$2)", [A, bp])));
    await test("INSERT column grants block publication metadata", () => deny(() =>
        as("authenticated", A, () => db.query("insert into public.videos(creator_id,title,status) values ($1,'forged','draft')", [A]))));
    await test("cross-user draft UPDATE returns zero rows", async () => {
        const result = await as("authenticated", A, () => db.query("update public.videos set title='hijacked' where id=$1 returning id", [W]));
        assert.equal(result.rows.length, 0);
        assert.equal((await as("authenticated", B, () => db.query("select title from public.videos where id=$1", [W]))).rows[0].title, "Security fixture");
    });
    await test("draft cover is invisible to anon and other user", async () => {
        for (const [role, user] of [["anon", null], ["authenticated", A]]) {
            assert.equal((await as(role, user, () => db.query("select * from storage.objects where name=$1", [bp]))).rows.length, 0);
        }
    });
    await test("owner can read draft cover", async () => {
        assert.equal((await as("authenticated", B, () => db.query("select * from storage.objects where name=$1", [bp]))).rows.length, 1);
    });
    await test("public avatar remains readable", async () => {
        await as("authenticated", A, () => db.query("insert into storage.objects(bucket_id,name) values ('thumbnails',$1)", [`${A}/avatar-test.png`]));
        assert.equal((await as("anon", null, () => db.query("select * from storage.objects where name=$1", [`${A}/avatar-test.png`]))).rows.length, 1);
    });
    await test("trusted publish RPC succeeds and grants public cover access", async () => {
        await as("authenticated", A, () => db.query("select public.publish_video($1)", [V]));
        assert.equal((await as("anon", null, () => db.query("select * from storage.objects where name=$1", [ap]))).rows.length, 1);
    });
    await test("published cover cannot be swapped to victim's draft cover", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set thumbnail_path=$1 where id=$2", [bp, V]))));
    await test("published duration is locked", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set duration_seconds=11 where id=$1", [V]))));
    await test("published media path is locked", () => deny(() =>
        as("authenticated", A, () => db.query("update public.videos set storage_path=$1 where id=$2", [`${A}/${V}/other.mp4`, V]))));
    for (const column of ["id", "creator_id", "status", "published_at", "deleted_at", "content_type", "created_at", "updated_at"]) {
        await test(`column grants deny direct ${column} UPDATE`, () => deny(() =>
            as("authenticated", A, () => db.query(`update public.videos set ${column}=${column} where id=$1`, [V]))));
    }
    await test("owner can still edit published title", async () => {
        const result = await as("authenticated", A, () => db.query("update public.videos set title='Edited' where id=$1 returning title", [V]));
        assert.equal(result.rows[0].title, "Edited");
    });
    await test("object UPDATE cannot move a thumbnail to another owner", () => deny(() =>
        as("authenticated", A, () => db.query("update storage.objects set name=$1 where name=$2", [`${B}/avatar-stolen.png`, ap]))));
    for (const table of ["video_likes", "video_comments"]) {
        await test(`anonymous ${table} INSERT with valid foreign keys is denied`, () => deny(() =>
            as("anon", null, () => table === "video_likes"
                ? db.query("insert into public.video_likes(video_id,user_id) values ($1,$2)", [V, B])
                : db.query("insert into public.video_comments(video_id,user_id,content) values ($1,$2,'test')", [V, B]))));
    }
    await test("unpublish RPC succeeds and removes anonymous cover access", async () => {
        await as("authenticated", A, () => db.query("select public.unpublish_video($1)", [V]));
        assert.equal((await as("anon", null, () => db.query("select * from storage.objects where name=$1", [ap]))).rows.length, 0);
    });
    await test("soft-delete RPC is idempotent and cannot be undone by client", async () => {
        await as("authenticated", A, () => db.query("select public.soft_delete_video($1)", [V]));
        await as("authenticated", A, () => db.query("select public.soft_delete_video($1)", [V]));
        await deny(() => as("authenticated", A, () => db.query("update public.videos set deleted_at=null where id=$1", [V])));
        assert.ok((await as("authenticated", A, () => db.query("select deleted_at from public.videos where id=$1", [V]))).rows[0].deleted_at);
    });
    await test("missing draft thumbnail does not prevent cancellation cleanup", async () => {
        await as("authenticated", B, () => db.query("delete from storage.objects where name=$1", [bp]));
        await as("authenticated", B, () => db.query("select public.soft_delete_video($1)", [W]));
        assert.ok((await as("authenticated", B, () => db.query("select deleted_at from public.videos where id=$1", [W]))).rows[0].deleted_at);
    });
    console.log(`${passed} database security checks passed.`);
} finally { await db.close(); }

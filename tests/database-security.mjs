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
const LEGACY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
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
        if (file.includes("000012_")) {
            await db.query("insert into auth.users(id) values ($1)", [A]);
            await as("authenticated", A, async () => {
                await db.query("insert into public.videos(id,creator_id,title,description,content_type) values($1,$2,'Legacy animation','Original synopsis','animation')", [LEGACY,A]);
                await db.query("insert into storage.objects(bucket_id,name) values('thumbnails',$1),('videos',$2)", [`${A}/${LEGACY}/thumb.png`,`${A}/${LEGACY}/media.mp4`]);
                await db.query("update public.videos set thumbnail_path=$1,storage_path=$2,duration_seconds=600 where id=$3", [`${A}/${LEGACY}/thumb.png`,`${A}/${LEGACY}/media.mp4`,LEGACY]);
                await db.query("select public.publish_video($1)",[LEGACY]);
                await db.query("insert into public.video_comments(video_id,user_id,content) values($1,$2,'Preserve this comment')",[LEGACY,A]);
            });
        }
        await db.exec(await readFile(new URL(file, directory), "utf8"));
    }
    console.log("Applied every repository migration to isolated PostgreSQL.");
    await db.query("insert into auth.users(id) values ($1), ($2) on conflict do nothing", [A, B]);
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
    await test("legacy animation backfill preserves video ID, comment, public media and creates one film title", async () => {
        const titles = await as("anon",null,()=>db.query("select * from public.animation_catalog where id=$1",[LEGACY]));
        assert.equal(titles.rows[0].first_video_id,LEGACY); assert.equal(titles.rows[0].format,"film"); assert.equal(titles.rows[0].episode_count,1);
        assert.equal((await as("anon",null,()=>db.query("select * from public.video_comments where video_id=$1",[LEGACY]))).rows[0].content,"Preserve this comment");
    });
    const genre = (await db.query("select id from public.genres order by sort_order limit 1")).rows[0].id;
    const otherGenres = (await db.query("select id from public.genres order by sort_order limit 4")).rows.map(row=>row.id);
    const input = { title:"Serial uji",synopsis:"Perjalanan mengenal budaya.",format:"series",language:"Bahasa Indonesia",age_guidance:"all",story_status:"ongoing" };
    const save = (owner,id,data=input,genres=[genre]) => as("authenticated",owner,()=>db.query("select * from public.save_animation($1,$2::jsonb,$3::uuid[],'{}'::uuid[])",[id,JSON.stringify(data),genres]));
    const parent = (await save(A,null)).rows[0], victim = (await save(B,null)).rows[0];
    const make = (owner,parentId,number=1,season=1) => as("authenticated",owner,()=>db.query("select * from public.create_animation_episode($1,'Episode uji','Deskripsi',$2,$3)",[parentId,season,number]));
    const status = (owner,id,action) => as("authenticated",owner,()=>db.query("select * from public.set_animation_status($1,$2)",[id,action]));
    const episode = (await make(A,parent.id)).rows[0];
    await test("new animation draft cannot bypass atomic episode RPC",()=>deny(()=>as("authenticated",A,()=>db.query("insert into public.videos(creator_id,title,content_type) values($1,'orphan','animation')",[A]))));
    await test("draft parent and relation are invisible cross-user",async()=>{
        assert.equal((await as("authenticated",B,()=>db.query("select * from public.animations where id=$1",[parent.id]))).rows.length,0);
        assert.equal((await as("anon",null,()=>db.query("select * from public.animation_episodes where animation_id=$1",[parent.id]))).rows.length,0);
    });
    await test("cross-user parent edits and episode insertion are denied",async()=>{
        await deny(()=>save(A,victim.id)); await deny(()=>make(A,victim.id));
        await deny(()=>status(A,victim.id,"delete"));
    });
    await test("taxonomy writes and direct title/relation mutation are denied",async()=>{
        await deny(()=>as("authenticated",A,()=>db.query("insert into public.genres(name,slug) values('fake','fake')")));
        await deny(()=>as("authenticated",A,()=>db.query("update public.animations set status='published' where id=$1",[parent.id])));
        await deny(()=>as("authenticated",A,()=>db.query("delete from public.animation_episodes where video_id=$1",[episode.id])));
    });
    await test("duplicate episode slot and invalid numbering are rejected atomically",async()=>{
        const before=(await db.query("select count(*)::int n from public.videos")).rows[0].n;
        await deny(()=>make(A,parent.id),"23505"); await deny(()=>make(A,parent.id,0),"23514");
        assert.equal((await db.query("select count(*)::int n from public.videos")).rows[0].n,before);
    });
    await test("maximum three genres and valid taxonomy references are enforced",async()=>{
        await deny(()=>save(A,parent.id,input,otherGenres),"23514");
        await deny(()=>save(A,parent.id,input,["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"]),"23514");
    });
    await test("incomplete title cannot be published",()=>deny(()=>status(A,parent.id,"publish"),"23514"));
    const poster=`${A}/animations/${parent.id}/poster.png`, media=`${A}/${episode.id}/media.mp4`, thumbnail=`${A}/${episode.id}/thumb.png`;
    await as("authenticated",A,async()=>{
        await db.query("insert into storage.objects(bucket_id,name) values('thumbnails',$1),('thumbnails',$2),('videos',$3)",[poster,thumbnail,media]);
        await db.query("update public.videos set storage_path=$1,thumbnail_path=$2,duration_seconds=90 where id=$3",[media,thumbnail,episode.id]);
        await db.query("select public.publish_video($1)",[episode.id]);
    });
    await test("published episode under draft parent remains hidden including media and interactions",async()=>{
        for(const role of ["anon","authenticated"]) {
            const uid=role==="anon"?null:B;
            assert.equal((await as(role,uid,()=>db.query("select * from public.videos where id=$1",[episode.id]))).rows.length,0);
            assert.equal((await as(role,uid,()=>db.query("select * from storage.objects where name=any($1::text[])",[[poster,media,thumbnail]]))).rows.length,0);
        }
        await deny(()=>as("authenticated",A,()=>db.query("insert into public.video_likes(video_id,user_id) values($1,$2)",[episode.id,A])));
    });
    await test("parent cover ownership cannot be borrowed from another title or creator",async()=>{
        await deny(()=>save(A,parent.id,{...input,poster_path:bp}));
        await deny(()=>save(A,parent.id,{...input,poster_path:`${A}/animations/${victim.id}/poster.png`}));
    });
    await save(A,parent.id,{...input,poster_path:poster});
    await test("complete title publishes and catalog groups episodes with real totals",async()=>{
        await status(A,parent.id,"publish");
        const e2=(await make(A,parent.id,2)).rows[0];
        await as("authenticated",A,async()=>{
            const path=`${A}/${e2.id}/media.mp4`; await db.query("insert into storage.objects(bucket_id,name) values('videos',$1)",[path]);
            await db.query("update public.videos set storage_path=$1,duration_seconds=30 where id=$2",[path,e2.id]); await db.query("select public.publish_video($1)",[e2.id]);
        });
        const catalog=await as("anon",null,()=>db.query("select * from public.animation_catalog where id=$1",[parent.id]));
        assert.equal(catalog.rows.length,1); assert.equal(catalog.rows[0].first_video_id,episode.id); assert.equal(catalog.rows[0].episode_count,2); assert.equal(Number(catalog.rows[0].duration_seconds),120);
        assert.equal((await as("anon",null,()=>db.query("select * from storage.objects where name=any($1::text[])",[[poster,media,thumbnail]]))).rows.length,3);
        await as("authenticated",B,()=>db.query("insert into public.video_comments(video_id,user_id,content) values($1,$2,'Visible comment')",[episode.id,B]));
    });
    await test("published parent cannot lose required metadata",()=>deny(()=>save(A,parent.id,{...input,poster_path:null}),"23514"));
    await test("a forged privileged poster reference cannot expose another creator's draft artwork",async()=>{
        const secret=`${B}/animations/${victim.id}/secret.png`;
        await as("authenticated",B,()=>db.query("insert into storage.objects(bucket_id,name) values('thumbnails',$1)",[secret]));
        await db.query("update public.animations set poster_path=$1 where id=$2",[secret,parent.id]);
        assert.equal((await as("anon",null,()=>db.query("select * from storage.objects where name=$1",[secret]))).rows.length,0);
        await db.query("update public.animations set poster_path=$1 where id=$2",[poster,parent.id]);
    });
    await test("format remains immutable after the first episode",()=>deny(()=>save(A,parent.id,{...input,format:"film",poster_path:poster}),"23514"));
    await test("unpublishing parent hides children, images, comments and catalog even from another logged-in user",async()=>{
        await status(A,parent.id,"unpublish");
        for(const [role,uid] of [["anon",null],["authenticated",B]]){
            assert.equal((await as(role,uid,()=>db.query("select * from public.animation_catalog where id=$1",[parent.id]))).rows.length,0);
            assert.equal((await as(role,uid,()=>db.query("select * from storage.objects where name=any($1::text[])",[[poster,media,thumbnail]]))).rows.length,0);
            // Authors retain their own comment for deletion; other comments stay hidden.
            assert.equal((await as(role,uid,()=>db.query("select * from public.video_comments where video_id=$1 and user_id<>coalesce(auth.uid(),'00000000-0000-0000-0000-000000000000')",[episode.id]))).rows.length,0);
        }
        await deny(()=>as("authenticated",B,()=>db.query("insert into public.video_comments(video_id,user_id,content) values($1,$2,'blocked')",[episode.id,B])));
    });
    await test("film cardinality is enforced and deleted upload slots can be reused",async()=>{
        const film=(await save(A,null,{...input,format:"film"})).rows[0]; const first=(await make(A,film.id)).rows[0];
        await deny(()=>make(A,film.id,2),"23514"); await deny(()=>make(A,film.id,1,2),"23514");
        await as("authenticated",A,()=>db.query("select public.soft_delete_video($1)",[first.id]));
        const replacement=(await make(A,film.id)).rows[0]; assert.notEqual(replacement.id,first.id);
    });
    await test("only own draft episodes can move; Reels cannot become episodes",async()=>{
        await deny(()=>as("authenticated",A,()=>db.query("select public.move_animation_episode($1,$2,1,3)",[episode.id,victim.id])));
        await deny(()=>as("authenticated",A,()=>db.query("select public.move_animation_episode($1,$2,1,3)",[episode.id,parent.id])));
        const draft=(await make(A,parent.id,3)).rows[0];
        await deny(()=>as("authenticated",A,()=>db.query("select public.move_animation_episode($1,$2,1,1)",[draft.id,victim.id])));
        const destination=(await save(A,null)).rows[0];
        await as("authenticated",A,()=>db.query("select public.move_animation_episode($1,$2,2,4)",[draft.id,destination.id]));
        assert.equal((await db.query("select season_number from public.animation_episodes where video_id=$1",[draft.id])).rows[0].season_number,2);
        await deny(()=>db.query("insert into public.animation_episodes values($1,$2,1,99)",[V,parent.id]),"23514");
    });
    await test("deleting a parent blocks new uploads and re-publication without removing old media IDs",async()=>{
        await status(A,parent.id,"delete"); await deny(()=>make(A,parent.id,4));
        await as("authenticated",A,()=>db.query("select public.unpublish_video($1)",[episode.id]));
        await deny(()=>as("authenticated",A,()=>db.query("select public.publish_video($1)",[episode.id])),"23514");
        assert.equal((await db.query("select id from public.videos where id=$1",[episode.id])).rows.length,1);
    });
    const revision = async()=>Number((await db.query("select revision from public.public_content_revision where id=true")).rows[0].revision);
    const beforePrivate=await revision();
    const publicTitle=(await save(A,null)).rows[0],publicEpisode=(await make(A,publicTitle.id)).rows[0];
    const publicPoster=`${A}/animations/${publicTitle.id}/poster.png`,publicMedia=`${A}/${publicEpisode.id}/media.mp4`;
    await as("authenticated",A,async()=>{
        await db.query("insert into storage.objects(bucket_id,name) values('thumbnails',$1),('videos',$2)",[publicPoster,publicMedia]);
        await db.query("update public.videos set storage_path=$1,duration_seconds=35 where id=$2",[publicMedia,publicEpisode.id]);
    });
    await test("private draft creation and uploads do not broadcast public revisions",async()=>assert.equal(await revision(),beforePrivate));
    const publishWork=(owner,id)=>as("authenticated",owner,()=>db.query("select public.publish_work($1) result",[id]));
    await test("the same publish_work RPC exposes Reels from account B to account A and anonymous viewers",async()=>{
        const reel=(await as("authenticated",B,()=>db.query("insert into public.videos(creator_id,title,content_type) values($1,'Reel B','reel') returning id",[B]))).rows[0];
        const path=`${B}/${reel.id}/media.mp4`;
        await as("authenticated",B,async()=>{
            await db.query("insert into storage.objects(bucket_id,name) values('videos',$1)",[path]);
            await db.query("update public.videos set storage_path=$1,duration_seconds=15 where id=$2",[path,reel.id]);
        });
        const before=await revision();await publishWork(B,reel.id);assert.ok(await revision()>before);
        for(const [role,uid] of [["authenticated",A],["anon",null]]){
            assert.equal((await as(role,uid,()=>db.query("select id from public.videos v where id=$1 and public.video_is_public(v)",[reel.id]))).rows.length,1);
            assert.equal((await as(role,uid,()=>db.query("select * from storage.objects where name=$1",[path]))).rows.length,1);
        }
    });
    await test("failed atomic publication keeps video and title private and rolls back notifications",async()=>{
        const before=await revision();
        await deny(()=>publishWork(A,publicEpisode.id),"23514");
        assert.equal((await db.query("select status from public.videos where id=$1",[publicEpisode.id])).rows[0].status,"draft");
        assert.equal(await revision(),before);
    });
    await save(A,publicTitle.id,{...input,poster_path:publicPoster});
    await test("publish_work makes animation and video readable to a second account and anonymous viewers",async()=>{
        const result=await publishWork(A,publicEpisode.id); assert.equal(result.rows[0].result.publicly_available,true);
        for(const [role,uid] of [["authenticated",A],["authenticated",B],["anon",null]]){
            const rows=await as(role,uid,()=>db.query("select v.id,public.video_is_public(v) visible from public.videos v where v.id=$1 and public.video_is_public(v)",[publicEpisode.id]));
            assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].visible,true);
            assert.equal((await as(role,uid,()=>db.query("select * from public.animation_catalog where id=$1",[publicTitle.id]))).rows.length,1);
            assert.equal((await as(role,uid,()=>db.query("select * from storage.objects where name=$1",[publicMedia]))).rows.length,1);
        }
        assert.ok(await revision()>beforePrivate);
    });
    await test("idempotent public publication neither rewrites data nor emits duplicate revisions",async()=>{
        const before=await revision();await publishWork(A,publicEpisode.id);assert.equal(await revision(),before);
    });
    await test("cross-user publication is rejected and cannot broadcast",async()=>{
        const before=await revision();await deny(()=>publishWork(B,publicEpisode.id));assert.equal(await revision(),before);
    });
    await test("unpublish broadcasts a public invalidation while removing the work from all public queries",async()=>{
        const before=await revision();await status(A,publicTitle.id,"unpublish");assert.ok(await revision()>before);
        const own=await as("authenticated",A,()=>db.query("select public.video_is_public(v) visible from public.videos v where id=$1",[publicEpisode.id]));assert.equal(own.rows[0].visible,false);
        for(const [role,uid] of [["authenticated",A],["authenticated",B],["anon",null]])assert.equal((await as(role,uid,()=>db.query("select v.id from public.videos v where id=$1 and public.video_is_public(v)",[publicEpisode.id]))).rows.length,0);
        await publishWork(A,publicEpisode.id);assert.equal((await db.query("select status from public.animations where id=$1",[publicTitle.id])).rows[0].status,"published");
    });
    await test("public revision contains no media data and cannot be written by clients",async()=>{
        const rows=await as("anon",null,()=>db.query("select * from public.public_content_revision"));assert.deepEqual(Object.keys(rows.rows[0]).sort(),["id","revision","updated_at"]);
        await deny(()=>as("authenticated",A,()=>db.query("update public.public_content_revision set revision=999")));
        await deny(()=>as("authenticated",A,()=>db.query("select public.bump_public_content_revision()")));
        assert.equal((await db.query("select count(*)::int n from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='public_content_revision'")).rows[0].n,1);
    });
    console.log(`${passed} database security checks passed.`);
} finally { await db.close(); }

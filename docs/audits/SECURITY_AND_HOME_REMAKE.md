# Security follow-up and home remake — 2 November 2026

This follow-up supersedes V3's completion claims for thumbnail privacy, upload
cancellation, and live security assertions. Local verification does not establish
that migrations have been applied to the remote project.

## Security changes

- Migration `20261102000011_thumbnail_ownership_and_video_grants.sql` validates
  media/thumbnail paths against both creator and video ID, including on INSERT.
  Thumbnails must exist when attached or published. Storage SELECT policies
  independently validate ownership, including for invalid legacy references.
- Client INSERT/UPDATE grants list allowed columns; publication/deletion fields
  remain RPC-only. Published media and duration cannot be changed directly.
- Every private cover/avatar consumer uses renewed, short-lived signed URLs.
  Already issued image URLs remain bearer URLs until expiry (five minutes).
- Cancellation checks the full upload operation after each async step and cleans
  up its own draft/objects. Cleanup failures are disclosed. Cancellation is
  disabled after the publication RPC has been sent because it may commit.
- Live tests require two distinct test-account identities and valid fixture IDs.
  Unexpected API/network/FK failures are not reported as authorization success.
  Cleanup uses soft_delete_video and verifies both rows and object removal.

## Verification and limits

- `npm test`: 48 unit tests passed.
  Unit setup replaces Supabase configuration with a non-live test endpoint.
- `npm run test:security:db`: 29 PostgreSQL/PGlite checks passed, applying every
  migration to a fresh isolated database with minimal Auth/Storage fixtures.
  This verifies SQL/grants/triggers/RLS, not Supabase Storage's HTTP service.
- `npm run test:ui`: isolated desktop/mobile checks cover format-based playback
  links, filters, search query navigation, keyboard menu dismissal, private image
  endpoints, original logo, subscription preview, empty/error states and overflow.
- Remote migration state and live two-account tests remain **NOT VERIFIED**.
- No production build, commit, push, or remote migration was executed.

An npm dependency audit also reports 11 findings (2 critical, 8 high, 1 moderate).
Every affected version is unchanged from the starting lockfile: axios,
concurrently, follow-redirects, form-data, nanoid, postcss, react-router,
react-router-dom, shell-quote, source-map-js, and vite. No automatic dependency
upgrade was performed as part of this scoped fix. These findings remain open;
this report is not a claim that the complete dependency tree is vulnerability-free.

## Remote rollout

Reconcile actual migration history first, then apply missing migrations in order
through `000011`. Do not rerun `000003` after hardening: it makes thumbnails public.
Deploy the signed-image client together with the private-bucket migrations.

Check old paths before rollout:

```sql
select id from public.videos
where (storage_path is not null and storage_path !~
  ('^' || creator_id::text || '/' || id::text || '/[^/]+$'))
or (thumbnail_path is not null and thumbnail_path !~
  ('^' || creator_id::text || '/' || id::text || '/[^/]+$'));
```

New constraints are `NOT VALID` for existing rows: they enforce new writes
immediately without silently rewriting data. Reconcile any flagged legacy rows
through an explicitly reviewed repair before validating the constraints. Public
Storage reads of invalid references fail closed under the new policies.

Configure two dedicated **NusaTales accounts** in the ignored `.env.local`:
`TEST_USER_A_EMAIL`, `TEST_USER_A_PASSWORD`, `TEST_USER_B_EMAIL`,
`TEST_USER_B_PASSWORD`. These are not Google account passwords.
Set `SECURITY_TEST_ALLOW_WRITES=true` only for an authorized test project, then
run `npm run test:security:live`. Exit code 2 means blocked, 1 means failed
(including setup/cleanup), 0 means all assertions passed. Fixtures are
soft-deleted and uploaded objects removed; tombstones remain by design.

## Home scope

- Original `/poto/logo.png` retained; Plus Jakarta Sans headings/CTA and
  Be Vietnam Pro body are self-hosted through Fontsource.
- Responsive hero, mascot introduction, published-story bento and format filter,
  latest works, map illustration, subscription cards, creator invitation, footer.
- A single CC0 Kawung background sits below content and the opaque footer.
  Source/license: `public/patterns/README.md`.
- Sections/cards reveal once with fade-up; hero copy and illustrations also
  slide in horizontally. Reduced-motion users see the content immediately.
  The native right-hand scrollbar uses the cream/brown palette and stable gutter.
- Navbar search opens the catalogue with `?q=...`; cards route by actual content
  type. No invented popularity, episode, or balance data.
- Monthly Figma plan previews: Supporter Rp15.000, Explorer Rp35.000,
  VIP/Creator Pack Rp75.000. Buttons open a preview dialog; billing and premium
  entitlements are not enabled.

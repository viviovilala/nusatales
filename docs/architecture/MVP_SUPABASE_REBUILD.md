# NusaTales — Supabase-First MVP Rebuild

> **Status:** APPROVED SCOPE / IMPLEMENTATION NOT STARTED  
> **Branch:** feature/supabase-mvp-rebuild  
> **Baseline:** main @ c47d4e1e677c1b9bd5e9c105894436817257bd5c (18 May 2026)  
> **Document version:** 1.0 — 2 November 2026  
> **Document type:** Product Requirements + Architecture Decision + Technical Design + Implementation Plan + QA Checklist  
> **Audience:** frontend engineer, backend/Supabase engineer, QA, AI coding agent, reviewer  
> **Objective:** replace the Laravel-dependent backend and routing with a focused, working React + Supabase MVP, without disrupting the original main branch.

---

## 0. Executive decision

**Build a NEW, narrowly scoped MVP on this feature branch. Keep NusaTales' existing brand identity and useful React UI, but remove reliance on Laravel for the MVP experience.**

The only must-have product loop is:

**Visitor -> register/login -> profile -> upload video -> publish -> view in vertical Reels feed -> manage own videos -> repeat.**

A visitor should also be able to watch published Reels without logging in. An authenticated user can edit their profile, upload and manage their own videos, and optionally like/comment on published videos.

### Non-negotiable constraints

1. DO NOT modify, reset, force-push, merge, or delete the main branch.
2. All implementation and migrations must land in feature/supabase-mvp-rebuild and be reviewed before merge.
3. Preserve existing logo, mascot, palette, and the valuable UI. Simplify the app structure; do not redesign everything unnecessarily.
4. Implement only authentication, profile, upload, video CRUD, and the Reels feed as P0.
5. Basic likes/comments can be included as a small, clearly isolated P1 after P0 works. **No point/coin rewards.**
6. **NusaKoin, subscriptions, plans, wallets, monetization, missions, earnings, notifications, ads, admin dashboard, following, favorites, advanced discovery, cultural map, and recommendation algorithms are OUT OF SCOPE.**
7. No Laravel API requests from MVP pages. No fake successful uploads, dummy engagement counts, or silent API error swallowing.
8. Database schema changes are migrations in Git; every exposed table and storage bucket has tested access policies.
9. Never put the Supabase service-role or secret key in browser code, public environment variables, committed files, or screenshots.
10. Do not claim the MVP is complete until the acceptance tests at the end of this document pass against a real test Supabase project.

---

## 1. Product definition

### 1.1 What is NusaTales MVP?

A lightweight Indonesian cultural storytelling/video platform. Its first real value proposition is enabling creators to publish short cultural animation videos and enabling visitors to discover and watch them in a mobile-first, vertical video interface.

### 1.2 MVP target users

- **Visitor:** watches published Reels, opens a creator's public profile, decides to join.
- **Member / creator:** signs up, manages a public profile, uploads videos, publishes/unpublishes, edits/deletes own videos, watches Reels.
- **Operator (manual, temporary):** can inspect data and take down abusive content through protected Supabase administrative tooling. A custom admin UI is not part of MVP.

**Important architecture decision:** no user-vs-creator role gate in MVP. Every authenticated user is permitted to upload. "Creator" means a user who publishes content, not a privileged user-controlled role. Admin privileges must never be accepted from sign-up metadata.

### 1.3 MVP success criterion

Starting from a clean browser and empty database:

1. User A signs up, confirms email when enabled, and logs in.
2. User A completes profile (display name, unique username, optional bio/avatar).
3. User A uploads a valid short video with title and optional description/thumbnail.
4. Upload progress, retry, failures, and completion are accurately shown.
5. The video appears in User A's studio and becomes publicly visible only when explicitly published.
6. Anonymous visitor B can open Reels and play the published video.
7. User A can edit metadata, unpublish, republish, and delete the video.
8. User B cannot modify User A's profile, uploads, media, or video records, even by calling Supabase directly.
9. Session refresh, logout, page refresh, empty states, and network errors work predictably.

### 1.4 Out-of-scope clarification

Defer rather than stub:
- NusaKoin balance, point award rules, coin purchases, coin history.
- Premium subscription, payment gateway, paid content, monetization.
- Full admin CMS and automated video moderation.
- Infinite recommendation ranking/personalization/ML.
- Social follows, creator payouts, live streaming, notifications.
- Stories/map/category exploration and the complete NusaMandala/NusaLanglang flows.
- Full video transcoding, adaptive HLS streaming, custom CDN pipeline.
- Data import from Laravel production users unless verified necessary.

Do not leave dead routes that pretend these functions exist. Hide navigation entries or clearly mark them "Coming later" without broken clicks.

---

## 2. Evidence-based audit of the current repository

Repository: https://github.com/viviovilala/nusatales

### 2.1 Confirmed stack and integration points

| Area | Existing implementation | MVP decision |
|---|---|---|
| UI | React 19, JSX, React Router 7, Tailwind 4 | Keep and refactor |
| Bundler | Vite 8 with laravel-vite-plugin | Convert to standalone Vite |
| Backend | Laravel 13 / PHP 8.3 / Sanctum | Stop using for MVP |
| Main entry | resources/views/welcome.blade.php -> resources/js/app.jsx | Standalone index.html + src entry |
| Auth | resources/js/contexts/AuthContext.jsx, authService.js | Supabase Auth |
| API client | resources/js/services/apiClient.js -> /api/v1 | Supabase SDK/repositories |
| Upload | animationService.js + CreatorStudio.jsx -> Laravel multipart endpoint | Supabase Storage + metadata |
| Public feed | Shorts.jsx, Jelajah.jsx | Real Supabase published videos |
| Playback | AnimationViewer.jsx | Keep useful player components |
| Profile | AccountHub/Dashboard + Laravel users | Dedicated profile / settings |
| Database schema | database/migrations/*.php | New PostgreSQL migrations |
| Existing tests | PHPUnit feature/unit tests | Add JS/component/E2E and SQL/RLS tests |

### 2.2 Specific problems to address, not copy

- apiClient.js stores a Laravel bearer token in localStorage, and services are coupled to fixed /api/v1 endpoints.
- AuthContext.jsx bootstraps with Laravel /auth/me and is not reusable for Supabase sessions.
- Shorts.jsx mixes real records with hardcoded fake Reels, hardcoded likes/comments, and catches some interaction errors without user feedback.
- Jelajah.jsx contains dummy records and placeholder popularity figures; do not treat those as real content.
- Favorit.jsx lists public videos rather than real saved favorites. Remove from MVP navigation rather than falsely implying a working favorites feature.
- Peta.jsx contains static cultural story data. Preserve the UI/assets for future work; do not build this in MVP.
- app.jsx globally patches Node.prototype.removeChild/insertBefore and uses innerHTML to show error text. Remove monkey-patching and replace it with a React error boundary and safe error rendering.
- Register.jsx allows users to choose user/kreator; the new MVP should not require role selection.
- VideoService.php stores files on Laravel's public disk, and existing video statuses allow creator-side published selection; new publishing needs explicit server-controlled validation.
- SubscriptionService.php updates balance, ledger, and subscription without one surrounding transaction; this is **a reason to defer NusaKoin, not a reason to migrate the bug**.
- InteractionService.php awards points for new likes/shares/comments. Repeated unlike/like can award repeatedly. None of those reward paths may exist in MVP.
- In the current frontend, public media is represented with video_url and thumbnail_url, not raw storage paths. Keep a clean UI-facing data contract.

### 2.3 Existing assets worth preserving

- Brand: public/poto/NusaTalesLogo.svg, existing logo, splash/mascot images.
- Landing visuals: hero-roro-*.webp, hero-bandung-bondowoso.webp, etc.
- Reels layout idea in Shorts.jsx.
- Studio layout idea in CreatorStudio.jsx.
- Existing font/color palette and responsive styles.

### 2.4 Baseline limitations

This audit is source inspection of main at the commit listed above. It does **not** prove that the legacy application builds or runs. No production Supabase project, secrets, live data, deployment environment, or existing account inventory was inspected. Before executing data migration, confirm whether real user/video records exist.

---

## 3. Architecture decision record (ADR-001)

### Decision

Use **React SPA + Vite + Supabase Auth + PostgreSQL + Storage**, with limited **Supabase Edge Functions or narrowly scoped PostgreSQL RPC** only for trusted operations, such as publishing and deleting videos when extra validation/cleanup is needed.

~~~text
Browser (React 19 / React Router / Tailwind)
  |
  +-- Supabase Auth (signup, login, session, reset)
  |
  +-- Supabase Data API / supabase-js
  |      |
  |      +-- public.profiles  (RLS)
  |      +-- public.videos    (RLS)
  |      +-- public.video_likes, video_comments (P1; RLS)
  |
  +-- Supabase Storage
  |      +-- avatars (public read; owner write)
  |      +-- videos (private; signed read, owner upload)
  |      +-- thumbnails (private; signed read, owner upload)
  |
  +-- Trusted publishing/deletion boundary
         +-- PostgreSQL RPC and/or Edge Functions
         +-- strict JWT identity verification + ownership checks
~~~

### Why this architecture?

- Supabase supplies a managed identity service and relational database without maintaining a Laravel API server.
- PostgreSQL constraints and RLS secure ownership **even when users bypass the React UI**.
- React routes are navigation/UI responsibilities, not an authorization boundary.
- Protected Storage plus short-lived media URLs allow draft videos to remain non-public.
- Small trusted functions keep publication and cleanup rules out of arbitrary browser updates.

### Explicit trade-offs

- A frontend-only Supabase integration is **not** a security shortcut. RLS, Storage policies, grants, and tests are mandatory.
- Supabase Storage is object storage, **not automatically a full video-transcoding/streaming service**. MVP uses browser-compatible uploaded video formats. HLS/transcoding is a separate later phase.
- Signed media URLs can remain valid until their expiry even if content is unpublished; use a short TTL and understand that immediate revocation of already-issued URLs is not guaranteed.
- Video upload size is subject to current Supabase plan, project settings, and bucket limits. Never assume 100 MB works on every plan.
- No custom backend process is necessary for basic read/write operations, but server-side functions may still be necessary for validation and media cleanup.

### Technical non-goals

No Next.js rewrite, no TypeScript migration requirement, no microservices, no GraphQL layer, no new global state library, and no custom auth framework in MVP.

---

## 4. Priorities and release gates

| Priority | Feature | Required behavior | Release gate |
|---|---|---|---|
| P0 | Standalone React app | npm run dev/build works without PHP | MUST |
| P0 | Auth | Register, verify (if enabled), login, logout, reset password, session restore | MUST |
| P0 | Profile | Public profile + edit own name, username, bio, avatar | MUST |
| P0 | Upload | Real file validation, TUS upload, progress/retry, draft saved | MUST |
| P0 | Video CRUD | List own drafts/live videos; edit, publish, unpublish, delete | MUST |
| P0 | Reels | Real published-video feed with vertical playback, paging, loading/error/empty states | MUST |
| P0 | Security | Tested RLS, protected media, no exposed secrets, ownership enforcement | MUST |
| P0 | Deployment | Frontend deployed with SPA fallback; Supabase configured | MUST |
| P1 | Like/unlike | One like per viewer/video; no NusaKoin | AFTER P0 |
| P1 | Comments | Read/add/delete own comments; no rewards | AFTER P0 |
| P1 | Native share | Copy link / Web Share API | AFTER P0 |
| P2 | Search/categories, favorites, map, follows, notifications | Separate future milestone | LATER |
| P3 | NusaKoin, subscriptions, premium content, earnings | Separate architecture/security review | LATER |

**Launch distinction:** an internal/demo MVP may be released with manual/operator moderation. Opening unrestricted public uploads requires additional abuse reporting/takedown process and a content moderation policy. Do not imply that user-generated content is safe by default.

---

## 5. User stories and acceptance criteria

### US-AUTH-01: Register

Given a new visitor, when they provide a valid email, valid password, and display name, then Supabase creates the account and a matching profile row. Show a clear email-confirmation instruction if confirmation is enabled. Do not auto-navigate to a protected page until a valid authenticated session exists.

- Validate input client-side for UX; server is authoritative.
- Password handling is delegated to Supabase Auth; never store a password in public.profiles.
- Duplicate email and weak password errors are human-readable.
- No client-editable role field.

### US-AUTH-02: Login / logout / recovery

A confirmed member can sign in, refresh the page without unexpected logout, sign out, and start reset-password recovery. Protected routes redirect visitors with a return path.

- Loading/initial session state must not flash protected content.
- No stale Laravel token survives as an auth authority.
- Reset link opens a valid recovery flow; incorrect/expired link displays an error.
- Logout clears active Supabase session and UI state.

### US-PROFILE-01: Edit public profile

A member can edit only their own display name, unique username, optional short bio, and avatar. Anyone can view the public profile by username.

- Username is case-insensitively unique and validated.
- A profile may initially have no username; prompt onboarding.
- Display name can be a friendly fallback.
- Public pages must never expose private auth email or any security credentials.
- Uploaded avatar must have allowed MIME/size; prior avatar cleanup is handled safely.
- User's own profile edit must update navbar/studio without a hard refresh.

### US-VIDEO-01: Start a draft

An authenticated user starts a draft with a title. They receive a stable UUID for their video before uploading media. The unfinished draft is visible only to its owner.

### US-VIDEO-02: Upload media

An owner uploads a supported video file from desktop/mobile.

- Initial MVP policy: MP4 with browser-friendly codecs (H.264/AAC recommended); optional WebM only after target-browser testing.
- Proposed initial limit: **max 100 MiB and max 180 seconds**, subject to the actual plan/project/bucket limits. The 100 MiB policy is a proposed app rule, NOT a guaranteed Supabase allowance.
- Vertical 9:16 recommended; landscape is allowed with sensible letterboxing.
- Support drag/drop or file picker, progress %, cancel, retry/resume on unstable networks.
- Use TUS resumable upload for large files rather than a normal single HTTP request.
- Upload object path is server/user scoped; no arbitrary cross-user overwrite.
- Failed uploads must not create a false "published" record.
- Metadata must record the actual storage path, not a local blob URL.

### US-VIDEO-03: Publish

The owner explicitly publishes a valid, uploaded draft. Trusted server logic confirms that the object exists, belongs to the owner, matches the selected video, is an allowed type, and falls within configured size constraints. Publication timestamp is set by the server.

**Critical:** the browser must not directly assign arbitrary published status by editing a JSON payload. Publishing goes through an audited RPC/Edge Function or similarly protected database mechanism.

### US-VIDEO-04: Edit, unpublish, delete

An owner can:
- Edit title, description, and thumbnail metadata (validate again).
- Unpublish a live video, immediately removing it from public feed queries.
- Republish a valid video without duplicating the record.
- Delete their video with a confirmation step. It disappears from public feed and own studio immediately; associated storage is cleaned by an idempotent privileged cleanup process.
- Never edit or delete another owner's content.

Deleting a database record and deleting storage media are **not one SQL transaction**. Design retryable cleanup to prevent permanent orphaned objects.

### US-REELS-01: Public viewing

Without signing in, a visitor can:
- Open /reels.
- Load only currently published, non-deleted videos.
- Play/pause the current item, mute/unmute, navigate up/down or swipe.
- See title, creator identity, description, and a link to public creator profile.
- Advance to the next page when nearing the end, without loading every video at once.
- See friendly states for no videos, video failure, and slow network.

The app must not append fake videos or invented engagement statistics to database results.

### US-REELS-02: User actions (P1)

- Logged-in members may like/unlike and comment on published videos.
- Visitors are prompted to sign in before posting.
- Interaction errors must roll back optimistic UI updates or show explicit failure.
- **No NusaKoin, points, earnings, or monetization side effects.**

---

## 6. Route map and UI navigation contract

| Public route | UI purpose | Auth required? |
|---|---|---|
| / | New/retained landing and CTA | No |
| /reels | Primary vertical feed | No |
| /reels/:videoId | Deep link to individual video | No |
| /u/:username | Public creator/user profile + published uploads | No |
| /login | Sign in | No |
| /register | Sign up | No |
| /forgot-password | Request reset link | No |
| /reset-password | Change password in recovery context | Valid recovery context |
| /auth/callback | Auth email/code callback | No, validated internally |
| /studio | My videos: drafts/published | Yes |
| /studio/upload | New draft and upload | Yes |
| /studio/videos/:id/edit | Edit own video | Yes |
| /settings/profile | Profile preferences and avatar | Yes |

### Deprecated legacy route strategy

- /shorts -> redirect to /reels.
- /dashboard -> redirect to /studio for authenticated users, otherwise /login.
- /creator/studio -> redirect to /studio.
- /account -> redirect to /settings/profile.
- /favorit, /peta, /jelajah, /admin/studio -> temporarily hide from navigation; use a deliberate fallback page or redirect where appropriate. Do not accidentally expose half-working legacy screens.
- /animations/:id -> redirect to /reels/:id if mapped to a migrated video; otherwise a graceful not-found page.
- All unknown routes -> NotFound, not blank screen.

### Navigation design

Visitor navbar: logo / Home / Reels / Login / Register.

Authenticated navbar: logo / Home / Reels / Upload / Studio / Profile menu / Logout.

Mobile: compact tab navigation and prominent upload action. Retain mascot/brand accents while keeping media controls legible.

---

## 7. Proposed repository restructuring

**Do not wholesale delete old files in the first implementation commit.** Build the new core, test it, then remove the obsolete Laravel runtime in a reviewable cleanup commit.

~~~text
nusatales/
├── index.html                           # Vite SPA entry
├── vite.config.js                       # React + Tailwind, no Laravel plugin
├── package.json
├── .env.example                         # public VITE_ values ONLY
├── public/
│   └── poto/                            # retain visual assets
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── app/
│   │   ├── router.jsx
│   │   ├── providers.jsx
│   │   └── ErrorBoundary.jsx
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   ├── errors.js
│   │   └── mediaUrls.js
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthProvider.jsx
│   │   │   ├── RequireAuth.jsx
│   │   │   ├── authRepository.js
│   │   │   └── pages/
│   │   ├── profile/
│   │   │   ├── profileRepository.js
│   │   │   ├── ProfilePage.jsx
│   │   │   └── EditProfilePage.jsx
│   │   ├── videos/
│   │   │   ├── videoRepository.js
│   │   │   ├── uploadService.js
│   │   │   ├── useUploadVideo.js
│   │   │   ├── VideoForm.jsx
│   │   │   ├── StudioPage.jsx
│   │   │   └── UploadPage.jsx
│   │   ├── reels/
│   │   │   ├── reelsRepository.js
│   │   │   ├── ReelsPage.jsx
│   │   │   ├── ReelCard.jsx
│   │   │   └── useActivePlayback.js
│   │   └── interactions/                 # P1
│   │       ├── likeRepository.js
│   │       └── commentRepository.js
│   ├── components/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── media/
│   └── styles/
├── supabase/
│   ├── config.toml                       # if local CLI is used
│   ├── migrations/
│   │   ├── 20261102_0001_mvp_profiles.sql
│   │   ├── 20261102_0002_mvp_videos.sql
│   │   ├── 20261102_0003_mvp_storage.sql
│   │   ├── 20261102_0004_mvp_publish_functions.sql
│   │   └── 20261102_0005_mvp_interactions.sql  # P1
│   ├── functions/
│   │   └── delete-video/                  # when adopting Edge Function cleanup
│   └── seed.sql                           # local/demo seed; NO private data
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── security/
└── docs/
    └── architecture/
        └── MVP_SUPABASE_REBUILD.md
~~~

**Migration-friendly alternative:** keep resources/js temporarily and gradually move to src/. Avoid two competing active application entry points. The final Vite configuration must specify exactly one correct entry point.

### Responsibilities

- Components/pages render UI and delegate to hooks/services.
- Repositories handle Supabase query contracts and normalize response shapes.
- AuthProvider owns auth session/user state.
- RLS owns authorization; React RequireAuth is only a UX guard.
- Storage service handles upload/progress/path and signed URL resolution.
- Trusted RPC/Edge Functions handle publication invariants and cleanup.
- SQL migrations own schema, policies, grants, and functions. No manual-only database state.

---

## 8. Supabase project setup

### 8.1 Environment separation

Use at least:
- A **development/test** Supabase project with disposable data.
- A **production** project created only after passing security/functional tests.

Never use production user data for development or run destructive migrations against production without backup/review.

### 8.2 Local environment

Example public frontend variables:

~~~dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
VITE_APP_ENV=development
~~~

Do not use VITE_SUPABASE_SERVICE_ROLE_KEY, secret keys, raw database credentials, or provider secrets in Vite. VITE_ variables are included in frontend bundles and must be treated as public.

Server-side function secrets belong in Supabase-managed secrets, never a client .env file. Keep .env.local ignored.

### 8.3 React client bootstrap

~~~js
// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publicKey) {
  throw new Error("Supabase configuration is missing.");
}

export const supabase = createClient(url, publicKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
~~~

### 8.4 Auth dashboard checklist

- Configure Site URL and allowed redirect URLs for local and production domains.
- Decide email confirmation mode; **recommend enabled for public launch**.
- Configure confirmation/recovery templates and an appropriate SMTP strategy before scale.
- Enable email/password authentication; social login is not required for P0.
- Confirm URL callback behavior in both local and deployment environments.
- Protect functions using JWT verification or an equivalent server-side credential check.

### 8.5 Storage setup

Proposed buckets:

| Bucket | Public? | Purpose | Path |
|---|---|---|---|
| avatars | Yes | Profile images (public by design) | owner_uuid/random_uuid.webp |
| videos | **No** | Private uploaded video and draft data | owner_uuid/video_uuid/random_uuid.mp4 |
| thumbnails | **No** | Private thumbnails until published | owner_uuid/video_uuid/random_uuid.webp |

**Why private videos?** A draft must not become retrievable by guessing its path. Published videos can be authorized for signed URL creation through restrictive SELECT policies or through a trusted server endpoint.

---

## 9. Data model (MVP only)

### 9.1 Relationship diagram

~~~text
auth.users (Supabase managed)
    id uuid
       |
       | 1:1
       v
public.profiles
    id uuid PK/FK
    username, display_name, bio, avatar_path
       |
       | 1:N
       v
public.videos
    id uuid PK
    creator_id uuid FK -> profiles.id
    title, description, storage_path, thumbnail_path
    duration_seconds, status, timestamps, deleted_at
       |
       +--- 1:N public.video_comments (P1)
       |
       +--- 1:N public.video_likes (P1)
~~~

### 9.2 Schema specification: profiles

| Column | SQL type | Rules |
|---|---|---|
| id | uuid | PK; references auth.users(id) on delete cascade |
| username | text | nullable until onboarding, case-insensitive unique, lowercase 3-24 characters |
| display_name | text | non-null, 1-60 characters |
| bio | text | nullable, max 160 characters |
| avatar_path | text | nullable, Storage path, NOT a permanent signed URL |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Do not copy the Laravel integer user_id or password hash into this table.

### 9.3 Schema specification: videos

| Column | SQL type | Rules |
|---|---|---|
| id | uuid | PK; random UUID |
| creator_id | uuid | FK -> profiles.id, required |
| title | text | required; trim; 1-120 characters |
| description | text | nullable; <= 2200 characters |
| storage_path | text | nullable while draft; must match owner/video path |
| thumbnail_path | text | nullable |
| duration_seconds | integer | nullable while draft; 1..180 when published |
| status | text | draft or published; initial draft |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| published_at | timestamptz | nullable; set server-side |
| deleted_at | timestamptz | nullable soft-delete marker |

Index (status, published_at DESC, id DESC) for feed; index (creator_id, created_at DESC) for studio; index (creator_id, status).

Video status transitions:

~~~text
create -> DRAFT
DRAFT -- publish (verified media exists) --> PUBLISHED
PUBLISHED -- unpublish --> DRAFT
DRAFT -- publish --> PUBLISHED
DRAFT/PUBLISHED -- delete --> DELETED (deleted_at != null)
DELETED -- any client mutation --> REJECT
~~~

No arbitrary "approved" claim in user editable columns. If moderation is added later, create a separate server-controlled moderation_state.

### 9.4 P1: likes and comments

video_likes:
- user_id UUID FK to profiles.
- video_id UUID FK to videos.
- created_at timestamptz.
- composite PK (user_id, video_id): prevents duplicate likes.

video_comments:
- id UUID PK.
- video_id UUID FK.
- author_id UUID FK.
- body text, min 1 max 1000.
- created_at/updated_at.
- optional deleted_at for moderation.
- index (video_id, created_at DESC).

**No reward points, coin transaction tables, subscriptions or payouts in this MVP schema.**

---

## 10. Proposed migration blueprint — SQL reference

This SQL is a **reviewable design baseline**, not a claim that migrations have been executed or tested. Split it into numbered migrations, test against disposable Supabase, confirm grants/function search_path, and review all policies before deployment.

### 10.1 Profiles

~~~sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text not null default 'Pengguna NusaTales'
    check (char_length(trim(display_name)) between 1 and 60),
  bio text check (bio is null or char_length(bio) <= 160),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,24}$'
  )
);

create unique index profiles_username_lower_unique
on public.profiles (lower(username))
where username is not null;

create or replace function public.handle_new_nusatales_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, display_name)
  values (
    new.id,
    coalesce(
      nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
      'Pengguna NusaTales'
    )
  );
  return new;
end;
$$;

create trigger on_nusatales_auth_created
after insert on auth.users
for each row execute function public.handle_new_nusatales_user();

alter table public.profiles enable row level security;

create policy profiles_public_read
on public.profiles for select
to anon, authenticated
using (true);

create policy profiles_self_update
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
~~~

**Extra required protection:** restrict column grants so users can update only display_name, username, bio, avatar_path. They must not modify id, timestamps, or any future role/admin field. Add a trusted updated_at trigger. A failed profile trigger can block signup; test sign-up and failure cases.

### 10.2 Videos (base table and policies)

~~~sql
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null
    references public.profiles(id) on delete cascade,
  title text not null
    check (char_length(trim(title)) between 1 and 120),
  description text
    check (description is null or char_length(description) <= 2200),
  storage_path text,
  thumbnail_path text,
  duration_seconds integer
    check (duration_seconds is null or duration_seconds between 1 and 180),
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  constraint published_requires_media check (
    status <> 'published'
    or (
      storage_path is not null
      and duration_seconds between 1 and 180
      and published_at is not null
    )
  )
);

create index videos_feed_idx
on public.videos (published_at desc, id desc)
where status = 'published' and deleted_at is null;

create index videos_studio_idx
on public.videos (creator_id, created_at desc);

alter table public.videos enable row level security;

create policy published_videos_public_read
on public.videos for select
to anon, authenticated
using (status = 'published' and deleted_at is null);

create policy owners_read_own_videos
on public.videos for select
to authenticated
using (creator_id = (select auth.uid()));

create policy owners_create_draft
on public.videos for insert
to authenticated
with check (
  creator_id = (select auth.uid())
  and status = 'draft'
  and storage_path is null
  and deleted_at is null
);

create policy owners_update_own_video
on public.videos for update
to authenticated
using (
  creator_id = (select auth.uid())
  and deleted_at is null
)
with check (
  creator_id = (select auth.uid())
  and deleted_at is null
);
~~~

**Do not deploy this UPDATE policy alone as the complete authorization model.** Pair it with explicit SQL column privileges and server-only publish/unpublish/delete operations, otherwise users might change status or media fields outside the intended workflow.

Required grant strategy after reviewing Supabase default grants:
- anon: SELECT only allowed public columns.
- authenticated: SELECT; INSERT only permitted draft columns; UPDATE only owner-editable columns.
- no client UPDATE rights to creator_id, id, status, published_at, deleted_at, created_at.
- prevent changing storage_path to another creator's object: validate first two path segments against auth.uid() and videos.id, ideally in a trusted function/trigger.
- use server-controlled functions with locked ownership checks for publish and unpublish.
- do not use client-supplied creator_id as an authorization assertion; set it from current auth identity.

### 10.3 Publishing function contract

A trusted publish function must validate:

1. JWT identifies a real authenticated user.
2. Video row belongs to that user and is not deleted.
3. Video is a draft, or already published (idempotent).
4. storage_path is present and is under owner_uuid/video_uuid/.
5. Matching object exists in the expected private videos bucket.
6. Object belongs to the current user; size and MIME are within configured rules.
7. duration_seconds is within MVP policy. **Client-reported duration is advisory** until server-side probing/transcoding exists; do not label it "server verified" without actually probing media.
8. Database transition to published + published_at is atomic.
9. Repeat calls cannot create duplicate publications.

Illustrative call:

~~~js
const { data, error } = await supabase.rpc("publish_video", {
  p_video_id: videoId,
});
~~~

Implementation must be security-reviewed:
- For SECURITY DEFINER functions: set search_path explicitly; fully qualify objects; revoke EXECUTE from PUBLIC and grant only required roles.
- Never trust p_creator_id or a role flag from the browser.
- Prefer a single database transaction for DB changes.
- Do not put elevated service keys inside React.
- If using an Edge Function, authenticate the request server-side and perform both ownership and object checks before privileged calls.

A matching unpublish_video function resets status to draft and removes it from public list queries. Existing signed URLs may remain valid until expiry; keep short TTL.

### 10.4 Storage policies (implementation contract)

For **avatars**:
- Public-read bucket.
- Only authenticated user may INSERT/UPDATE/DELETE objects under their own UUID prefix.
- Allowed MIME types: image/jpeg, image/png, image/webp. Suggested max 2 MiB.
- Prefer random object names, never overwrite someone else's path.
- Avatar profile path must point under user's own folder.

For **videos** and **thumbnails** (private):
- INSERT allowed only for authenticated user in own UUID prefix.
- SELECT allowed to owner for drafts and published; to public only if a matching **published, non-deleted** video references the object path.
- UPDATE/DELETE limited to owner and trusted cleanup, ideally mediated by controlled service operation.
- Referencing a random uploaded file must not give visibility to other private assets.
- Protect old objects on metadata replacement; clean safely.
- Never create unrestricted policies such as "with check (true)" for writes.
- Signed URLs should be short-lived (e.g. 5-15 minutes, adjust after player tests).
- Anonymous playback of private media requires a signed URL; simply inserting the raw private object path into a video src is insufficient.

Suggested path validation rule:

~~~text
video path = <auth.uid()>/<videos.id>/<random-file-uuid>.mp4
thumb path = <auth.uid()>/<videos.id>/<random-file-uuid>.webp
avatar path = <auth.uid()>/<random-file-uuid>.webp
~~~

Implement policies on storage.objects using bucket_id, foldername(name), ownership, and a published-video reference where needed. Test createSignedUrl as both anonymous and authenticated; the SELECT permission requirements must be proven in integration tests, not assumed.

### 10.5 Interactions RLS (P1)

- video_likes: users may insert/delete only records with their own user_id for published/non-deleted videos. Primary key prevents duplicate likes.
- video_comments: published comments publicly readable (if intended); logged-in users may insert their own comments only on published/non-deleted videos; only author (or trusted operator) may delete.
- No user can fabricate author_id, overwrite creator_id, or inject currency rewards.
- Display aggregate counts without exposing private identity lists unnecessarily; use appropriately secured server-side aggregate or bounded queries.
- Add anti-spam/rate limits for comments and auth.

---

## 11. Frontend data contract

Normalize Supabase rows to a stable UI shape instead of coupling JSX to every SQL column:

~~~js
// UI-facing reel model
{
  id: "uuid",
  title: "Legenda Timun Mas",
  description: "...",
  durationSeconds: 74,
  videoUrl: "short-lived signed URL",
  thumbnailUrl: "short-lived signed URL or safe placeholder",
  publishedAt: "ISO 8601",
  creator: {
    id: "uuid",
    username: "ceritanusantara",
    displayName: "Cerita Nusantara",
    avatarUrl: "public avatar URL"
  },
  stats: {
    likes: 0,     // only if implemented; never fake
    comments: 0   // only if implemented; never fake
  }
}
~~~

### Repository interfaces

~~~text
authRepository
  signUp(email, password, displayName)
  signIn(email, password)
  signOut()
  requestPasswordReset(email)
  updatePassword(password)

profileRepository
  getPublicProfile(username)
  getOwnProfile()
  updateOwnProfile(input)
  uploadOwnAvatar(file)
  listPublishedVideosByUser(userId, cursor)

videoRepository
  createDraft(input)
  listMyVideos(filters, cursor)
  getMyVideo(videoId)
  updateMyVideoMetadata(videoId, input)
  publishVideo(videoId)
  unpublishVideo(videoId)
  deleteVideo(videoId)

uploadService
  validateVideo(file)
  uploadVideoResumable(file, path, callbacks)
  uploadThumbnail(file, path)
  cancelUpload()
  resumeUpload()

reelsRepository
  listPublishedVideos({ cursor, limit })
  getPublishedVideo(videoId)
  resolvePlaybackUrl(video)
~~~

For all data access:
- Normalize errors once into AppError categories: AUTH, FORBIDDEN, VALIDATION, NETWORK, NOT_FOUND, RATE_LIMIT, STORAGE, UNKNOWN.
- Do not return "success" when Supabase returned an error.
- Do not swallow errors with empty catches.
- Surface actionable recovery (retry, login, choose another file, edit profile).

---

## 12. Authentication state machine

~~~text
INITIALIZING
  |-- valid session ------> AUTHENTICATED
  |-- no/expired session -> ANONYMOUS
  |-- retryable error ----> ERROR / RECOVERABLE

ANONYMOUS
  |-- sign in success ----> AUTHENTICATED
  |-- sign up confirmation required --> EMAIL_CONFIRMATION_PENDING

AUTHENTICATED
  |-- token refresh ------> AUTHENTICATED
  |-- logout ------------> ANONYMOUS
  |-- invalid session ---> ANONYMOUS
~~~

AuthProvider expectations:
- Subscribe to supabase.auth.onAuthStateChange and unsubscribe on cleanup.
- Restore initial session before resolving RequireAuth.
- On auth change, refresh profile separately; do not infer authorization from user-editable metadata.
- Provide { user, profile, isAuthenticated, isLoading, signOut, refreshProfile }.
- If profile row is temporarily unavailable, show a recoverable profile/onboarding state, not a crash.
- Keep password reset and email confirmation separate from normal login redirect.
- Handle duplicate callback events and navigation idempotently.

UX:
- Loading screen during bootstrap.
- Friendly login failures, no debug stack exposure.
- Protected route tracks redirect destination.
- Keep accessible input labels and keyboard focus state.

---

## 13. Video upload lifecycle — full workflow

### 13.1 Start upload

1. Require authenticated session.
2. Validate title, file type, size; inspect video duration/dimensions client-side for early feedback.
3. Create a draft video record; server records creator identity.
4. Obtain video UUID from draft.
5. Generate unique path: user_uuid/video_uuid/file_uuid.mp4.
6. Upload to private videos bucket using resumable TUS (for files >6 MB; using TUS for all videos is acceptable).
7. Update draft record with storage_path and duration once upload finishes.
8. Optionally upload thumbnail under matching user/video prefix.
9. On "Publish": call trusted publish action and refresh status.
10. Navigate to /studio and display the published record.

### 13.2 Failure handling

| Failure | Required behavior |
|---|---|
| Not logged in | Redirect to login, preserve intended action |
| Wrong MIME | Reject before upload and show supported format |
| Over size quota | Explain app limit/project limit; do not retry indefinitely |
| Network interruption | Resume/retry from TUS session when possible |
| User cancels | Stop active upload; leave a recoverable draft or offer cleanup |
| Storage uploaded, DB update failed | Keep draft; retry metadata commit; reconcile orphan later |
| DB draft exists, upload failed | Draft remains private; user can retry or delete |
| Publish verification fails | Keep draft; display specific correction |
| Browser closed mid-upload | No public video; retry/resume depending on retained upload state |
| Replaced file | Use new unique path; avoid CDN cache collision |
| Delete storage fails | Hide/tombstone DB record, log cleanup failure, retry out-of-band |

### 13.3 Upload decisions

- Media must be seekable by the HTML video player. Test on Chrome desktop and Android mobile.
- Do not automatically claim WebM/HEVC/QuickTime support without compatibility checks.
- Favor unique filenames and upsert: false.
- Do not use Base64 media storage in Postgres.
- Generate client preview with object URLs and revoke them on cleanup.
- Avoid embedding entire video files into React state.
- Upload progress from TUS onProgress, not guessed timers.
- Ensure cancel/retry doesn't duplicate DB records or published items.
- Thumbnail may be generated client-side for MVP, but image content/type must be validated and any complex transcoding deferred.
- Prefer one uploaded original MP4 for MVP; adaptive streaming is a future phase.

---

## 14. Reels feed and player behavior

### Fetching

- Query only status=published, deleted_at IS NULL.
- Sort stable: published_at DESC, id DESC.
- Fetch small bounded pages (proposed 8-12 records).
- Prefer keyset pagination once supported by query contract; offset pagination can be used initially with stable ordering and duplicate prevention.
- Fetch creator display_name, username, avatar_path with each video.
- Resolve authorized signed media URLs only for visible items and the next few items, not hundreds at once.
- No static fallback array mixed with real data. Use a true empty state and optionally seed a few **real** test videos in the dev environment.

### Playback

- Vertical one-video-at-a-time active playback.
- Autoplay muted where browser policy requires; include a visible unmute control.
- playsInline on mobile; pause previous item on swipe/scroll/navigation.
- Pause when document becomes hidden; stop old streams when leaving Reels.
- Provide play/pause, mute, retry, progress/loading indicator.
- Respect reduced-motion/user-control preferences.
- Avoid multiple video elements decoding simultaneously.
- Handle signed URL expiry; refresh URL before/after playback failure.
- Keep aspect ratio consistent: object-fit contain/cover by design, avoid severe cropping of animation.
- Preload metadata or the immediately next video only; control bandwidth.
- Keyboard ArrowUp/ArrowDown and touch swipe supported; avoid stealing normal input focus.

### Deep link

Opening /reels/:videoId must fetch that specific published video first, show 404/unavailable if removed, then allow navigating adjacent feed videos. Do not show a draft when ID is guessed.

---

## 15. Video management/studio behavior

### Studio list

Tabs: Drafts / Published (or All / Draft / Published).

Each card includes: thumbnail (or placeholder), title, status, date, actions.

Actions:
- Edit title/description.
- Continue or replace draft upload.
- Publish when media validation passes.
- Unpublish currently published content.
- Delete with confirmation.
- View public Reel URL if published.

### Required confirmations and guards

- Prevent double submit via pending state.
- Confirm irreversible user action or clearly explain soft delete.
- Show progress and error with retry.
- Creator ownership verified in DB, not just hidden by UI.
- If video is deleted, signed link may remain accessible briefly; never show it from live queries.
- If upload is being processed, prevent conflicting publish/delete operations and display appropriate UI state.

---

## 16. Profile UX and identifiers

### Profile data

Display name, username, avatar, bio, public uploaded videos, joined date (optional).

### Public URL

/u/:username uses case-insensitive unique usernames. Use normalized lowercase slug; avoid exposing email in routes.

### Onboarding

After first login, if username is null, prompt user to choose one before publishing. Reading/watching is allowed without username.

### Avatar

Compress locally if possible (within 2 MiB limit), upload to public avatars bucket under own folder, update avatar_path, show fallback mascot/avatar if missing. Ensure browser cannot change another user's avatar or profile path.

### Sign-out / account deletion

Sign-out is P0. Full account-deletion workflow requiring auth admin operations, cascading content decisions, and storage cleanup is **not** a trivial client DELETE and should be separately designed before a broad public launch.

---

## 17. Security threat model and hardening checklist

### Threats

| Threat | Required mitigation |
|---|---|
| User A reads User B's draft | videos RLS + private Storage + signed access restrictions |
| User A edits/deletes User B's media | ownership checks in DB, storage, function |
| Fake published video without upload | trusted publish with object checks |
| Forged creator_id / profile id | auth.uid() checks, immutable owner columns |
| Signup as admin | no role input, no mutable trusted role metadata |
| Unexpected public video file | private bucket; no open public read policy |
| Leaked service role | never in client; server secrets only |
| SQL/API privilege escalation | least-privilege grants, RLS, tests with real JWT |
| Malicious file | MIME/size restrictions, storage rules; future malware/moderation |
| Script injection via text | React escapes text; no unsanitized innerHTML |
| Repeated likes/comments | unique constraints, input limits, anti-spam |
| Repeated upload abuse | quotas, rate limits, bounded size; operator visibility |
| Exposed auth emails | public profile stores no auth email |
| Broken authentication links | configured redirects and validated callback |
| Unbounded media costs | dev quotas, upload cap, storage/egress monitoring |
| Abuse in public UGC | operator takedown + release gate for moderation/reporting |

### Critical API authorization rules

- Client-supplied user_id or creator_id is never considered proof of identity.
- An authenticated user must have no WRITE permission on another user's rows.
- An anonymous visitor must not list drafts or create uploads.
- Role restrictions implemented only in navigation are insufficient.
- RLS must protect both table access and Storage object access.
- Avoid SECURITY DEFINER functions unless needed and carefully audited.
- Revoke excessive default grants and public function EXECUTE where relevant.
- Never use production service-role credentials in test browsers.

### Browser and deployment controls

- HTTPS required in production.
- No raw stack traces or sensitive internal diagnostics in user-visible UI.
- CSP and allowed remote media origins reviewed.
- Proper SPA deep-link fallback so /reels/:id and /u/:username work on refresh.
- No secrets in Git history.
- Dependency lockfile tracked and updated in reviewable commits.

---

## 18. Database migration and legacy compatibility

### Fresh MVP strategy (preferred when no valuable live data exists)

- Treat the legacy Laravel database schema as reference material only.
- Create clean UUID-based Supabase schema and new Auth users.
- Keep legacy files unchanged in branch history until replacement works.
- No attempt to recreate every legacy table.
- Seed limited safe demo content in dev only.

### If real Laravel users/videos must be retained

This becomes a **separate migration project**:
1. Backup original DB and media.
2. Inventory accounts, uploads, status, relationships, and storage paths.
3. Define legacy integer user_id -> new Supabase Auth UUID mapping.
4. Plan approved account migration/reverification/reset process; do not blindly copy old Laravel password hashes into public tables.
5. Transfer files to Storage with integrity checks and ownership mapping.
6. Map published video metadata, creator ownership, thumbnails.
7. Validate sample and total record counts; do not migrate coins/subscription side effects as part of MVP.
8. Cut over only after full restore/rollback plan.

**Never drop or overwrite the Laravel production database just because new Supabase migrations succeed.**

---

## 19. Testing strategy

### 19.1 Unit tests

- username normalization and validation.
- file format/size/duration rejection.
- UI model normalization.
- error-to-message conversion.
- upload state transitions.
- pagination duplicate prevention.
- auth loading and route redirect behavior.

### 19.2 Integration tests (real disposable Supabase)

- Signup creates auth user + public profile.
- Public profile SELECT; self UPDATE succeeds; other-user UPDATE fails.
- Anonymous cannot list draft or create media.
- User A can create/upload/update own draft.
- User B cannot read, update, publish, unpublish, or delete A's draft.
- Published video visible to anonymous.
- A's published video becomes invisible when unpublished.
- createSignedUrl works for visible published media and fails for another user's draft.
- Wrong Storage prefix, bucket, or MIME is rejected.
- Publish without media fails.
- Publish idempotent; unpublish idempotent.
- Delete hides record; cleanup is retryable.
- Expired/invalid JWT cannot call privileged operation.
- P1: duplicate like prevented; comment ownership works.

### 19.3 E2E tests (Playwright recommended)

~~~text
E2E-01 visitor opens landing -> Reels -> empty state
E2E-02 register -> email confirmation message (if enabled)
E2E-03 valid login -> studio
E2E-04 refresh studio -> session restored
E2E-05 logout -> protected routes redirect
E2E-06 forgot/reset password flow
E2E-07 edit display name/bio/username
E2E-08 duplicate username -> clear error
E2E-09 upload correct MP4 -> progress -> private draft
E2E-10 reject unsupported format
E2E-11 reject over-limit upload
E2E-12 network interruption -> retry/resume
E2E-13 publish draft -> public feed
E2E-14 visitor plays Reel by deep link
E2E-15 scroll/swipe changes active video and pauses previous
E2E-16 logged-in creator edits title -> new title visible
E2E-17 unpublish -> Reel no longer public
E2E-18 republish -> Reel public again
E2E-19 delete -> video disappears from studio/feed
E2E-20 browser refresh direct /u/:username works
E2E-21 responsive Android-size viewport
E2E-22 unauthorized user cannot edit a different creator's video
E2E-23 404/unavailable video is graceful, not a blank screen
E2E-24 Supabase network failure shows retryable error
E2E-25 browser console has no unhandled error on success path
~~~

### 19.4 RLS negative test matrix

Test with JWT contexts: **anon, user_A, user_B, owner_A after logout, expired JWT**. Do not test only through UI. Issue direct requests to Supabase and assert deny/not-visible behavior.

| Data/action | anon | Owner A | Other user B |
|---|---|---|---|
| Read published video | Allow | Allow | Allow |
| Read A draft | Deny | Allow | Deny |
| Create A draft | Deny | Allow | Deny |
| Update A draft metadata | Deny | Allow | Deny |
| Publish A video | Deny | Allow | Deny |
| Unpublish A video | Deny | Allow | Deny |
| Delete A video | Deny | Allow | Deny |
| Read A public profile | Allow | Allow | Allow |
| Update A profile | Deny | Allow | Deny |
| Upload to A video prefix | Deny | Allow | Deny |
| Sign A draft media URL | Deny | Allow | Deny |
| Sign A published media URL | Allow (by design) | Allow | Allow |

Storage permission may return 403/404 or an empty result depending on API semantics; the important assertion is no unauthorized data exposure or mutation.

---

## 20. Performance and UX budgets

Initial targets for an MVP test environment, not guaranteed production SLAs:

- Route shell renders without waiting on all feed metadata.
- Small paginated feed batches (8-12 videos), not full table scans.
- Preload only active/adjacent media.
- Video URLs short-lived and refreshed when necessary.
- Avatar/thumbnail optimized, lazy-loaded outside viewport.
- Upload progress is real; show retry on connectivity loss.
- Avoid overfetching signed URLs and creator profiles.
- Keep low-end Android performance in mind.
- First render and feed behavior must be verified on throttled mobile network.

Monitor Supabase Storage usage, monthly egress, and user upload rate. The free tier is for experimentation, not an assumption of unlimited video hosting.

---

## 21. Implementation slices (strict order)

### Slice 0 — Baseline, isolate and prepare

- [ ] Confirm the feature branch base SHA; main remains untouched.
- [ ] Record legacy routes, assets, active dependencies, test baseline.
- [ ] Add ADR + this specification to repo.
- [ ] Remove ambiguity about whether live Laravel user/video data must be imported.
- [ ] Create disposable Supabase dev project and document config process.
- [ ] Add a basic CI workflow for npm install/build/lint/tests (once test tooling exists).

**Gate:** clear source tree and reproducible local development plan.

### Slice 1 — Standalone frontend + Auth

- [ ] Replace Laravel Blade entry with index.html and Vite SPA config.
- [ ] Keep branding/styles/assets working.
- [ ] Add supabase-js client and .env.example.
- [ ] Implement auth repository/provider/RequireAuth.
- [ ] Register, login, logout, recovery/callback.
- [ ] Create profiles migration + trigger + RLS + tests.
- [ ] Remove client use of Sanctum localStorage bearer token.
- [ ] Replace global React DOM prototype patch and innerHTML error renderer.

**Gate:** clean build, protected routes, login persistence, RLS-verified profile.

### Slice 2 — Profiles

- [ ] Public profile and /u/:username.
- [ ] Profile edit form with case-insensitive username uniqueness.
- [ ] Avatar upload and private ownership of writes.
- [ ] Profile onboarding.
- [ ] Tests: self update, cross-user denial, profile URL refresh.

**Gate:** full profile flow works with real Supabase.

### Slice 3 — Video draft, upload, CRUD

- [ ] Videos schema, indexes, grants, RLS, constraints.
- [ ] Storage buckets and policies.
- [ ] Draft create/list/get/edit.
- [ ] TUS upload with progress, cancel/resume, retry.
- [ ] Metadata persistence and path validation.
- [ ] Trusted publish/unpublish actions.
- [ ] Trusted delete/tombstone + cleanup.
- [ ] Studio UI and explicit error states.
- [ ] Test invalid, interrupted, oversized, and cross-owner uploads.

**Gate:** user can upload, publish, edit, unpublish, delete own video; user B cannot tamper.

### Slice 4 — Real Reels

- [ ] Feed query: published only, ordered, paginated.
- [ ] Media signed URL resolver.
- [ ] Vertical player, swipe/up/down, autoplay policy controls.
- [ ] Creator profile link and video deep links.
- [ ] Loading/error/empty states.
- [ ] Remove fake fallback Reels and invented counts.
- [ ] Responsive/low-end mobile checks.
- [ ] Security verification for drafts and unpublish.

**Gate:** new publish appears in anonymous feed and plays; unpublish/delete removes it.

### Slice 5 — Stabilize + deployment

- [ ] Full E2E and RLS attack-matrix tests.
- [ ] Clean broken legacy navigation and redirects.
- [ ] CI build and dependency audit.
- [ ] Site URL/email redirect setup for production.
- [ ] Verify Storage plan limits and billing safety.
- [ ] Production release checklist + rollback/backup.
- [ ] Document limitations and post-MVP enhancements.

**Gate:** all P0 acceptance tests green.

### Slice 6 — Optional P1 (separate PR or commit series)

- [ ] Likes (without coin rewards).
- [ ] Comments (without coin rewards).
- [ ] Native share link.
- [ ] Abuse rate limits and anti-spam.
- [ ] Observability improvements.

Do not let P1 delay working P0.

---

## 22. Recommended commit boundaries

1. docs: define NusaTales Supabase MVP architecture and acceptance
2. build: decouple React Vite from Laravel runtime
3. feat(auth): integrate Supabase Auth and protected routes
4. feat(profile): add profile schema, RLS, and screens
5. feat(video): add owner-scoped drafts and media storage
6. feat(upload): add resumable upload with progress/retry
7. feat(video): implement trusted publish, unpublish, and delete
8. feat(reels): integrate real published feed and player
9. test: add auth, storage, ownership, and E2E regressions
10. chore: remove unused legacy MVP dependencies and dead links

Every commit must keep the app as runnable as practical, and tests should accompany the feature being introduced.

---

## 23. Implementation guardrails for coding agents

Before every change:
- Read this document and current changed files.
- Confirm current branch is feature/supabase-mvp-rebuild.
- Never perform destructive Git operations.
- Check actual Supabase documentation and installed SDK API version.
- Respect existing UI assets; avoid redesigning unrelated pages.
- Never claim integration/test success without running it.

While editing:
- Prefer small focused diffs.
- Keep JSX and reusable components; avoid a giant App.jsx or one mega-service.
- Keep database operations in repositories and authorization in RLS/functions.
- Never hardcode project URLs, secrets, or user IDs.
- Avoid permissive test-only policies being left in production migrations.
- Do not invent backend responses or dummy counts.
- Ensure error handling, loading state, and accessibility.
- Avoid implementing coins/subscriptions/admin/favorites/maps as a side effect.

Before completion:
- npm run build passes.
- Test suite and any required RLS SQL tests pass.
- Document exact commands, outputs, failures, commit SHAs, and limitations.
- Provide summary of schema/policy changes and affected routes.
- Do not merge to main automatically.

---

## 24. Definition of Done (MVP)

### Product

- [ ] Signup/login/logout/recovery works.
- [ ] Public profile and edit-own-profile work.
- [ ] Private draft creation works.
- [ ] Video upload works with real progress, errors, and retry/resume.
- [ ] Video title/description/thumbnail update works.
- [ ] Publish/unpublish/delete are safe and functional.
- [ ] Anonymous Reels feed displays and plays only published records.
- [ ] Deep-link to Reel and profile works after refresh.
- [ ] Empty/loading/error states are finished.
- [ ] No core interaction uses fake fallback records.

### Engineering

- [ ] No Laravel runtime required for MVP dev/build/deploy.
- [ ] All MVP schema and storage policies are versioned as migrations.
- [ ] Auth UUID mapping/relations correct.
- [ ] All exposed tables have RLS enabled; grants audited.
- [ ] Anon, owner and cross-owner negative tests pass.
- [ ] No service keys in client bundle or repository.
- [ ] Build and E2E pass with recorded evidence.
- [ ] Upload size, browser compatibility and storage egress limits verified.
- [ ] main branch remains unchanged.

### Release safety

- [ ] Published content can be taken down by an authorized operator.
- [ ] Public UGC launch has a minimum reporting/moderation process or restricted beta access.
- [ ] Production Auth callback URLs and email templates tested.
- [ ] Observability / error logging does not leak credentials.
- [ ] Restore/rollback plan written and tested to the extent feasible.
- [ ] P0 features do not depend on NusaKoin or subscriptions.

---

## 25. Risks, decisions, and future enhancements

| Risk | Severity | Control |
|---|---|---|
| RLS incomplete exposes private drafts | Critical | Negative tests before deployment |
| Storage object is publicly accessible before publish | Critical | Private video bucket + signed reads |
| Client can modify publish status | High | Column privileges + trusted RPC |
| Auth/profile creation trigger failure | High | Test trigger and fallback/recovery |
| Interrupted upload leaves orphan | Medium | Draft state + scheduled cleanup |
| Video cost unexpectedly grows | High | File size caps, quota, billing alerts |
| Browser codec incompatibility | Medium | MP4 H.264/AAC test matrix |
| New freeform UGC without moderation | High | Restricted beta/manual takedown before public launch |
| Existing real Laravel accounts not mapped | High if applicable | Separate audited migration plan |
| Signed URL remains valid after unpublish | Medium | Short expiry, document limitation |

### Future phase (NOT in MVP)

- NusaKoin architecture: ledger-based immutable transactions, idempotent trusted reward functions, rate limits, transactional balances, anti-fraud tests.
- Subscriptions: provider webhook verification, invoice/entitlement ledger, refund handling, no client-side balance mutation.
- Video pipeline: transcoding, thumbnails, HLS, CDN cost controls.
- Better creator tools: playlists/series, categories/story tags, drafts schedule.
- Social: follows, favorites, notifications, shares, comment moderation.
- NusaMandala/NusaLanglang: map/story exploration and cultural taxonomy.
- Admin: moderation queue, abuse reports, strike/suspension, audit logs.
- Analytics: verified plays, retention, recommendations; do not inflate views client-side.

---

## 26. Open decisions requiring confirmation before the implementation stage

These should **not block writing the plan**, but should be fixed when creating the Supabase project or building features:

1. Does any real user/video data from the Laravel database need preservation, or is this a clean MVP reset?
2. Which Supabase account/project and deployment domain will be used?
3. What are the real plan/bucket limits for uploads? Proposed app max 100 MiB / 180 seconds must be adjusted if incompatible.
4. Should email confirmation be mandatory for the first private demo? Recommendation: yes for public launch; local test mode may differ.
5. Is initial launch invite-only/private beta, or unrestricted public uploads? Public uploads need minimum moderation/reporting before release.
6. Should likes/comments be included before the first demo (P1) or after core upload-to-playback P0 is complete?

Defaults until explicitly changed: clean development data; email/password auth; any authenticated user can upload; 180-second Reels; private video storage; published content open to anonymous viewers; no coins; no subscriptions; Reels likes/comments after P0.

---

## 27. Official technical references

Keep implementation aligned to actual current docs; verify details when writing migrations:

- Supabase Auth + React: https://supabase.com/docs/guides/auth/quickstarts/react
- Managing auth users and public profiles: https://supabase.com/docs/guides/auth/managing-user-data
- PostgreSQL Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Storage access policies: https://supabase.com/docs/guides/storage/security/access-control
- Storage owner_id: https://supabase.com/docs/guides/storage/security/ownership
- Resumable/TUS uploads: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- Standard uploads and recommendation >6MB: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- File size is plan/project/bucket-specific: https://supabase.com/kb/troubleshooting/upload-file-size-restrictions-Y4wQLT

---

## 28. Final go/no-go rule

**GO** only when a real newly registered creator can upload an MP4, publish it, watch it anonymously in Reels, update/unpublish/delete it, and another account cannot tamper with that content — with real RLS/storage tests and no Laravel runtime dependency.

**NO-GO** if upload only works as a mocked success, draft files are public, publishing can be forged by modifying requests, auth state is unreliable, or private/other-owner data is accessible.

The MVP wins by being small, real, secure, and maintainable. NusaKoin and subscriptions wait until this core loop is reliable.

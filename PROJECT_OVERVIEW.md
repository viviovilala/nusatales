# NusaTales Project Overview

Audit date: 2026-05-13

## Summary

NusaTales is currently implemented as a single Laravel application with a React/Vite SPA mounted through Blade. The repository is not split into `backend/` and `frontend/` directories; backend code lives under `app/`, `routes/`, `database/`, and `tests/`, while the React frontend lives under `resources/js` with Vite output generated into `public/build`.

The current codebase implements a foundation for authentication, public animation browsing, single-video playback, creator animation upload, simple engagement, subscriptions using an internal NusaKoin wallet, creator/admin dashboards, and a Filament admin panel. It does not yet implement the full product described in the brief: there are no series or episode entities, no asset store, no payment gateway, no invoice flow, no real coin-package purchase flow, no episode unlock model, no ratings, no bookmarks/favorites table, and no creator payout workflow.

## Architecture

- Backend: Laravel application code under `app/`, versioned API routes in `routes/api_v1.php`, generic API response trait in `app/Support/ApiResponse.php`.
- Frontend: React JSX under `resources/js`, mounted by `resources/views/welcome.blade.php`, routed by `resources/js/app.jsx`.
- Authentication: Laravel Sanctum token authentication with `auth:sanctum` routes and a custom `role` middleware.
- Admin UI: Filament panel at `/admin`, with resources for users, videos, categories, folk stories, plans, ads, and missions.
- Storage: uploaded videos, thumbnails, and profile photos are stored on the `public` disk.
- Tests: PHPUnit feature tests cover auth, health, public animation index, references, creator animation upload/list, and admin moderation.

## Implemented Domains

- Authentication: register, login, logout, profile update, Sanctum token issue/revoke.
- Public catalog: published animation list and detail, categories, folk stories, creator directory.
- Viewer engagement: public view count, authenticated like, share, comment, watch history, notifications, daily missions.
- Creator tools: upload/update/delete a single video record with files, creator dashboard summary, earnings summary/list.
- Monetization foundation: internal `user_points`, `subscription_plans`, `user_subscriptions`, and `nusa_koin_transactions`.
- Admin tools: REST admin endpoints and Filament resources for users, videos, plans, missions, ads, categories, and stories.

## Missing Product Domains

- Series and episodes.
- Episode unlocking and coin-gated playback.
- Coin package purchase and external payment gateway integration.
- Invoice generation and payment webhooks.
- Ratings.
- Bookmarks/favorites separate from likes.
- Asset store: assets, product detail, cart, checkout, orders, order items, and purchased downloads.
- Creator payout and revenue-sharing workflow.
- Production deployment automation and CI/CD.

## Verification Snapshot

- `php artisan route:list`: succeeded, 109 total routes including API, Filament, Livewire, Sanctum, storage, and SPA fallback routes.
- `composer validate --strict`: passed.
- `npm run build`: passed; generated a 341.29 kB JS bundle and 49.16 kB CSS asset.
- `php artisan test`: printed `16 passed (113 assertions)` but the shell command returned a timeout code after the pass output, so the test behavior should be rechecked in CI.


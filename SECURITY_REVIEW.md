# NusaTales Security Review

Audit date: 2026-05-13

## Findings

### High: Authentication endpoints are not route-throttled

- Description: Register, login, public view, comments, likes, and other sensitive write routes have no explicit `throttle` middleware or custom `RateLimiter`.
- Impact: Brute-force login attempts, account creation abuse, view inflation, and interaction spam are easier.
- Recommended fix: Add named rate limiters in `bootstrap/app.php` or a service provider and apply them to auth and public interaction routes.
- Files affected: `routes/api_v1.php`, `bootstrap/app.php`.

### High: Seeder credentials are hardcoded

- Description: `AdminUserSeeder` and `CreatorUserSeeder` create accounts with `password123`.
- Impact: If production or staging is seeded with default credentials, admin/creator compromise is likely.
- Recommended fix: Remove production admin credentials from seeders, require environment-provided bootstrap credentials, and rotate any seeded passwords.
- Files affected: `database/seeders/AdminUserSeeder.php`, `database/seeders/CreatorUserSeeder.php`.

### High: Subscription wallet debit is not transactional

- Description: `SubscriptionService::subscribe` checks balance, decrements points, writes a transaction, cancels old subscriptions, and creates a new subscription without a DB transaction or row lock.
- Impact: Concurrent subscribe requests can double-spend, create inconsistent subscription state, or record partial financial data.
- Recommended fix: Wrap the entire flow in `DB::transaction`, lock the wallet row with `lockForUpdate`, and enforce non-negative balances.
- Files affected: `app/Services/SubscriptionService.php`.

### High: Public view counter can be inflated

- Description: `/api/v1/animations/{video}/view` is public and increments analytics on every request.
- Impact: Creator analytics and future monetization/revenue decisions can be manipulated.
- Recommended fix: Rate limit by IP/user/video, add event de-duplication windows, and keep raw view events separate from aggregate counters.
- Files affected: `routes/api_v1.php`, `app/Http/Controllers/Api/InteractionController.php`, `app/Services/InteractionService.php`.

### Medium: Tokens are stored in `localStorage`

- Description: React stores Sanctum bearer tokens in browser `localStorage`.
- Impact: Any XSS vulnerability can steal long-lived API tokens.
- Recommended fix: Prefer Sanctum SPA cookie mode with secure, same-site cookies, or enforce strict CSP, short token expiry, token rotation, and XSS hardening.
- Files affected: `resources/js/services/apiClient.js`.

### Medium: Self-service creator registration bypasses onboarding approval

- Description: Public registration allows role values `user` and `kreator`.
- Impact: Creator-only upload routes become available to anyone who registers as a creator.
- Recommended fix: Register everyone as `user`, add a creator application/approval workflow, or gate creator status through admin review.
- Files affected: `app/Http/Requests/Auth/RegisterRequest.php`, `app/Services/AuthService.php`, `resources/js/pages/Register.jsx`.

### Medium: Missing email verification and password reset

- Description: The user migration removes `email_verified_at`; no email verification or password reset API exists.
- Impact: Weak account recovery and identity assurance.
- Recommended fix: Add verification and reset flows using Laravel notifications/brokers, restore verification state, and wire frontend pages.
- Files affected: `database/migrations/2026_03_28_042101_align_users_table_with_pengguna_attributes.php`, `routes/api_v1.php`, `resources/js/pages/login.jsx`.

### Medium: File uploads are public and not processed

- Description: Videos, thumbnails, and profile photos are uploaded directly to the public disk with extension/MIME validation only.
- Impact: Large public media uploads can consume disk, bypass moderation review, or expose files before approval.
- Recommended fix: Upload to private/quarantine storage, scan/process asynchronously, transcode videos, and only publish moderated derivatives through CDN/signed URLs.
- Files affected: `app/Http/Requests/Video/StoreVideoRequest.php`, `app/Services/VideoService.php`, `config/filesystems.php`.

### Medium: Missing audit logs for admin and moderation actions

- Description: Admin status changes, user role changes, deletes, plan changes, and ad/mission changes do not write audit records.
- Impact: Production incidents and moderation disputes are hard to investigate.
- Recommended fix: Add audit log table/service with actor, target, action, before/after metadata, IP, and timestamp.
- Files affected: `app/Http/Controllers/Api/Admin/*`, `app/Services/AdminService.php`, `app/Services/AdminCatalogService.php`, `app/Services/VideoService.php`.

### Low: Production example environment is not hardened

- Description: `.env.example` sets `APP_ENV=local`, `APP_DEBUG=true`, SQLite defaults, and local/log mail defaults.
- Impact: Copying the example to production without edits can leak debug information and misconfigure infrastructure.
- Recommended fix: Add `.env.production.example` or harden `.env.example` comments with production-safe values.
- Files affected: `.env.example`, `docs/commands/deploy.md`.

## Positive Controls Observed

- Passwords are cast with Laravel's `hashed` cast on the `User` model.
- API validation errors, authentication errors, model-not-found errors, and generic API exceptions are converted to safe JSON responses.
- File upload requests validate type and size.
- Admin and creator API routes are behind Sanctum and role middleware.
- Creator video lookup is scoped to the current creator.
- Comments can only be deleted by owner or admin.
- `.env` is ignored by Git and is not tracked according to `git ls-files .env .env.example`.


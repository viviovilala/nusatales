# NusaTales Deployment Readiness Checklist

Audit date: 2026-05-13

Deployment readiness score: 42/100

## Verification Results

| Check | Result | Notes |
|---|---|---|
| `composer validate --strict` | Pass | Composer metadata is valid. |
| `php artisan route:list` | Pass | 109 routes registered, including API, Filament, Livewire, Sanctum, storage, and SPA fallback. |
| `npm run build` | Pass | Vite build succeeded; JS bundle 341.29 kB, CSS 49.16 kB. |
| `php artisan test` | Partial | Output printed `16 passed (113 assertions)`, but shell returned a timeout code after the pass output. Recheck in CI. |
| `.github/workflows` | Fail | Directory does not exist. |
| Nginx config | Missing | No deployable Nginx config found. |
| Cloudflare Tunnel config | Missing | No tunnel docs/config found. |
| SSL docs | Missing | No SSL certificate or proxy hardening guide found. |
| Storage link docs | Partial | Mentioned in docs; deployment sequence should explicitly run `php artisan storage:link` before serving uploads. |
| Queue workers | Partial | Jobs tables exist and Composer dev script starts queue listener; no production worker/supervisor config. |
| Environment sample | Partial | `.env.example` exists but is local/debug oriented. |

## Required Pre-Launch Checklist

- [ ] Resolve framework version mismatch: project context says Laravel 12, README says Laravel 13, `composer.json` requires `laravel/framework:^13.0`.
- [ ] Add CI workflow for Composer install, npm install/build, PHP tests, Pint/static analysis.
- [ ] Add deployment workflow or documented manual release runbook with rollback.
- [ ] Add production `.env` guide with `APP_DEBUG=false`, database, queue, cache, mail, filesystem, Sanctum/session, and trusted proxy settings.
- [ ] Add Nginx virtual host config.
- [ ] Add SSL/Cloudflare Tunnel configuration and header handling.
- [ ] Add `php artisan storage:link` to release procedure.
- [ ] Configure queue worker process manager such as Supervisor/systemd.
- [ ] Add scheduler setup if subscriptions, payouts, notifications, or cleanup jobs are introduced.
- [ ] Add database backup/restore procedure before migrations.
- [ ] Add log rotation and application monitoring.
- [ ] Add payment provider secrets/webhook verification before monetization launch.
- [ ] Add media storage/CDN plan before public video launch.
- [ ] Re-run tests in CI and resolve the local timeout behavior.

## Suggested Production Commands

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Current Blockers

- No CI/CD.
- No production infrastructure configuration.
- No payment, invoice, unlock, asset store, or payout backend.
- No route throttling on auth/write endpoints.
- No media processing pipeline.
- No production-safe seeded admin flow.


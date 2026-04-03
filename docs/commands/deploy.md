# Deployment Commands

Operational commands and production deployment guidance for NusaTales. The backend is Laravel-based, while the frontend build is delivered through the Laravel application using Vite assets.

## Deployment Goals

- Build and publish a stable Laravel API release.
- Apply database changes safely.
- Warm up caches for production performance.
- Keep rollback risk low and observable.

## Standard Release Sequence

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan down --render="errors::503"
php artisan migrate --force
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

## Core Artisan Commands

- `php artisan migrate --force`: apply schema changes in production without interactive confirmation.
- `php artisan optimize`: optimize framework bootstrap and package discovery.
- `php artisan config:cache`: cache configuration for faster startup.
- `php artisan route:cache`: cache routes for better route registration performance.
- `php artisan view:cache`: precompile Blade templates used by the Laravel layer.

## Environment Checklist

- [ ] `.env` values are correct for production.
- [ ] `APP_DEBUG=false`.
- [ ] Database backup exists before running migrations.
- [ ] Queue worker and scheduler configuration are active.
- [ ] HTTPS and reverse proxy headers are configured correctly.
- [ ] Storage symlink is created if uploads are used.

## Example VPS Flow

```bash
cd /var/www/nusatales
git fetch origin
git checkout main
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize
sudo systemctl reload php8.3-fpm
sudo systemctl reload nginx
```

## Post-Deploy Validation

- Check health or smoke-test endpoints.
- Verify authentication flow works with the active session or token strategy.
- Verify core modules: NusaMandala, NusaLanglang, and NusaKarya.
- Confirm monetization and community features do not return server errors.
- Review logs for migration, cache, queue, and permission issues.

## Rollback Notes

- Roll back code through Git or release artifacts.
- Revert database only with a reviewed rollback plan.
- Clear and rebuild caches after rollback.

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

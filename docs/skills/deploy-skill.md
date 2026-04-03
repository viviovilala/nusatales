# Deployment Skill

Expected deployment and release capability for developers or DevOps contributors working on NusaTales.

## Core Competencies

- Prepare Laravel production environments on VPS or managed infrastructure.
- Configure Nginx, PHP-FPM, queues, scheduler, and environment variables.
- Build frontend assets with Vite for production delivery.
- Execute safe release, rollback, and validation procedures.

## Deployment Topics

- Linux VPS operations and SSH-based deployment.
- Nginx virtual host and reverse proxy setup.
- Process supervision for queues and scheduled jobs.
- CI/CD pipelines for build, test, and release automation.
- Secret handling and production environment hardening.

## Example Commands

```bash
php artisan migrate --force
php artisan optimize
php artisan queue:restart
sudo systemctl reload nginx
```

## CI/CD Expectations

- Run tests before deploy.
- Build frontend assets in a repeatable environment.
- Fail fast on migration or build errors.
- Track release version or commit hash.

## Operational Checklist

- [ ] Production environment variables are validated.
- [ ] Cache strategy is understood.
- [ ] Queue workers and scheduler are monitored.
- [ ] Rollback path is documented.
- [ ] Post-deploy smoke tests are executed.

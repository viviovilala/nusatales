# Fix Issue Workflow

Standard debugging and issue-resolution workflow for NusaTales. Use this document when investigating API failures, frontend regressions, deployment issues, or data inconsistencies.

## Objectives

- Reproduce the issue with clear scope.
- Identify the failing layer quickly.
- Fix without introducing regressions.
- Leave an audit trail through tests and pull requests.

## Triage Checklist

- [ ] Confirm environment: local, staging, or production.
- [ ] Capture exact error message, endpoint, route, or screen.
- [ ] Identify affected module: NusaMandala, NusaLanglang, NusaKarya, auth, monetization, or community.
- [ ] Determine severity: blocker, major, minor, or cosmetic.
- [ ] Check whether the issue is reproducible.

## Debugging Commands

```bash
php artisan route:list
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
php artisan migrate:status
php artisan test
npm run build
```

## Laravel Investigation Tips

- Check `storage/logs/laravel.log` for exceptions and stack context.
- Validate request payloads and authorization rules.
- Inspect service-layer behavior instead of only checking controllers.
- Confirm environment variables are loaded and cached correctly.
- Review migrations and seed data when the issue is data-related.

## React Investigation Tips

- Reproduce the bug in the browser with network tools open.
- Confirm API request path, headers, and payload structure.
- Check state transitions, route guards, and loading/error states.
- Verify failed requests match backend response conventions.

## Issue Resolution Flow

1. Reproduce the bug and document exact steps.
2. Isolate whether the problem is frontend, backend, integration, or data.
3. Implement the smallest correct fix.
4. Add or update unit or feature tests where applicable.
5. Validate the impacted user journey end to end.
6. Document operational follow-up if deployment or data action is needed.

## Example Operational Commands

```bash
php artisan tinker
php artisan db:seed --class=DemoSeeder
php artisan queue:restart
php artisan schedule:list
```

## Closure Checklist

- [ ] Root cause identified.
- [ ] Fix reviewed by another developer when risk is medium or high.
- [ ] Tests added or updated.
- [ ] No stack trace or sensitive data exposed to users.
- [ ] Relevant docs in `docs/` updated if process or rules changed.

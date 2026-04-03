# Review Process

Code review guidance and checklist for NusaTales pull requests.

## Review Objectives

- Protect platform stability and security.
- Maintain consistent architecture across Laravel and React.
- Keep API contracts predictable for frontend consumers.
- Detect scalability, maintainability, and observability risks early.

## Reviewer Focus Areas

- Correctness of business logic.
- API response consistency.
- Authorization and authentication impact.
- Database migration safety.
- Test coverage for changed behavior.
- Documentation updates for changed standards.

## Pull Request Checklist

- [ ] Scope is clear and limited.
- [ ] Branch targets the correct base branch.
- [ ] Business logic is not hidden inside controllers or components unnecessarily.
- [ ] API changes follow the response contract in `rules/api-convention.md`.
- [ ] Database changes use migrations and preserve data integrity.
- [ ] Validation and authorization are enforced.
- [ ] Sensitive data is not logged or exposed.
- [ ] Unit and feature tests cover the change.
- [ ] Frontend loading, empty, and error states are handled.
- [ ] Documentation is updated when behavior or architecture changes.

## Review Commands

```bash
php artisan test
composer test
npm run build
php artisan route:list
git diff --stat origin/main...HEAD
```

## Review Questions

- Does this change break REST compatibility?
- Does this introduce N+1 queries or unnecessary re-renders?
- Does this respect module boundaries for NusaMandala, NusaLanglang, and NusaKarya?
- Does monetization logic handle edge cases and authorization correctly?
- Could this expose stack traces, internal IDs, or secrets?

## Approval Guidance

- Approve when correctness, tests, and documentation are aligned.
- Request changes when security, data integrity, or API compatibility is unclear.
- Escalate for architecture review when the change alters cross-module boundaries.

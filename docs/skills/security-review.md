# Security Review Skill

Expected security review capability for NusaTales contributors involved in code review, release approval, or architecture changes.

## Review Scope

- Backend API endpoints and authorization.
- Frontend rendering of untrusted content.
- Database access patterns and query safety.
- Deployment configuration and secret management.

## Threats To Evaluate

- XSS in user-generated content, community posts, and creator pages.
- SQL Injection in raw queries or unsafe dynamic filters.
- CSRF in session-based flows.
- IDOR in resource access paths.
- Broken auth or missing policy enforcement.

## Review Tasks

- Verify request validation exists on all writable endpoints.
- Verify authorization checks exist on protected actions.
- Inspect raw SQL usage and parameter binding.
- Review token, cookie, and session handling.
- Confirm production settings do not expose debug output.

## Security Checklist

- [ ] Input validation is comprehensive.
- [ ] Output encoding is safe for rendered content.
- [ ] Sensitive logs and secrets are not exposed.
- [ ] Protected resources enforce ownership or role checks.
- [ ] Rate limiting is considered for abuse-prone endpoints.

## Example Review Commands

```bash
php artisan route:list
php artisan test
rg "DB::raw|whereRaw|innerHTML|dangerouslySetInnerHTML" .
```

# Testing Rules

Testing standards for NusaTales backend and frontend-adjacent integration flows.

## Testing Goals

- Protect core product behavior.
- Catch regressions before merge.
- Validate API contracts and business rules.
- Support confident deployment of modular features.

## Test Types

- Unit tests for isolated services, actions, and utility classes.
- Feature tests for HTTP endpoints, middleware, authorization, and database interactions.
- Integration-oriented checks for critical frontend-to-API flows when possible.

## Priority Areas

- Authentication and access control.
- REST API contracts for NusaMandala, NusaLanglang, and NusaKarya.
- Monetization and subscription logic.
- Community posting, moderation, and membership flows.
- Validation and error handling.

## Laravel Commands

```bash
php artisan test
composer test
php artisan test --filter=Auth
```

## Test Writing Rules

- Name tests by behavior, not implementation.
- Use factories and seeders to keep setup readable.
- Keep each test focused on one behavior.
- Assert status code, payload structure, and side effects where relevant.

## Example Checklist

- [ ] New endpoint has feature tests.
- [ ] New service logic has unit coverage where practical.
- [ ] Auth-protected routes test `401` and `403` behavior.
- [ ] Validation rules test `422` responses.
- [ ] Critical queries are covered for expected data shape.

## Release Readiness

- Minimum expectation: affected feature tests pass before merge.
- High-risk changes should include regression coverage.
- Production bug fixes should add tests unless technically impossible.

# Code Style

Code style rules for PHP, Laravel, JavaScript, and React JSX in NusaTales.

## General Standards

- Prefer clarity over cleverness.
- Keep files focused on one responsibility.
- Use descriptive names for classes, methods, variables, and components.
- Avoid dead code, commented-out blocks, and duplicated business rules.

## PHP and Laravel

- Follow PSR-12 formatting.
- Use `laravel/pint` for automated formatting.
- Keep controllers thin and orchestration-focused.
- Move reusable business logic to `app/Services`, `app/Actions`, or dedicated domain classes.
- Use request classes for validation and policies for authorization.

```bash
./vendor/bin/pint
php artisan test
```

## React JSX

- Use functional components.
- Prefer explicit props and predictable state updates.
- Keep pages responsible for composition and data flow.
- Keep components presentational when possible.
- Centralize HTTP calls in service modules instead of inline component code.

## Naming Conventions

- PHP classes: `PascalCase`.
- React components: `PascalCase`.
- Variables and functions: `camelCase`.
- Database tables: `snake_case` plural.
- Route names: resource-oriented and explicit.

## File Hygiene

- One primary class or component per file.
- Remove debugging statements before merge.
- Keep environment-specific values out of source control.
- Update docs when public behavior changes.

## Review Checklist

- [ ] Formatting passes with project tools.
- [ ] Logic is not duplicated across modules.
- [ ] Naming reflects domain language.
- [ ] Tests remain readable and intention-revealing.
- [ ] Comments explain why, not what.

# Database Rules

Database design, migration, and relation standards for NusaTales.

## Core Principles

- Manage schema changes exclusively through migrations.
- Preserve data integrity with explicit foreign keys and indexes.
- Model domain relationships clearly for content, community, and monetization flows.
- Avoid manual schema edits in production databases.

## Migration Rules

- Every schema change must have a migration.
- Migrations must be idempotent and safe to run once.
- Use descriptive migration names.
- Review destructive changes separately.

```bash
php artisan make:migration create_stories_table
php artisan migrate
php artisan migrate:status
```

## Schema Design Guidance

- Use `foreignId()->constrained()` for relational consistency.
- Add indexes for frequently filtered columns such as `slug`, `status`, `user_id`, and timestamps used in lists.
- Use enums sparingly; prefer constrained strings or lookup tables when states evolve often.
- Use soft deletes only when business recovery requirements justify them.

## Example Relations

- A `user` can own many `stories`, `products`, and `community_posts`.
- A `story` can belong to many `tags` and many `places`.
- A `product` can belong to one `creator` and have many `orders`.
- A `subscription` belongs to one `user` and one plan.

## Data Integrity Checklist

- [ ] Foreign keys are defined.
- [ ] Required columns are non-nullable unless business rules allow null.
- [ ] Cascading behavior is explicit.
- [ ] Unique constraints exist where duplicates are invalid.
- [ ] Large tables have indexes for expected query patterns.

## Seeder Guidance

- Use seeders for local and staging bootstrap data.
- Keep production seeders controlled and reviewable.
- Avoid hiding critical business assumptions inside seed data.

## Anti-Patterns

- Editing tables directly outside migrations.
- Storing relational data in comma-separated fields.
- Missing indexes on lookup-heavy tables.
- Overusing nullable columns without domain justification.

# NusaTales Documentation

Central documentation for the NusaTales platform. This folder is designed to be repository-native, team-readable, and AI-readable so that development standards, operational commands, and implementation rules stay close to the source code.

## Purpose

- Provide a single source of truth for engineering decisions.
- Support onboarding for backend, frontend, QA, DevOps, and reviewers.
- Standardize delivery for Laravel API and React frontend work.
- Make repository guidance explicit for humans and AI coding assistants.

## Product Context

NusaTales is a modular platform with several product domains:

- `NusaMandala`: discovery, mapping, and story-driven cultural content.
- `NusaLanglang`: exploration, itinerary, event, and location interaction flows.
- `NusaKarya`: creator tools, digital offerings, and monetization features.
- `Community`: profiles, social interactions, contributions, and moderation.
- `Core Platform`: authentication, subscriptions, API contracts, and admin support.

## Documentation Map

### Commands

- [`commands/deploy.md`](/c:/laragon/www/nusatales/docs/commands/deploy.md)
- [`commands/fix-issue.md`](/c:/laragon/www/nusatales/docs/commands/fix-issue.md)
- [`commands/review.md`](/c:/laragon/www/nusatales/docs/commands/review.md)

### Rules

- [`rules/api-convention.md`](/c:/laragon/www/nusatales/docs/rules/api-convention.md)
- [`rules/code-style.md`](/c:/laragon/www/nusatales/docs/rules/code-style.md)
- [`rules/database.md`](/c:/laragon/www/nusatales/docs/rules/database.md)
- [`rules/error-handling.md`](/c:/laragon/www/nusatales/docs/rules/error-handling.md)
- [`rules/git-workflow.md`](/c:/laragon/www/nusatales/docs/rules/git-workflow.md)
- [`rules/project-structure.md`](/c:/laragon/www/nusatales/docs/rules/project-structure.md)
- [`rules/security.md`](/c:/laragon/www/nusatales/docs/rules/security.md)
- [`rules/testing.md`](/c:/laragon/www/nusatales/docs/rules/testing.md)

### Skills

- [`skills/skill.md`](/c:/laragon/www/nusatales/docs/skills/skill.md)
- [`skills/deploy-skill.md`](/c:/laragon/www/nusatales/docs/skills/deploy-skill.md)
- [`skills/security-review.md`](/c:/laragon/www/nusatales/docs/skills/security-review.md)

## How To Use This Folder

- Read this file first during onboarding.
- Use `rules/` before implementing new features or refactors.
- Use `commands/` for recurring operational and review procedures.
- Use `skills/` to align team expectations for delivery capability.
- Update documentation in the same pull request as the code change when behavior or architecture changes.

## Documentation Standards

- Write concise technical English.
- Prefer explicit examples over abstract guidance.
- Keep examples aligned with Laravel, React JSX, and REST conventions.
- Use checklists for repeatable engineering workflows.
- Keep domain references consistent with NusaMandala, NusaLanglang, and NusaKarya.

## Maintenance Checklist

- [ ] Update this index when new documentation files are added.
- [ ] Review command examples after deployment changes.
- [ ] Review API and security rules before each release cycle.
- [ ] Ensure product terminology matches current domain modules.

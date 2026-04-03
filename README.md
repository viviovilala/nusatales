# NusaTales

NusaTales is a modular web platform built with Laravel for the backend API and React JSX for the frontend application. The platform is designed for scalable product delivery around cultural discovery, creative ecosystems, monetization, and community-driven experiences.

## Core Domains

- `NusaMandala`: cultural mapping, discovery, and storytelling experience.
- `NusaLanglang`: exploration, travel, and activity-oriented user flows.
- `NusaKarya`: creator ecosystem, digital products, and monetization support.
- `Community`: user engagement, contributions, discussion, and collaboration.
- `Authentication`: user identity, access control, and session-token flows.
- `REST API`: backend integration layer for web clients and future services.

## Technology Stack

- Backend: Laravel 13, PHP 8.3, Eloquent ORM, Artisan CLI.
- Frontend: React 19, React Router 7, Vite.
- Styling: Tailwind CSS 4.
- Testing: PHPUnit for unit and feature tests.
- Local development: Laragon-friendly Laravel + Vite workflow.

## Repository Structure

- [`docs/README.md`](/c:/laragon/www/nusatales/docs/README.md): central documentation index.
- [`docs/commands/deploy.md`](/c:/laragon/www/nusatales/docs/commands/deploy.md): deployment and operational commands.
- [`docs/rules/project-structure.md`](/c:/laragon/www/nusatales/docs/rules/project-structure.md): backend/frontend structure standard.
- [`docs/skills/skill.md`](/c:/laragon/www/nusatales/docs/skills/skill.md): expected developer capabilities.

## Local Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run dev
```

## Development Principles

- Keep business logic in services or actions, not in controllers.
- Use versioned REST endpoints for public and authenticated APIs.
- Treat documentation in `docs/` as the single source of truth for team collaboration.
- Prefer migration-driven database evolution and reviewed pull requests.
- Do not expose internal stack traces or sensitive configuration in responses.

## Documentation

All project documentation is stored in [`docs/README.md`](/c:/laragon/www/nusatales/docs/README.md). The folder is structured to support onboarding, implementation standards, deployment, review processes, and AI-readable repository guidance.

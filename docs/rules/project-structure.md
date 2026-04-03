# Project Structure

Canonical project structure for NusaTales. The current repository starts from Laravel's base layout and should evolve toward the modular structure below as features grow.

## Architecture Overview

- Backend: Laravel API, authentication, domain services, queue jobs, and persistence.
- Frontend: React JSX pages, reusable components, route composition, and API services.
- Shared goal: keep domain logic modular and ready for scale.

## Backend Structure

```text
app/
  Http/
    Controllers/
    Requests/
    Resources/
    Middleware/
  Models/
  Policies/
  Services/
  Actions/
  Jobs/
  Providers/
routes/
  api.php
  web.php
database/
  migrations/
  seeders/
  factories/
config/
tests/
```

## Frontend Structure

```text
resources/js/
  components/
  pages/
  services/
  hooks/
  layouts/
  routes/
  utils/
  app.jsx
```

## Module Organization

As the platform grows, group features by domain boundary:

- `NusaMandala`: stories, places, cultural maps, collections.
- `NusaLanglang`: trips, events, itineraries, exploration content.
- `NusaKarya`: creators, products, subscriptions, orders.
- `Community`: posts, comments, memberships, moderation.
- `Core`: auth, profiles, settings, notifications, billing support.

## Folder Rules

- Controllers handle HTTP concerns only.
- Services or actions contain business logic.
- Models represent persistence and relationships.
- Pages compose screens and routes.
- Components stay reusable and UI-focused.
- Service modules centralize API calls for the frontend.

## Current Repository Notes

- Laravel entrypoint is present through `artisan`, `routes/`, `app/`, and `database/`.
- React entrypoint is present in `resources/js/app.jsx`.
- Current frontend folders include `resources/js/components` and `resources/js/pages`.
- Additional folders such as `services` and `layouts` should be introduced as the app grows.

## Structure Checklist

- [ ] New backend logic is placed outside controllers when reusable.
- [ ] New frontend API calls live in service modules.
- [ ] Feature directories reflect domain language.
- [ ] Tests mirror the backend behavior being introduced.
- [ ] Documentation is updated when structure evolves.

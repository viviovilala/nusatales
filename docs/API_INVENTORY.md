# API Inventory

All responses follow:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "message": "string",
  "errors": {}
}
```

## Authentication

| Method | Route | Auth | Status | Notes |
|---|---|---:|---|---|
| POST | `/api/register` | No | Implemented | Root alias. Accepts `name`, `email`, `password`, `password_confirmation`; always creates `role=user`. |
| POST | `/api/login` | No | Implemented | Root alias. Returns Sanctum token and user resource. |
| POST | `/api/logout` | Yes | Implemented | Root alias. Revokes current Sanctum token. |
| GET | `/api/me` | Yes | Implemented | Root alias. Returns current user resource. |
| POST | `/api/v1/auth/register` | No | Implemented | Versioned alias. Throttled. |
| POST | `/api/v1/auth/login` | No | Implemented | Versioned alias. Throttled. |
| POST | `/api/v1/auth/logout` | Yes | Implemented | Versioned API logout. |
| GET | `/api/v1/auth/me` | Yes | Implemented | Versioned API current user. |
| POST/PATCH | `/api/v1/auth/profile` | Yes | Implemented | Profile update with current-password validation for password changes. |

## Phase 1 Catalog

| Method | Route | Auth | Status | Notes |
|---|---|---:|---|---|
| GET | `/api/v1/genres` | No | Implemented | Active genre list. |
| GET | `/api/v1/references/categories` | No | Implemented | Enhanced categories include slug, description, status. |
| GET | `/api/v1/series` | No | Implemented | Supports search, genre/category/creator filters, pagination. |
| GET | `/api/v1/series/{slug}` | No | Implemented | Published series detail with published episodes. |
| GET | `/api/v1/episodes/{id}` | Optional | Implemented | Published episode detail; includes viewer progress when authenticated. |
| GET | `/api/v1/continue-watching` | Yes | Implemented | Paginated episode progress. |
| POST | `/api/v1/episodes/{id}/progress` | Yes | Implemented | Upserts watch progress. |
| GET | `/api/v1/favorites` | Yes | Implemented | Paginated current-user favorites. |
| POST | `/api/v1/favorites` | Yes | Implemented | Body: `target_type=series|episode`, `target_id`. |
| DELETE | `/api/v1/favorites/{id}` | Yes | Implemented | Deletes only current-user favorite. |
| POST | `/api/v1/ratings` | Yes | Implemented | Body: `target_type`, `target_id`, `score`, optional `review`. |

## Existing APIs Still Present

| Group | Prefix | Status |
|---|---|---|
| Public animation videos | `/api/v1/animations` | Implemented legacy single-video model. |
| Comments/likes/shares/watch history | `/api/v1/animations/*` | Implemented legacy interaction APIs. |
| Creator animation studio | `/api/v1/creator` | Implemented for legacy `videos`; role now `creator` or `admin`. |
| Subscriptions/wallet/missions/notifications | `/api/v1` | Implemented baseline APIs. |
| Admin REST APIs | `/api/v1/admin` | Implemented baseline user/video/plan/mission/ad management. |

## Missing for Later Phases

- Coin packages, payment transactions, webhooks, invoices.
- Episode unlocks and entitlement enforcement.
- Creator series/episode upload APIs.
- Asset store products, cart, checkout, orders, downloads.
- Creator payout requests and admin payout approval APIs.

# NusaTales API Inventory

Audit date: 2026-05-13

Source: `routes/api_v1.php`; verified with `php artisan route:list`.

## Public Endpoints

| Method | Route | Auth | Status | Issues |
|---|---|---:|---|---|
| GET | `/api/v1/health` | No | Complete | Basic health only. |
| POST | `/api/v1/auth/register` | No | Complete | Allows user to self-select `kreator`; no email verification or rate limiter. |
| POST | `/api/v1/auth/login` | No | Complete | No route-level throttling. |
| GET | `/api/v1/references/categories` | No | Complete | No cache. |
| GET | `/api/v1/references/stories` | No | Complete | Uses inline validation, no pagination. |
| GET | `/api/v1/subscriptions/plans` | No | Partial | Lists plans but there is no external billing integration. |
| GET | `/api/v1/creators` | No | Partial | Creator directory exists; no creator profile/detail page. |
| GET | `/api/v1/animations` | No | Partial | Supports search/category pagination, but models a video rather than series/episode. |
| GET | `/api/v1/animations/{video}` | No | Partial | Only published videos; no entitlement/unlock logic. |
| POST | `/api/v1/animations/{video}/view` | No | Partial | Public view counter can be inflated; no throttling, session/user de-duplication, or analytics event model. |
| GET | `/api/v1/animations/{video}/comments` | No | Partial | Lists comments; no moderation/reporting/replies. |

## Authenticated Viewer Endpoints

| Method | Route | Auth | Status | Issues |
|---|---|---:|---|---|
| GET | `/api/v1/auth/me` | Sanctum | Complete | Standard current-user lookup. |
| POST/PATCH | `/api/v1/auth/profile` | Sanctum | Complete | File upload validation exists; token rotation after sensitive updates is not implemented. |
| POST | `/api/v1/auth/logout` | Sanctum | Complete | Deletes current token only. |
| GET | `/api/v1/notifications` | Sanctum | Partial | No realtime delivery or preferences. |
| PATCH | `/api/v1/notifications/{notification}` | Sanctum | Complete | Scopes notification to current user in service. |
| GET | `/api/v1/wallet` | Sanctum | Partial | Wallet is points-only; no purchase flow. |
| GET | `/api/v1/missions` | Sanctum | Partial | Lists current-day mission progress only. |
| POST | `/api/v1/subscriptions` | Sanctum | Partial | Internal NusaKoin debit only; no payment/invoice/transaction isolation. |
| GET | `/api/v1/subscriptions` | Sanctum | Partial | No automatic expiry job. |
| GET | `/api/v1/nusa-koin/transactions` | Sanctum | Partial | Records mission/subscription entries only. |
| POST | `/api/v1/creators/{creator}/follow` | Sanctum | Partial | Toggle follow exists; no notification or follower list endpoint. |
| POST | `/api/v1/animations/{video}/watch-history` | Sanctum | Partial | Always creates a new row; no resume position update. |
| GET | `/api/v1/watch-history` | Sanctum | Partial | Returns list nested under `data.items`, inconsistent with paginated response helper. |
| POST | `/api/v1/animations/{video}/like` | Sanctum | Partial | Toggle exists; no race handling around unique constraint. |
| POST | `/api/v1/animations/{video}/comments` | Sanctum | Partial | Create only; no edit/report/moderation workflow. |
| DELETE | `/api/v1/comments/{comment}` | Sanctum | Partial | Owner/admin delete check exists; no soft delete. |
| POST | `/api/v1/animations/{video}/share` | Sanctum | Partial | Records share only; no actual platform integration. |

## Creator Endpoints

| Method | Route | Auth | Status | Issues |
|---|---|---:|---|---|
| GET | `/api/v1/creator/dashboard` | Sanctum + `kreator,admin` | Partial | Summary counts only. |
| GET | `/api/v1/creator/monetization/summary` | Sanctum + `kreator,admin` | Partial | Uses manual earnings table; no revenue-share rules. |
| GET | `/api/v1/creator/monetization/earnings` | Sanctum + `kreator,admin` | Partial | No payout status or settlement. |
| GET | `/api/v1/creator/animations` | Sanctum + `kreator,admin` | Complete | Scoped to current creator. |
| POST | `/api/v1/creator/animations` | Sanctum + `kreator,admin` | Complete | Uploads video/thumbnail to public disk; no queue/transcoding. |
| GET | `/api/v1/creator/animations/{video}` | Sanctum + `kreator,admin` | Complete | Scoped by creator ownership. |
| POST/PATCH | `/api/v1/creator/animations/{video}` | Sanctum + `kreator,admin` | Complete | Updates metadata/files; delete old files. |
| DELETE | `/api/v1/creator/animations/{video}` | Sanctum + `kreator,admin` | Partial | Hard delete; no soft delete/audit trail. |

## Admin Endpoints

| Method | Route | Auth | Status | Issues |
|---|---|---:|---|---|
| GET | `/api/v1/admin/dashboard` | Sanctum + `admin` | Partial | Counts only; no financial reports. |
| GET | `/api/v1/admin/animations` | Sanctum + `admin` | Complete | Moderation list with filters. |
| GET | `/api/v1/admin/animations/{video}` | Sanctum + `admin` | Complete | Admin video lookup. |
| PATCH | `/api/v1/admin/animations/{video}/status` | Sanctum + `admin` | Complete | Publish/reject/draft; no audit log. |
| DELETE | `/api/v1/admin/animations/{video}` | Sanctum + `admin` | Partial | Hard delete; no soft delete/audit trail. |
| GET | `/api/v1/admin/users` | Sanctum + `admin` | Complete | Search/filter/pagination. |
| GET | `/api/v1/admin/users/{user}` | Sanctum + `admin` | Complete | Basic user detail. |
| POST/PATCH | `/api/v1/admin/users/{user}` | Sanctum + `admin` | Complete | Admin can update role/password/profile. |
| DELETE | `/api/v1/admin/users/{user}` | Sanctum + `admin` | Partial | Prevents deleting users with videos; hard deletes other users. |
| GET | `/api/v1/admin/plans` | Sanctum + `admin` | Complete | CRUD list. |
| POST | `/api/v1/admin/plans` | Sanctum + `admin` | Complete | Creates subscription plan. |
| GET | `/api/v1/admin/plans/{plan}` | Sanctum + `admin` | Complete | Uses route model binding. |
| POST/PATCH | `/api/v1/admin/plans/{plan}` | Sanctum + `admin` | Complete | Updates plan. |
| DELETE | `/api/v1/admin/plans/{plan}` | Sanctum + `admin` | Partial | Hard delete; no dependency guard beyond FK. |
| GET | `/api/v1/admin/missions` | Sanctum + `admin` | Partial | Returns raw models and pagination under `data`, not API resources/meta. |
| POST | `/api/v1/admin/missions` | Sanctum + `admin` | Complete | Creates mission. |
| GET | `/api/v1/admin/missions/{mission}` | Sanctum + `admin` | Partial | Raw model response. |
| POST/PATCH | `/api/v1/admin/missions/{mission}` | Sanctum + `admin` | Partial | Raw model response. |
| DELETE | `/api/v1/admin/missions/{mission}` | Sanctum + `admin` | Partial | Hard delete. |
| GET | `/api/v1/admin/ads` | Sanctum + `admin` | Complete | Ads are implemented but outside stated core product modules. |
| POST | `/api/v1/admin/ads` | Sanctum + `admin` | Complete | Creates ad record. |
| GET | `/api/v1/admin/ads/{ad}` | Sanctum + `admin` | Complete | Uses resource. |
| POST/PATCH | `/api/v1/admin/ads/{ad}` | Sanctum + `admin` | Complete | Updates ad. |
| DELETE | `/api/v1/admin/ads/{ad}` | Sanctum + `admin` | Partial | Hard delete. |

## Missing API Areas

- Email verification and password reset.
- Series and episodes CRUD.
- Episode entitlement/unlock checks.
- Ratings.
- Favorites/bookmarks.
- Coin package listing and purchase.
- Payment provider create/confirm/webhook endpoints.
- Invoice listing/detail/download.
- Asset store products/assets, cart, checkout, orders, purchased downloads.
- Creator payout and revenue-share management.
- Admin payment monitoring and business reports.


# NusaTales Feature Completion Matrix

Audit date: 2026-05-13

| Module | Feature | Status (Complete/Partial/Missing) | Evidence |
|------|------|------|------|
| Authentication | Register | Complete | `POST /api/v1/auth/register` in `routes/api_v1.php`; `AuthController::register`; `RegisterRequest`; covered by `tests/Feature/AuthApiTest.php`. |
| Authentication | Login | Complete | `POST /api/v1/auth/login`; `AuthService::login`; covered by `AuthApiTest`. |
| Authentication | Logout | Complete | `POST /api/v1/auth/logout`; deletes current Sanctum token in `AuthService::logout`. |
| Authentication | Current user profile | Complete | `GET /api/v1/auth/me`; consumed by `AuthContext.jsx`. |
| Authentication | Profile update | Complete | `POST|PATCH /api/v1/auth/profile`; validates current password for password changes. |
| Authentication | Email verification | Missing | `email_verified_at` is explicitly dropped in `2026_03_28_042101_align_users_table_with_pengguna_attributes.php`; no verification routes or `MustVerifyEmail`. |
| Authentication | Forgot password | Missing | `password_reset_tokens` table exists from Laravel default migration, but there are no API routes/controllers; login page has `href="#"`. |
| Authentication | Role-based access | Partial | Custom `role` middleware and `User::isAdmin/isCreator`; no permissions table/policies and public register allows `kreator`. |
| Viewer | Homepage | Partial | `Landingpage.jsx` consumes published animations and creators but falls back to dummy content. |
| Viewer | Search | Partial | Backend `IndexVideoRequest` supports `search`; no real search page/UI, navbar search links to `/api/test`. |
| Viewer | Filter by genre/category | Partial | Backend supports `kategori_id`; no dedicated frontend filter experience; no `genres` table. |
| Viewer | Episode player | Partial | `AnimationViewer.jsx` plays a single `Video` record; no series/episode model. |
| Viewer | Continue watching | Partial | `watch_history` table and `/watch-history`; records one row per save without resume position semantics or de-duplication. |
| Viewer | Bookmark/favorites | Missing | Like system exists, but no favorites/bookmarks model, migration, route, or UI behavior. |
| Viewer | Comments | Partial | List/create/delete comment endpoints exist; no edit, reporting, moderation workflow, replies, or creator tools. |
| Viewer | Ratings | Missing | No rating model, migration, route, or frontend UI. |
| Viewer | Notifications | Partial | Notifications list and mark-read exist; no delivery channel, realtime, preferences, or background jobs. |
| Monetization | Coin wallet | Partial | `user_points` and `nusa_koin_transactions` exist; wallet summary endpoint exists. |
| Monetization | Coin purchase | Missing | No coin packages, payment provider, checkout, or credit purchase endpoint. |
| Monetization | Episode unlock | Missing | No episode table, unlock table, entitlement check, or playback gate. |
| Monetization | Subscription tiers | Partial | Plans and user subscriptions exist; subscription consumes NusaKoin only. |
| Monetization | Payment gateway | Missing | No Midtrans/Xendit/Stripe config, webhook route, payment intent, or callback validation. |
| Monetization | Invoice generation | Missing | No invoices table, PDF/numbering service, or billing documents. |
| Creator | Creator dashboard | Partial | `/creator/dashboard` returns counts and views; limited analytics. |
| Creator | Upload video | Complete | `StoreVideoRequest`, `VideoService::create`, `CreatorStudio.jsx`; covered by `CreatorAnimationApiTest`. |
| Creator | Upload thumbnails | Complete | `thumbnail_file` validation and storage on public disk; Filament and React forms support upload. |
| Creator | Episode management | Missing | No series/episode models or routes. |
| Creator | Analytics | Partial | Analytics table tracks views, watch_time, engagement_rate, but only views are incremented. |
| Creator | Monetization dashboard | Partial | Earnings summary/list exists, but earnings are manual/seeded data. |
| Creator | Revenue sharing | Missing | No revenue rules, payout table, payout status, or settlement workflow. |
| Asset Store | Product listing | Missing | No asset/product model, route, migration, or UI. |
| Asset Store | Product details | Missing | No asset/product detail endpoint or page. |
| Asset Store | Cart | Missing | No cart model/service/frontend state. |
| Asset Store | Checkout | Missing | No checkout route or payment integration. |
| Asset Store | Download after purchase | Missing | No purchased asset entitlement or signed download endpoint. |
| Admin | User management | Partial | Admin REST users endpoints and Filament users resource; no audit log or granular permissions. |
| Admin | Content moderation | Partial | Admin can publish/reject/delete video; no moderation queue states beyond draft/published/rejected. |
| Admin | Payment monitoring | Missing | No payments or invoices exist. |
| Admin | Reports | Partial | Dashboard counts exist; no export/reporting module. |


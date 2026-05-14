# Feature Matrix

| Module | Feature | Status | Evidence |
|---|---|---|---|
| Authentication | Public user registration | Complete | `POST /api/register`, `POST /api/v1/auth/register`, `RegisterRequest`, `AuthService`, `AuthApiTest`. |
| Authentication | Public login/logout/me | Complete | `POST /api/login`, `POST /api/logout`, `GET /api/me`, versioned aliases, Sanctum tokens. |
| Authentication | Role system | Complete for MVP | `users.role` supports `user`, `creator`, `admin`; default registration always creates `user`; role middleware protects creator/admin APIs. |
| Authentication | Demo accounts | Complete | `DemoAccountSeeder`, `docs/DEMO_ACCOUNTS.md`. |
| Admin | Filament admin access | Complete for MVP | `User::canAccessPanel`, guarded `/admin`, `FilamentAdminAccessTest`. |
| Admin | Public Filament registration safety | Complete | `FILAMENT_ADMIN_REGISTRATION=false` by default; optional custom admin registration page only outside production. |
| Viewer | Series catalog | Complete for Phase 1 | `series`, `genres`, `genre_series`, `episodes` migrations; `GET /api/v1/series`. |
| Viewer | Series detail | Complete for Phase 1 | `GET /api/v1/series/{slug}`, `SeriesDetail.jsx`. |
| Viewer | Episode watch | Complete for Phase 1 | `GET /api/v1/episodes/{id}`, `EpisodeWatch.jsx`. |
| Viewer | Favorites | Complete for Phase 1 | `favorites` table; `GET/POST/DELETE /api/v1/favorites`; `Favorites.jsx`. |
| Viewer | Ratings and reviews | Complete for Phase 1 | `ratings` table; `POST /api/v1/ratings`; rating UI on series/watch pages. |
| Viewer | Continue watching progress | Complete for Phase 1 | `episode_progress` table; `POST /api/v1/episodes/{id}/progress`; `GET /api/v1/continue-watching`. |
| Creator | Series/episode upload workflow | Partial | Data model exists; creator UI/API for series and episode upload is still pending. |
| Monetization | Episode unlocks | Missing | Required for Phase 2. |
| Monetization | Coin packages/payment gateway/invoices | Missing | Required for Phase 2. |
| Asset Store | Products/cart/checkout/downloads | Missing | Required for later MVP phases. |

# Known Issues

## Remaining Product Gaps

- Episode unlocks, payment gateway handling, invoices, subscription billing, and coin package purchases are not implemented yet.
- Creator upload flow still uses legacy single-video APIs; series/episode creator management is pending.
- Asset store, cart, checkout, purchased downloads, and order management are pending.
- Revenue sharing and payout request workflows are pending.

## Technical Notes

- Legacy database columns such as `kreator_id` remain in existing video/follow/earning tables. Role values are normalized to `creator`, but the column names have not been renamed to avoid a broad migration.
- Frontend auth still uses bearer tokens in `localStorage`; cookie-based Sanctum auth or a hardened token strategy should be evaluated before production.
- Filament browser rendering can depend on local `storage/framework/views` write permissions on Windows. Backend authorization tests verify the admin access contract.
- `npm run lint` currently delegates to the frontend build until a dedicated ESLint configuration is introduced.

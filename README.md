# Motolink website deployment handoff

This repository is a snapshot of the current frontend and backend working trees, including the Meta Pixel implementation. It intentionally starts with a fresh Git history; the original repositories and their remotes were not changed.

## Layout

- `frontend/`: React/Vite storefront and admin UI
- `backend/`: Spring Boot API, MySQL integration, and a snapshot of local product uploads
- `frontend/META_PIXEL_PLAN.md`: implemented event map and launch checks

## Configure

Copy `frontend/.env.example` and `backend/.env.example` to local `.env` files or set the same values in your deployment environment. Do not commit production secrets.

For production, set the frontend API URL/base path for the real domain, configure the backend MySQL connection and allowed frontend origin, enable secure session cookies on HTTPS, and confirm that `/uploads/products` is served correctly. The tracked `backend/uploads/products` files are only the local snapshot; back up and preserve any production uploads separately.

Back up MySQL and rehearse schema changes on a staging copy before starting the new backend against production. The default `JPA_DDL_AUTO=update` can alter a schema. Provision or verify the production admin account separately; no admin credentials are included here.

## Build and verify

- Frontend: `cd frontend`, `npm ci`, `npm run build`, `npm run test:analytics`
- Backend: `cd backend`, `./mvnw test` (or `mvnw.cmd test` on Windows); Java 17+ and a reachable MySQL instance are needed for production runtime verification.
- Test browse → product → cart → checkout → order in admin, image delivery, stock changes, and order status changes on staging.
- Verify Meta Pixel ID `1149512494760452` in Events Manager on the real domain for `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, and one `Purchase` after a successful order placement. `Purchase` means order placed, not that a manual payment was collected.

The frontend build and local analytics tests have passed previously, and backend tests used H2. Live MySQL behavior and Meta event receipt on the production domain still require verification before deployment sign-off.

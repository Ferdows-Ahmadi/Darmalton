# Build Log

## 2026-07-23 - Environment and design audit

- Confirmed 64-bit Windows build 26200 on x64 hardware with about 16 GB RAM.
- Confirmed free space: approximately 397 GB on C: and 917 GB on D:.
- Git 2.55.0 and VS Code 1.129.1 are installed.
- Anaconda Python 3.13.9 is installed but its directory is not on the process
  PATH; the project may use an explicit interpreter path.
- Node/npm, Flutter/Dart, Docker/Compose, Java, and PostgreSQL client were not
  found on the normal PATH at the start of the audit.
- WSL reports not installed. Firmware virtualization capability was reported
  unavailable by WMI, so Docker/emulator support may require a firmware change.
- Environment variable names were inspected; values were intentionally withheld
  from logs to avoid exposing secrets.
- Read and rendered all 27 pages of `Online_Pharmacy_Database_Design.pdf`.
  Adopted catalogue/inventory separation, FEFO, immutable snapshots/status
  history, UUIDs, decimal money, conservative deletion, and server authority.
- Created branch `codex/milestone-1` and initialized the monorepo contracts.

## 2026-07-24 - Milestone 1 implementation and verification

- Installed and version-checked Node.js 24.18.0 with npm 11.16.0.
- Created the Python virtual environment and implemented the Django/DRF backend,
  initial migrations, admin, idempotent demo seed, JWT auth, owner-scoped APIs,
  transactional FEFO checkout, immutable order snapshots, and validated order
  transitions.
- Implemented the responsive Next.js customer application and same-origin
  HTTP-only cookie proxy. Desktop (1280 px), mobile (390 px), and narrow mobile
  (320 px) layouts were visually inspected.
- Fixed client-route scroll retention with `ScrollToTop`. Verified detail-to-cart
  navigation reaches `scrollY = 0` on desktop and mobile, keeps the heading below
  the sticky header, and introduces no horizontal overflow or runtime dialog.
- Isolated verification builds in `.next-build` so `next build` cannot overwrite
  a running `next dev` cache.
- Implemented the feature-first Flutter source using Riverpod, Dio,
  go_router, secure token storage, typed models, and model/widget tests. Order
  detail includes immutable item and delivery-address snapshots.
- Added PostgreSQL Compose services, multi-stage container builds, health checks,
  WhiteNoise static serving, and repeatable PowerShell setup/dev/test/reset
  commands with checked exit codes.
- Backend verification passed: Ruff format/lint, 10 pytest tests, Django system
  checks, migration consistency, and validated OpenAPI generation.
- Website verification passed: TypeScript typecheck, ESLint, and a Next.js
  15.5.9 production build with 13 routes.
- Integrated live smoke passed registration, catalogue, cart, address, checkout,
  admin transition, and customer refresh; verified order
  `OP-20260724-DA14CFC3`.
- Generated and reviewed complete Android/iOS Flutter runners with package/bundle
  identifier `com.darmalton.pharmacy`. Flutter 3.44.7 analysis is clean and all
  four Flutter tests pass.
- Fixed the Riverpod `Notifier.update` override collision by renaming the cart
  operation to `updateQuantity`, and updated all callers.
- Narrowed Docker build contexts from the monorepo to each service. A cached
  website rebuild transferred 4.45 kB instead of hundreds of megabytes; npm uses
  a BuildKit cache plus bounded retry/timeouts.
- Built and ran the complete Docker Compose stack against PostgreSQL 17.6.
  Django checks/migrations passed, all 10 tests passed against PostgreSQL, and
  medicine data survived a database-container restart.
- Re-ran the integrated PostgreSQL smoke flow successfully through authentication,
  catalogue, cart, checkout, admin transition, and customer refresh; verified
  order `OP-20260724-698805E1`.
- Completed browser QA at 1280 px desktop and a live 328 px mobile viewport.
  Verified combined search/category filtering, cart quantity, address creation,
  checkout, order history, logout, and scroll reset to `0` on both viewports.
- Fixed three integration defects found by visual smoke: category slug filtering
  caused a PostgreSQL UUID cast error, checkout treated paginated addresses as an
  array, and the public header retained the authenticated sign-out affordance.
- Corrected the stale local `DJANGO_ALLOWED_HOSTS` entry from
  `192.168.0.202` to the active private Wi-Fi address `192.168.0.102`.
  Both localhost and LAN schema requests return HTTP 200.
- Added a repeatable Android helper supporting stable USB/`adb reverse` and
  dynamic private-LAN builds without embedding a developer IP in source.
- Re-ran the full verification suite on 2026-07-26: 10 backend tests passed,
  website typecheck/lint/13-route production build passed, Flutter analysis was
  clean, all 5 Flutter tests passed, and the cached debug APK built in 112.5s.
- Installed the USB-configured APK on the authorized Pixel 10. Verified seeded
  customer login, authenticated catalogue loading, product detail, add to cart,
  and server subtotal rendering with no app crash or cleartext/network error.
- Re-ran the PostgreSQL integrated smoke successfully through checkout and
  status transition; verified order `OP-20260726-E790928F`.
- A clean Docker recreate showed no recurring Gunicorn SIGKILL/OOM condition.
  Two workers used about 131 MiB total at idle; the earlier termination was
  consistent with container recreation rather than a reproducible memory leak.

# Build Log

## 2026-08-13 - Full product hardening audit started

- Established `docs/FULL_PRODUCT_QA.md` as the implementation-backed feature
  and acceptance matrix for Flutter, the public website, the staff portal, and
  cross-cutting release checks. It distinguishes automated evidence from live
  browser/device acceptance instead of treating a green suite as usability
  proof.
- Audited the reported mobile login redirect issue. Normal login and
  registration already resolve to `/catalogue`; only authentication prompted by
  an explicit protected destination preserves that safe local `returnTo`.
  Neither STAFF, PHARMACIST nor ADMIN roles have a customer-app redirect to
  Profile.
- Added focused regression coverage for normal customer login, ADMIN login in
  the customer app, protected checkout return, registration, restored sessions,
  and unsafe/external return destinations. All 11 focused authentication and
  guest-first tests pass.
- The localization inventory found 432 Dari/Persian source literals, 285 of
  which do not yet have an exact English entry in the current lightweight
  translation catalogue. The remaining localization phase is therefore a real
  release task, not a documentation-only limitation.

## 2026-08-12 - Unified staff operations centre

- Completed the normal `/staff` administration path for prescriptions,
  medicines and medicine images, category media, and administrator-managed
  user/staff accounts. Daily work no longer links operators to Django Admin.
- Added searchable, filterable and paginated medicine/category managers with
  create/edit/state controls, guarded image upload/primary/delete workflows,
  server validation, safe category deletion, and polished media fallbacks.
- Added category image/display-order migration `catalog.0006`; it is applied to
  the Docker PostgreSQL database. Flutter category cards now consume uploaded
  category media after refresh and preserve it in the public offline cache.
- Added ADMIN-only account administration for customer inspection, staff and
  pharmacist creation, role/profile edits, secure temporary passwords,
  activation/deactivation, and self-lockout prevention. Historical identities
  are never deleted.
- Grouped the staff navigation into dashboard, operations, catalogue,
  procurement, content and administration. Sensitive destinations follow
  backend roles, and the attention dashboard uses live filtered queues.
- Final verification passed: Ruff, Django check/migration consistency, 82
  backend tests, 20 website tests, TypeScript, ESLint, 38-route production
  build, Compose validation, warning-free OpenAPI validation, the PostgreSQL
  registration/catalogue/cart/address/checkout/order-transition smoke flow,
  Flutter analyze and 52 Flutter tests.
- Live desktop browser QA passed for ADMIN, PHARMACIST, STAFF and CUSTOMER:
  grouped navigation, attention counts, medicine/image controls, category-media
  form, user-management controls, customer rejection and a clean console.
  Prescription clarification/approval/customer-state acceptance was completed
  in the immediately preceding checkpoint. The responsive browser override did
  not change the automation viewport, so narrow layout remains covered by CSS,
  type/build tests rather than a fresh manual narrow-browser claim.

## 2026-08-12 - Operational staff prescription workflow

- Replaced the read-only `/staff/prescriptions` table and Django Admin handoff
  with a responsive operational manager using the existing guarded APIs.
- Added search, status filtering, ordering, pagination, loading/empty/retry
  states, guarded image/PDF preview and download, customer/reviewer metadata,
  authorized medicines, internal/customer notes, and the complete audit timeline.
- Added state-aware confirmation forms for start review, clarification,
  approval with catalogue medicine IDs/quantities/expiry, rejection, and expiry;
  backend field errors remain visible without losing entered form data.
- Corrected reviewer attribution so a customer's clarification response returns
  the prescription to review without replacing the assigned pharmacist.
- Live browser QA completed a real customer submission through ADMIN review,
  clarification request, customer response, PHARMACIST approval, and customer
  final-state display. CUSTOMER is redirected to staff login and STAFF remains
  blocked by the authoritative reviewer permission.

## 2026-08-05 - Meeting demo readiness checkpoint

- Added an idempotent `scripts/demo-start.ps1` entry point that preserves
  PostgreSQL volumes, verifies Docker/ADB/Flutter, waits for backend and website
  health, configures USB or LAN mobile access, avoids unnecessary APK rebuilds,
  installs/launches the Pixel app, and prints the current meeting URLs.
- Added Flutter CMS `HOME_HERO` banner consumption with authenticated media,
  scheduling/order rules, safe internal actions, cached offline rendering,
  zero/one/many states, swipe controls, dots, and six-second autoplay.
- Added a neutral medicine-image fallback and a
  `report_missing_medicine_images` command. The current 20 demo medicines still
  need operator-supplied licensed product photography.
- Fixed mobile refresh so `/auth/refresh/` never inherits an expired bearer
  token. A fresh APK was installed on Pixel 10 and a synthetic file upload
  completed through the live prescription API and appeared in history.
- Fixed PostgreSQL prescription transitions by removing the nullable reviewer
  outer join from the row-lock query. The live synthetic record successfully
  transitioned `SUBMITTED -> UNDER_REVIEW -> CLARIFICATION_REQUESTED`.
- Completed live browser checks for public/shop routes, all staff operations and
  CMS routes, CMS banner creation controls, the Next.js `/admin` bridge, Django
  Admin login, and core Admin resource lists without runtime or console errors.
- Verified physical Dari/English direction switching and persistence, offline
  recovery after Docker restart, prescription source selection, file preview,
  and upload. A full attended camera, address CRUD/GPS, and checkout pass remains
  on the acceptance checklist.
- Added `docs/DEMO_RUNBOOK.md` and `docs/DEMO_ACCEPTANCE_CHECKLIST.md` with
  startup, firewall, exact access, demo accounts, content preparation, recovery,
  presentation order, verified checks, and honest limitations.

## 2026-08-04 - Milestone 2 locale refresh stabilization follow-up

- Completed the unfinished post-`35c5e41` locale-refresh repair in Flutter by
  removing the experimental `LanguageScope` inherited-dependent approach that
  caused `_dependents.isEmpty` assertions on bottom-sheet dismissal.
- Kept the existing persisted app settings provider as the single language
  source of truth and added explicit language-aware string helpers so
  navigation and filter labels rebuild deterministically from the watched
  language state.
- Updated localized static text rendering to rebuild off Flutter Localizations
  changes without registering every custom text widget as a dedicated inherited
  locale dependent.
- Finalized catalogue filter-sheet state application to happen only after the
  sheet closes, avoiding setState/dismiss race conditions and disposed
  controller exceptions.
- Added/expanded regression coverage in `mobile/test/language_settings_test.dart`
  for Dari/English switching, direction changes, persistence after restart, and
  catalogue filter-sheet localization/dismiss safety.
- Verification passed on current sources: `flutter analyze` and full
  `flutter test` (42 tests passed).
- Built and installed a fresh debug APK from current source:
  `mobile/build/app/outputs/flutter-apk/app-debug.apk`.
- Device/install evidence:
  - Connected device: Pixel 10 (`57221FDCR00CMN`)
  - Installed package: `com.darmalton.pharmacy`
  - Installed version: `1.0.0 (1)`
  - APK SHA-256:
    `B2953B526B0A4EE2661DC0A47AD024CA991DEECB8244AA2A1A0D52D4EFA56ED9`
- Android SDK Platform 34 corruption from the previous pass is no longer a
  blocker for debug builds in this environment; the requested debug APK now
  builds successfully.
- Full manual physical Pixel walkthrough for the entire Stage 3 matrix was not
  completed in this run; repository-level automated verification is complete
  and targeted device artifacts were refreshed under `docs/qa/`.

## 2026-08-01 - Automatic local mobile connectivity

- Added a public database-backed `/api/v1/health/` endpoint and a
  development-only Docker UDP responder that advertises the active private LAN
  API without scanning arbitrary addresses.
- Added `scripts/dev-up.ps1` to update the ignored development host allowance,
  start/recreate the required Docker services, verify health, configure all
  connected Android ADB reverse tunnels, and create/check Private-profile TCP
  8000 and UDP 53535 rules when run with administrator permission.
- Added a debug-only Flutter endpoint manager with deterministic USB, discovered
  LAN, remembered LAN, and manual-override resolution. The last successful
  endpoint/time is persisted; release builds cannot execute discovery and fall
  back safely when no production HTTPS endpoint is compiled.
- Added public debug diagnostics from sign-in and authenticated Settings,
  including endpoint, method, health, last success, retry/discovery, and bounded
  manual override.
- Verification passed Ruff, Django checks, the public health test, Compose dev
  profile validation, live Docker health and UDP responses, Flutter analysis,
  and 9 focused Flutter tests. On the connected Pixel 10, the same APK selected
  USB localhost with ADB reverse and then healthy LAN `192.168.0.113` after all
  reverse mappings were removed, without rebuilding; no Flutter/FATAL crash
  markers appeared.

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

## 2026-07-26 - Dari-first redesign and final device QA

- Added optional Dari catalogue fields for categories, dosage forms, medicine
  names, and descriptions while retaining canonical Latin fields and search
  fallback. The migration, serializers, seed data, and tests were updated.
- Bundled Vazirmatn Regular/Medium/Bold under the OFL, applied `fa_AF`/RTL
  defaults in Flutter and `lang="fa-AF" dir="rtl"` in Next.js, and directionally
  isolated Latin identifiers.
- Added the supplied Darmalton wordmark and generated adaptive/legacy Android
  plus iOS launcher assets from the supplied launcher artwork.
- Rebuilt the Flutter home, categories/search, detail, cart, COD checkout,
  orders/tracking, prescription explanation, profile, login, registration, and
  splash experiences. Unsupported wallet/card/GPS/chat/prescription-review
  actions are labeled or disabled instead of fabricated.
- Rebuilt all customer website routes with the same responsive Dari design
  language. Added a same-origin asset proxy so Docker-internal image hosts never
  leak into browser image URLs.
- Enforced the prescription boundary on the server: a prescription-required
  medicine cannot enter the normal cart or checkout flow until a pharmacist
  review workflow exists.
- Browser QA passed at 1280x720 and 390x844. Verified RTL/font metadata, no
  horizontal overflow, Dari search, product image loading, authenticated
  product-to-cart flow, checkout summary, orders/tracking, profile, and
  route/query scroll reset to `0`.
- Built and installed the USB-configured debug APK on the Pixel 10 (Android API
  37). Physical screenshots verified home, categories, cart, orders, tracking,
  and profile. Two text-scale-only overflows were found and fixed in the home
  banner and long category names; the final log contained no Flutter rendering
  exception, fatal exception, cleartext-network, or socket error.
- Final verification passed 11 backend tests, 5 Flutter tests, and all 15 route
  entries listed by the Next.js production build, including the same-origin
  asset route.
- The final PostgreSQL integrated smoke passed registration, catalogue, cart,
  address, checkout, admin transition, and customer status refresh for order
  `OP-20260726-0E15FFC5`. The production backend image intentionally excludes
  `pytest`; backend unit tests run from the project test environment, while this
  smoke validates the containerized PostgreSQL path.

## 2026-07-28 - Branding, medicine media, and Google identity

- Replaced every Android legacy/adaptive/round and iOS launcher asset from the
  supplied transparent Darmalton launcher master. Flutter analysis, tests,
  debug APK generation, install, and Pixel launcher inspection passed.
- Added staff/admin medicine-image CRUD, content-based JPEG/PNG/WebP validation,
  a single-primary database invariant, cacheable anonymous content delivery,
  Django admin management, Next Image optimization, and Flutter disk/memory
  caching with a neutral local fallback.
- Verified a real multipart image lifecycle through PostgreSQL Compose:
  authenticated upload, medicine primary URL, anonymous cache/ETag response,
  Next.js proxy and optimizer rendering, then deletion/promotion cleanup.
- Added Google Identity Services authentication. Django verifies provider ID
  tokens and stores stable provider subjects before issuing the existing JWT
  pair. Next.js preserves HTTP-only cookie sessions; Flutter uses
  `google_sign_in` and secure token storage. Both authentication screens remain
  Dari-first and use Google-compliant button branding.
- Backend verification now passes 20 tests plus Ruff, Django checks, migration
  consistency, and OpenAPI validation. Website typecheck, source lint, and
  production build pass. Flutter analysis is clean, all 8 tests pass, and the
  debug APK builds with API and Google client-ID defines.
- Live Google consent remains operator-gated because the repository correctly
  contains no OAuth credentials. Platform credential/registration requirements
  are recorded in `README.md` and `docs/KNOWN_ISSUES.md`.

## 2026-07-28 - Milestone 2 Phase 3 prescription checkpoint

- Added a persistent prescription lifecycle covering submitted, under review,
  clarification requested, approved, rejected, expired, and cancelled states.
  Database-row locks and validated transitions prevent conflicting or invalid
  review actions.
- Added authorization-controlled private JPEG/PNG/PDF storage with generated
  filenames, extension/MIME/magic validation, a 10 MiB limit, customer-safe
  serializers, secure customer/staff download endpoints, immutable audit
  history, and persistent in-app notification records.
- Added pharmacist/admin review APIs and guarded Django Admin review controls.
  Internal staff notes never appear in customer responses. Approval records the
  exact prescription medicines and maximum quantities.
- Linked approved, unexpired, unused prescriptions to prescription-required cart
  items and orders. The server rejects missing, rejected, expired, unrelated,
  over-quantity, or already-consumed authorizations and stores an order-time
  status/expiry snapshot.
- Added Dari-first website and Flutter customer flows for upload progress,
  retry, history, clarification response, cancellation, and adding approved
  medicines to the cart. The website proxy now preserves binary multipart and
  private-file responses.
- PostgreSQL has applied `accounts.0003`, `prescriptions.0001`, and
  `commerce.0002`. Checkpoint verification passed changed-file Ruff, Django
  system checks, five targeted prescription permission/transition/upload tests,
  Flutter analysis, and website TypeScript checking.
- At the requested checkpoint, no fresh full backend suite, website lint/build,
  Flutter tests/APK build, Docker rebuild, integrated prescription smoke, or
  completed responsive/device QA was run after the final admin changes.
- Exact restart point: run the authenticated PostgreSQL flow
  upload -> pharmacist review -> clarification/approval -> authorized Rx cart
  and order through the website and Pixel, then address any discovered Phase 3
  UI/operational issues before starting Phase 4.

## 2026-07-29 - Pharmacy operations and inventory controls

- Reviewed the additional database proposal as inspiration only. Rejected its
  duplicate user/customer/employee/password structures and retained the
  existing normalized Django identity, catalogue, order, and prescription
  models.
- Added supplier records with normalized codes, contact and pharmacy-license
  fields, payment terms, bounded ratings, verification, active/inactive state,
  staff-only APIs, Django Admin filters/search/actions, and permission tests.
- Added server-authoritative purchase orders with supplier and branch linkage,
  nested medicine items, generated numbers/totals, invoice and payment status,
  expected/received delivery dates, ordered/approved/received actors, guarded
  transitions, partial receipts, and immutable history.
- Extended inventory batches with warehouse/rack/shelf locations, quality
  status, inspection history, quarantine, physical verification, and verified
  actor/timestamp fields. Existing batches default to approved and may retain a
  null location until operationally assigned.
- Added an immutable inventory ledger. Purchase receipts, checkout sales,
  eligible customer returns, expiry, damage, adjustments, and stock counts now
  record batch, direction, quantity, before/after stock, actors, references, and
  source purchase/order/return records.
- Added owner-scoped customer returns with delivered-order and cumulative
  quantity validation, partial approval, pickup state, receipt, condition
  verification, safe restoration to original eligible batches, and manual
  refund completion. No payment gateway integration was added.
- Added only allergies and optional medical notes to the existing customer
  profile, with owner-only API access and bounded normalization. No duplicate
  customer or authentication model was introduced.
- Hardened Django Admin for suppliers, procurement, warehouse locations,
  inventory, ledger, and returns. Unsafe direct creation/deletion is disabled
  for workflow/audit records, batch quality actions call audited services, and
  medicine images have previews.
- Disabled hard-delete API routes for suppliers, purchase orders, warehouses,
  and storage locations; operators use active/inactive state so referenced
  operational history remains intact.
- PostgreSQL applied `accounts.0004`, `catalog.0004` through `catalog.0005`, and
  `operations.0001` through `operations.0004` without error. Django checks pass
  on the running container.
- Final verification passed Ruff formatting/lint, 46 backend tests, Django
  checks, migration consistency, OpenAPI validation without warnings, website
  TypeScript/ESLint/15-page production build, Flutter analysis, and all 16
  Flutter tests. Compose configuration validation passed; no Docker image or
  APK rebuild was needed because no container dependency or mobile source
  changed.
- The live PostgreSQL integrated registration/catalogue/cart/address/checkout/
  status-refresh smoke passed after sale-ledger integration for order
  `OP-20260729-EB87AE2C`.

## 2026-07-29 - Public, staff, and mobile product experience

- Replaced the website root with a responsive Dari-first public landing page
  covering value, prescription review, delivery, the Android client, FAQ,
  contact, about, privacy, and terms while preserving the customer portal under
  `/shop`. The generated campaign artwork is stored at
  `website/public/branding/landing-hero.png`.
- Added a dedicated role-gated Next.js staff console for dashboards, orders,
  prescriptions, inventory and ledger, warehouses and locations, suppliers,
  purchasing, returns, customers, reports, and local staff preferences. Django
  Admin remains the guarded surface for complex operational changes.
- Expanded the Flutter home with a production image banner, prescription and
  nearby-pharmacy shortcuts, popular and recommended medicines, continue
  shopping, server-priced daily selections, brands, a seasonal campaign, health
  articles, loading/empty/error states, and persisted recently viewed items.
- Added secure stale-while-revalidate catalogue/category caching, thumbnail
  control, favorites, recent searches, guest-cart ID/quantity persistence,
  signed-in address caching, a clear offline banner, retry recovery, and cache
  clearing. Cached medicine and cart records are contract-tested to exclude
  price and stock.
- Added complete functional account settings for profile editing, address
  access, larger text, reduced motion, notification/search/image preferences,
  privacy guidance, cache management, help/contact/about/terms/privacy pages,
  password change, and confirmed soft account deactivation. Historical records
  are retained; no duplicate account model was introduced.
- Improved Android navigation so nested routes pop normally, bottom-tab back
  returns home, and a second back press exits from the home root. The app remains
  RTL with the bundled Vazirmatn Dari font.
- Final verification passed Ruff format/lint, 52 backend tests, Django checks,
  migration consistency, and OpenAPI generation (one documented enum-name
  warning); website TypeScript, ESLint, and a 33-route production build; Flutter
  analysis and all 19 tests; Compose validation and PostgreSQL checks with all
  migrations applied.
- The live PostgreSQL integrated registration/catalogue/cart/address/checkout/
  transition/status-refresh smoke passed for order
  `OP-20260729-52E520A9`.
- Browser QA covered the landing and staff dashboard at 1440x900 and 390x844.
  Both remained RTL without document overflow, staff tables used contained
  horizontal scrolling, route navigation reset scroll to zero at both sizes,
  and basic checks found one H1, no missing image alt text, no empty buttons,
  and no unlabelled form controls. A mobile CSS selector that hid the landing
  sign-in button was found and fixed during this pass.
- The campaign illustration was generated in `ads-marketing` mode with a prompt
  for a premium Afghan online-pharmacy hero: a white pharmacy bag, teal medical
  cross, generic bottles, blister pack, capsules and leaves, wide composition,
  no product brands, logo, text, or watermark.

## 2026-08-01 - Milestone 2 corrected Phase 2 customer experience

- Preserved the single-provider Darmalton model: customers use one catalogue,
  prescription workflow, checkout, and delivery service. Customer-facing
  nearby-pharmacy discovery, comparison, selection, and fake live tracking were
  removed; internal branch, warehouse, and fulfilment foundations remain.
- Added owner-scoped address create/edit/delete/default selection with offline
  cached selection, delivery instructions, nullable latitude/longitude, explicit
  current-location capture, map pin selection/adjustment, preview/removal, and
  an order-time delivery snapshot. GPS permission is requested only from an
  explicit location action; manual addresses do not require GPS.
- Added server-backed catalogue category, manufacturer, prescription, stock,
  price-range, and ordering filters plus the read-only manufacturer endpoint.
  Each customer and staff page now retains one clearly scoped search input.
- Corrected navigation so the Home menu opens Account, the fifth bottom tab is
  Settings, Account has no duplicate Settings action/tab, and root/nested
  Android back behavior has deterministic Home fallbacks.
- Added Afghan phone normalization to compact E.164 on the API and LTR rendering
  inside RTL fields/tables. The mobile UI formats values as `+93 7XX XXX XXX`.
- Added explicit camera/gallery/file prescription selection, permission and
  cancellation handling, orientation correction, readable compression,
  preview/retake/remove, upload progress/retry, 10 MiB/type validation, and
  temporary-file cleanup while reusing the private prescription API.
- Added persisted Dari/English selection, immediate RTL/LTR switching, safe
  Dari fallback, catalogue display-field selection, and authenticated account
  synchronization through `preferred_language`.
- PostgreSQL applied `accounts.0005` and `commerce.0003`; Django checks and
  migration consistency passed. Changed-backend Ruff passed, 23 targeted API
  tests and all 63 backend tests passed, Flutter analyze passed, all 41 Flutter
  tests passed, and website TypeScript/ESLint checks passed.
- A single debug APK build was attempted with the current LAN API address. It
  reached Gradle's Android SDK Platform 34 preparation step, produced no fresh
  APK, and was terminated after progress stopped. No older APK was installed,
  so the final physical-device walkthrough remains unverified for this commit.

## 2026-08-05 - Staff portal routing repair

- Confirmed that the existing Next.js operations portal and its dashboard,
  order, prescription, inventory, warehouse, supplier, purchasing, returns,
  customer, report, and settings pages were already implemented. The running
  website container used an older image created before those routes existed,
  so `/staff` fell through to the public application's not-found experience.
- Added a dedicated `/staff/login` flow, an early staff-route cookie gate, and
  role-aware post-login navigation. Unauthenticated requests preserve their
  staff destination; `STAFF`, `PHARMACIST`, and `ADMIN` users enter the portal;
  customer accounts are rejected without being sent through the customer home.
- Kept Django Admin separate at backend `/admin/` and replaced hard-coded local
  admin links with a host-aware website `/admin` bridge. Production deployments
  can set `DJANGO_ADMIN_ORIGIN`; Docker development defaults to backend port
  8000 on the incoming website host.
- Focused verification passed the staff navigation unit tests, website
  TypeScript and ESLint checks, a 34-route production build, Compose validation,
  Django system checks, and targeted staff API tests. Live browser verification
  covered unauthenticated redirect/return, administrator login, rejection of a
  customer account, public-login recognition of an administrator, and the
  separate Django Admin login page.

## 2026-08-05 - CMS backend checkpoint

- Preserved the partial `cms` app configuration and role helper, then completed
  a backend-only content system without changing the website or Flutter client.
  Added bilingual promotional banners, announcements, informational pages, and
  featured-medicine placements with UUIDs, display ordering, active state,
  draft/published/archived transitions, optional publication windows, and
  creator/updater/publisher audit records.
- Added staff-only create/update/delete/publish/archive APIs and Django Admin
  management for `STAFF`, `PHARMACIST`, and `ADMIN`. Anonymous reads expose only
  currently visible records; customers cannot write; future, expired, inactive,
  draft, archived, and inactive-medicine content remains private.
- Added validated private-by-state banner/page image delivery. JPEG, PNG, and
  WebP uploads are content-inspected, limited to 5 MiB and 128-6000 pixels, and
  replaced/deleted files are removed from storage. Action URLs are restricted to
  local application paths or absolute HTTP(S) destinations. CMS images share the
  existing private-media root, now backed by a dedicated Compose volume; nine
  existing prescription files were copied and checksum-verified before the
  backend container was recreated onto that volume.
- Added `cms.0001_initial` and `cms.0002` and applied them to the live PostgreSQL
  container. Migration consistency, Django system checks, Ruff, Compose
  validation, and the complete 77-test backend suite passed; 14 tests directly
  cover CMS visibility, roles, ordering/filtering, bilingual fields, publication
  transitions, invalid input, image privacy/validation, object retrieval,
  deletion, featured medicines, and route availability.
- OpenAPI generation completed with no CMS warnings. Validation retained the
  documented pre-existing untyped health endpoint and `payment_status` enum-name
  collision; no unrelated schema code was changed in this checkpoint.

## 2026-08-05 - Staff CMS management interface

- Added a dedicated content-management section to the existing role-gated staff
  portal at `/staff/cms`, with resource pages at `/staff/cms/banners`,
  `/staff/cms/announcements`, `/staff/cms/pages`, and
  `/staff/cms/featured-medicines`. The existing `STAFF`, `PHARMACIST`, and
  `ADMIN` guard remains authoritative; customer accounts are rejected and the
  originally requested CMS route is preserved through staff login.
- Implemented reusable responsive list, search, status/activity/placement
  filters, ordering, pagination, loading, empty, error/retry, detail preview,
  create, edit, publish/schedule, archive, activate/deactivate, and delete
  experiences. Publication badges distinguish draft, scheduled, published,
  expired, inactive, and archived content. Accessible in-portal confirmation
  dialogs protect state-changing and destructive actions.
- Added bilingual resource-specific editors matching the existing CMS
  serializers, including announcement levels/actions, informational page
  slugs/summaries, featured-medicine lookup/selection, display order, active
  state, and guarded banner/page image upload and replacement. Multipart
  requests preserve browser boundaries, backend validation remains attached to
  the relevant field without clearing form data, and authenticated image
  delivery stays behind the website API proxy without exposing storage paths.
- Focused verification passed 8 website contract/navigation tests, TypeScript,
  ESLint, the 35-route Next.js production build, Compose validation, Django
  system checks, and all 14 CMS API tests. The final website image rebuilt and
  started healthy.
- Live browser QA covered all four resource pages, loading and empty states,
  search/filter/order behavior, create/edit/details, validation recovery,
  immediate publish, activate/deactivate, archive, accessible confirmations,
  featured-medicine selection, image upload/replacement and guarded preview,
  destructive cleanup, customer rejection, administrator route restoration,
  and a forced API failure followed by successful retry. Desktop and 375-pixel
  layouts had no document overflow; the mobile menu, stacked cards, tables, and
  single-column editor remained usable. Temporary QA records and media were
  deleted after verification.

## 2026-08-12 - Operational admin, Health Articles, and bulk import

- Completed ordinary custom-portal operations for suppliers, warehouses and
  storage locations, purchase orders and partial/full receiving, inventory
  quality/count/adjustment actions, orders, and customer returns. Stock changes
  continue through the existing locked service layer and immutable ledger;
  historical records are transitioned or deactivated rather than hard-edited.
- Added `/staff/cms/health-articles` on the existing bilingual CMS page
  architecture, including draft/publish/schedule/archive/activity controls,
  guarded images and author/source. Flutter now reads only currently eligible
  articles, caches normalized content/images, renders an honest zero-state, and
  opens a Dari/English RTL/LTR article detail route.
- Added administrator-only `/staff/medicines/import` with a downloadable XLSX
  template, XLSX/UTF-8 CSV parsing, strict headers and size/row/formula limits,
  row-level validation, reference resolution, duplicate reporting, explicit
  create/update/skip policy, mutation-free preview, confirmation, and an import
  result. Confirmation is atomic; batches are never overwritten, enter pending
  quality state, and receive quantity only through a purchase ledger entry.
- Applied PostgreSQL migrations `cms.0003` and `catalog.0007`. Docker backend,
  database and website services are healthy; Compose configuration validates.
  Ruff, Django checks, migration consistency, OpenAPI validation and all 91
  backend tests passed. Website TypeScript, ESLint, all 34 tests and the 39-route
  production build passed. Flutter analyze and all 54 tests passed.
- Live staff browser QA covered the nine audited operational routes plus Health
  Articles and bulk import. At 1440, 1024, 390 and 320 pixels there was no
  document overflow; nested navigation, mobile menu, stacked import form and
  contained tables remained usable, with no console errors.
- Built and installed one fresh debug APK on Pixel 10 (`1.0.0+1`) using USB ADB
  reverse. The device showed the branded homepage, live category/medicine data,
  CMS hero, Health Articles zero-state and a temporary neutral QA article/detail
  (removed afterward), and persisted Dari RTL after switching from English and
  relaunching. No Flutter, Dio, socket or fatal runtime errors appeared.

## 2026-08-13 - Product hardening audit and Flutter localization

- Added `docs/FULL_PRODUCT_QA.md` as the milestone-wide evidence matrix for the
  Flutter customer app, public website, staff portal, backend contracts, and
  deferred release checks. It separates verified behavior from remaining work
  instead of treating route or API presence as user-flow acceptance.
- Locked down authentication navigation with focused tests: ordinary customer
  and staff-role sign-in and registration in the customer app open Home, while
  a valid protected-route intent is restored after authentication and external
  or authentication-loop return locations are rejected.
- Extended the existing Dari-first localization architecture rather than adding
  a competing framework. Shared authorization, navigation, offline, error,
  button, and design-system text now use the localized text path; authentication
  validators, connectivity errors, phone validation, medicine guidance, order
  state details, settings, policies, and primary catalogue/workflow copy have
  English equivalents. The catalogue contains 393 unique translation keys with
  no duplicate map entries, and `Darmalton` is used as the English app name.
- Flutter analyze passed. Twenty-four focused authentication, language,
  navigation, and offline tests passed, including persisted English, LTR/RTL
  switching, protected-route English guidance, and English offline/exit chrome.
  Full milestone regression, browser, and physical-device verification remain
  scheduled after the remaining product-hardening phases.

## 2026-08-13 - Catalogue discovery and manufacturer management

- Replaced repeated or misleading discovery blocks with live, distinct
  category shelves and truthful catalogue sections. Category actions now open
  the existing server-filtered search surface, and medicine cards expose
  localized product facts, manufacturer context, prescription state, stable
  imagery, and safe add-to-cart availability.
- Extended the existing manufacturer entity without duplicating catalogue
  models. Active manufacturers now support Dari names, validated guarded logo
  media, staff-controlled display order, country/website metadata, and safe
  activation/deactivation. Used manufacturers cannot be deleted.
- Added `/staff/manufacturers` to the existing staff catalogue manager with
  search, status/order controls, create/edit/detail, logo replacement, and
  deletion protection. Flutter Home consumes the same public data as a
  horizontally scrollable brand surface and opens a manufacturer-filtered
  catalogue rather than a decorative placeholder.
- Applied PostgreSQL migration `catalog.0008`. Ruff formatting/lint, Django
  checks, migration consistency, 23 focused catalogue/staff API tests, website
  tests/typecheck/ESLint, and focused Flutter analysis/widget tests passed.
  Production website build and attended responsive/device QA are recorded
  separately when run; no broad milestone regression was claimed here.

## 2026-08-13 - Approved prescription bundles and in-app notifications

- Added an owner-scoped, atomic `add-authorized-to-cart` prescription action.
  It safely merges one unit of every authorized medicine, preserves unrelated
  items, is idempotent on repeat, rejects cross-prescription conflicts, and
  retains all existing expiry, quantity, stock, price, ownership, and one-order
  checks. Approval still never creates an order or confirms checkout.
- Extended the existing persistent notification model for clarification
  responses plus order placement and actual order status changes. Events carry
  Dari and English copy, optional prescription/order links, unread filtering,
  single-read and read-all actions, and remain strictly owner-scoped.
- Flutter now provides a settings-respecting Home unread badge, notification
  center with resource navigation, and one-tap approved bundle action. The
  website exposes the same notification and bundle flows. Removed the disabled
  courier phone/chat card from order detail; no live courier claim was added.
- Applied PostgreSQL migrations `prescriptions.0002` and `.0003`. Ruff, Django
  checks/migration consistency, all 8 focused prescription/notification tests,
  website tests/typecheck/ESLint, Flutter analyze, and 21 focused Flutter tests
  passed. Attended browser and Pixel verification remain in the final QA pass.

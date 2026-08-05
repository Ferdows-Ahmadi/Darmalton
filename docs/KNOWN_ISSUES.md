# Known Issues

- iOS compilation and signing cannot be validated on Windows; use a current
  macOS/Xcode runner. Google sign-in there also needs the iOS OAuth client and
  reversed-client-ID URL scheme registered in the Runner target.
- No real Google OAuth credentials are committed, so the live provider popup
  cannot complete in repository CI/local verification until an operator supplies
  `GOOGLE_CLIENT_ID`, the server-only secret, authorized website origins, and
  Android package/SHA registration. Invalid, unavailable, linking-conflict, and
  verified-claim paths are covered by deterministic backend/client tests.
- Debug Android builds permit cleartext HTTP solely for private-LAN development.
  Release builds require HTTPS and production secrets/configuration.
- Automatic LAN discovery is development-only and requires a Private Windows
  network plus inbound TCP 8000 and UDP 53535 firewall rules. Guest Wi-Fi or
  access points with client isolation can still prevent phone-to-laptop access;
  USB ADB reverse remains the deterministic fallback.
- Wallets, stored payment methods, card gateways, ratings/reviews, courier chat,
  and live courier tracking remain gated rather than simulated. Cash on delivery
  is the only enabled checkout payment method. Address GPS and map pin capture
  are functional; service zones, dynamic fees/ETAs, courier assignment, courier
  GPS updates, and customer tracking remain Phase 7 work.
- The prescription backend, clients, authorization rules, guarded review
  controls, and camera/gallery/file UI pass automated tests. A fresh
  physical-device walkthrough of camera capture, upload, clarification,
  approval, authorized cart, and checkout is still required before release.
- The current `file_picker` Android plugin still applies the legacy Kotlin
  Gradle plugin. Earlier debug builds succeeded, but Flutter warns that a future
  toolchain may require a plugin release migrated to built-in Kotlin.
- The 2026-08-01 Phase 2 debug build did not produce a fresh APK. Gradle reached
  `Preparing "Install Android SDK Platform 34 (revision 3)"`; the SDK directory
  appeared, but the build stopped making meaningful progress and only its build
  wrapper/daemon were terminated. Do not treat the older APK in `build/` as a
  Phase 2 artifact; rerun one diagnostic build after repairing/confirming the
  Android SDK installation.
- 2026-08-04 follow-up: the prior locale-refresh hotfix experiment that made a
  custom localized-text widget tree depend directly on an inherited language
  widget was rejected. It triggered `_dependents.isEmpty` assertions when the
  catalogue filter modal dismissed. The finalized approach keeps app settings as
  the single source of truth and uses explicit language-aware string resolution
  plus safe post-dismiss filter state application.
- The requested full manual Pixel regression matrix (navigation, addresses,
  catalogue, prescription, offline, and all back-stack interactions) remains
  partially open in this run; automated Flutter coverage and the debug APK build
  are green, but complete physical interaction-based sign-off still requires a
  full attended walkthrough.
- Development map previews use the OpenStreetMap standard tile endpoint with
  attribution and an application user agent. Before production traffic, choose
  and configure a tile provider or self-hosting plan that satisfies capacity,
  caching, privacy, and usage-policy requirements.
- The dedicated Next.js staff console provides responsive dashboards, live
  searchable resource views, reports, and quick links. Complex operational
  mutations remain intentionally delegated to guarded Django Admin workflows.
- Next.js route additions require rebuilding/redeploying the website image;
  restarting a container created from an older image will not make new staff
  routes available. The `/admin` bridge assumes backend port 8000 for local
  Docker/LAN access; reverse-proxied production deployments must set
  `DJANGO_ADMIN_ORIGIN` to the externally reachable Django origin.
- Refund completion is intentionally a manual workflow record. It does not
  initiate or reconcile a bank, card, wallet, or other payment-gateway refund.
- Purchase receiving requires staff to enter batch, expiry, selling price,
  quality decision, and storage location. Barcode scanners, supplier EDI,
  automated replenishment, and accounting-system export remain production
  integrations.
- Existing batches created before warehouse tracking have a null storage
  location and default to quality-approved to preserve current sellable stock.
  Operations staff should assign locations and complete a physical verification
  before production cutover.
- Medicine seed records use a neutral fallback until real, licensed product
  photography is uploaded through the staff/admin image-management API.
- Promotional campaigns, recommendations, offers, and health articles currently
  use curated demo content in the clients. A production content-management,
  approval, scheduling, and localization workflow is not yet implemented.
- The mobile app is Dari-first with persisted English switching and currently
  ships only the light theme. Missing localized copy safely falls back to Dari;
  operator-authored catalogue text needs populated English fields for a fully
  English presentation. Biometric login and operating-system push notifications
  remain disabled until their platform-specific secure-storage, consent, and
  credential work is completed; the notification foundation is preserved for
  Phase 8.
- Offline mobile support persists public catalogue metadata, thumbnails,
  favorites, searches, recently viewed items, guest-cart item IDs/quantities,
  preferences, and the signed-in user's addresses. It deliberately omits live
  prices, stock, order, prescription, and payment status. Authenticated server
  carts are not available offline. Endpoint rediscovery runs at startup and on
  explicit retry; continuous background reachability monitoring is deferred to
  the dedicated offline-sync phase.
- OpenAPI generation succeeds with one non-blocking warning because multiple
  resources expose different choice sets named `payment_status`; add a
  `SPECTACULAR_SETTINGS.ENUM_NAME_OVERRIDES` entry before publishing a generated
  SDK.
- Historical order item and status-note snapshots preserve the text stored at
  order time. Newly seeded catalogue display names are Dari-first, but older
  snapshots can retain a Latin medicine name.
- The attached PDF's master ER diagram page renders without diagram content, but
  its detailed table definitions and relationships are readable and were used.

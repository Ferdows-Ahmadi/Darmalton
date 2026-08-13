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
  network plus inbound TCP 3000, TCP 8000, and UDP 53535 firewall rules. Run
  `scripts/demo-start.ps1 -ConfigureFirewall` once from Administrator
  PowerShell. Guest Wi-Fi or
  access points with client isolation can still prevent phone-to-laptop access;
  USB ADB reverse remains the deterministic fallback.
- Wallets, stored payment methods, card gateways, ratings/reviews, courier chat,
  and live courier tracking remain gated rather than simulated. Cash on delivery
  is the only enabled checkout payment method. Address GPS and map pin capture
  are functional; service zones, dynamic fees/ETAs, courier assignment, courier
  GPS updates, and customer tracking remain Phase 7 work.
- The prescription backend, clients, authorization rules, guarded staff review
  interface, and camera/gallery/file UI pass automated tests. The browser flow
  now passes review, clarification, customer response, approval, and final-state
  visibility. Physical file selection/preview/upload passes; an attended camera
  capture plus approved-cart checkout remains required before release.
- The current `file_picker` Android plugin still applies the legacy Kotlin
  Gradle plugin. Earlier debug builds succeeded, but Flutter warns that a future
  toolchain may require a plugin release migrated to built-in Kotlin.
- Android debug APK builds now complete and install successfully. Flutter still
  warns that the current `file_picker` plugin applies the legacy Kotlin Gradle
  plugin; this is non-blocking with the verified toolchain.
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
- The custom Next.js staff portal is now the normal operational interface for
  prescriptions, orders, customers, medicine/image management, category media,
  suppliers, warehouses/locations, procurement/receiving, inventory/ledger,
  returns, CMS, and administrator account management. Django Admin remains a
  technical emergency/audit fallback, not a required daily workflow.
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
- Missing medicine photography uses a neutral fallback until real, licensed
  product images are uploaded through `/staff/medicines`. Run
  `python manage.py report_missing_medicine_images` for the exact IDs.
- Responsive staff browser QA passed at 1440, 1024, 390 and 320 pixels without
  document overflow or console errors. Very large real datasets can still make
  contained tables require horizontal scrolling by design.
- The production CMS backend manages bilingual scheduled banners,
  announcements, informational pages, and featured-medicine placements with
  guarded publication and image delivery, and the Next.js staff portal has
  complete management screens. Flutter now consumes scheduled `HOME_HERO`
  banners with caching and autoplay. The public website still renders its
  existing curated campaign sections; consuming public CMS data there remains a
  separate checkpoint. No live banners are currently seeded, so operators must
  upload and publish meeting content.
- Staff CMS labels and workflow guidance are Dari-first, but validation text
  returned verbatim by Django can still be English. Localize the stable backend
  CMS validation messages before a fully Dari operator release.
- Bulk import intentionally excludes medicine images, formulas, legacy XLS,
  multi-sheet CSV and automatic creation of categories, dosage forms, suppliers,
  warehouses or locations. XLSX requires exact template sheet/header names; CSV
  imports medicine metadata only. Missing manufacturers may be created from the
  workbook name plus a two-letter country code. New batches stay quarantined in
  the pending-quality state until staff inspection approves them.
- The mobile app is Dari-first with persisted English switching and currently
  ships only the light theme. Missing localized copy safely falls back to Dari;
  operator-authored catalogue text needs populated English fields for a fully
  English presentation. Persistent bilingual in-app prescription and order
  notifications are implemented. Operating-system push notifications and
  biometrics remain disabled until their platform-specific secure-storage,
  consent, and credential work is completed.
- The order detail displays only server-recorded status/history. Courier phone,
  chat, live GPS, nearby-pharmacy comparison, and delivery estimates remain
  hidden because no trustworthy assignment/tracking provider is integrated.
- Offline mobile support persists public catalogue metadata, thumbnails,
  favorites, searches, recently viewed items, guest-cart item IDs/quantities,
  preferences, and the signed-in user's addresses. It deliberately omits live
  prices, stock, order, prescription, and payment status. Authenticated server
  carts are not available offline. Endpoint rediscovery runs at startup and on
  explicit retry; continuous background reachability monitoring is deferred to
  the dedicated offline-sync phase.
- OpenAPI generation now has an explicit health response and distinct order
  payment-status enum name. Generated clients still require normal versioning
  and compatibility review before publication.
- Historical order item and status-note snapshots preserve the text stored at
  order time. Newly seeded catalogue display names are Dari-first, but older
  snapshots can retain a Latin medicine name.
- The attached PDF's master ER diagram page renders without diagram content, but
  its detailed table definitions and relationships are readable and were used.

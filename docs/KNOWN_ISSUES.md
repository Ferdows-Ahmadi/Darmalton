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
- Wi-Fi device builds depend on the laptop's current private-LAN address being
  listed in the ignored `.env` `DJANGO_ALLOWED_HOSTS`. The USB helper is the
  preferred address-independent workflow; rerun the LAN helper after DHCP
  changes.
- Wallets, stored payment methods, ratings/reviews, live GPS, and courier chat
  remain outside the current milestone and must stay labeled or disabled rather
  than simulated.
- The Phase 3 prescription backend, customer clients, authorization rules, and
  guarded admin review controls are implemented and checkpointed. A fresh
  end-to-end PostgreSQL/browser/Pixel workflow and responsive QA still need to
  be completed after the final admin edits; the user intentionally stopped that
  verification to preserve the checkpoint.
- The current `file_picker` Android plugin still applies the legacy Kotlin
  Gradle plugin. The debug build succeeds today, but Flutter warns that a future
  toolchain may require a plugin release migrated to built-in Kotlin.
- Supplier, procurement, warehouse, inventory-ledger, and returns operations
  are available through Django Admin and staff APIs. A dedicated staff-facing
  Next.js or Flutter operations console is not implemented.
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
- Historical order item and status-note snapshots preserve the text stored at
  order time. Newly seeded catalogue display names are Dari-first, but older
  snapshots can retain a Latin medicine name.
- The attached PDF's master ER diagram page renders without diagram content, but
  its detailed table definitions and relationships are readable and were used.

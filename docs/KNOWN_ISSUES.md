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
- Wallets, stored payment methods, ratings/reviews, live GPS, courier chat, and
  prescription review are not Milestone 1 backend capabilities. The redesigned
  clients must label or disable these honestly rather than simulating them.
- Medicine seed records use a neutral fallback until real, licensed product
  photography is uploaded through the staff/admin image-management API.
- Historical order item and status-note snapshots preserve the text stored at
  order time. Newly seeded catalogue display names are Dari-first, but older
  snapshots can retain a Latin medicine name.
- The attached PDF's master ER diagram page renders without diagram content, but
  its detailed table definitions and relationships are readable and were used.

# Production Readiness

Status as of 2026-08-13. This file separates verified application behavior from
operator configuration and intentionally deferred integrations.

## Ready in the codebase

- Django remains the authority for identities, permissions, catalogue, prices,
  stock, prescriptions, orders, operations, returns, notifications and CMS.
- PostgreSQL migrations are applied and consistent. Django checks, Ruff, 97
  backend tests and the integrated PostgreSQL smoke flow pass.
- The Next.js public website and role-guarded staff portal pass 41 tests,
  strict TypeScript, ESLint and the 42-route production build. Responsive
  browser QA passes at 1440, 1024 and 320 pixels without document overflow.
- Flutter passes analysis and all 66 tests. A fresh debug APK is installed and
  verified on a Pixel 10 for Dari/English direction, branding, online data,
  offline presentation and recovery.
- Customer, pharmacist and administrator routing was browser-verified. Django
  and client permission tests cover the broader supported role matrix.
- Uploads, private media, tokens and roles remain server-guarded; no production
  secrets or customer data are committed.

## Operator actions before production

- Supply production `SECRET_KEY`, PostgreSQL credentials, HTTPS API/site
  origins, allowed hosts, CSRF/CORS origins, secure object/media storage,
  backups, monitoring and log retention. Keep `DEBUG=false`.
- Change or disable every seeded demo account and never deploy `seed_demo`
  credentials to a public environment.
- Upload licensed medicine/brand media, verify physical batch locations and
  quarantine/quality state, and publish reviewed bilingual CMS content.
- Configure an approved map tile/geocoding provider and production delivery
  service zones. Register Google OAuth platform credentials only if Google
  sign-in is enabled.
- Run the attended release checklist for camera capture, GPS/map positioning,
  destructive address actions, approved-prescription checkout and Android
  release signing. Validate/sign iOS on macOS/Xcode.
- Resolve the single OpenAPI enum-name warning before publishing generated SDKs.

## Intentionally deferred or gated

- Card/wallet gateways and automated refunds; Cash on Delivery is the only
  enabled checkout method.
- Courier assignment, chat, live GPS, nearby-pharmacy comparison and dynamic
  ETA/fee calculations.
- Operating-system push notifications, biometrics, supplier EDI, accounting
  export and barcode-scanner integration.
- iOS compilation/signing on this Windows workstation.

The debug build is suitable for local/team demonstration through ADB reverse or
a correctly configured private LAN. It is not a production-signed release APK.

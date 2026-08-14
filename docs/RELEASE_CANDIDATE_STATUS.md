# Release Candidate Status

Status date: 2026-08-14. Candidate branch: `codex/milestone-1`.

## PASS

- Django system/migration checks, Ruff, OpenAPI validation and all 101 backend
  tests pass. The complete backend suite also passes against PostgreSQL 17.6.
- All 43 website tests, strict TypeScript, ESLint and the 42-route production
  Next.js build pass.
- Flutter analysis and all 66 tests pass. A fresh debug APK build passed in the
  release-candidate verification run.
- The PostgreSQL registration, catalogue, cart, address, COD checkout, staff
  transition and customer-refresh smoke flow passes.
- Development Compose remains healthy. The separate production Compose profile
  validates, builds clean production images, applies all migrations to a fresh
  isolated PostgreSQL volume, and reaches healthy backend/website/database state
  without publishing ports 3000, 8000 or 5432.
- Production Django configuration fails closed for missing database, secret,
  host and browser-origin settings. `manage.py check --deploy` has no warnings
  under the documented production profile.
- The isolated PostgreSQL backup/restore drill passes, both media volumes are
  writable by the unprivileged application UID, and internal website-to-Django
  calls pass without exposing service ports.
- Browser QA passes public/staff routes at 320, 1024 and 1440 pixels with no
  overflow, broken images or fresh-tab console errors. Customer, pharmacist and
  administrator direct-route permissions were rechecked through the UI.

## OPEN before public production

- Complete the attended Pixel workflow in `FINAL_ACCEPTANCE_CHECKLIST.md`,
  especially real camera capture, GPS/map behavior, destructive address actions
  and approved-prescription-to-COD checkout.
- Select the real web/API domains and perform the first manual VPS deployment.
- Verify the existing Hostinger Traefik Docker-provider network path on the VPS.
- Run the first production backup, copy it off-server and repeat the already
  proven isolated restore drill on the VPS.
- Create and protect the Android release keystore; build/sign/test an AAB.
- Configure and test production Google identities if Google sign-in will launch.
- Perform iOS build, signing and device validation on macOS.

## EXTERNAL CONFIGURATION REQUIRED

- DNS for the selected web and API hosts, production `.env.production`, TLS
  certificate issuance, Google Cloud OAuth clients, privacy-policy URL, map tile
  provider, off-server backup destination, monitoring and alert recipients.
- Real licensed catalogue imagery, reviewed bilingual CMS content, physical
  inventory-location verification and removal/disablement of demo accounts.

## DEFERRED

- Card/wallet payment, automatic gateway refunds, live courier GPS/chat,
  nearby-pharmacy comparison, push notifications, biometrics, iOS work on
  Windows, supplier EDI and accounting export.

The repository is a first production release candidate only after all automated
checks remain green and the OPEN deployment/device gates are signed off. It is
not evidence that the application has already been deployed.

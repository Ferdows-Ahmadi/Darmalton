# Final Acceptance Checklist

Record date, commit, APK/AAB hash, device/OS, operator and evidence links. Do not
mark a human action PASS from API/unit-test evidence alone.

## Automated release gate

- [x] Ruff, Django system/deployment/migration checks and OpenAPI validation.
- [x] 101 backend tests on SQLite workstation fallback and PostgreSQL 17.6.
- [x] 43 website tests, TypeScript, ESLint and 42-route production build.
- [x] Flutter analyze, 66 tests and fresh debug APK compile.
- [x] Development and production Compose validation.
- [x] Clean production image build and isolated production-stack health.
- [x] Integrated PostgreSQL customer/order/staff smoke flow.
- [x] Local compressed backup plus isolated restore verification (56 migrations).

## RC1 Pixel installation - 2026-08-14

- [x] Verified the clean source checkout at
      `be80adae2a2cf40d3386a6daf9261f33de7b273a` before installation.
- [x] Verified the recorded RC1 debug APK SHA-256 as
      `4B90A06C25DE89920528319D72ABEF2BA6ED7A29C68F95A7C8F578CE834D80C2`.
- [x] Verified package `com.darmalton.pharmacy`, version `1.0.0` and
      versionCode `1` from the APK manifest and installed package metadata.
- [x] Installed with non-destructive `adb install -r` on Google Pixel 10
      (`57221FDCR00CMN`, Android 17/API 37); existing application data was not
      cleared and the original first-install timestamp was preserved.
- [x] Pulled the installed base APK and confirmed its SHA-256 exactly matches
      the local RC1 artifact.
- [x] Force-stop/cold-launch passed; Home loaded online in Dari RTL and English
      LTR, the language choice persisted across cold launches, and the device
      was returned to Dari for the final cold launch.
- [x] With only the local development backend temporarily stopped, the compact
      offline banner appeared and Retry recovered after the same container was
      restarted. Database and media volumes were not changed.
- [x] No fatal, unhandled or current-process error was present in the final
      application logcat inspection. One non-fatal geolocator lifecycle message
      (`position updates stopped`) appeared during an earlier force-stop.

This was deliberately a replacement install, not a fresh-data install. The
complete attended prescription/address/GPS/COD workflow below remains open.

## RC1 promotional-media patch - 2026-08-14

- [x] Traced a real `HOME_HERO` record from the CMS list and guarded image
      endpoint through Flutter endpoint selection, metadata/file caching, image
      decoding, fallback, and rendering.
- [x] Confirmed the public published image is anonymously readable (`200`,
      `image/png`, valid bytes) while archived banner images remain unavailable
      and private prescription media authorization remains unchanged.
- [x] Confirmed a real uploaded promotional image visibly renders online on the
      Pixel 10 without requiring Retry.
- [x] Confirmed the same real image remains visible from cache when the backend
      is deliberately stopped; Home remains usable and no loading loop occurs.
- [x] Confirmed the compact offline banner's Retry control restores live state
      and keeps the image rendered after the backend becomes healthy.
- [x] Confirmed the physical Home header remains menu-left, wordmark-center and
      notification-right in Dari RTL and English LTR, with no narrow-width
      overflow in focused widget tests.
- [x] Confirmed `محصولات دارویی` / `Medicines` replaces the obsolete catalogue
      title and the old title is no longer translated or rendered.
- [x] Audited major customer screens and removed obsolete demo, milestone,
      future-version, fake-contact, and dead-share messaging/controls.
- [x] Passed Flutter analyze, all 71 Flutter tests, 16 targeted Django CMS tests,
      fresh APK build/install, cold launch, physical online/offline/recovery
      checks, and clean app-scoped logcat inspection.

The patch APK SHA-256 is
`AFE3F827D200AE78790993C0BFBCFA9593B1ACAC3F8AF77EF5C0FA823453BBF6`.
Production deployment remains paused until this committed patch is explicitly
approved as the new release candidate.

## Pixel attended flow — OPEN

- [ ] Fresh install/cold launch and online recovery on the final candidate APK.
- [ ] Real camera prescription capture, preview/retake, upload and submit.
- [ ] Pharmacist opens that exact record in `/staff/prescriptions`.
- [ ] Request clarification with required note; customer sees it and replies.
- [ ] Pharmacist approves; customer sees authorization without an auto-order.
- [ ] Approved medicines enter/review cart with explicit quantity/price/stock.
- [ ] Customer selects/creates an address and completes COD checkout once.
- [ ] Order appears in customer/staff views and status refreshes correctly.
- [ ] Address create/edit/default/GPS/map-confirm/map-cancel/delete walkthrough.
- [ ] Home, Categories, Brands, Search, Detail, Cart, Prescriptions, Orders and
      Profile/Settings visually checked in both Dari RTL and English LTR.

## Browser and production — OPEN

- [x] Final browser pass at 320, 1024 and 1440 widths with no overflow, broken
      images or fresh-tab console/runtime errors; route scroll reset passed.
- [x] Customer rejected from `/staff`; pharmacist/admin permissions rechecked.
- [ ] Final domains/DNS/TLS and Traefik routing verified on Hostinger.
- [ ] First production database backup copied off-server and VPS restore drill
      recorded (the same scripts pass locally against PostgreSQL 17.6).
- [ ] Production Google sign-in tested or explicitly disabled.
- [ ] Signed Android AAB installed/tested; Play disclosures/privacy URL approved.
- [ ] iOS build/sign/device validation completed on macOS or held from release.

## Release decision

- [ ] No secrets/customer data in Git; working tree clean; commits/tag reviewed.
- [ ] All OPEN launch gates either pass or are explicitly accepted by the release
      owner with scope and mitigation recorded.

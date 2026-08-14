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

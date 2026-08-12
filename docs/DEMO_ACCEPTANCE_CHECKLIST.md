# Darmalton Demo Acceptance Checklist

Run this list after `scripts/demo-start.ps1`. `[x]` records the latest verified
state; `[ ]` requires an attended check or meeting content.

## Platform readiness

- [x] PostgreSQL, backend, website, discovery, and staff containers are healthy.
- [x] Django checks pass and migrations are applied to PostgreSQL.
- [x] Public website, staff routes, Django Admin, API docs, and health endpoint load.
- [x] Fresh debug APK builds, installs, and launches on Pixel 10.
- [ ] Run `demo-start.ps1 -ConfigureFirewall` once as Administrator before Wi-Fi guests arrive.
- [ ] Confirm the meeting-day IP printed by the script from a teammate's phone.

## Customer website and staff portal

- [x] Public home and shop render RTL without console/runtime errors.
- [x] Staff authentication sends unauthorized users to `/staff/login` and preserves routes.
- [x] ADMIN reaches the grouped dashboard and all operations/CMS navigation routes.
- [x] Customer accounts remain blocked from staff pages.
- [x] Medicine/image, category/media, CMS, prescription, and user administration
  controls are available in the custom staff portal.
- [x] Django Admin remains separate as a technical fallback and is absent from
  normal staff navigation.
- [x] CMS create form exposes bilingual copy, scheduling, action, state, and guarded image upload.

## Pixel application

- [x] Customer password login works against the Docker API.
- [x] Dari/English changes RTL/LTR and persists after force-stop/relaunch.
- [x] Account, Settings, catalogue filtering/sorting, and prescription source picker render.
- [x] Prescription picker offers camera, gallery, and file sources.
- [x] File selection, preview, retake/remove, upload, and history confirmation work physically.
- [x] Expired access-token refresh no longer reuses the invalid bearer token.
- [x] Offline state appears when Docker is stopped and normal service recovers after restart.
- [x] Map cancel/confirm paths have focused regression coverage and prior device checks pass.
- [ ] Complete one attended physical camera capture in meeting lighting.
- [ ] Complete one attended address create/edit/delete/default/GPS walkthrough.
- [ ] Complete one attended cart and cash-on-delivery checkout walkthrough.

## Prescription and CMS demo data

- [x] Live PostgreSQL transition succeeds from submitted to review to clarification requested.
- [x] Targeted prescription permission, state-transition, and upload tests pass.
- [x] Respond to clarification in the customer interface and approve it in the staff UI.
- [ ] Upload and publish four `HOME_HERO` banners for the carousel demonstration.
- [ ] Upload licensed primary images for featured demo medicines.
- [x] Zero/one/four/more-than-ten banner and cached/offline states have automated coverage.

## Intentionally unavailable (do not demonstrate as live)

- [x] Card/wallet gateways and automatic bank refunds remain gated.
- [x] Nearby-pharmacy distance, courier assignment/chat, and live GPS tracking remain gated.
- [x] Push notifications and biometric login remain gated.
- [x] Public Next.js CMS banner consumption is documented as unfinished.
- [x] iOS build/signing is documented as requiring macOS/Xcode.

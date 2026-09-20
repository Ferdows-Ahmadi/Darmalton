# Dari App page visual review

Date: 2026-09-21. Status: **visually approved by the user and included in the App approval checkpoint**.

## Approved account checkpoint

`f892969c7bf49b31dd8cd2c081d2708c7d637daf` — `Approve responsive Dari customer account ecosystem`.
The checkpoint contains the approved account redesign, localization corrections, focused tests and required shared source. Generated files were excluded. Nothing was pushed or deployed.

## Scope and files

The existing customer download route is `/app`, implemented in `website/app/app/page.tsx`. The new presentation renders only for `fa-AF` (Dari RTL). English/Pashto retain their existing presentation.

- `website/app/app/page.tsx`: compact phone-led hero, Android actions, inactive iOS status, capability strip and three workflow cards.
- `website/app/app/app.module.css`: page-scoped responsive styling using the approved storefront palette and compact treatment.
- `website/components/AppChrome.tsx`: adds only `/app` to the existing Dari storefront chrome condition; no shared styles changed.
- `docs/APP_DESIGN_REVIEW.md`: this evidence report.

No other approved page was redesigned. No backend, Flutter, APK or signing changes were made.

## Existing assets and supported capabilities

All imagery is reused unchanged from `website/public/app/`:

- `APP-01_Hero_Dual_Phones.png`
- `APP-02_App_Screen_In_Hand.png`
- `APP-12_Prescription_Illustration.png`
- `APP-10_Delivery_Illustration.png`
- `APP-06_Feature_Security_Icon.png`
- `APP-07_Feature_Speed_Icon.png`
- `APP-08_Feature_Location_Icon.png`
- `APP-09_Feature_Support_Icon.png`

These are existing Darmalton marketing assets, not newly fabricated phone screens or captures from a rebuilt APK.

Read-only inspection of `mobile/lib/src/app.dart`, the prescription picker, profile and checkout implementation confirmed catalogue/search/product browsing, prescription upload, protected account/order access, notifications and saved delivery addresses. Copy is limited to these capabilities. Prescription privacy wording follows the existing owner/authorized-pharmacy access model. Delivery information links to `/delivery-policy`; no delivery-time or clinical-service promises were added.

## Download behavior

Both Android actions retain the existing anchor `download` attribute and exact destination:

`https://darmalton.com/downloads/darmalton-android-1.0.0.apk`

The rendered DOM confirmed both destinations at every reviewed width. Version 1.0.0 follows the existing production release URL supplied by the user. Remote availability is **unverified**: PowerShell HEAD and curl HEAD attempts timed out connecting to the production host (curl exit 28). No successful HTTP response, download or installation is claimed. No APK was rebuilt, replaced or downloaded.

iOS appears as plain unavailable text in the hero and final section. There is no interactive iOS action or App Store destination.

## Responsive evidence

Reviewed at 1440, 1024, 768, 412, 390 and 320 pixels. All six had RTL direction, zero document horizontal overflow, eight successfully loaded page images and two correct Android links. Top and lower sections were visually inspected; phone imagery and CTA text remain contained. The final Android action remains accessible above the fixed bottom navigation at 320x700.

Screenshots are local ignored artifacts in `tmp/app-design-review/`; paired viewport captures show the page without RTL full-page stitching artifacts.

| Width | Top | Lower |
| --- | --- | --- |
| 1440 | [Top](../tmp/app-design-review/app-1440.png) | [Lower](../tmp/app-design-review/app-lower-1440.png) |
| 768 | [Top](../tmp/app-design-review/app-768.png) | [Lower](../tmp/app-design-review/app-lower-768.png) |
| 390 | [Top](../tmp/app-design-review/app-390.png) | [Lower](../tmp/app-design-review/app-lower-390.png) |
| 320 | [Top](../tmp/app-design-review/app-320.png) | [Lower](../tmp/app-design-review/app-lower-320.png) |

Additional evidence: [1024](../tmp/app-design-review/app-1024.png), [412](../tmp/app-design-review/app-412.png), [320x700 action clearance](../tmp/app-design-review/app-action-320.png), [DOM checks](../tmp/app-design-review/checks.json).

## Regression and checks

Homepage, Login and the approved Profile page were checked visually at 1440 and 390. All six retained RTL and zero horizontal overflow; no regression was observed. The only shared source change adds the App route to an existing style condition.

| Page | 1440 | 390 |
| --- | --- | --- |
| Homepage | [Capture](../tmp/app-design-review/homepage-1440-regression.png) | [Capture](../tmp/app-design-review/homepage-390-regression.png) |
| Login | [Capture](../tmp/app-design-review/login-1440-regression.png) | [Capture](../tmp/app-design-review/login-390-regression.png) |
| Profile | [Capture](../tmp/app-design-review/profile-1440-regression.png) | [Capture](../tmp/app-design-review/profile-390-regression.png) |

- Frontend tests: **61/61 passed**.
- TypeScript: **passed** (`npm run typecheck`).
- ESLint: **passed** (`npm run lint`).
- Production build: **passed**, 61/61 pages generated using isolated `.next-build` output.
- Browser console error log: **empty** during the review.
- `git diff --check`: **passed**.
- Backend tests not rerun: this phase changes only frontend presentation.

The generated Next route-reference path was restored to the development `.next` path after the isolated build. `next-env.d.ts` and `tsconfig.json` have no content diff and are excluded from the intentional App changes. This report and the three intentional App source files are included in the user-approved checkpoint.

Testing used the existing local demo account without saving profile edits or creating records. The session was signed out afterward and the original guest cart restored. Screenshots contain no credentials or prescription material. The local preview remains available at `http://127.0.0.1:3002/app`.

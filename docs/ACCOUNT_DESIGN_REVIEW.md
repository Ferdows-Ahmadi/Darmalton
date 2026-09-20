# Dari protected customer account review

Approved by the user on 2026-09-21: the Dari RTL account shell, Profile, Addresses, Orders, Prescription Upload/History/Detail, and Notifications, including the focused localization corrections. The following dated sections retain the verification history. This approved account work is now recorded as its own checkpoint before the separate App page phase.

## Focused localization correction — 2026-09-21

The account shell and Profile design are directionally accepted; the entire protected-account phase remains unapproved and uncommitted. This correction did not change CSS, typography, spacing, navigation layout, AppChrome, header, or footer. The earlier dated implementation record below is historical; this section supersedes its English-error limitation and test counts.

### Localization audit and changes

- Added a Dari-only account request-error formatter. It translates the known API validation envelope, request/network failures, authentication/access errors, missing records, upload size, throttling, service errors, and known prescription approval/expiry/ownership/previous-use errors. Unknown English exception text uses the existing localized contextual fallback.
- Profile API validation now says **معلومات واردشده را بررسی و اصلاح کنید.** The message does not falsely claim that individual fields have been highlighted. Profile load failures also show their localized error instead of an indefinite loading label.
- Native required-field feedback says **این بخش را تکمیل کنید.** Native format/length/invalid-value messages also have Dari text within AccountShell. Existing browser validity rules remain in force; changing input clears custom feedback.
- Missing order/address/etc. records say **مورد درخواستی پیدا نشد یا در دسترس شما نیست.** This replaces raw text such as “No Order matches the given query.”
- Address deletion confirmation now refers to the address: **این آدرس حذف شود؟** Existing default-address labels and GPS feedback were already Dari; no default/GPS behavior changed.
- Profile, address load/save/delete, order list/detail, prescription history/upload/cancel/respond/add-approved, and notification errors use the scoped formatter. Upload XHR failures preserve status for presentation. Notification read failures now display localized feedback through the existing error area instead of an unhandled rejection.
- Audited account overview/guard/shell, profile success, address defaults/GPS, order statuses/empty/loading, prescription success/history/detail/statuses/cancellation, and notifications. Their existing UI translations already cover Dari. PrescriptionDetail retains its existing generic localized error state.
- Stored names, emails, medicine data, pharmacy notes, notification records, filenames, and identifiers are untouched. Existing notification templates and the cancelled test record are already Dari. No translation is applied to arbitrary backend records. JPG/PNG/PDF and Rx remain technical labels.

### Files changed in this correction

- New `website/lib/account-feedback.ts` and `website/test/account-feedback.test.mjs`.
- `website/components/AccountShell.tsx`, `ProfileEditor.tsx`, `AddressBook.tsx`, `AddressEditor.tsx`, and `PrescriptionDetail.tsx`.
- `website/app/orders/page.tsx`, `website/app/orders/[id]/page.tsx`, `website/app/prescriptions/page.tsx`, and `website/app/notifications/page.tsx`.
- This report. Earlier uncommitted account design files remain in the tree; no additional visual work or other-locale design was done.

### Fresh functional and navigation results

Verified a genuine invalid-phone API response and native empty-name validation on Profile, and required recipient-name validation on the blank address form. These submissions did not save changed data. The original profile/address remained unchanged. Missing-file prescription validation and the unavailable-order response were checked live. Address deletion, prescription cancellation, and service-outage scenarios were audited through their shared message paths and formatter tests, not recreated through destructive actions or forced outages.

Clicked each of the six visible account navigation links: `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/prescriptions`, and `/account/notifications`. Each reached the exact existing route with exactly one correct `aria-current="page"` item. New/edit address views retained the addresses active item; prescription detail retained prescriptions; unavailable order detail retained orders. The account overview's existing cart/orders/prescription links remain unchanged. The header logout was exercised.

Guest access to Profile preserved `/login?returnTo=%2Faccount%2Fprofile`; local demo login returned to Profile. No new addresses, prescriptions, orders, notifications, or accounts were created. Existing cancelled harmless test prescription used for history/detail evidence. Final session signed out and original guest cart restored. No private prescription material or passwords appear in delivered screenshots.

### Fresh screenshot evidence

All files below are fresh captures from this correction, stored locally under ignored `tmp/account-localization-review/`. Profile/address data is the existing seed-demo data. Orders show the genuine empty state. History/detail show the existing cancelled harmless test request. Some long forms have separate upper/lower viewport captures because full-page RTL browser capture was unreliable.

| Page | 1440 | 390 |
| --- | --- | --- |
| Profile | [Desktop](../tmp/account-localization-review/profile-1440.png) | [Mobile](../tmp/account-localization-review/profile-390.png) |
| Populated addresses | [Desktop](../tmp/account-localization-review/addresses-1440.png) | [Mobile](../tmp/account-localization-review/addresses-390.png) |
| Address create | [Desktop](../tmp/account-localization-review/address-create-1440.png) | [Mobile](../tmp/account-localization-review/address-create-390.png) |
| Address edit | [Desktop](../tmp/account-localization-review/address-edit-1440.png) | [Mobile](../tmp/account-localization-review/address-edit-390.png) |
| Empty orders | [Desktop](../tmp/account-localization-review/orders-1440.png) | [Mobile](../tmp/account-localization-review/orders-390.png) |
| Prescription upload | [Desktop](../tmp/account-localization-review/prescription-upload-1440.png) | [Mobile](../tmp/account-localization-review/prescription-upload-390.png) |
| Prescription history | [Desktop](../tmp/account-localization-review/prescription-history-1440.png) | [Mobile](../tmp/account-localization-review/prescription-history-390.png) |

Additional evidence: [prescription detail 390](../tmp/account-localization-review/prescription-detail-390.png), [notifications 390](../tmp/account-localization-review/notifications-390.png), [corrected Dari Profile error 390](../tmp/account-localization-review/profile-validation-390.png), [localized order error 390](../tmp/account-localization-review/order-error-390.png), [account at 320](../tmp/account-localization-review/account-320.png).

Long-form actions: [address controls 390](../tmp/account-localization-review/address-edit-controls-390.png), [upload submit controls 390](../tmp/account-localization-review/prescription-upload-controls-390.png).

390px regressions: [Login](../tmp/account-localization-review/login-regression-390.png), [Register](../tmp/account-localization-review/register-regression-390.png), and Profile above passed visual review. AppChrome/shared customer chrome was not changed in this correction, so the full public-route matrix was not repeated. Captured layouts showed RTL and no positive page overflow.

### Checks and current scope

- Frontend: **61 tests passed**, including three new focused feedback tests.
- TypeScript and ESLint: **passed**.
- Production build: **passed**, 61/61 static pages, separate `.next-build` output.
- Existing backend account-settings tests: **3 passed**. Backend source/contracts unchanged.
- `git diff --check`: **passed**. Nothing staged or committed.
- No console errors captured. One existing catalogue-image LCP priority warning appeared in the tab log; no account warning was observed.
- Screenshots, route/active-state measurements, and functional observations: `tmp/account-localization-review/checks.json`.

Branch remains `reference-ui-transplant-homepage`, HEAD remains the approved Auth checkpoint `563c26384393ee8b3726e4a8ca85e4ab30fded35`. All account design and localization changes are uncommitted. Generated `next-env.d.ts`/`tsconfig.json` remain status-marked without content diffs. Local review remains running on port 3002. No push/deploy, App-page, admin, Flutter, or English/Pashto redesign work.

---

Date: 2026-09-20. Status: implemented locally, awaiting visual approval; this phase is not committed.

Approved authentication checkpoint: `563c26384393ee8b3726e4a8ca85e4ab30fded35` — `Approve responsive reference-locked authentication pages`. That commit contains AuthForm.tsx, AuthForm.module.css, the required AppChrome change, and AUTH_DESIGN_REVIEW.md only. No push or deployment.

## Actual routes and existing ownership

| Route | Existing implementation / application of shared design |
| --- | --- |
| `/account` | Account overview, existing AccountShell |
| `/account/profile` | ProfileEditor, existing AccountShell |
| `/account/addresses` | AddressBook, existing AccountShell |
| `/account/addresses/new` | AddressEditor, existing AccountShell |
| `/account/addresses/[id]/edit` | AddressEditor, existing AccountShell |
| `/account/orders` | Reuses `/orders` implementation and AccountShell |
| `/account/orders/[id]` | Reuses `/orders/[id]`; loading/error states now also use the Dari shell |
| `/account/prescriptions` | Reuses `/prescriptions`; upload and history remain on the same page |
| `/account/prescriptions/[id]` | Existing PrescriptionDetail and AccountShell |
| `/account/notifications` | Reuses `/notifications` and AccountShell |
| `/orders`, `/orders/[id]`, `/notifications` | Existing alternate routes; same shared shell and active destination mapping |
| `/prescriptions`, `/prescriptions/upload` | Existing upload/history aliases; same shared shell |
| `/prescriptions/success/[id]` | Existing generic submission confirmation now wrapped in the Dari shell; contains no prescription content |

`/account/layout.tsx` retains its existing authentication guard and return-path behavior. Alternate routes retain their existing component checks. The generic prescription confirmation was already outside the account guard; this change does not grant access to private records or files. `/orders/success/[id]` also exists as a separate order confirmation; its page implementation was not redesigned or exercised by creating an order.

## Shared design and intentional files

The approved storefront header, footer, and mobile navigation now apply to Dari customer-account routes. One reusable AccountShell gives all sections a compact right-side desktop navigation, with a three-column, two-row top navigation below 900px. Content takes the full mobile width. Cards, form controls, status labels, empty states, file selection, errors, and actions share restrained green accents and small corners. No global stylesheet or public-page design was changed.

| File | Change |
| --- | --- |
| `website/components/AccountShell.tsx` | Dari-scoped module class and active-link mapping for existing alternate routes |
| `website/components/AccountShell.module.css` | New shared responsive account presentation |
| `website/components/AppChrome.tsx` | Extends existing Dari storefront chrome to account-related routes |
| `website/components/ProfileEditor.tsx` | Correct Dari language code on existing save request; distinguish errors from success |
| `website/app/orders/[id]/page.tsx` | Consistent Dari shell for loading and unavailable states |
| `website/app/prescriptions/page.tsx` | Upload/history jump links and link to the existing private detail route |
| `website/app/prescriptions/success/[id]/page.tsx` | Shared Dari shell around existing confirmation |
| `docs/ACCOUNT_DESIGN_REVIEW.md` | This review and verification record |

One existing functional defect was discovered during real profile testing: the client sent `preferred_language: fa-AF`, while the backend accepts `fa` for Dari. The existing PATCH request now maps that locale to `fa`; the backend contract and validation remain unchanged. This was necessary for a successful save. Profile failures now use an alert/error style instead of the previous green success style. Some existing backend error text is English; it remains readable and was not relocalized in this phase.

## Functional verification

| Area | Observed result and limits |
| --- | --- |
| Protected routing | Guest `/account/profile` redirected to `/login?returnTo=%2Faccount%2Fprofile`. Safe local login returned to `/account/profile`. After logout, `/account/addresses` again redirected with its return path. |
| Navigation and logout | Existing account destinations, prescription detail, and notification target worked. Final demo session is signed out. |
| Profile | Loaded real demo fields; edited name, saved successfully, reloaded and verified persistence. Empty required first name invoked native validation. Invalid phone displayed the existing API validation error. Original profile values restored and verified after reload. Email remains read-only. |
| Addresses | Created one disposable non-default local address, edited/reopened it, then deleted only that test record. Original address and default designation preserved. Delete confirmation completed despite a browser-control timeout; a subsequent browser reload and read-only API lookup confirmed removal. |
| GPS | Existing explanatory dialog and Cancel action tested. Browser location permission was not granted; actual coordinate acquisition was not exercised. No permission logic or location data changed. |
| Orders | Real empty history and shop action checked. Safe unavailable-detail state checked. Demo account has no orders: populated order content, timelines, and fulfillment actions were not live-tested. No order was created. |
| Prescription selection | Missing-file and unsupported-type errors checked. Harmless local PNG selected through the actual file chooser; preview, remove, and reselect worked. Existing JPG/PNG/PDF and 10 MB validation retained. PDF upload and physical mobile camera/gallery capture were not exercised. |
| Prescription submission | Submitted a copy of the Darmalton logo explicitly labelled as a local UI test, not medical material. Actual success route, private detail route, submitted timestamp/status, and populated history appeared. The test request was then cancelled through its existing action. |
| Prescription privacy | No real private prescription uploaded; preview remains in the existing account workflow. File links retain the existing authenticated backend endpoint. No backend media/privacy settings changed. |
| Notifications | Test upload/cancellation produced notifications. Opening one reached its private prescription detail and marked it read. Mark-all-read completed for the two test notifications. |
| Guest cart | Original one-item guest cart was preserved for the test and restored afterward. Final displayed item/quantity/price matched the starting cart. No checkout submission. |

The cancelled local test prescription and its two read notifications remain as historical records. Test address removed; original profile/address/default preserved. No meaningful user data was deleted. The approved-bundle and clarification branches retain their existing handlers but were not exercised with pharmacist decisions.

## Responsive and visual checks

48 recorded layout checks: account overview, profile, addresses, new-address form, empty orders, prescription upload, populated prescription history, and notifications at each of 1440, 1024, 768, 412, 390, and 320 pixels. All recorded RTL, zero page horizontal overflow, and no clipped measured controls/navigation. Screenshots were captured for every combination. Additional prescription detail screenshots cover 1440, 390, and 320.

At 320 x 700, keyboard focus brought the 44px upload submit button above the fixed bottom navigation (button bottom about 372px; navigation top 642px). Existing page scrolling remains available. No new broken-image issue was observed. Captured final browser warning/error log is empty; intentionally tested API validation and unavailable-record responses are documented above.

All screenshot and JSON evidence is local and ignored under `tmp/account-review/`; it is not part of the commit scope. Profile/address screenshots contain documented local demo data only. Login captures were cleared of autofilled credentials before saving final evidence.

| Required screen | Desktop | Mobile |
| --- | --- | --- |
| Account overview | [1440](../tmp/account-review/account-1440.png) | [390](../tmp/account-review/account-390.png) |
| Profile | [1440](../tmp/account-review/profile-1440.png) | [390](../tmp/account-review/profile-390.png) |
| Addresses | [1440](../tmp/account-review/addresses-1440.png) | [390](../tmp/account-review/addresses-390.png) |
| Orders | [1440](../tmp/account-review/orders-1440.png) | [390](../tmp/account-review/orders-390.png) |
| Prescription upload | [1440](../tmp/account-review/prescription-upload-1440.png) | [390](../tmp/account-review/prescription-upload-390.png) |
| Prescription history | [1440](../tmp/account-review/prescription-history-1440.png) | [390](../tmp/account-review/prescription-history-390.png) |

Narrow examples: [account at 320](../tmp/account-review/account-320.png), [new address at 320](../tmp/account-review/address-new-320.png), [upload action at 320 x 700](../tmp/account-review/upload-action-320-short.png).

## Approved public-page regression checks

| Page/state | 1440 | 390 |
| --- | --- | --- |
| Homepage | Pass | Pass |
| Shop | Pass | Pass |
| Categories | Pass | Pass |
| Manufacturers | Pass | Pass |
| Product detail | Pass | Pass |
| Empty cart | Pass | Pass |
| Populated cart | Pass | Pass |
| Login | Pass | Pass |
| Register | Pass | Pass |

These are visual/rendering regressions, not a repeat of every business workflow on those routes. Eighteen captures and geometry observations showed RTL and zero page overflow. Filenames are `{homepage,shop,categories,manufacturers,product-detail,cart-empty,cart-populated,login,register}-{1440,390}-regression.png`. The homepage's intended horizontal product rail remains scrollable within the page.

## Engineering verification and handoff

- Frontend tests: 58 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed, 61/61 static pages generated; separate `.next-build` output used to preserve the running development server.
- Relevant existing backend account-settings tests: 3 passed via pytest. Django system check reported no issues. No backend source or migration changes.
- `git diff --check`: passed. No staged account changes.
- Full backend, Flutter, Compose, and integrated cross-client suites were not rerun for this scoped website phase.

Build-generated `next-env.d.ts` output-directory reference was restored to the prior `.next` value. `next-env.d.ts` and `tsconfig.json` may remain marked modified by Git metadata/line-ending handling, but have no content diff; neither is an intentional source change or staged. The remaining intentional work is six modified source files, one new CSS module, and this new report, all uncommitted.

Local review remains at http://127.0.0.1:3002/account (login required); API remains on the existing local service. No push, deployment, production changes, or work on App/admin/Flutter/other-locale designs. Stop here pending review.

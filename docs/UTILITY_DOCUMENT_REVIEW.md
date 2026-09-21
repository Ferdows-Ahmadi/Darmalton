# Dari utility/help/legal family review

Date: 2026-09-21. Branch: `reference-ui-transplant-homepage`.

Approved Checkout checkpoint: `e50e573479d1c5c817ee822849bd78d5c00c08e2` — `Approve responsive Dari checkout experience`. The checkpoint contains only the six approved checkout files. No push or deployment.

Utility work is complete for visual review and remains uncommitted.

## Routes and shared implementation

Harmonized `/about`, `/contact`, `/help`, `/faq`, `/privacy`, `/terms`, `/delivery-policy`, `/returns`, `/prescription-help`, `/forgot-password`, and `/reset-password` as one document family. `/checkout/login` was inspected and retains the already approved `auth-shell`; no further change was necessary.

One new `UtilityDocument.module.css` provides an 880px maximum readable document width, compact heading/intro/divider, restrained information panels, 44px minimum action links, native FAQ disclosures and logical RTL spacing. Mobile widths use compact page margins and readable stacked content. The old large card, gradient About panel, fixed section heights and recovery-specific excess spacing are overridden only within the opted-in Dari document root.

`StaticInfoPage` applies the style only for `fa-AF`. `InfoPage` and `CmsInfoPage` accept an optional `utility` flag, defaulting to false. Only the existing About, Contact, Privacy and Terms routes opt in for their published CMS override. Generic `/pages/[slug]` and health/article presentation remain unchanged. No shared chrome, AuthForm, checkout, account or global CSS was changed.

Exact intentional files:

- `website/components/UtilityDocument.module.css` (new)
- `website/components/StaticInfoPage.tsx`
- `website/components/InfoPage.tsx`
- `website/components/CmsInfoPage.tsx`
- `website/app/about/page.tsx`
- `website/app/contact/page.tsx`
- `website/app/privacy/page.tsx`
- `website/app/terms/page.tsx`
- `website/test/locale.test.mjs`
- `docs/UTILITY_DOCUMENT_REVIEW.md` (new)

## Content, functionality and localization

`static-pages.ts` is unchanged: every existing title, introduction, paragraph, question, answer, service rule and policy statement is preserved. No contact details, recovery behavior, claims, FAQs, fees or service guarantees were invented. Published CMS selection and data fallback behavior are unchanged; no backend content was translated or fabricated. Local views used the existing static fallbacks; populated CMS overrides were source-reviewed, not demonstrated with fabricated content.

Help retains its two steps. The Dari counters now use the existing `formatNumber` helper and display `۱` / `۲` instead of `01` / `02`; other locales retain their existing presentation. One focused formatter test was added.

FAQ retains native `details`/`summary`, its existing initial first-open state and both original questions/answers. Keyboard QA verified Enter closes the first disclosure and Space opens the second. The delivered mobile screenshot shows the second answer expanded.

Prescription Help retains `/prescriptions/upload`; Forgot/Reset retain `/contact`. Contact continues to say contact information is not configured, and recovery continues to say the local recovery flow is unavailable. No submission, email or reset flow was added.

No English UI sentence, raw backend error or English accessibility label was found in the settled utility document bodies. Legitimate `PDF` remains unchanged. The pre-existing shared loading skeleton still exposes an English `Loading` accessibility label during route loading. This is explicitly deferred because shared loading/error/not-found states are excluded from this phase; this report does not claim it is corrected.

## Responsive and interaction QA

About, Contact, Help, FAQ, Privacy, Prescription Help and Forgot Password were each inspected at 1440, 768, 390 and 320 CSS pixels (28 route/width checks). Every check had RTL and zero positive horizontal overflow. Desktop documents measured 880px wide; tablet documents measured 720px. Content sections have no forced minimum height; all action links measured at least 44px. Terms, Delivery Policy, Returns and Reset Password also rendered successfully at 320px with no horizontal overflow.

At 320px, the Help page's final scroll position placed the footer bottom at approximately 840px and fixed navigation top at 842px in a 900px viewport; content and footer remained reachable above navigation. Temporary viewport overrides were reset afterward.

Browser captures may include the local Next.js development indicator, and raster size may differ from CSS viewport dimensions due to scrollbar/capture scaling.

## Required screenshots

| Page | Evidence |
| --- | --- |
| About 1440 / 390 | [Desktop](../tmp/utility-review/about-1440.png), [Mobile](../tmp/utility-review/about-390.png) |
| Contact 390 | [Contact](../tmp/utility-review/contact-390.png) |
| Help 1440 | [Help](../tmp/utility-review/help-1440.png) |
| FAQ 390, expanded answer | [FAQ](../tmp/utility-review/faq-390.png) |
| Privacy 1440 | [Privacy](../tmp/utility-review/privacy-1440.png) |
| Prescription Help 390 | [Prescription Help](../tmp/utility-review/prescription-help-390.png) |
| Forgot Password 390 | [Recovery unavailable](../tmp/utility-review/forgot-password-390.png) |
| Tablet representative | [Privacy 768](../tmp/utility-review/privacy-768.png) |
| Narrow mobile representative | [Help 320](../tmp/utility-review/help-320.png), [Footer clearance](../tmp/utility-review/help-320-footer.png) |

Additional captures for the full seven-page/four-width matrix and the other four routes are in ignored `tmp/utility-review/`.

## Regression and safety

- [Homepage 1440](../tmp/utility-review/home-1440-regression.png): approved layout intact, RTL, zero horizontal overflow, no broken images and no console errors in the final check.
- [Login 390](../tmp/utility-review/login-390-regression.png): approved form and chrome intact, blank inputs, no overflow.
- [Checkout 390](../tmp/utility-review/checkout-390-regression.png): existing authenticated checkout opened, blank new-address form captured without saving or ordering; no overflow.
- [Account address form 390](../tmp/utility-review/account-address-390-regression.png): existing account navigation and blank form intact; no overflow.
- Checkout Login 390: approved auth shell and return-path note intact; no overflow. No further wrapper edits.

QA used the existing local demo account on the separate localhost origin after verifying that origin's guest cart was empty, avoiding changes to the user's 127.0.0.1 guest cart. No accounts, addresses, orders, prescriptions or CMS records were created. Screenshots contain no credentials or saved personal address details. The temporary account was signed out, verified by the account route returning to Login, and the original localhost locale was restored. The interruption stopped local servers; they were restarted and left running on 3002/8000.

## Engineering checks

- Frontend tests: **77 passed, 0 failed**, including the added localized-counter test (`tmp/utility-review/frontend-tests.log`).
- TypeScript: passed.
- ESLint: passed.
- Production build: passed; **61/61** static pages generated (`tmp/utility-review/build.log`). Build used `.next-build` to avoid interfering with the local dev server. The generated route-type reference was restored afterward.
- `git diff --check`: passed.

No backend, API contract, migration or Flutter code changed; backend/Flutter suites were not rerun for this scoped presentation work.

## Git status and stop boundary

Eight tracked utility source/test files are modified; the new CSS module and this report are untracked. Nothing is staged. All utility work remains uncommitted pending visual approval.

Pre-existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` are preserved. `website/next-env.d.ts` and `website/tsconfig.json` remain status-marked with no textual diff and are excluded from the intentional change set.

No further Checkout visual edits, health/CMS-family work, shared state redesign, English/Pashto phase, push or deployment. Stop here for approval. Local review: `http://127.0.0.1:3002/about`.

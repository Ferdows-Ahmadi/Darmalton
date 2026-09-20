# Shared Dari customer chrome correction

Review date: 2026-09-21. Local review: http://127.0.0.1:3002/.
Base: `c2a3617` on `reference-ui-transplant-homepage`. This patch is uncommitted.

## Scope and causes corrected

- The literal approved-route allowlist omitted customer detail, checkout, utility and CMS routes. The shared shell now covers the Dari customer tree, excluding the `/staff`, `/admin` and `/api` namespaces using segment boundaries. Existing page bodies and destinations are unchanged. Customer not-found pages also receive the shared shell.
- Old dark-footer `brightness(0) invert(1)` filters hid/recolored the legitimate service icons and logo on the light footer. Scoped overrides restore all five original images with `filter: none` and full opacity. Light-footer copy and borders now use appropriate muted dark colors.
- Mobile service-card padding, the stacked brand block and two-column navigation made the footer excessively tall. Compact service rows, an inline brand block and four link columns retain all 13 destinations and 44px minimum link heights. At 320px the narrowest link is approximately 65px wide; wrapped links remain readable.
- The viewport-height shell's growing main element created unused space before short-page footers. An explicit Dari `contentFlow` modifier keeps the viewport-height shell but gives its main element intrinsic height. Spare viewport space follows the footer. Long pages remain in normal flow, and existing page padding remains intact. The global `main { flex: 1 }` rule is untouched.
- Exact-match desktop highlighting and broad mobile prefixes missed children and aliases. Explicit, segment-aware section maps now select parent links. The mobile drawer receives the same desktop mapping and `aria-current="page"`.

English/Pashto styles and active-state behavior are unchanged. No page-body, asset, backend, data contract, Flutter or production changes were made.

## Files changed by this patch

- `website/components/AppChrome.tsx`: shared coverage, content-flow modifier and mobile section selection.
- `website/components/Header.tsx`: parent selection and Dari drawer active semantics.
- `website/components/home/MarketplaceChrome.module.css`: light-footer corrections, compact mobile treatment and shared short-page policy.
- `website/lib/customer-navigation.ts`: new route-to-section helpers.
- `website/test/customer-navigation.test.mjs`: four route-mapping/coverage tests.
- `docs/SHARED_CHROME_REVIEW.md`: this review record.

## Active navigation mapping

| Route family | Desktop header / drawer | Mobile bottom bar |
| --- | --- | --- |
| `/` | Home | Home |
| `/shop`, `/medicines/*` | Shop | Shop |
| `/categories/*` including index | Categories | Shop |
| `/manufacturers/*` including index | Manufacturers | Shop |
| `/cart`, `/checkout/*` | No unrelated primary section | Cart |
| `/account/*`, `/orders/*`, `/notifications` | No unrelated primary section | Account |
| `/account/prescriptions/*` | No unrelated primary section | Account |
| `/prescriptions/*` including index/upload/success | Rx | Rx |
| `/health/*`, `/health-articles/*` | Health when the existing link is available | No unrelated section |
| `/app/*` | App | No unrelated section |
| Other utility/customer pages | No unrelated section | No unrelated section |

All link destination URLs are preserved. Query-based Shop/search views use the same `/shop` pathname. Lookalikes such as `/shopper`, `/orders-help` and `/accounting` do not activate unrelated links. Internal namespaces receive no customer section.

## Measurements

Measured from live DOM rectangles at a 1000 CSS-pixel viewport height. Footer height excludes bottom-navigation clearance. Content-to-footer gap is footer top minus the bottom of main's last content element; it includes retained outer spacing, not padding inside that element.

| Measurement | Before | After |
| --- | ---: | ---: |
| Footer height at 390px | 608.94px | 357.85px |
| Manufacturers content-to-footer gap at 1440px | 176.80px | 32.00px |
| Login content-to-footer gap at 1440px | 27.40px | 0.00px |

The mobile footer is 251.09px shorter (41.23%). Desktop footer height remains 245.75px; tablet footer height is 408.94px. Account retains 32px outer spacing on desktop/tablet and 24px on mobile.

At the document end on 390px and 320px, the footer bottom was approximately 940px and the fixed navigation top 942px: no overlap. The existing `60px + env(safe-area-inset-bottom)` clearance remains. The browser reports a zero safe-area inset; a physical notched device was not tested.

## Browser regression verification

All checks used the local Dari RTL site. No horizontal page overflow was measured.

| Routes | Widths checked |
| --- | --- |
| Homepage, Shop, Manufacturers, Login, authenticated Account, About | 1440, 1024, 768, 390, 320 |
| Categories, representative medicine detail, Cart, Register, App | 1440, 390 |
| Category detail, manufacturer detail, Checkout, FAQ | 1440, 390 |

Header/search fit and retained composition, footer/link layout, RTL, image visibility and parent highlighting were inspected. All five original footer images were verified loaded and unfiltered when brought into view; initial offscreen lazy images on long pages were checked again after scrolling. Category detail drawer highlighting was verified at 390px. Live alias checks confirmed Orders/Notifications map to Account, standalone prescription routes map to Rx, and account prescription history maps to Account.

The existing local demo account was used read-only in an isolated localhost tab, then signed out; the previous locale was restored and that tab closed. Checkout screenshots show an unsaved blank address form. No orders, addresses or accounts were created. The original 127.0.0.1 guest cart row was confirmed unchanged. Login/Register screenshots contain empty fields. No console errors were captured in the final review tab.

Legacy detail, checkout and utility body layouts remain as audited. Their separate redesign and existing non-chrome issues remain outside this patch. This is shared presentation regression coverage, not a new end-to-end commerce certification.

## Engineering checks

- Frontend tests: **65/65 passed**, including four new route coverage/mapping tests.
- TypeScript: **passed** (`npm run typecheck`).
- ESLint: **passed** (`npm run lint`).
- Production build: **passed** (`NEXT_DIST_DIR=.next-build npm run build`); isolated output keeps the review server available. Generated route-type reference restored to `.next/types/routes.d.ts` afterward.
- `git diff --check`: **passed**.
- Backend behavior was not changed; backend tests were not rerun for this presentation-only patch.

## Screenshots and machine-readable evidence

Screenshots are actual browser captures at the named CSS viewport widths and 1000px height. The browser capture surface can scale raster dimensions or include its scrollbar; the viewport dimensions were independently recorded from `innerWidth`. Files are local review artifacts under ignored `tmp/chrome-review`, not staged repository assets.

Required evidence:

- [Homepage 1440](../tmp/chrome-review/home-1440.png)
- [Manufacturers 1440](../tmp/chrome-review/manufacturers-1440.png)
- [Login 1440](../tmp/chrome-review/login-1440.png)
- [Manufacturers 390](../tmp/chrome-review/manufacturers-390.png)
- [Login 390](../tmp/chrome-review/login-390.png)
- [Category detail 1440, Categories parent active](../tmp/chrome-review/category-detail-1440.png)
- [Lower mobile footer 390](../tmp/chrome-review/footer-390.png)

Additional evidence: [drawer 390](../tmp/chrome-review/drawer-category-390.png), [footer 320](../tmp/chrome-review/footer-320.png), [homepage 768](../tmp/chrome-review/home-768.png), [account 390](../tmp/chrome-review/account-390.png), [checkout 390](../tmp/chrome-review/checkout-390.png), [register 390](../tmp/chrome-review/register-390.png).

Measurements and route observations: [before.json](../tmp/chrome-review/before.json), [after.json](../tmp/chrome-review/after.json). Build output: [build.log](../tmp/chrome-review/build.log).

## Git state and stopping point

HEAD remains `c2a3617`; nothing is staged or committed. The five code/test files and this report are the intentional patch. Pre-existing untracked `DARI_CUSTOMER_SITE_AUDIT.md` and `DARI_CUSTOMER_SITE_AUDIT - Copy.md` are preserved. `website/next-env.d.ts` and `website/tsconfig.json` remain status-marked from the starting tree but have no textual diff.

Stopped for shared chrome visual approval. No next-page redesign, additional locale work, push or deployment was performed. Local services remain running.

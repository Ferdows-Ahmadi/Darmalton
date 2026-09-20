# Dari cart visual review

Date: 2026-09-20. Status: approved by the user; checkpoint authorized before login/register work.

## Approved product-detail checkpoint

`db221ad7d165831eada6c9cf471be0c77acdb325`
— `Approve responsive reference-locked product detail`.

The checkpoint includes the approved product-detail page, component, scoped CSS,
required AppChrome condition, and review report. Generated/no-content changes
were excluded. Nothing was pushed or deployed.

## Route and files

The actual customer cart route is `/cart`, implemented by the existing client
page at `website/app/cart/page.tsx`. Only its Dari (`fa-AF`) presentation changed.

- `website/app/cart/page.tsx`: Dari breadcrumb, compact empty-state icon, existing recommendation cards in marketplace presentation, exact-SKU image/title links, pack size, Rx badge, unit price, and line-total label.
- `website/app/cart/cart.module.css`: scoped desktop list/summary composition, tablet layout, mobile item layout, and compact empty state.
- `website/components/AppChrome.tsx`: adds only the exact `/cart` route to the approved Dari chrome condition.
- `docs/CART_DESIGN_REVIEW.md`: this report.

The desktop list uses bounded product media, quiet metadata, 44px quantity
buttons, and a compact summary. Mobile uses separate product, quantity, and
total/removal rows. The summary remains reachable by normal scrolling above the
approved mobile bottom navigation. No new sticky checkout bar was added.

The empty state reuses an existing cart asset and the existing recommendation
request and family grouping; no recommendation mechanism or product data was
invented. Product images still use MedicineMedia and its legitimate fallback.
No shipping fees, discounts, taxes, or delivery estimates were added.

## Preserved functionality

The existing cart loading, authentication branch, API calls, guest fallback,
quantity updates, removal, error handling, persistence, synchronization, and
checkout destinations are unchanged. Prices, line totals, and subtotal use the
existing cart values. The selected medicine ID remains the SKU identity.
Quantity decrease remains disabled at one; removal uses the existing remove
action. Increase remains constrained by available quantity. Rx status comes
from `prescription_required`; backend prescription authorization is unchanged.

No backend, database, authentication, prescription, checkout, admin, or Flutter
source was changed. English/Pashto presentation paths were retained.

## Browser states and interactions

Real local products were added through the existing product-detail UI:

| State | Result |
| --- | --- |
| Empty guest cart | Compact message, continue-shopping action, existing recommendations |
| Single ordinary item | Amlo 10mg, MED0059, one unit at 100 AFN |
| Quantity greater than one | Amlo increased to two; line total 200 AFN |
| Multiple items | Amlo x2, Mercip 500mg x1, Amclav Plus 457mg/5ml x1; subtotal 470 AFN |
| Real product image | Verified on populated rows |
| Legitimate fallback image | Verified on Mercip 500mg, MED0011 |
| Guest Rx action | Existing sign-in destination reached; cart stayed empty |

Verified increase and decrease, disabled decrease at one, remove, reload
persistence, exact Amlo 10mg product link, and continue shopping to `/shop`.
Guest checkout reached `/login?returnTo=%2Fcheckout`.

Mercip's available-quantity limit was exercised through the UI: quantity 23,
increase disabled, line total 2,990 AFN, and combined subtotal 3,330 AFN.

The original guest cart was restored after testing: one Amclav Plus item at
quantity one and 140 AFN. Visible original/restored item, link, and quantity
matched. No order was submitted.

### Verification limits

A legitimate approved-Rx/mixed populated cart was not exercised. The existing
workflow supports approved prescription authorizations, but the local database
had zero approved prescriptions. An old Rx cart row was not used to bypass the
current authorization workflow. No database or business rules were altered to
create a screenshot.

Authenticated cart operations and login synchronization were not exercised in
the browser's guest session. Their implementation is unchanged; this report
does not claim a new authenticated integration test.

## Responsive and regression checks

Empty and representative three-row populated carts were checked at 1440, 1024,
768, 412, 390, and 320px. All twelve combinations had RTL direction, zero
horizontal page overflow, no broken images, and no clipped checked headings,
buttons, prices, or totals. Quantity buttons measured 44 x 44px. At 320px, the
scrolled checkout action was visibly above the fixed bottom navigation and was
successfully clicked.

| Previously approved page | 1440px | 390px |
| --- | --- | --- |
| Homepage `/` | Passed | Passed |
| `/shop` | Passed | Passed |
| `/categories` | Passed | Passed |
| `/manufacturers` | Passed | Passed |
| `/medicines/0a87485f-0ccd-471c-bc4e-1f268ac4f794` | Passed | Passed |

All ten regression views were visually reviewed, remained RTL, and had zero
horizontal overflow. No shared chrome stylesheet changed. The browser returned
zero captured console errors in the final check.

## Engineering checks

- Frontend tests: 58 passed.
- TypeScript: passed.
- ESLint: passed.
- Isolated production build (`.next-build`): passed, 61/61 pages generated.
- `git diff --check`: passed.

## Local artifacts and handoff

Review URL: `http://127.0.0.1:3002/cart`. Local website/API were left running.
Screenshots and verification evidence are under ignored `tmp/cart-review/`:

- `populated-1440.png`, `populated-1024.png`, `populated-768.png`, `populated-412.png`, `populated-390.png`, `populated-320.png`
- `populated-320-summary.png`: scrolled mobile summary and checkout
- `empty-1440.png`, `empty-1024.png`, `empty-768.png`, `empty-412.png`, `empty-390.png`, `empty-320.png`
- `single-320.png`
- `homepage`, `shop`, `categories`, `manufacturers`, and `product-detail` screenshots with `-1440-regression.png` and `-390-regression.png` suffixes
- `width-checks.json`, `functional-checks.json`, `regressions.json`, `console-errors.json`, `original-cart.json`, and `build.log`

Cart work was approved for a scoped checkpoint before login/register work. Git also reports
`website/next-env.d.ts` and `website/tsconfig.json` as modified, but they have no
content diff and are not intentional changes. No push, deployment, production
change, or work on the next route was performed.

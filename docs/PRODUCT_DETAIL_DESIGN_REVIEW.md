# Dari product-detail visual review

Date: 2026-09-20. Status: approved by the user; checkpoint authorized before cart work.

## Approved manufacturers checkpoint

`af59aad77cf61616d5b09f52b958786bdd4eba1e`
— `Approve responsive reference-locked manufacturers page`.

The checkpoint contains the manufacturers page, scoped CSS, required AppChrome
condition, and its review report. Generated/no-content changes were excluded.
Nothing was pushed or deployed.

## Canonical route and scope

The existing customer product-detail route is `/medicines/[id]`, where `id` is
the exact medicine UUID. Storefront family cards and search results link to this
route. There is no separate family-detail page: the route loads the medicine,
then fetches variants by its existing `family_code`. Choosing a strength links to
the corresponding `/medicines/{variant.id}`. Both requests and their fallback
behavior are unchanged.

Only the Dari (`fa-AF`) presentation is redesigned. The English and Pashto render
path is retained. No backend, cart, authentication, prescription, admin, or Flutter
source changed.

## Files changed

- `website/app/medicines/[id]/page.tsx`: imports and selects the Dari presentation after the existing data loading and locale handling.
- `website/components/ProductDetail.tsx`: server-rendered product presentation using the existing medicine and variants, localization helpers, MedicineMedia, and AddToCart.
- `website/components/ProductDetail.module.css`: scoped compact product layout and responsive styles.
- `website/components/AppChrome.tsx`: includes exact single-ID medicine routes in the approved Dari chrome condition; no shared chrome CSS changes.
- `docs/PRODUCT_DETAIL_DESIGN_REVIEW.md`: this report.

## Design and behavior

Compact breadcrumb leads directly to image and purchase information. Desktop and
tablet use two columns; mobile stacks a 200px image area above title, manufacturer,
price, stock, strength controls, prescription status, and the action. Images use
contain sizing and a bounded area. Attributes and supplied description follow in
compact rows. Small green selection borders and pale surfaces match the approved
storefront.

The existing selected-SKU price is shown; family price ranges on listing cards
remain unchanged. No discounts, medical content, or product assets were invented.
The same real SKU image and legitimate fallback component are used. Existing
detail media was a single primary image, which is preserved.

AddToCart is unchanged: one unit per click, selected medicine ID, existing API and
guest fallback, disabled state from `!medicine.in_stock`, and the same Rx route.
Quantity editing remains in the cart. Prescription state comes directly from the
API, including the existing stock gate on the action.

No related-product data/section existed in the detail page, so none was added.
No sticky purchase bar was added: the compact in-flow action remains reachable
without covering the existing bottom navigation or duplicating Rx/action state.
Global footer density is unchanged.

## Representative existing states

The public API returned 54 medicines, including 15 Rx-required records and two
legitimate fallback images. All 54 were in stock; no out-of-stock database state
was available. No catalogue data was modified to manufacture a test state.

| Record | Exact ID | State verified |
| --- | --- | --- |
| MED-0001, Panadol 500mg | `2a5deb7b-acbf-461d-8551-c5a098ead713` | Single variant, real image, non-Rx, 120 AFN, stock 79 |
| MED-0058, Amlo 5mg | `0a87485f-0ccd-471c-bc4e-1f268ac4f794` | Real image, non-Rx, two strengths, 60 AFN, stock 60 |
| MED-0059, Amlo 10mg | `9a8e99ad-4499-4743-a9e5-a0787eaab993` | Clicked variant; image/strength/price/stock changed to 100 AFN, stock 70 |
| MED-0019, Leflox 500mg | `51140718-e01f-49ca-805b-80b5e08e3478` | Real image, Rx, three strengths, 150 AFN, stock 5 |
| MED-0020, Leflox 250mg | `13f8c510-a474-44bf-8597-696c08c63935` | Clicked variant; image/pack/price/stock updated to 100 AFN, stock 7; Rx retained |
| MED-0011, Mercip 500mg | `405c30d6-c733-4051-8281-311088d0ca29` | Legitimate fallback SVG, three strengths, 130 AFN, stock 23 |

Amlo 10mg was added through its product action: the guest cart showed the exact
10mg SKU and 100 AFN unit price. Increasing quantity to two displayed 200 AFN.
Only that newly added test row was removed afterward; the pre-existing cart was
restored exactly according to its visible content.

The Rx action was clicked after selecting Leflox 250mg. It uses the unchanged
`/prescriptions/upload?medicineId=...` action; the existing unauthenticated
prescription page forwards to `/login?returnTo=%2Faccount%2Fprescriptions`.
The sign-in gate was verified. Authenticated upload/approval and authenticated
cart operations were not exercised; their implementation was not changed.

## Verification

Panadol, Amlo 5mg, Leflox 500mg, and fallback Mercip 500mg were each checked at
1440, 1024, 768, 412, 390, and 320px: 24 page/width combinations. All had Dari RTL,
zero horizontal page overflow, no clipped product labels/actions, and loaded
product media. Selected strengths use `aria-current`, full variant links, and
focus outlines. Mobile variant controls and primary actions exceed 44px height.
No browser console errors were recorded during this review.

Homepage, shop, categories, and manufacturers were captured and visually reviewed
at 1440 and 390px. No visual regression or horizontal overflow was found. Header
heights remained 82.8px at desktop and 103.8px on mobile.

- Frontend tests: 58/58 passed.
- TypeScript: passed after correcting a control-flow narrowing issue in the new Dari branch.
- ESLint: passed.
- Production build: passed, including 61/61 static pages, isolated `.next-build` output.
- `git diff --check`: passed.

Frontend scope only; backend and Flutter suites were not rerun. Review used the
local Django workstation fallback and Next development server. No production
environment or data was touched.

## Artifacts and handoff

Local review: <http://127.0.0.1:3002/medicines/0a87485f-0ccd-471c-bc4e-1f268ac4f794>.

Ignored artifacts in `tmp/product-detail-review/`:

- `amlo-{1440,1024,768,412,390,320}.png`: representative multi-variant product.
- `rx-{1440,1024,768,412,390,320}.png`: Rx-required multi-variant product.
- `fallback-{1440,1024,768,412,390,320}.png` and `panadol-{1440,1024,768,412,390,320}.png`.
- `{homepage,shop,categories,manufacturers}-{1440,390}-regression.png`.
- `width-checks.json`, `functional-checks.json`, `regressions.json`, API snapshot, and `build.log`.

The user approved this product-detail implementation and authorized its checkpoint. The generated
`website/next-env.d.ts` build reference was returned to the dev output path;
it and `website/tsconfig.json` appear modified in status but have no content diff.
No push or deployment was performed. Cart is the next separately reviewed scope.

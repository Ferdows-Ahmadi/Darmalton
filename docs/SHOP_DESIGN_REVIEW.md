# Dari shop design review

Date: 2026-09-20. Branch: `reference-ui-transplant-homepage`.

The approved responsive homepage was committed as
`225d1b30e537cd88930f25e00557f48eef0c0380` —
`Approve responsive reference-locked Dari homepage`.
The shop work below was reviewed and approved by the user across desktop, tablet and mobile on 2026-09-20. It is included in the approved shop checkpoint. Nothing was pushed or deployed.

## Scope and implementation

Only the Dari `/shop` presentation adopts the approved homepage design:

- Compact breadcrumb/title, with the former banner size, decoration and shadow removed.
- Existing marketplace medicine cards, including real imagery, prices, stock, Rx badges, variant links and purchase controls.
- Six desktop columns, four at 1024px, three at 768px, and two on mobile.
- Compact desktop/tablet filters; the existing expandable filter mechanism on mobile, with an accessible toggle and 44px input/action heights.
- Compact sorting, result count and pagination; harmonized empty/error and route loading presentation.
- The same approved header/footer adapter is enabled for `/shop`. Its CSS and homepage components are unchanged.

Files changed:

| File | Purpose |
| --- | --- |
| `website/app/shop/page.tsx` | Opt this route into marketplace cards; existing API query and error handling retained. |
| `website/app/shop/layout.tsx` | Apply the shop CSS only for the Dari locale. |
| `website/app/shop/shop.module.css` | Responsive shop presentation and scoped state styles. |
| `website/app/shop/loading.tsx` | Reuse the existing loading component within the scoped shop layout. |
| `website/components/Catalogue.tsx` | Optional card presentation, accessible filter toggle, and preservation of manufacturer/Rx/sort query context in the shop filter form. |
| `website/components/AppChrome.tsx` | Extend the existing Dari chrome condition from `/` to `/` and `/shop`. |
| `docs/SHOP_DESIGN_REVIEW.md` | This review record. |

Category/manufacturer detail routes retain their original card presentation. Other locales retain their existing visual presentation. No backend, database, price, inventory, authentication, checkout or cart business logic was changed.

## Functional verification

Browser checks against the local development API and website:

- Price sorting changed the URL to `ordering=price`, returned ascending prices, and preserved sorting when moving to page 2.
- Page 2 returned a different first product and supplied previous/next links with the correct page and sort parameters.
- Mobile search for Panadol with in-stock and 100–150 price filters returned one family priced at 120 AFN; `ordering=price` survived form submission and pagination reset.
- Antibiotic category filtering returned the corresponding catalogue results.
- An unmatched search rendered the localized empty state; clearing filters returned to `/shop`.
- AGP manufacturer plus `prescription_required=true` returned three Rx cards. Submitting the in-stock filter retained manufacturer, prescription and sort parameters.
- Panadol's image link opened the corresponding medicine detail route and title.
- An Rx card action followed the existing protected prescription flow to the login screen for an anonymous customer.
- Variant and add-to-cart controls reuse the unchanged `MedicineCard`/`AddToCart` implementation. No order was placed; an authenticated cart mutation was not exercised in this visual pass.

## Responsive verification

All widths were checked at a 1000px viewport height. The local browser reserves 15px for its vertical scrollbar.

| Viewport | Grid columns | Card height | Filters | Horizontal overflow / clipped controls |
| --- | --- | --- | --- | --- |
| 1440px | 6 | 232px | Panel | None |
| 1024px | 4 | 250px | Panel | None |
| 768px | 3 | 250px | Panel | None |
| 412px | 2 | 250px | Collapsed toggle | None |
| 390px | 2 | 250px | Collapsed toggle | None |
| 320px | 2 | 250px | Collapsed toggle | None |

RTL was confirmed at every width. The expanded 320px filter panel fits within the page; inputs, select and submit action are 44px high. All 12 first-page product images loaded after scrolling, including the intentional neutral Mercip fallback. No browser console errors were observed. One development-only Next image-priority/LCP warning was logged for the existing fallback asset during navigation.

Evidence under ignored `tmp/shop-review/`:

- `shop-1440.png`, `shop-768.png`, `shop-390.png`, `shop-320.png`: requested viewport screenshots.
- `shop-1024.png`, `shop-412.png`: additional breakpoint screenshots.
- `shop-320-filters.png`: expanded narrow filter panel.
- `width-checks.json`: DOM measurements and image/control checks.
- `homepage-1440-regression.png`, `homepage-390-regression.png`, `homepage-390-footer-regression.png`: homepage regression screenshots.
- `build.log`: successful production build output.

## Homepage regression

Compared current 1440px and 390px homepage screenshots with the approved responsive captures. The header, hero, category shortcuts, merchandising bands and mobile navigation retain their approved appearance. Mobile footer was also checked. Desktop header height remains 82.8px and page height 2878px; the 390px header remains 103.8px. No page overflow was found. Screenshot viewport heights differ for the historical mobile capture, so comparison was visual rather than a full-image pixel identity claim.

No homepage source or shared marketplace CSS was edited in this pass.

## Frontend checks and working tree

- `npm test`: 58/58 passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, generating 61/61 static pages and completing route output.
- `git diff --check`: passed.

One intermediate standalone type check overlapped the build regenerating `.next-build/types` and reported missing generated files. It was rerun after the build completed and passed; final checks are complete.

The build's generated `next-env.d.ts` route reference was restored to the existing dev reference. `website/next-env.d.ts` and `website/tsconfig.json` remain the pre-existing status-only modifications with no content diff and are excluded from the shop source changes.

At the original review handoff, three modified source files, three new shop source files, and this report were left uncommitted. The user's subsequent approval authorizes committing those files and moving on only to `/categories`. Review URL: `http://127.0.0.1:3002/shop`.

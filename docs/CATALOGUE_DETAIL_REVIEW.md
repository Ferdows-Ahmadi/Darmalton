# Dari contextual catalogue review

Date: 2026-09-21. Local review only. Detail-route changes remain uncommitted.

## Approved checkpoint

Shared chrome checkpoint: `5bbb0d29a737dd3df4964645ce323acd1743f39e` — `Approve compact Dari customer chrome and navigation`.

That commit contains only the approved shell, header, chrome CSS, navigation helper, focused tests and shared-chrome report. Generated files and pre-existing audit documents were excluded. Nothing was pushed or deployed.

## Implementation

Both `/categories/[slug]` and `/manufacturers/[slug]` now reuse the existing Shop CSS module and marketplace MedicineCard presentation. No new CSS or card system was introduced. The compact header shows a breadcrumb, the real context name and the filtered API result count. Counts are product families from the existing `family_listing=true` API, not SKU counts from the manufacturer index.

Category names reuse the existing customer-facing category labels where available. Manufacturer names are resolved against the real manufacturer list and displayed unchanged. No descriptions, logos, countries or statistics were fabricated. Unknown category/manufacturer identities return the existing not-found page.

Files changed:

- `website/app/categories/[slug]/page.tsx`
- `website/app/manufacturers/[slug]/page.tsx`
- `website/components/Catalogue.tsx`
- `website/components/CatalogueHeading.tsx` (new)
- `website/lib/catalogue-context.ts` (new)
- `website/test/catalogue-context.test.mjs` (new)
- `docs/CATALOGUE_DETAIL_REVIEW.md` (new)

The approved shared chrome, Shop stylesheet, product-card component, indexes and other page bodies were not edited. Dari styling remains locale-gated. No backend filter contract was changed.

## Route-context correction

There were two independent causes: Catalogue hardcoded `/shop` in form actions, sorting, pagination and clear links; the detail route loaders ignored incoming search parameters and always requested only their path constraint with name ordering.

The new context helper supplies the canonical category/manufacturer path and copies all supported filters into API requests. Path-derived category/manufacturer values override conflicting query values. Sort and pagination links preserve the same path; sorting resets the page while retaining filters. Form submissions retain the path, search/stock/price/category controls, and hidden ordering, Rx, shopper-category and applicable manufacturer filters. Clear and empty-state actions remove filters while retaining the path context.

The category selector is locked to the actual current category and shows its label. Manufacturer pages allow category refinement and preserve the manufacturer path. Encoded names are matched against real source names without blindly decoding names twice. The normal Shop route remains `/shop` with its original visual treatment and page-local result count.

## Functional verification

Actual local data: Antibiotic (`antibiotic`) and Getz pharma each have **13 product families**, with 12 on page one and one on page two.

| Check | Category detail | Manufacturer detail |
| --- | --- | --- |
| Real context/products | Passed; locked category selector | Passed; unchanged Getz pharma name |
| Sort | Price ascending and descending; reset page; retain filters | Price ascending; retain manufacturer |
| Stock and price form | Passed with stock, 0–1000 price bounds and sort retained | Passed with stock, 0–1000 price bounds and sort retained |
| Actual page two | Same category path; one expected product | Same manufacturer path; one expected product |
| Search and narrower prices | Amclav, stock, 0–150, descending price: 5 families | Amclav + Antibiotic, stock, 50–150, ascending price: 5 families |
| Mobile filtering | Expanded controls checked at 390/320 | Category + stock submitted at 390; 7 matching families |
| Product links | Opened the card's exact medicine route | Opened the card's exact medicine route |
| Empty and clear | Covered by context helper tests | Live empty result and clear restored all 13 families on the same route |

Visible product IDs and their ordering matched direct read-only backend responses for baseline listings, filtered listings and both second pages. Automated tests cover preservation of search, category, manufacturer, shopper category, ordering, stock, Rx and price parameters across pagination. No data was created or changed, and no add-to-cart or order action was performed.

## Responsive and regression results

Both detail routes were inspected at **1440, 1024, 768, 390 and 320px**, using a 1000px viewport height. No horizontal page overflow was measured. The existing Shop grid supplies six, four, three, two and two columns respectively. Expanded filters remain usable at 390/320. Desktop parent links remain Categories/Manufacturers; mobile navigation remains Shop.

The unchanged compact footer measured 357.85px at 320/390, retained 13 links and loaded all five original unfiltered images. At 320px its bottom was 939.6px, before the fixed navigation at 942px. No footer overlap was found.

Regression checks passed for Shop, Categories index and Manufacturers index at 1440/390, and Homepage at 1440. Shop sorting at 390 still uses `/shop?ordering=price` and its next link preserves the order. Screenshots were visually inspected; the approved page composition remains intact. Final review-tab console error log was empty.

## Engineering checks

- Frontend tests: **72/72 passed**, including seven new context tests.
- TypeScript: **passed**.
- ESLint: **passed**.
- Production build: **passed**, using isolated `.next-build` output.
- Generated Next route-type reference restored to `.next/types/routes.d.ts` after the build.
- `git diff --check`: **passed**.
- No backend implementation changed; direct read-only API comparisons verified the existing filtering contract.

## Screenshots and evidence

Required screenshots:

- [Category detail 1440](../tmp/catalogue-detail-review/category-1440.png)
- [Category detail 390](../tmp/catalogue-detail-review/category-390.png)
- [Manufacturer detail 1440](../tmp/catalogue-detail-review/manufacturer-1440.png)
- [Manufacturer detail 390](../tmp/catalogue-detail-review/manufacturer-390.png)
- [Expanded mobile manufacturer filters 390](../tmp/catalogue-detail-review/manufacturer-expanded-390.png)
- [Expanded mobile category filters 390](../tmp/catalogue-detail-review/category-expanded-390.png)

Additional evidence: [320px expanded filters](../tmp/catalogue-detail-review/manufacturer-expanded-320.png), [768px category](../tmp/catalogue-detail-review/category-768.png), [1024px manufacturer](../tmp/catalogue-detail-review/manufacturer-1024.png), [footer 320](../tmp/catalogue-detail-review/footer-320.png), [Shop 1440](../tmp/catalogue-detail-review/shop-1440.png), [Shop 390](../tmp/catalogue-detail-review/shop-390.png).

All are actual local browser captures at the named CSS viewport widths. The capture surface can scale raster dimensions/include scrollbars; DOM `innerWidth` records the tested width. Review artifacts remain under ignored `tmp/catalogue-detail-review`.

Machine-readable observations: [review.json](../tmp/catalogue-detail-review/review.json). Logs: [tests](../tmp/catalogue-detail-review/tests.log), [build](../tmp/catalogue-detail-review/build.log).

## Git state and stopping point

Branch: `reference-ui-transplant-homepage`. HEAD: `5bbb0d29a737dd3df4964645ce323acd1743f39e`. Detail changes are unstaged and uncommitted. Pre-existing untracked `DARI_CUSTOMER_SITE_AUDIT.md` and `DARI_CUSTOMER_SITE_AUDIT - Copy.md` remain untouched. `website/next-env.d.ts` and `website/tsconfig.json` remain status-marked as at task start, with no textual diff.

Stopped for visual approval. No Checkout, utility-page, English/Pashto, admin or Flutter phase was started. No push or deployment. Local services remain running.

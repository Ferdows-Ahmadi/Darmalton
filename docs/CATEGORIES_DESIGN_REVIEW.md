# Dari categories design review

Date: 2026-09-20. Branch: `reference-ui-transplant-homepage`.

Approved shop checkpoint: `c62f75415339dff76566875cbc0e3315ae8797c5`
(`Approve responsive reference-locked shop page`). The shop checkpoint includes only its intentional source changes and review report, excluding the generated/status-only files.

The categories redesign was approved by the user across desktop, tablet and mobile and is included in the approved categories checkpoint. No push, deployment, production change, or work on another route was performed.

## Changed files

- `website/app/categories/page.tsx`: add a Dari-only CSS wrapper around the existing directory.
- `website/app/categories/categories.module.css`: compact intro, six-column desktop photographic grid, three-column tablet grid, two-column mobile grid, and a grouped health-need section.
- `website/components/AppChrome.tsx`: include exactly `/categories` in the approved Dari header/footer presentation condition. Existing homepage and shop conditions remain intact.
- `docs/CATEGORIES_DESIGN_REVIEW.md`: this review record.

## Preserved data and behavior

The category API call, locale architecture, `CategoryDirectory`, `shopperCategories`, and `shopperHealthNeeds` are unchanged. All six existing primary category photographs and all six health-need destinations remain in use. There are no new categories, counts, claims, promotional copy, images, data models, or backend changes. Category detail pages and other locales retain their previous presentation.

All twelve visible cards were clicked and their destinations verified in the browser:

| Card | Existing destination | Local result |
| --- | --- | --- |
| Medicines | `/shop?shopper_category=medicines` | 12 families on first page |
| Vitamins and supplements | `/shop?shopper_category=vitamins-supplements` | 12 families on first page |
| Personal care | `/shop?shopper_category=personal-care` | Existing localized empty state |
| Baby care | `/shop?shopper_category=baby-care` | Existing localized empty state |
| Medical devices | `/shop?shopper_category=medical-devices` | Existing localized empty state |
| Skin care | `/shop?shopper_category=skin-care` | Existing localized empty state |
| Antibiotics | `/categories/antibiotic` | 12 families on first page |
| Nutrition and supplements | `/shop?shopper_category=vitamins-supplements` | 12 families on first page |
| Kidney and urinary health | `/categories/kidney-stones` | 1 family |
| Pain relief | `/categories/pain-relief` | 1 family |
| Digestive health | `/categories/proton-pump-inhabitor-ppi` | 3 families |
| Heart and blood pressure | `/categories/calcium-channel-blockers-ccbs` | 1 family |

Counts above are verification observations from the local dataset, not new counts displayed on category cards. Empty destinations were preserved rather than populated with fabricated products.

## Responsive and visual checks

| Width | Primary columns | Health-need columns | Overflow, clipped labels, broken images |
| --- | --- | --- | --- |
| 1440px | 6 | 3 | None |
| 1024px | 3 | 3 | None |
| 768px | 3 | 2 | None |
| 412px | 2 | 2 | None |
| 390px | 2 | 2 | None |
| 320px | 2 | 2 | None |

Verified Dari RTL at every width. Primary photos retain centered, consistent crops. All twelve directory images loaded. The shortest clickable card is 76px on desktop/tablet and 68px on mobile. Long health-need labels wrap within their cards at 320px. Mobile footer and bottom navigation were visually inspected.

Browser console: no errors during this review. Next development mode reports LCP/priority suggestions for existing category images; these are performance warnings, not broken image requests.

## Approved-page regression checks

Compared current screenshots with the previously reviewed homepage and shop captures at 1440px and 390px. No visual regression was observed. Shared marketplace CSS and approved page components were not edited.

| Route | Width | Header height | Page height | Horizontal overflow |
| --- | --- | --- | --- | --- |
| `/` | 1440px | 82.8px | 2878px | None |
| `/` | 390px | 103.8px | 4534px | None |
| `/shop` | 1440px | 82.8px | 1048px | None |
| `/shop` | 390px | 103.8px | 2609px | None |

## Verification and artifacts

- `npm test`: 58/58 passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, including generation of 61/61 static pages and final route output.
- `git diff --check`: passed.

Artifacts are in ignored `tmp/categories-review/`: screenshots `categories-{1440,1024,768,412,390,320}.png`, `categories-390-footer.png`, `width-checks.json`, `link-checks.json`, `regressions.json`, four homepage/shop regression screenshots, and `build.log`. Screenshots use a 1000px viewport height; mobile screenshots show the top viewport, with the footer checked separately.

At the original review handoff, two modified source files, one new CSS file and this report were left uncommitted. The subsequent user approval authorizes their checkpoint commit. The pre-existing `website/next-env.d.ts` and `website/tsconfig.json` status entries have no content diff and are excluded. Local review: `http://127.0.0.1:3002/categories`.

The user approved `/categories` and authorized the next pass only for `/manufacturers`.

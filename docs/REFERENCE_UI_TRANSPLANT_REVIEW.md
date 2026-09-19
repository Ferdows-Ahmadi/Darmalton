# Dari desktop homepage visual review

## Desktop baseline approval

The user approved the current 1440px Dari RTL homepage as the desktop visual baseline and authorized a local checkpoint commit. The implementation below is now the visual source of truth for responsive homepage work. No push or deployment is authorized. Historical references to awaiting approval below describe the earlier review stages.

## Focused refinement pass — 19 September 2026

Completed the requested corrections on the existing Dari RTL desktop homepage. No commit, deployment, other-route redesign or responsive expansion. Branch remains `reference-ui-transplant-homepage`, HEAD `410fd97c36874e0c0c9d3dcd0b1b6697adf64322`.

Files edited in this correction pass:

- `website/components/home/MarketplaceHome.module.css`: integrated hero composition, tighter vertical rhythm and stronger campaign imagery.
- `website/components/home/MarketplaceHome.tsx`: correct responsive image-size hint for the wider fallback hero photograph; no content/data changes.
- `website/components/home/MarketplaceCard.module.css`: consistent 232px cards, larger image area, stronger prices and quieter metadata.
- `website/components/MedicineCard.tsx`: marketplace markup order now places price and buying action ahead of secondary metadata. Existing conditions, destinations and handlers are retained verbatim.
- `docs/REFERENCE_UI_TRANSPLANT_REVIEW.md`: this refinement record.

The fallback hero now fades the existing photograph continuously into a dark-green campaign field, with the existing Dari copy and a compact cream CTA. This removes the previous pale split-panel treatment. The hero is 208px high (previously 216px). Existing CMS content and carousel behavior remain connected.

Most section gaps are now 8px rather than 12px, heading/panel padding is tighter, and service panels are 84px rather than 96px high. Promotional images extend farther into their banners with deliberate crops and blended text backgrounds. Existing photographs and copy are retained; no new offers or claims were added.

Product images increase from 90px to 96px, with less internal image padding. Cards follow image, name, price, action, then stock/Rx and variant metadata. All 39 cards measure 232px high; no price overflow or vertically clipped card children were found. Pharmacy information and business decisions remain present.

Final 1440px browser measurements: page height 2878px (previous review 3078px), header approximately 83px, footer approximately 246px, document/client width 1425px with no horizontal overflow. Rail counts remain 7/8/7/9/8, with 39 unique families. Dari `fa-AF` and RTL are confirmed. Visual comparison against the original reference checked the integrated hero, compact continuous section rhythm, banner crops and product hierarchy. The finite real catalogue still limits the reference's length and variety.

Checks rerun for this pass: 58 frontend tests, TypeScript, ESLint and the production build all passed (61 routes). Build log: `tmp/reference-ui-refinement/build.log`. Fresh browser console contains no warnings or errors; there are no broken visible images. `git diff --check` passed. Backend/Flutter suites and authenticated commerce flows were not rerun for these presentation-only edits; their results below belong to the first pass.

New full-page artifact: `tmp/reference-ui-refinement/home-dari-1440-refined.png`. Captured at a 1440 x 1000 CSS-pixel viewport using four overlapping browser screenshots, assembled with pixel alignment to avoid the capture provider's stitching defect. PNG size is 1410 x 2850 raster pixels after removing the scrollbar edge; this reflects the provider's slight scaling. Original captures and the assembly script remain beside the artifact.

![Refined full homepage at 1440px](../tmp/reference-ui-refinement/home-dari-1440-refined.png)

Working tree remains uncommitted. The status includes the original homepage pass and these refinements: modified `website/app/page.tsx`, `AppChrome.tsx`, `HeroCarousel.tsx`, `MedicineCard.tsx`, and `test/public-cms.test.mjs`; untracked `LegacyHome.tsx`, `components/home/` and this report. Next-generated `next-env.d.ts` and `tsconfig.json` may appear as modified in status but have no content diff after restoring the development routes hint. Nothing is staged. Stop for visual review.

---

## First-pass record (historical)

Status: implemented locally; awaiting human visual approval. No deployment or push.

## Review target

- URL: http://127.0.0.1:3002/ (Dari, RTL, 1440px browser viewport).
- Branch: `reference-ui-transplant-homepage`.
- HEAD: `410fd97c36874e0c0c9d3dcd0b1b6697adf64322`.
- Base: `customer-storefront-v1-final-rebuild`, the same commit. Review changes are uncommitted.
- Scope: homepage and its scoped shared-chrome presentation for Dari desktop at widths of at least 1200px. Other routes, locales and smaller viewports retain their existing presentation. No further responsive redesign was undertaken.

## Files changed

| File | Purpose |
| --- | --- |
| `website/app/page.tsx` | Retains CMS and family-listing loading; selects the scoped new desktop presentation and loads actual categories/manufacturers. |
| `website/components/LegacyHome.tsx` | Extracts the previous homepage for existing locales and smaller viewports. |
| `website/components/home/MarketplaceHome.tsx` | New dense homepage composition using real catalogue data and existing media. |
| `website/components/home/MarketplaceHome.module.css` | Independent homepage geometry, rails, bands, shortcuts and banners. |
| `website/components/home/MarketplaceCard.module.css` | Compact product-card presentation. |
| `website/components/home/MarketplaceChrome.module.css` | Scoped compact header/footer presentation. |
| `website/components/AppChrome.tsx` | Applies the presentation scope only on the Dari homepage. |
| `website/components/MedicineCard.tsx` | Adds an optional presentation while retaining existing product decisions and actions. |
| `website/components/HeroCarousel.tsx` | Adds an optional image-size hint; preserves carousel behavior. |
| `website/test/public-cms.test.mjs` | Follows the extracted homepage components in the existing CMS assertions. |
| `docs/REFERENCE_UI_TRANSPLANT_REVIEW.md` | This review record. |

Next-generated TypeScript configuration files have no content diff. No backend, mobile or infrastructure source changes.

## Replaced visual structures

The old spacious homepage sections and product-grid skin are replaced on this target by a shallow full-width hero, eight small shortcuts, a red seven-product band, four compact campaigns, a cream eight-product rail, three service panels, a green seven-product band, round discovery links, paired banners, nine- and eight-product rails, manufacturer discovery, compact service links and a narrow app banner. Existing global homepage styles remain available to the legacy presentation; the new layout uses separate CSS modules.

The shared functional header and footer receive a scoped compact presentation. Measured header height is approximately 83px; hero height is 216px. Main content width is 88.4%, with mostly 12px section gaps. Cards retain room for product identity, variants, prescription status, price and actions. The page is approximately 3078 CSS pixels tall. Its length is constrained by real catalogue breadth rather than filled with duplicated families.

## Preserved functionality and data

- Django remains authoritative for authentication, stock, prices, prescription requirements and orders; no contracts or business rules were changed.
- Existing public CMS loading, hero carousel and article integration remain connected. Empty CMS sections use the existing legitimate fallback presentation or are omitted.
- Existing medicine-family grouping, representative images, price ranges, variant links, stock/Rx decisions and AddToCart behavior are reused.
- Existing search, account/login, cart, prescription, category, manufacturer, health-need and service destinations remain connected.
- All 39 displayed product families are unique. Non-prescription selection follows actual backend flags.

## Content limits relative to the reference

The local catalogue has 39 public families (26 medicine and 13 supplement families), populated medicine/supplement shopping categories, and six mapped health-need groups. It cannot honestly support the reference's many unrelated retail categories or equally long series of unique product rows.

There are 12 actual manufacturers, but no manufacturer logos in this dataset. The discovery row therefore uses eight real manufacturer names rather than fabricated brand imagery. Local CMS has no published hero slides, feature campaigns, articles or announcements; existing pharmacy media is reused in the campaign slots, and absent editorial content is omitted. No fake discounts, countdowns, products, testimonials or partner marks were introduced. The Mercip representative lacks an appropriate source image and retains the existing fallback; a different strength's photograph was not substituted.

## Verification

| Check | Result |
| --- | --- |
| Website tests | 58 passed |
| TypeScript and ESLint | Passed |
| Next.js production build | Passed; 61 routes generated; log in `tmp/reference-ui-transplant/build.log` |
| Django checks and migration consistency | Passed |
| Backend tests | 113 passed on the local SQLite fallback |
| Ruff lint and formatting | Passed; 99 files already formatted |
| Flutter analyzer and tests | Passed; 71 tests |
| Compose configuration validation | Passed; no containers changed |
| Whitespace diff check | Passed |
| Final browser geometry | 1440px viewport; 1425px document/client width; no horizontal overflow; `fa-AF`, `rtl` |
| Final visible images and console | No broken visible images; no warnings/errors |
| Real medicine image proxy and Next optimizer | Both HTTP 200 with image content types |
| Search interaction | Live Amlo result navigated to the correct family with 5mg/10mg variants |
| Guest cart interaction | Non-Rx add opened the cart with one item, quantity controls and an AFN total |
| Prescription entry | Existing protected login destination reached |

Authenticated checkout and completed prescription upload were not rerun. The order-creating integrated smoke script was not run. PostgreSQL execution was not revalidated in this visual phase; runtime verification used the documented local SQLite fallback. Browser checks demonstrate the tested interactions, not every commerce flow. Visual acceptance remains the user's decision.

## Full-page screenshot

Artifact: `tmp/reference-ui-transplant/home-dari-1440-review.png`.

The browser was set to a 1440 x 1000 CSS-pixel viewport. The capture provider returned slightly scaled raster images. Its automatic full-page capture repeated sections, so the deliverable was assembled from four overlapping, unmodified viewport captures, aligned by pixel overlap; only the scrollbar margin was cropped. The resulting PNG is 1410 x 3046 raster pixels and represents the full page at the requested 1440px viewport. Assembly script and original captures remain alongside it for reproducibility. No content was invented or removed between sections.

![Full Dari RTL homepage captured at a 1440px viewport](../tmp/reference-ui-transplant/home-dari-1440-review.png)

Stop here for visual approval. Do not expand to other pages, responsive redesign or deployment before the next instruction.

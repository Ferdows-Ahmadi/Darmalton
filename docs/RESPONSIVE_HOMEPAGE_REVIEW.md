# Dari RTL responsive homepage review

The user has approved this responsive homepage across desktop, tablet and mobile and authorized its checkpoint commit. This is the approved visual baseline for subsequent customer-route work. The uncommitted/review-pending statements below record the original delivery state.

Desktop baseline checkpoint: `37e193e26eb13ff4e4e101182b7c3ee688f4b3a7` — **Approve reference-locked Dari desktop homepage**.

Branch: `reference-ui-transplant-homepage`. Responsive changes are unstaged and uncommitted. Nothing was pushed or deployed. Local review: http://127.0.0.1:3002/.

## Changed files

- `website/app/page.tsx`: render the approved marketplace homepage at every Dari width, removing the smaller-screen legacy fallback. English and Pashto keep their existing presentation.
- `website/components/home/MarketplaceHome.module.css`: scoped tablet/mobile hero composition, scrolling rails, compact shortcuts, regrouped campaign banners, discovery/manufacturer sections and service links. Rules for the approved 1440px layout are retained.
- `website/components/home/MarketplaceCard.module.css`: 250px tablet/mobile cards accommodate 44px purchase targets while preserving image/name/price/action/metadata hierarchy. Desktop cards remain 232px.
- `website/components/home/MarketplaceChrome.module.css`: compact responsive header with prominent search, explicit mobile grid placement, existing drawer and bottom navigation styling, and responsive footer links. Header icon labels remain available to assistive technology.
- `docs/RESPONSIVE_HOMEPAGE_REVIEW.md`: this report.

No other route, backend contract, database rule, product data, locale content, admin or Flutter source was changed. The same 39 families, rail ordering, existing assets, prices, Rx/stock decisions and action components remain in use. Manufacturer and product rows scroll inside their containers rather than widening the page.

## Verification

All requested widths were rendered and checked: **1366, 1280, 1024, 900, 768, 430, 412, 390, 375, 360, 320px**, plus a 1440px baseline check.

| Width | Card height | Page horizontal overflow | Clipped card content / price overflow | Hero copy fits | Dari RTL |
| --- | --- | --- | --- | --- | --- |
| 1440 | 232px | None | None | Yes | Yes |
| 1366 | 232px | None | None | Yes | Yes |
| 1280 | 232px | None | None | Yes | Yes |
| 1024 | 250px | None | None | Yes | Yes |
| 900 | 250px | None | None | Yes | Yes |
| 768 | 250px | None | None | Yes | Yes |
| 430 | 250px | None | None | Yes | Yes |
| 412 | 250px | None | None | Yes | Yes |
| 390 | 250px | None | None | Yes | Yes |
| 375 | 250px | None | None | Yes | Yes |
| 360 | 250px | None | None | Yes | Yes |
| 320 | 250px | None | None | Yes | Yes |

The 1440px page retains its 208px hero, approximately 83px header and 2878px total page height. Tablet keeps the band title beside the rail; mobile moves it into a compact horizontal heading. The integrated hero remains 218px high on mobile. The four promotional tiles become a two-column group, paired banners stack, and discovery shortcuts remain compact grids.

Browser checks found no broken loaded images and no warnings/errors in the fresh final session. At 320px the menu opened within the viewport and closed correctly; live Amlo search returned a fitting family suggestion; a horizontal scroll advanced the RTL rail (scrollLeft -292). The existing five bottom-navigation destinations remain `/`, `/shop`, `/prescriptions/upload`, `/cart`, `/account`, with measured link heights of approximately 51px. Completed checkout and authenticated prescription flows were not rerun for this CSS/layout phase.

Frontend verification passed: **58 tests**, TypeScript, ESLint, production build (**61 routes**), and `git diff --check`. Build log: `tmp/homepage-responsive/build.log`. Machine-readable width checks: `tmp/homepage-responsive/width-checks.json`.

## Screenshots

Full-page review images at the requested CSS viewport widths:

- [1024px](../tmp/homepage-responsive/homepage-1024.png)
- [768px](../tmp/homepage-responsive/homepage-768.png)
- [412px](../tmp/homepage-responsive/homepage-412.png)
- [390px](../tmp/homepage-responsive/homepage-390.png)
- [320px](../tmp/homepage-responsive/homepage-320.png)

These are assembled from overlapping browser viewport captures because the capture provider's automatic full-page stitching repeated sections. The provider slightly scales the raster output; viewport widths were verified from `innerWidth`. The scrollbar edge is cropped, and the fixed mobile bottom navigation is shown once at the bottom of each assembled image. Original viewport captures preserve its actual fixed position and remain beside the composites (`<width>-0.png`, `<width>-1.png`, etc.). No page content was fabricated. The assembly script and scroll positions are saved in the same directory.

## Git status at delivery

The five files listed above contain the responsive implementation/report. `website/next-env.d.ts` and `website/tsconfig.json` also appear modified in Git's status because of generated-file/line-ending metadata, but `git diff` reports no content changes for either. Nothing is staged. The approved desktop commit remains HEAD. Stop here for responsive visual review.

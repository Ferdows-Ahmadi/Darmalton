# Dari manufacturers visual review

Date: 2026-09-20. Status: approved by the user; checkpoint authorized before product-detail work.

## Approved checkpoint

The approved responsive categories page was committed as
`4bf1c19d77b2eff916f1b3863a295dcf15ff7e9d` —
`Approve responsive reference-locked categories page`.
That checkpoint contains the categories page, its CSS module, the required
AppChrome route condition, and `docs/CATEGORIES_DESIGN_REVIEW.md` only.
Generated/no-content changes were excluded. Nothing was pushed or deployed.

## Manufacturers changes

- `website/app/manufacturers/page.tsx`: applies a Dari-only scoped wrapper to the existing directory.
- `website/app/manufacturers/manufacturers.module.css`: compact intro, pale grid surface, restrained teal borders, small neutral letter identifiers, readable counts, directional affordances and hover/focus treatment. Four columns at desktop, three at tablet, two at mobile.
- `website/components/AppChrome.tsx`: adds the exact Dari `/manufacturers` route to the approved shared chrome condition.
- `docs/MANUFACTURERS_DESIGN_REVIEW.md`: this review record.

The existing directory component, API request, localization, routing, and count
behavior remain unchanged. No manufacturer imagery, descriptions, countries,
ratings, or featured labels were introduced. The small letters are neutral
typographic identifiers, not official logos. The current API has zero logos.
The shared footer density is unchanged and remains a site-wide QA item; cards
were not stretched and no filler sections were added to lengthen this short page.
English, Pashto, manufacturer detail pages, and all other page designs are outside
this change.

## Data and navigation verification

All 12 rendered names and product counts matched the local API with zero
mismatches:

| Manufacturer | Products |
| --- | ---: |
| Hoechst pharma | 4 |
| Highnoon pharma | 1 |
| Getz pharma | 24 |
| SAMI pharma | 4 |
| Martin Dow | 3 |
| MEYER pharma | 3 |
| TOTAL pharma | 3 |
| ATABAYpharma | 1 |
| GSK | 1 |
| Pinewood Health care | 1 |
| AGP pharma | 7 |
| Hilton pharma | 2 |

Every card was clicked in the browser. All 12 reached the matching encoded
`/manufacturers/{name}` route, with the correct manufacturer heading and a visible
catalogue. Existing destination family grouping and pagination remain unchanged;
visible family-card totals need not equal the directory product count.

## Responsive and regression verification

| Viewport width | Columns | RTL | Horizontal overflow | Clipped names/counts |
| ---: | ---: | --- | --- | --- |
| 1440 | 4 | Pass | None | None |
| 1024 | 3 | Pass | None | None |
| 768 | 3 | Pass | None | None |
| 412 | 2 | Pass | None | None |
| 390 | 2 | Pass | None | None |
| 320 | 2 | Pass | None | None |

All widths rendered 12 cards. Desktop/tablet cards were at least 114px high;
mobile cards were about 125px high, with full names allowed to wrap. Browser
console error inspection returned no errors during the reviewed navigation.

Homepage, shop, and categories were checked visually at 1440px and 390px against
their approved captures. No visual regression or horizontal overflow was found.
Approved shared header/footer styling is reused without changing its CSS.

## Automated checks

- Frontend tests: 58/58 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed, including 61/61 static pages; isolated `.next-build` output.
- `git diff --check`: passed.

These are frontend checks. No backend contracts, data, business logic, or Flutter
source changed. Browser review used the local Django workstation fallback and
Next.js development server, not production.

## Review artifacts and handoff

Local review: <http://127.0.0.1:3002/manufacturers>.

Ignored local artifacts are under `tmp/manufacturers-review/`:

- `manufacturers-1440.png`, `manufacturers-768.png`, `manufacturers-390.png`, `manufacturers-320.png` (requested captures).
- `manufacturers-1024.png`, `manufacturers-412.png` (additional widths).
- `homepage-{1440,390}-regression.png`, `shop-{1440,390}-regression.png`, `categories-{1440,390}-regression.png`.
- `width-checks.json`, `link-checks.json`, `regressions.json`, API/rendered data snapshots, and `build.log`.

The user approved this manufacturers implementation and authorized its checkpoint.
`website/next-env.d.ts` and `website/tsconfig.json` are reported modified by Git
but have no content diff; they are excluded from intentional changes.
No push or deployment was performed. Product detail is the next separately reviewed scope.

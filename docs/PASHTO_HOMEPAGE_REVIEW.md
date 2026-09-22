# Pashto homepage and shared chrome review

Date: 2026-09-22. First Pashto milestone only; implementation complete and **uncommitted pending visual approval**.

## Checkpoint and branch

Approved final Dari checkpoint: `28591ff167318481495e1ef500147f416a38762c` — `Complete final Dari customer website QA`.

The current diff was reviewed before committing. That commit contains exactly the 11 intentional final-Dari source corrections, focused test and final report (13 files). Generated/no-content-diff files, unrelated audit copies and ignored screenshots/logs were excluded.

Created and checked out the user-requested `pashto-storefront-propagation` branch directly from that checkpoint. Current HEAD and merge-base with `reference-ui-transplant-homepage` both equal `28591ff167318481495e1ef500147f416a38762c`. Before Pashto implementation, the intended source working tree had no content changes. Existing status-only `next-env.d.ts`/`tsconfig.json` and two untracked audit files were preserved, not discarded.

## Scope and implementation

Pashto now uses the same MarketplaceHome component tree and CSS as approved Dari. The hero, shortcut row, red/yellow/green product rails, promotional mosaics, discovery rows, manufacturer section, help links and App CTA retain their order, assets and geometry. There is no duplicate Pashto component tree. English retains its existing LegacyHome path.

Shared customer chrome, compact footer, mobile bottom navigation and desktop/drawer parent-state mapping now apply to both RTL locales. Only shared chrome travels to other Pashto customer routes at this stage; their page bodies have not been propagated or redesigned. Existing destinations and backend contracts remain unchanged.

| File | Change |
| --- | --- |
| `website/app/page.tsx` | Route Dari and Pashto through MarketplaceHome with the actual locale; keep English fallback. |
| `website/components/home/MarketplaceHome.tsx` | Extract fixed Dari UI text; pass locale to category/health-need/manufacturer helpers and shared copy; preserve markup, ordering, data and assets. |
| `website/lib/marketplace-copy.ts` | New typed Dari/Pashto homepage dictionary, preserving approved Dari literals. |
| `website/components/AppChrome.tsx` | Enable approved chrome and mobile parent mapping for Pashto; localize footer ordinals; pass announcement locale. |
| `website/components/Header.tsx` | Use existing parent mappings and localized variant counts for Pashto; retain accessible account/cart labels, search and locale-switch behavior. |
| `website/components/HeroCarousel.tsx` | Pashto carousel role description and formatted slide ordinals; existing Pashto hero fallback and backend banner localization retained. |
| `website/components/MedicineCard.tsx` | Pashto marketplace variant counts and localized error feedback opt-in; compact geometry unchanged. |
| `website/components/AddToCart.tsx` | Marketplace-only localized feedback option suppresses arbitrary backend error text in Pashto; guest fallback and Rx routing unchanged. |
| `website/components/PublicAnnouncements.tsx` | Pashto accessibility label; preserve original CMS source content through the existing CMS locale helper. Existing non-Pashto output retained. |
| `website/components/home/MarketplaceChrome.module.css` | Comment updated to describe both RTL locales; no CSS declaration changed. |
| `website/test/marketplace-locale.test.mjs` | Focused tests for identical structure/assets/destinations/data, Pashto UI copy, source-content fallback and safe marketplace cart errors. |
| `website/test/public-cms.test.mjs` | Existing assertion accepts the added locale prop without depending on JSX prop order. |
| `docs/PASHTO_HOMEPAGE_REVIEW.md` | This review report. |

## Copy extraction

The new dictionary contains the approved homepage application copy with Pashto counterparts: campaign headings and descriptions, rail titles/subtitles, view links, shortcut labels, service banners, category discovery, manufacturer context, help groups, article-section label and mobile App CTA. Dari strings remain unchanged. Existing locale dictionaries supply header/search/login/cart, language selector, menu/close, footer/service strip, mobile navigation, stock/Rx labels, prices and product actions. Existing localized source fields and established data helpers supply medicine/manufacturer/category values; no medical facts or brand names were invented.

Examples of introduced Pashto UI copy:

| Meaning | Pashto |
| --- | --- |
| Quick access | چټک لاسرسی |
| Send your prescription | خپله نسخه واستوئ |
| Pharmacy team private review | د درملتون د ډلې محرمه کتنه |
| Medicines and health products | درمل او روغتیایي توکي |
| Non-prescription products | بې نسخې توکي |
| Browse the pharmacy | په درملتون کې ولټوئ |
| Daily care | د هرې ورځې پاملرنه |
| Pharmacy services | د درملتون خدمتونه |
| App on your phone | درملتون ستاسو په موبایل کې |
| Get the Android app | د اندروید اپ ترلاسه کړئ |

The complete paired wording is reviewable in `website/lib/marketplace-copy.ts`. Real source medicine names, strengths, SKUs, pack values and manufacturer names were not rewritten. AFN uses the existing locale formatter and Pashto currency label.

## CMS/content limitation

Articles, generic CMS pages and announcements have English/Dari source fields but no real Pashto fields. This milestone does not fabricate or silently translate their content. Homepage article references and Pashto announcements use the existing `cmsText` policy: available original English, otherwise original Dari. This is source content, not a claim of Pashto content localization. Current local articles are empty, so populated article/CMS visual validation remains for the later content phase. Banners separately already support Pashto source fields; their existing fallback behavior is retained. No database/schema/content records were changed.

## Responsive and RTL verification

Actual browser checks and screenshots passed at **1440, 1024, 768, 390 and 320** with `lang=ps-AF`, `dir=rtl`, zero positive document overflow, no broken loaded images and no campaign text clipping. Card heights remain 232px desktop / 250px below the existing breakpoint. Hero heights remain 208px desktop/tablet / 218px mobile. Existing horizontal rails remain intentionally scrollable.

Physical image positioning, masks, gradients, search radii and arrow glyphs were reviewed: they serve the same RTL composition for both locales and needed no CSS change. Header controls, drawer, service links, bottom navigation and footer wrapping fit the tested widths. At the lower 390px viewport the footer ended around y=940 and bottom navigation began at y=942, leaving interactive footer links clear. The compact footer structure and short-page policy are unchanged.

## Dari regression protection

Dari homepage rechecked at 1440 and 390 after extraction. Approved text, imagery, ordering and layout remain visually unchanged. The settled 390px comparison matched all 13 recorded section geometry/text/label entries exactly against the pre-extraction capture. Desktop was visually compared with the approved final-Dari QA screenshot; no pixel-perfect desktop comparison is claimed. The initial pre-extraction file labelled 1440 was inadvertently captured at 390 and is excluded from desktop evidence. No CSS declaration was modified for this milestone.

## Functional checks

- Dari → Pashto → Dari → Pashto switching updates the homepage copy and shared controls while keeping RTL. Pashto remains selected after reload. Server-rendered homepage copy was checked after refresh settled.
- Pashto header search for Amclav reached `/shop?search=Amclav` and loaded results; the mobile Shop parent state was correct. Shop was opened only to verify the shared search destination, not redesigned.
- Mobile drawer opens/closes, exposes Pashto labels and marks Home with `aria-current=page`. Bottom Home state and shared parent mappings remain correct.
- Homepage category, product, manufacturer, prescription, login/account/cart and App hrefs retain their destinations; structural locale tests compare both locale trees. Existing parent-mapping tests pass.
- Homepage add-to-cart was exercised with a temporary existing non-Rx product. The temporary line was removed and the original guest cart matched its prior text exactly. No order, login, account record or private upload was created.
- Homepage App CTA reaches `/app`; both existing Android links retain exactly `https://darmalton.com/downloads/darmalton-android-1.0.0.apk`. The iOS item remains inactive. No APK download/deployment occurred. App body remains outside this propagation milestone.
- Final inspected browser warning/error log was empty; no hydration error observed.

## Engineering checks

| Check | Result |
| --- | --- |
| Full frontend tests | **89 passed, 0 failed** |
| TypeScript | Passed |
| ESLint | Passed |
| Production build | Passed, 61 generated pages, no warnings/errors |
| `git diff --check` | Passed |

The initial extraction typecheck caught a missing optional prop binding and the existing CMS test assumed prop order. Both were corrected before the final passing checks. New tests use in-memory fixtures only, never backend/screenshot data. Backend/Flutter checks were not rerun because no backend, business-contract or Flutter code changed. Local screenshots, measurements and check logs are ignored artifacts under `tmp/pashto-home-review/`.

## Screenshot evidence

| Capture | File |
| --- | --- |
| Pashto homepage 1440 | [Open](../tmp/pashto-home-review/pashto-home-1440.png) |
| Pashto homepage 1024 | [Open](../tmp/pashto-home-review/pashto-home-1024.png) |
| Pashto homepage 768 | [Open](../tmp/pashto-home-review/pashto-home-768.png) |
| Pashto homepage 390 | [Open](../tmp/pashto-home-review/pashto-home-390.png) |
| Pashto homepage 320 | [Open](../tmp/pashto-home-review/pashto-home-320.png) |
| Lower Pashto footer 390 | [Open](../tmp/pashto-home-review/pashto-footer-390.png) |
| Dari regression 1440 | [Open](../tmp/pashto-home-review/dari-regression-1440.png) |
| Dari regression 390 | [Open](../tmp/pashto-home-review/dari-regression-390.png) |

## Final git state and stop boundary

Branch `pashto-storefront-propagation`; HEAD remains `28591ff167318481495e1ef500147f416a38762c`. Ten existing source/test files modified, plus new dictionary, focused test and this report. Nothing staged or committed for Pashto. `website/next-env.d.ts` and `website/tsconfig.json` retain pre-existing status-only changes with no textual diff. Pre-existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` remain untouched. No screenshot/log is staged.

Local review: `http://127.0.0.1:3002/`, Pashto selected. Stop for homepage/shared-chrome visual approval. No further route propagation, English phase, admin/Flutter work, push, production change or deployment.

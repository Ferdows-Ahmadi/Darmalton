# Final English Customer Website Report

Date: 2026-09-23. Local development review only.

**ENGLISH CUSTOMER WEBSITE READY — pending the user's visual approval.**

English implementation remains uncommitted. Nothing was pushed or deployed. No admin, Flutter, backend business rules, production data, orders or uploaded material were changed.

## Checkpoint and branch

- Final approved Pashto checkpoint: `eecdc97954090ea587908c400f3fee731f627365` — `Complete Pashto customer website propagation and QA`.
- Branch: `english-storefront-propagation`.
- HEAD and merge-base with `pashto-storefront-propagation`: the same checkpoint above.
- Only intentional approved Pashto implementation, helpers, tests and report entered that checkpoint. Screenshots, logs, generated status-only files and old audit copies were excluded.
- English work is an unstaged working-tree diff on that checkpoint. The existing unrelated audit files and generated status-only files are preserved.

## Implementation and defects corrected

English now uses the approved shared MarketplaceHome, ProductDetail, App presentation, catalogue, cart, checkout, account shell, authentication, document, CMS and shared application-state system. The English LegacyHome route branch and old inline English Product/App branches were removed. The unused LegacyHome source file remains unreferenced by the homepage; there is no parallel English route tree.

Typed English dictionaries cover the shared customer literals and marketplace merchandising labels. English product descriptions use actual English source fields. Existing English dictionary text, backend product/brand/manufacturer values, SKU/strength values and AFN prices are preserved. Saved local prescription titles/notes remain source data even when they contain Dari.

LTR corrections:

- Header search input/action corner geometry, inherited sans-serif headings and the shared compact chrome.
- Hero image position, mask and gradient adapt to LTR without mirroring image pixels.
- Home/App forward arrows, account overview chevrons, category/manufacturer directory arrows, account active inset and cart text alignment follow English direction.
- Grid/flex order, logical spacing, catalogue sidebars, breadcrumbs, product variants, mobile navigation and footer columns use the shared direction-aware structure.
- Safe English account/checkout error maps allow recognized messages and status-specific feedback, while rejecting arbitrary backend/debug text. Native validation is English. English checkout required-field feedback follows the same approved pattern.
- English prescription state wording no longer reads “Prescription required / Not required”.
- Above-fold catalogue thumbnails and the first cart thumbnail receive image priority after development-console LCP warnings. This changes loading priority, not geometry.

The approved content-following footer policy is unchanged: short desktop pages may leave white space below the footer, with no giant gap between content and footer. The manufacturer desktop capture demonstrates the final composition.

## Customer route inventory: all 46 routes/templates reviewed

“Live” means the actual local browser route was inspected. Populated private records were not added for this review.

| # | Route/template | Result |
|---|---|---|
| 1 | `/` | Live shared English marketplace; desktop/mobile and lower sections |
| 2 | `/shop` | Live listing, search, filter and sort |
| 3 | `/categories` | Live directory; LTR arrows |
| 4 | `/categories/[slug]` | Live antibiotic category; filter/sort/page 2 retained context |
| 5 | `/manufacturers` | Live directory and short desktop footer |
| 6 | `/manufacturers/[slug]` | Live Getz pharma detail; sort retained context |
| 7 | `/medicines/[id]` | Live source product, price, stock, Rx and 5mg/10mg variant selection |
| 8 | `/cart` | Live guest and existing demo server carts |
| 9 | `/checkout` | Live guest redirect and authenticated address/validation/summary |
| 10 | `/checkout/login` | Live auth handoff with checkout return target |
| 11 | `/login` | Live compact auth and local demo sign-in |
| 12 | `/register` | Live form; no new account created |
| 13 | `/forgot-password` | Live honest support state |
| 14 | `/reset-password` | Live honest reset limitation state |
| 15 | `/account` | Live overview/navigation; no saved personal data in evidence |
| 16 | `/account/profile` | Live form; screenshot personal fields cleared locally without saving |
| 17 | `/account/addresses` | Live existing populated address; no screenshot of personal address |
| 18 | `/account/addresses/new` | Live blank editor; screenshot provided |
| 19 | `/account/addresses/[id]/edit` | Live existing edit form; no save |
| 20 | `/account/orders` | Live genuine empty state |
| 21 | `/account/orders/[id]` | Live unavailable state; populated template source-reviewed |
| 22 | `/account/prescriptions` | Live existing cancelled harmless test prescription |
| 23 | `/account/prescriptions/[id]` | Live cancelled test detail; no file opened |
| 24 | `/account/notifications` | Live genuine account state |
| 25 | `/app` | Live shared App page; exact Android href and inactive iOS |
| 26 | `/about` | Live compact document |
| 27 | `/contact` | Live support document |
| 28 | `/help` | Live help document |
| 29 | `/faq` | Live native disclosure; second item opened |
| 30 | `/privacy` | Live policy |
| 31 | `/terms` | Live terms |
| 32 | `/delivery-policy` | Live delivery document |
| 33 | `/returns` | Live returns document |
| 34 | `/prescription-help` | Live prescription guide |
| 35 | `/health` | Live alias with genuine empty state |
| 36 | `/health-articles` | Live genuine empty state |
| 37 | `/health-articles/[slug]` | Live missing article; populated template source-reviewed |
| 38 | `/health/[slug]` | Live missing-article alias |
| 39 | `/pages/[slug]` | Live missing CMS; populated template source-reviewed |
| 40 | `/notifications` | Live account alias and active navigation |
| 41 | `/orders` | Live account alias and empty state |
| 42 | `/orders/[id]` | Live safe unavailable order state |
| 43 | `/orders/success/[id]` | Live redirect to account detail with `placed=1`; unavailable test ID |
| 44 | `/prescriptions` | Live combined upload/history alias |
| 45 | `/prescriptions/upload` | Live form/history and missing-file validation |
| 46 | `/prescriptions/success/[id]` | Live presentation using existing harmless test ID; no new upload |

Shared loading was observed during route transitions and its accessibility treatment source/test-reviewed. General 404, article-missing and CMS-missing states were inspected live. The safe error boundary/retry implementation was source/unit-tested; no artificial production error or content record was introduced.

## Localization, CMS and locale switching

No accidental Dari/Pashto UI labels were found in the reviewed English states. Language-selector names, the supplied brand artwork, real product data and existing saved prescription text are intentionally unchanged. English error mapping never displays arbitrary error bodies. Counts/number formatting and AFN behavior retain the shared locale helpers; medicine strengths and technical identifiers are not rewritten.

CMS selection uses real English fields for English, falling back to existing source content if missing. No published local health/CMS records exist. Populated cards, article detail and generic CMS content therefore remain pending real-content visual validation. Their source structure and locale selection were reviewed/tested; no records were fabricated.

On Shop, `search=amlo`, price ordering and stock filtering survived English → Dari → Pashto → English with correct RTL/LTR direction. Authenticated Checkout retained its route and account session across these locale changes. The existing demo cart stayed at three units / 192 AFN. Homepage changes also retained the shared marketplace and real server-localized headings after refresh. The locale provider test verifies an in-place refresh rather than route replacement, cookie persistence and direction changes.

## Functional and navigation results

- Header search reached `/shop?search=amlo`; sort and stock filtering retained search.
- Category filter/sort/pagination retained `/categories/antibiotic`, ordering and stock context. Manufacturer sorting retained its detail route.
- Product 5mg → 10mg navigation selected the exact SKU and changed the displayed price from 60 to 100 AFN. Stock/Rx presentation remained tied to source values.
- A temporary guest supplement was added, increased to two units, decreased to one and removed. Original guest cart restored: one Co-amoxiclave 457mg/5ml unit, 140 AFN. Existing authenticated demo cart was not modified.
- Guest Checkout redirected to `/checkout/login`; auth UI retained `returnTo=/checkout`. Safe local demo sign-in established the account session. Logout was verified by return to home and reappearance of Sign in.
- Account links and descendants loaded with one appropriate account-shell active destination. Header/mobile parent mapping retained catalogue, Account and standalone Rx sections; manufacturer mobile drawer explicitly reported `aria-current=page` on Manufacturers.
- Blank checkout address submission showed English field errors; no address saved and no order created. Missing prescription upload showed actionable English feedback; no file uploaded/opened or prescription changed.
- Android links remain exactly `https://darmalton.com/downloads/darmalton-android-1.0.0.apk`. iOS remains explicitly unavailable. No APK downloaded or installed.
- FAQ disclosure expanded through its native control.

## Responsive and regression evidence

English representative captures/checks cover 1440, 1024, 768, 390 and 320 CSS-pixel viewports. Home, Shop and Register cover intermediate widths. Required 320 checks cover Home, Shop, Checkout, Register and Account. The complete requested 390 family matrix and desktop Home/Shop captures are in the gallery.

Dari and Pashto each have Home 1440/390, Shop 390, Product 390, Checkout 390, Account/Profile 390, App 390 and About 390 captures. RTL, existing copy, geometry and approved presentation are preserved in these samples. LTR-only CSS is explicitly scoped. No route-specific RTL redesign was made.

All recorded document-overflow measurements were zero. No broken visible images were found; genuine medicine fallback images were observed. Scrollable product rails intentionally clip the next card within their rail, without document overflow. No clipped form/action controls were found in sampled pages.

Development-console LCP hints found during the first sweep were corrected with thumbnail priority. The clean final browser pass over Shop, category detail, manufacturer detail, product, cart, App and FAQ recorded **zero warnings/errors**, zero broken visible images and zero document overflow (`final-console.json`). No hydration errors were observed.

## Verification

| Check | Result |
|---|---|
| Full frontend suite | 98 passed, 0 failed |
| TypeScript | Passed |
| ESLint | Passed, no warnings |
| Production build | Passed, 61 generated route entries; no build warnings |
| `git diff --check` | Passed; Git may print Windows line-ending conversion notices |
| Backend tests | Not rerun: no backend code or shared API/business contract changed |

Focused tests cover typed English copy, safe feedback, shared account presentation/alias active states, locale persistence/in-place refresh/direction, shared English marketplace structure and arrows, and source product/CMS selection. Existing tests were updated where they referenced the intentionally removed legacy branches.

## Accepted limitations and stop boundary

- Populated CMS/articles and populated order detail still need genuine local content for visual validation.
- Google login configuration, real password-reset delivery, installation of the APK, production delivery/payment, and actual order submission were not tested or altered.
- Profile evidence uses unsaved blank personal fields; addresses evidence uses the blank editor. The real existing populated local address was reviewed without recording its private content.
- Screenshots use browser viewport captures because stitched full-page captures duplicated fixed/sticky content. The development indicator and browser scrollbar may be visible; these are local review artifacts.
- Dari/Pashto are frozen. English awaits visual approval. No final English commit, push, deployment, admin work or Flutter work was performed.

Evidence directory: `tmp/english-final-qa/` (ignored). Open `review.html` for all required English captures, narrow/intermediate samples, RTL regression captures and safe validation examples. `measurements.json` contains the live route/locale/direction/overflow/navigation observations. Check logs and the final status snapshot are stored alongside it.

## Exact working-tree status at handoff

All entries are unstaged or untracked; there are no staged changes. The two old Dari audit files and status-only next-env/tsconfig entries predate this phase.

```text
 M website/app/about/page.tsx
 M website/app/account/page.tsx
 M website/app/app/page.tsx
 M website/app/cart/cart.module.css
 M website/app/cart/page.tsx
 M website/app/categories/[slug]/page.tsx
 M website/app/categories/categories.module.css
 M website/app/categories/page.tsx
 M website/app/checkout/page.tsx
 M website/app/contact/page.tsx
 M website/app/health-articles/[slug]/page.tsx
 M website/app/health-articles/page.tsx
 M website/app/layout.tsx
 M website/app/loading.tsx
 M website/app/login/page.tsx
 M website/app/manufacturers/[slug]/page.tsx
 M website/app/manufacturers/manufacturers.module.css
 M website/app/manufacturers/page.tsx
 M website/app/medicines/[id]/page.tsx
 M website/app/orders/[id]/page.tsx
 M website/app/page.tsx
 M website/app/pages/[slug]/page.tsx
 M website/app/prescriptions/page.tsx
 M website/app/prescriptions/success/[id]/page.tsx
 M website/app/privacy/page.tsx
 M website/app/register/page.tsx
 M website/app/shop/layout.tsx
 M website/app/terms/page.tsx
 M website/components/AccountShell.module.css
 M website/components/AccountShell.tsx
 M website/components/AddToCart.tsx
 M website/components/AddressBook.tsx
 M website/components/AppChrome.tsx
 M website/components/ApplicationState.tsx
 M website/components/AuthForm.tsx
 M website/components/Catalogue.tsx
 M website/components/Header.tsx
 M website/components/InfoPage.tsx
 M website/components/MedicineCard.tsx
 M website/components/ProductDetail.tsx
 M website/components/StaticInfoPage.tsx
 M website/components/home/MarketplaceChrome.module.css
 M website/components/home/MarketplaceHome.module.css
 M website/components/home/MarketplaceHome.tsx
 M website/lib/account-feedback.ts
 M website/lib/checkout-feedback.ts
 M website/lib/customer-copy.ts
 M website/lib/marketplace-copy.ts
 M website/next-env.d.ts
 M website/test/account-feedback.test.mjs
 M website/test/customer-workflow.test.mjs
 M website/test/final-polish-contract.test.mjs
 M website/test/marketplace-locale.test.mjs
 M website/test/public-cms.test.mjs
 M website/tsconfig.json
?? "docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md"
?? docs/DARI_CUSTOMER_SITE_AUDIT.md
?? docs/FINAL_ENGLISH_CUSTOMER_WEBSITE_REPORT.md
?? website/test/english-customer.test.mjs
```

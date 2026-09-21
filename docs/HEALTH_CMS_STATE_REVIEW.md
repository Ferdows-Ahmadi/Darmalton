# Dari Health, CMS and shared-state review

Review date: 2026-09-21. Status: implemented and verified within the limitations below; **uncommitted, awaiting visual approval**.

## Approved utility checkpoint

`fe94f9b09b6a77fb125cf94b8a524b81cb44d607` — `Approve compact Dari utility document family`.

Only the approved utility implementation, localized counters, focused test and report were committed. Generated files were excluded. Nothing was pushed or deployed.

## Exact files in this phase

Modified:

- `website/app/error.tsx`
- `website/app/health-articles/[slug]/page.tsx`
- `website/app/health-articles/page.tsx`
- `website/app/loading.tsx`
- `website/app/not-found.tsx`
- `website/app/pages/[slug]/page.tsx`
- `website/components/CmsInfoPage.tsx`
- `website/components/HealthArticleCard.tsx`
- `website/components/InfoPage.tsx`
- `website/lib/locale.ts`

Added:

- `website/app/health-articles/[slug]/not-found.tsx`
- `website/app/health/[slug]/not-found.tsx`
- `website/app/pages/[slug]/not-found.tsx`
- `website/components/ApplicationState.module.css`
- `website/components/ApplicationState.tsx`
- `website/components/HealthContent.module.css`
- `website/lib/cms-locale.ts`
- `website/test/cms-state.test.mjs`
- `docs/HEALTH_CMS_STATE_REVIEW.md`

Affected routes: `/health-articles`, `/health`, `/health-articles/[slug]`, `/health/[slug]`, `/pages/[slug]`, and shared loading/error/404 boundaries. Existing health aliases retain their implementations. `app/shop/loading.tsx` remains unchanged and reuses the updated global loading component.

## Presentation and localization

Health index and source templates use the approved compact document width, restrained teal surfaces, typography and responsive spacing. Styling is scoped to Dari. Article and CMS image containers have explicit positioned bounds for the existing fill images. The generic CMS document reuses approved utility presentation. No storefront chrome or global CSS changed.

Four states remain semantically distinct: a genuinely empty published-article index, a missing article, a missing CMS information page, and a general application 404. Missing articles link to the existing article index; missing CMS and general 404 link home. Article and CMS context/metadata use locale keys rather than fixed language text.

Loading now has localized `role="status"` text and `aria-label`, including Dari `در حال بارگذاری…`; decorative skeletons are hidden from the accessibility tree. Compact responsive skeletons retain shared Shop reuse and existing reduced-motion support.

Error presentation uses existing safe localized copy and a localized retry button. The reset callback is preserved. Error message, stack and digest are not rendered; existing developer-console logging is unchanged. Main-content accessibility labels and actions in the captured states had no unintended English fallback. Legitimate brand, locale choices, technical values and backend content were retained.

## CMS locale readiness and limitations

CMS callers now pass locale explicitly. A shared `cmsText` helper consistently selects existing source fields: Dari prefers Dari then English; other locales prefer English then Dari. Selection does not translate or fabricate source content. Titles, summaries, body content, publication values and images retain their existing data contracts.

**Pashto is not content-ready:** current article/CMS schema exposes English and Dari fields only. The helper's Pashto result is an English/Dari source fallback, not Pashto content. This makes article and CMS selection consistent but does not constitute a Pashto rollout. Proper Pashto fields/content and locale QA remain future work. No English/Pashto visual rollout was performed.

Read-only local API checks returned zero published health articles and zero generic CMS pages. No records were created for this review. Existing public CMS fetching still collapses request failure to an empty result; this phase does not add a network-failure distinction. Current emptiness was independently confirmed against the healthy local API.

## Actual browser verification

The following five states were captured and checked at **1440, 768, 390 and 320 pixels** (20 screenshots). Each had RTL direction, no horizontal overflow, and localized main-content labels. Return actions measured at least 44px high.

| State | Existing route tested | Evidence filename prefix |
| --- | --- | --- |
| Genuine empty health index | `/health-articles` | `health-empty` |
| Health index alias | `/health` | `health-alias` |
| Missing article | `/health-articles/qa-missing-article` | `missing-article` |
| Missing CMS | `/pages/qa-missing-page` | `missing-cms` |
| General 404 | `/qa-missing-route` | `not-found` |

The test slugs are requests for nonexistent content, not new application routes or records. `/health/qa-missing-article` was additionally captured at 390px and resolved to the article-specific missing state.

The 404 return-home link was clicked and its final URL verified as `/`. The article alias return link was clicked and verified at `/health-articles` with the genuine empty heading. An initial instrumentation check read the URL before client navigation finished; the final check waits for the destination and passes.

The actual transient loading state was captured at 390px during local navigation. No safe existing browser interaction was found to trigger the global error boundary, so there is **no browser error screenshot**. Instead, the real TSX error and loading components were compiled and rendered in focused tests with framework/context stubs. Tests verify safe output, localized accessibility text, decorative skeleton semantics and the actual retry callback. This verifies component behavior, not browser error-boundary recovery or its visual appearance.

**Source-reviewed only:** populated article cards, populated article detail and populated generic CMS page. Their layout, source-field selection and image bounds were inspected, but actual populated-content visual approval remains unavailable because the local CMS is empty. No medical content, authors or publication dates were fabricated.

## Approved-page regression

- Home 1440: screenshot reviewed; no overflow, no broken rendered images.
- Shop 390: screenshot reviewed; 12 genuine product headings, no overflow. Existing neutral product-image fallbacks remain unchanged.
- About 390: compact approved document retained; no overflow.
- Login 390: approved form/chrome retained, no overflow. Final screenshot has both credential fields blank; no login or account mutation was performed.

No browser console errors were observed in the checked navigation/regression session. Shared header/footer implementation was not modified.

## Engineering checks

- Frontend suite: **82 passed, 0 failed**, including five new focused CMS/state tests.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed, 61 generated pages. Existing Checkout CSS warning remains: Autoprefixer recommends `flex-start` instead of `start` at `app/checkout/checkout.module.css:32`. The related Webpack cache warning is non-blocking; this approved unrelated file was not changed.
- `git diff --check`: passed.
- Backend account tests were not rerun: no backend, account behavior, API contract or database change in this phase.

Local test/build logs and browser measurements are under `tmp/health-state-review/` (ignored local evidence, not staged).

## Screenshot index

Each matrix link is a real screenshot at the named width. Paths are relative to this report.

| State | 1440 | 768 | 390 | 320 |
| --- | --- | --- | --- | --- |
| Empty index | [1440](../tmp/health-state-review/health-empty-1440.png) | [768](../tmp/health-state-review/health-empty-768.png) | [390](../tmp/health-state-review/health-empty-390.png) | [320](../tmp/health-state-review/health-empty-320.png) |
| Health alias | [1440](../tmp/health-state-review/health-alias-1440.png) | [768](../tmp/health-state-review/health-alias-768.png) | [390](../tmp/health-state-review/health-alias-390.png) | [320](../tmp/health-state-review/health-alias-320.png) |
| Missing article | [1440](../tmp/health-state-review/missing-article-1440.png) | [768](../tmp/health-state-review/missing-article-768.png) | [390](../tmp/health-state-review/missing-article-390.png) | [320](../tmp/health-state-review/missing-article-320.png) |
| Missing CMS | [1440](../tmp/health-state-review/missing-cms-1440.png) | [768](../tmp/health-state-review/missing-cms-768.png) | [390](../tmp/health-state-review/missing-cms-390.png) | [320](../tmp/health-state-review/missing-cms-320.png) |
| General 404 | [1440](../tmp/health-state-review/not-found-1440.png) | [768](../tmp/health-state-review/not-found-768.png) | [390](../tmp/health-state-review/not-found-390.png) | [320](../tmp/health-state-review/not-found-320.png) |

Additional captures: [article alias 390](../tmp/health-state-review/missing-article-alias-390.png), [loading 390](../tmp/health-state-review/loading-390.png), [Home 1440](../tmp/health-state-review/home-1440-regression.png), [Shop 390](../tmp/health-state-review/shop-390-regression.png), [About 390](../tmp/health-state-review/about-390-regression.png), [Login 390](../tmp/health-state-review/login-390-regression.png).

## Git and stop boundary

Branch: `reference-ui-transplant-homepage`. HEAD remains utility checkpoint `fe94f9b09b6a77fb125cf94b8a524b81cb44d607`. Index is empty. This phase has 10 modified implementation files and 9 new implementation/test/report files, all unstaged.

Pre-existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` were preserved. `website/next-env.d.ts` and `website/tsconfig.json` remain status-marked by the existing workspace/generated-file state but have no textual Git diff; neither is staged.

Local review remains at `http://127.0.0.1:3002/health-articles`, with API on port 8000. Stopped for visual approval. No final Dari sweep, additional locale rollout, admin/Flutter work, push or deployment was started.

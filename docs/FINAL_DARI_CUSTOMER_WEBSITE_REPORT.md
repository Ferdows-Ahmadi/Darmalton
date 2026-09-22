# Final Dari customer website report

Date: 2026-09-21. **DARI CUSTOMER WEBSITE READY** for completion of the approved Dari UI implementation, subject to the accepted real-content validation limits below. Final QA corrections are deliberately uncommitted pending visual approval. This is local customer UI verification, not production deployment certification.

## Approved checkpoint

`b3dcee18d6496b41c2384dbba4ef3fe5ea66fe17` — `Approve Dari health CMS and shared application states`.

The reviewed checkpoint contains the approved Health/CMS presentation, shared application states, localized loading/accessibility, CMS locale helper, focused tests and review report. Generated/no-content-diff files were excluded. Nothing was pushed or deployed.

## Route-by-route coverage

Source of truth: `docs/DARI_CUSTOMER_SITE_AUDIT.md`, all 46 customer page routes. Its historical findings have been superseded by the subsequent approved phases and this final sweep. No staff/admin/API/internal route is included in this customer review.

“Pass” means the available local state loaded with the approved presentation. Unavailable populated templates are explicitly identified; source inspection is not presented as populated visual validation.

| Customer route/template | Final result |
| --- | --- |
| `/` | Pass; long homepage, responsive chrome, imagery and footer. |
| `/shop` | Pass; query search, filters, sort, pagination and mobile filter panel. |
| `/categories` | Pass; index and real category links. |
| `/categories/[slug]` | Pass using Antibiotic; pagination/filter/sort retain category context. |
| `/manufacturers` | Pass; index, localized counts and short desktop footer. |
| `/manufacturers/[slug]` | Pass using Getz pharma; sort/pagination retain manufacturer context. |
| `/medicines/[id]` | Pass; real Amlo variants, price, stock and Rx presentation. |
| `/cart` | Pass; original populated guest cart, temporary add/change/remove, then exact restoration. |
| `/checkout` | Pass; guest authentication redirect, authenticated saved-address presentation, blank new-address form and client validation. No order/address created. |
| `/checkout/login` | Pass; approved auth wrapper and return context. |
| `/login` | Pass; local demo login with return path, then logout. |
| `/register` | Pass; form and native Dari validation; no account created. |
| `/forgot-password` | Pass; honest local recovery-unavailable guidance. |
| `/reset-password` | Pass; honest unavailable reset guidance. |
| `/account` | Pass; existing demo overview and correct navigation. Late failure-path fix covered by focused component test; final guest redirect rechecked in browser. |
| `/account/profile` | Pass; existing form and compact account shell; no data edited. |
| `/account/addresses` | Pass; existing populated state; no mutation. |
| `/account/addresses/new` | Pass; blank create form; not submitted. |
| `/account/addresses/[id]/edit` | Pass; existing edit form; not saved. |
| `/account/orders` | Pass; genuine empty state. |
| `/account/orders/[id]` | Safe missing/unavailable state passed; populated order template source-reviewed only because no local orders exist. |
| `/account/prescriptions` | Pass; upload/history and existing harmless cancelled local test prescription. |
| `/account/prescriptions/[id]` | Pass; existing cancelled test detail; private file not opened. |
| `/account/notifications` | Pass; existing state and correct account navigation; no read-status mutation. |
| `/orders` | Pass; shared account orders implementation and Account parent state. |
| `/orders/[id]` | Pass for safe unavailable state; same populated-template limitation. |
| `/orders/success/[id]` | Existing redirect to `/account/orders/<id>?placed=1` verified with a missing identifier, without creating an order. |
| `/notifications` | Pass; shared notifications implementation and Account parent state. |
| `/prescriptions` | Pass; shared upload/history implementation and intended Rx parent. |
| `/prescriptions/upload` | Pass; shared upload entry point; no upload. |
| `/prescriptions/success/[id]` | Existing success template loaded with the harmless local test identifier; no new prescription created. |
| `/app` | Pass; exact Android URL preserved; iOS honestly inactive. |
| `/about` | Pass; compact document and footer. |
| `/contact` | Pass; honest contact-information placeholder. |
| `/help` | Pass; localized step treatment. |
| `/faq` | Pass; native disclosure opens/closes, including early interaction. |
| `/privacy` | Pass; approved compact document. |
| `/terms` | Pass; approved compact document. |
| `/delivery-policy` | Pass; approved compact document. |
| `/returns` | Pass; approved compact document. |
| `/prescription-help` | Pass; approved guidance and upload destination. |
| `/health-articles` | Pass; genuine empty state. |
| `/health` | Pass; same index implementation, not a separate redesign. |
| `/health-articles/[slug]` | Missing-article state passed; populated template source-reviewed, awaiting real content. |
| `/health/[slug]` | Same article-detail implementation and missing state passed. |
| `/pages/[slug]` | Missing-CMS state passed; populated template source-reviewed, awaiting real content. |

Special states: general 404 passed; localized loading observed during navigation; Shop loading shares the global implementation. Shared error component, safe messaging and retry are covered by source review and existing focused tests. A browser crash was not deliberately induced.

## Defects found and exact final corrections

| Defect | Narrow correction / files |
| --- | --- |
| Cart load/update/remove and shared AddToCart could expose English/raw backend error messages in Dari. | Reuse the existing localized `checkoutError` mapper in `website/app/cart/page.tsx` and `website/components/AddToCart.tsx`. Preserve guest 401 fallback, Rx routing and request contracts. |
| Native required/email validation on customer auth forms followed the browser language. | Dari/customer-only validation interception and validity clearing in `website/components/AuthForm.tsx`, using existing `accountValidation`. Staff behavior unchanged. |
| UI-generated manufacturer and variant counts used raw digits. | Dari `formatNumber` in `website/components/DirectoryPage.tsx`, `MedicineCard.tsx`, and `Header.tsx`. Medicine strength, SKU, pack source values and AFN price behavior unchanged. |
| Footer group ordinals and carousel accessibility strings were not fully localized. | Format footer ordinals in `website/components/AppChrome.tsx`; localize carousel role description and slide counters in `HeroCarousel.tsx`. No shared layout change. |
| Mobile header icon links lacked accessible names; account header destination lacked parent current state. | Explicit translated account/login/cart aria-labels and Dari account/order/notification parent `aria-current` in `website/components/Header.tsx`. |
| Checkout production build emitted an Autoprefixer flex alignment warning. | Only `.items li` flex `align-items: start` becomes semantically equivalent `flex-start` in `website/app/checkout/checkout.module.css`. |
| Early native FAQ disclosure interaction could change `open` before hydration and produce an attribute warning. | In `website/components/StaticInfoPage.tsx`, Dari-only `suppressHydrationWarning` on the native `details` element acknowledges its browser-owned open state. No content, layout or disclosure behavior change; rapid interaction/reload rechecked with clean console. |
| Account overview could remain loading after a non-401 request failure. | In `website/app/account/page.tsx`, show existing localized `accountError` in an alert for Dari; preserve the 401 return-path redirect. |

New `website/test/customer-final-qa.test.mjs` exercises the real transpiled AddToCart, Cart and Account handlers with narrow dependency stubs: localized server failures, suppression of backend sentinel text, guest fallback/Rx routing, PATCH/DELETE requests and account 401/error behavior. New report: this file.

There are 11 intentional modified source files, one new focused test file and this report. No route-specific redesign was made. All route bodies without a file above required no final changes, including catalogue detail, product layout, Profile/address/orders/prescription/notification layouts, App, document copy, Health/CMS and shared not-found/loading/error presentation. Shared labels were regression-sampled across these approved families.

## Visual consistency and short footer decision

No remaining legacy dark footer, giant legacy hero/card treatment, old teal page sections, oversized form geometry or route-specific old chrome was found in the reviewed Dari customer states. Approved typography, spacing and card system are preserved.

**Retain the approved natural-flow compact footer.** At 1440×1000 its height is about 246px. It begins directly after the content: Manufacturers ends near y=855, Login near y=973, About/recovery near y=679, Health near y=623 and not-found near y=565. The white canvas below the footer is intentional and preferable to recreating a large content-to-footer gap or stretching the footer. Long Home/Shop/account/checkout flows remain natural. Mobile bottom-navigation clearance was inspected, including the end of the long homepage; controls are not covered. No footer CSS adjustment was made.

## Localization, numbers and RTL

Customer-facing labels, buttons, empty states, errors, validation, success feedback, loading, navigation, breadcrumbs, pagination/filter controls and accessibility labels were source-audited and sampled in the browser. The final leaks identified above are corrected. No remaining actionable UI-controlled English fallback was found in this reviewed scope. Legitimate medicine/manufacturer names, technical identifiers, filenames, PDF, email values, language endonyms and untranslated backend content remain intact. UI-generated counts now use the Dari formatter where corrected; AFN behavior is unchanged.

All measured final states use RTL and have zero document horizontal overflow. Breadcrumbs, directional controls, product cards, form labels, filters, pagination, account navigation, active indicators and mobile drawers were inspected. No visible RTL defect requiring a layout correction was found. This does not claim every unavailable backend payload has been visually validated.

## Responsive matrix

| Representative family | 1440 | 768 | 390 | 320 |
| --- | --- | --- | --- | --- |
| Homepage / Shop | Pass | Pass | Pass | Pass |
| Category / manufacturer detail | Pass | Pass | Pass | Pass |
| Product / cart | Pass | Pass | Pass | Pass |
| Checkout blank address / validation | Pass | Pass | Pass | Pass |
| Login / Register | Pass | Pass | Pass | Pass |
| Profile / addresses / prescriptions | Pass | Pass | Pass | Pass |
| About / FAQ | Pass | Pass | Pass | Pass |
| Health empty / not-found | Pass | Pass | Pass | Pass |
| App | Pass | Pass | Pass | Pass |

Other utility pages, aliases, address editor, prescription detail/success, notifications and safe order states received targeted 390px coverage. Manufacturers, Login, About, Health, not-found and recovery also received short desktop composition review. No issue warranted additional 1024/412 breakpoint checks. Evidence files contain repeated observations as well as distinct combinations; their row totals are not unique test-case counts.

## Functional sanity and safety

- Header search for Amclav reaches `/shop?search=Amclav` and settles on matching results.
- Category pagination retains its category path; sorting resets pagination while retaining context; stock filtering retains category and ordering. Manufacturer sort/pagination similarly retain the manufacturer path. Mobile filters open.
- Existing Amlo 5mg/10mg variant selection changes the product route and selected state; displayed prices/stock and Rx/non-Rx presentation were checked against their visible source values.
- A temporary guest-cart product was added, increased, decreased and removed. The original guest cart was restored exactly: its original single Amclav Plus line and quantity remained. No checkout order was created.
- Existing local demo login returned to Profile. Authenticated account routes and checkout loaded. Demo login used a separate localhost origin whose guest cart was first confirmed empty, avoiding synchronization of the original 127.0.0.1 guest cart. Demo was logged out; temporary origin locale restored and tab closed.
- Existing address/profile data was read only. Blank checkout address validation was triggered without submission. No account/address/order or prescription was created, updated, cancelled or uploaded for this sweep.
- Existing harmless cancelled local test prescription was retained. No private prescription material was opened or included in evidence.
- Android CTA remains exactly `https://darmalton.com/downloads/darmalton-android-1.0.0.apk`. No APK was downloaded or deployed. iOS remains inactive. FAQ disclosure interaction passed.

## Shared navigation and active state

Desktop/drawer mapping: category detail → Categories; manufacturer detail → Manufacturers; product detail → Shop. Account descendants and standalone order/notification aliases → Account; standalone prescription entry points → intended Rx section. Account prescription descendants correctly remain within Account. Mobile catalogue descendants → Shop; cart/checkout → Cart; account/order/notification → Account; standalone prescription upload/success → Rx. Top-level Home/Shop/Categories/Manufacturers/App destinations and account-shell destinations are correct. Drawer `aria-current` was inspected and parent mapping has focused test coverage. Utility pages appropriately have no unrelated active primary item. Health navigation remains intentionally hidden while no articles are published; direct routes still work.

## Assets, console and overflow

Recorded public/account/auth measurements show zero document overflow and no broken rendered images. Legitimate fallback imagery remains usable. No clipped interactive control was found in the targeted checks. No fresh unhandled console/hydration error remained after the FAQ correction; a final FAQ and protected-route check returned an empty warning/error log. Expected protected or missing-resource states were not misclassified as browser exceptions.

## Checks

| Check | Result |
| --- | --- |
| Full frontend tests (`npm test`) | **86 passed, 0 failed** |
| TypeScript (`npm run typecheck`) | Passed after final source corrections |
| ESLint (`npm run lint`) | Passed after final source corrections |
| Production build (`NEXT_DIST_DIR=.next-build npm run build`) | Passed, 61 generated pages; **no warning/error output** |
| `git diff --check` | Passed |
| Backend tests | Not rerun: no backend, account API contract or business rule changed; final error handling is frontend-only and covered by focused frontend tests. |

Logs and DOM measurements are local ignored evidence under `tmp/final-dari-qa/`. The temporary generated `.next-build` type reference was returned to the development `.next` reference; generated/no-content-diff files are not part of the intentional patch.

## Accepted limitations

No published local articles or generic CMS pages exist. Populated article cards/detail and generic CMS pages remain pending real-content visual validation. Their source structure, locale selection, empty/missing states and focused tests are covered. No records were fabricated. Populated order detail remains source-reviewed only because no local orders exist; safe missing and redirect states were checked. No real order, private prescription upload, production delivery/payment, password recovery email, Google sign-in configuration, APK binary or iOS release was tested. These limits do not prevent completion of the approved Dari UI implementation.

## Requested final screenshots

Actual local browser captures, not mockups. Account evidence uses the empty Orders page inside the shared shell to avoid displaying personal-looking demo values. Checkout evidence uses the blank unsaved address form.

| Evidence | Capture |
| --- | --- |
| Homepage 1440 | [Open](../tmp/final-dari-qa/homepage-1440.png) |
| Homepage 390 | [Open](../tmp/final-dari-qa/homepage-390.png) |
| Shop 1440 | [Open](../tmp/final-dari-qa/shop-1440.png) |
| Product detail 390 | [Open](../tmp/final-dari-qa/product-390.png) |
| Checkout 390 | [Open](../tmp/final-dari-qa/checkout-390.png) |
| Account shell / Orders 390 | [Open](../tmp/final-dari-qa/account-390.png) |
| About 390 | [Open](../tmp/final-dari-qa/about-390.png) |
| App 390 | [Open](../tmp/final-dari-qa/app-390.png) |
| Health empty 390 | [Open](../tmp/final-dari-qa/health-390.png) |
| Short desktop / Manufacturers 1440 | [Open](../tmp/final-dari-qa/manufacturers-1440.png) |
| Corrected native Dari validation | [Open](../tmp/final-dari-qa/register-validation-390.png) |
| Representative 320 | [Open](../tmp/final-dari-qa/register-320.png) |

## Git status and stop boundary

Branch: `reference-ui-transplant-homepage`. HEAD is the approved checkpoint above. Nothing staged. The 11 source files, focused test and this report remain uncommitted for approval. Pre-existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` are preserved. `website/next-env.d.ts` and `website/tsconfig.json` remain status-marked with no textual content diff. Screenshot/log artifacts are ignored, not staged.

Local review remains at `http://127.0.0.1:3002/`. No push, deployment, new language rollout, admin change or Flutter change was made. Final Dari sweep complete; stop for review.

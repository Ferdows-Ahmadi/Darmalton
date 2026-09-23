# Final Pashto Customer Website Report

Completed: 2026-09-23 (QA captures span September 22–23). Local review: http://127.0.0.1:3002/ (select پښتو).

**PASHTO CUSTOMER WEBSITE READY** for visual approval, with the real-content limitations below. Full propagation remains uncommitted.

## 1. Approved checkpoint

`183d43bd5bdb0f8cb4b8d0603faa71e551de2354` — `Approve Pashto marketplace homepage and shared chrome`.

This contains only the approved homepage/shared-chrome milestone. Branch: `pashto-storefront-propagation`. Nothing was pushed or deployed.

## 2. Route/template coverage

All 46 customer route implementations in the existing route audit were reviewed. Dynamic routes used existing local catalogue/demo records or genuine missing states. Aliases were exercised without creating parallel implementations.

| Family | Route/template | Verification |
|---|---|---|
| Core commerce | `/` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/shop` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/categories` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/categories/[slug]` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/manufacturers` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/manufacturers/[slug]` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/medicines/[id]` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/cart` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/checkout` | Browser render, Pashto/RTL, navigation and overflow check |
| Core commerce | `/checkout/login` | Browser render, Pashto/RTL, navigation and overflow check |
| Authentication | `/login` | Browser render, Pashto/RTL, navigation and overflow check |
| Authentication | `/register` | Browser render, Pashto/RTL, navigation and overflow check |
| Authentication | `/forgot-password` | Browser render, Pashto/RTL, navigation and overflow check |
| Authentication | `/reset-password` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account/profile` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account/addresses` | Existing populated local demo address book inspected privately |
| Account | `/account/addresses/new` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account/addresses/[id]/edit` | Existing local demo edit form loaded; no address saved |
| Account | `/account/orders` | Genuine empty order history; account navigation |
| Account | `/account/orders/[id]` | Genuine missing-record state; populated template source reviewed, no local populated order |
| Account | `/account/prescriptions` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account/prescriptions/[id]` | Browser render, Pashto/RTL, navigation and overflow check |
| Account | `/account/notifications` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/app` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/about` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/contact` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/help` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/faq` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/privacy` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/terms` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/delivery-policy` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/returns` | Browser render, Pashto/RTL, navigation and overflow check |
| Marketing and documents | `/prescription-help` | Browser render, Pashto/RTL, navigation and overflow check |
| Content and aliases | `/health` | Genuine empty published-article list; alias verified |
| Content and aliases | `/health-articles` | Genuine empty published-article list; alias verified |
| Content and aliases | `/health-articles/[slug]` | Genuine missing state; populated source structure reviewed, no content fabricated |
| Content and aliases | `/health/[slug]` | Genuine missing state; populated source structure reviewed, no content fabricated |
| Content and aliases | `/pages/[slug]` | Genuine missing state; populated source structure reviewed, no content fabricated |
| Content and aliases | `/notifications` | Browser render, Pashto/RTL, navigation and overflow check |
| Content and aliases | `/orders` | Genuine empty order history; account navigation |
| Content and aliases | `/orders/[id]` | Genuine missing-record state; populated template source reviewed, no local populated order |
| Content and aliases | `/orders/success/[id]` | Existing redirect to account detail with placed=1; missing record, no order submitted |
| Content and aliases | `/prescriptions` | Browser render, Pashto/RTL, navigation and overflow check |
| Content and aliases | `/prescriptions/upload` | Browser render, Pashto/RTL, navigation and overflow check |
| Content and aliases | `/prescriptions/success/[id]` | Success template loaded with existing harmless test ID; no upload submitted |

Global 404, application loading (including accessibility text), Shop loading, and shared error implementation were also reviewed. Error rendering and feedback are covered by focused tests; no artificial production outage was induced.

## 3. Exact implementation changes

- Extended approved presentation gates from Dari-only to both RTL locales for catalogue/directory/detail pages, cart/checkout, auth, account shell, documents, App, CMS and shared states. Existing styles, geometry, spacing, assets and shared components are reused. No CSS file or declaration was changed and no duplicate route tree was created.
- Added typed Pashto copy for product, cart, checkout and the approved App component, including contextual/accessible labels. Dari strings remain the literal source values. Existing English branches remain intact.
- Extended safe account/checkout error mappings and native validation to Pashto; arbitrary backend error text is not displayed as Pashto UI. Stored backend names, messages, medicine information and filenames are not translated.
- Extended account alias active-path normalization to Pashto. Counters use the existing locale number formatter; AFN pricing semantics are unchanged.
- Corrected Profile PATCH under Pashto: omit unsupported `ps-AF` from the API language preference. The API supports fa/en; its saved preference is retained while the storefront cookie selects Pashto. Dari/English payloads remain unchanged.
- Localized the default new checkout address label for Pashto only.
- Corrected Pashto history timestamps where browser ICU fell back to English AM/PM/month names. Use numeric Gregorian dates, localized digits and 24-hour time; preserve exact existing Dari/English formatting.
- Localized remaining Pashto browser-tab titles and root description. Dari/English metadata values remain unchanged; the Health alias shares the same metadata function.
- Added focused tests for safe feedback, structural/data equivalence, Profile payload and timestamp fallback. Adjusted existing tests for the shared helper.

## 4. Files changed

- `website/app/about/page.tsx`
- `website/app/account/page.tsx`
- `website/app/app/page.tsx`
- `website/app/cart/page.tsx`
- `website/app/categories/[slug]/page.tsx`
- `website/app/categories/page.tsx`
- `website/app/checkout/page.tsx`
- `website/app/contact/page.tsx`
- `website/app/health-articles/[slug]/page.tsx`
- `website/app/health-articles/page.tsx`
- `website/app/health/page.tsx`
- `website/app/layout.tsx`
- `website/app/loading.tsx`
- `website/app/login/page.tsx`
- `website/app/manufacturers/[slug]/page.tsx`
- `website/app/manufacturers/page.tsx`
- `website/app/medicines/[id]/page.tsx`
- `website/app/notifications/page.tsx`
- `website/app/orders/[id]/page.tsx`
- `website/app/pages/[slug]/page.tsx`
- `website/app/prescriptions/page.tsx`
- `website/app/prescriptions/success/[id]/page.tsx`
- `website/app/privacy/page.tsx`
- `website/app/register/page.tsx`
- `website/app/shop/layout.tsx`
- `website/app/terms/page.tsx`
- `website/components/AccountShell.tsx`
- `website/components/AddToCart.tsx`
- `website/components/AddressBook.tsx`
- `website/components/ApplicationState.tsx`
- `website/components/AuthForm.tsx`
- `website/components/Catalogue.tsx`
- `website/components/DirectoryPage.tsx`
- `website/components/InfoPage.tsx`
- `website/components/OrderCard.tsx`
- `website/components/PrescriptionDetail.tsx`
- `website/components/ProductDetail.tsx`
- `website/components/ProfileEditor.tsx`
- `website/components/StaticInfoPage.tsx`
- `website/lib/account-feedback.ts`
- `website/lib/checkout-feedback.ts`
- `website/lib/locale.ts`
- `website/test/account-feedback.test.mjs`
- `website/test/customer-final-qa.test.mjs`
- `website/lib/customer-copy.ts`
- `website/test/pashto-customer.test.mjs`
- `docs/FINAL_PASHTO_CUSTOMER_WEBSITE_REPORT.md`

## 5. Localization and RTL

Customer UI gates and dictionaries were searched and reviewed. Pashto labels, CTAs, validation, status/empty/error/loading feedback, breadcrumbs, navigation and accessibility text now use shared localized output. Remaining Dari selectors intentionally choose language-specific data or preserve API contracts; legacy English-only component paths were not redesigned.

RTL document direction, logical layout, account navigation, product variants, filters, breadcrumbs, pagination and mobile drawers were checked. Category drawer `aria-current=page` resolves to `/categories`; manufacturer and product parents retain the catalogue mapping. Account descendants and order/notification aliases select Account; prescription account views select prescriptions in the account shell, while upload uses the intended Rx navigation. All visible account destinations resolve to existing routes.

Medicine strengths, pack/source values, SKU, manufacturer names, email values, PDF and backend notes remain legitimate source data. Existing marketing image pixels are unchanged; embedded artwork is not newly translated.

## 6. Responsive, assets and console

120 distinct recorded layout QA samples cover 1440, 1024, 768, 390 and 320 pixels. Home, Shop and Register were checked at all five widths. Account orders, address creation, prescriptions and checkout were sampled at 320/390/768/1024/1440. Product, App, FAQ and Health received additional 768/1440 sampling. Remaining route families were reviewed at 390.

No document horizontal overflow or broken visible image was recorded in the final sample for any label. Legitimate medicine image fallbacks render. No clipped interactive control was observed in the reviewed views. The fresh representative console sweep and final metadata-route sweep recorded zero warnings/errors and no hydration errors (`console-final.json`). Development tools indicators in screenshots are local Next.js UI, not production chrome.

## 7. Safe functional checks

| Flow | Result |
|---|---|
| Header search | Amclav query reaches Shop with query context |
| Catalogue | Price sort, in-stock/maximum-price filters and pagination work; category/manufacturer context retained |
| Product | Existing 5mg/10mg variant links select correct product; price/stock/Rx presentation follows data |
| Guest cart | Add, increment, decrement and remove exercised; original one-item cart restored (140 AFN) |
| Account cart | Existing three-unit demo cart retained (192 AFN); not modified |
| Authentication | Fresh documented local demo login returned to Profile; logout afterward |
| Profile | Unchanged demo profile save succeeded; blank required-field validation showed Pashto feedback; no new personal data |
| Addresses | Existing list/edit loaded; blank new-form validation checked; no create/delete/default mutation |
| Prescription | Empty-upload validation localized; existing harmless cancelled test history/detail and success template loaded; no upload/cancellation mutation |
| Checkout | Guest authentication redirect and authenticated blank-address validation checked; five required fields highlighted; no order created |
| FAQ | Disclosure interaction works |
| App | Android CTA retains exactly https://darmalton.com/downloads/darmalton-android-1.0.0.apk; iOS honestly inactive |

## 8. Locale switching and Dari regression

Dari ↔ Pashto was exercised across Shop/query context, cart and protected account/checkout views. Route/query and RTL remained appropriate. Guest cart and demo session survived locale changes; the account was logged out after checks.

Dari regression captures cover Home (1440/390), Shop (1440/390), category detail, product, cart, checkout, login, account, About, App, Health and 404. Approved layout remains effectively unchanged. Product, account/orders and checkout captures matched the earlier same-sized references exactly in a pixel comparison. Other image differences include scroll position, autofill/focus, dynamic catalogue data and the already approved shared chrome; these were visually reviewed, not asserted to be exact pixel matches. Login evidence was recaptured with blank fields. No new layout CSS was introduced.

## 9. Engineering checks

| Check | Result |
|---|---|
| Full frontend tests | 94 passed, 0 failed |
| TypeScript | Passed |
| ESLint | Passed |
| Production build | Passed; all 61 pages generated; no warning/error in final build log |
| git diff --check | Passed |
| Relevant backend account tests | 3 passed via pytest `tests/test_account_settings.py` with local SQLite test configuration |

Backend tests were included because the Profile request payload correction touches the account integration contract. No backend code, migration or schema changed. Admin, Flutter and production were outside this pass. Check logs are in `tmp/pashto-final-qa/`.

## 10. Accepted limitations and remaining defects

No known blocking Pashto customer UI defect remains in the tested scope. Visual approval is still required.

- No published local CMS pages/health articles exist. Populated cards, articles and CMS bodies still require real-content visual validation. No records were fabricated.
- CMS has only English/Dari source fields. Pashto UI is localized, but CMS content retains the existing English-first/Dari-fallback source selection; no Pashto CMS schema or translated content is claimed.
- No populated local orders exist. Empty/missing states, route aliases, source structure and focused tests were reviewed; populated order visual validation remains pending genuine data.
- Recovery email and Google login are not configured locally. Their honest unavailable states were checked, not external delivery/sign-in.
- No new order, account, address or prescription was created for screenshots. Address evidence uses a blank create form; the populated demo address book was inspected privately. Profile fields were cleared only in the unsaved browser form for privacy.
- Static artwork and existing backend notes may retain their source language, as requested. This is UI propagation, not content fabrication or medical translation.

## 11. Visual review evidence

[Open screenshot gallery](../tmp/pashto-final-qa/review.html). All images below are real local browser captures. The screenshot files are local review artifacts, not staged source assets.

- [Home desktop](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/home-1440.png)
- [Home mobile](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/home-390.png)
- [Shop desktop](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/shop-1440.png)
- [Shop mobile](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/shop-390.png)
- [Category detail](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/category-390.png)
- [Manufacturer detail](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/manufacturer-390.png)
- [Product detail](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/product-390.png)
- [Cart](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/cart-390.png)
- [Checkout - blank address form](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/checkout-390.png)
- [Login - blank fields](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/login-390.png)
- [Register](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/register-390.png)
- [Profile - unsaved blank fields](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/account-profile-390.png)
- [Addresses - create form](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/addresses-390.png)
- [Prescription upload](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/prescription-upload-390.png)
- [Prescription history - existing harmless cancelled test](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/prescription-history-390.png)
- [Prescription detail - existing harmless cancelled test](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/prescription-detail-390.png)
- [App](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/app-390.png)
- [About](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/about-390.png)
- [FAQ](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/faq-390.png)
- [Health empty](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/health-390.png)
- [Not found](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/not-found-390.png)
- [Home 320](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/home-320.png)
- [Shop 320](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/shop-320.png)
- [Checkout 320 validation](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/checkout-320.png)
- [Register 320](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/register-320.png)
- [Account 320](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/account-320.png)
- [Profile validation](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/profile-validation-390.png)

Dari comparison captures: [dari-about-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-about-390.png), [dari-account-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-account-390.png), [dari-app-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-app-390.png), [dari-cart-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-cart-390.png), [dari-category-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-category-390.png), [dari-checkout-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-checkout-390.png), [dari-health-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-health-390.png), [dari-home-1440](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-home-1440.png), [dari-home-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-home-390.png), [dari-login-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-login-390.png), [dari-not-found-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-not-found-390.png), [dari-product-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-product-390.png), [dari-shop-1440](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-shop-1440.png), [dari-shop-390](C:/Users/AFerd/Documents/Darmalton/tmp/pashto-final-qa/dari-shop-390.png).

## 12. Git state and stop boundary

All full-propagation changes listed above are uncommitted and unstaged. HEAD remains the approved homepage checkpoint. Existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` were preserved. `website/next-env.d.ts` and `website/tsconfig.json` retain pre-existing status-only changes, with no intentional content diff; build output paths were returned to the existing development declaration.

The exact final short status is recorded below. No push/deployment, English rollout, admin change or Flutter change was performed. Local preview remains available on port 3002. Work stops for visual approval.

```text
 M website/app/about/page.tsx
 M website/app/account/page.tsx
 M website/app/app/page.tsx
 M website/app/cart/page.tsx
 M website/app/categories/[slug]/page.tsx
 M website/app/categories/page.tsx
 M website/app/checkout/page.tsx
 M website/app/contact/page.tsx
 M website/app/health-articles/[slug]/page.tsx
 M website/app/health-articles/page.tsx
 M website/app/health/page.tsx
 M website/app/layout.tsx
 M website/app/loading.tsx
 M website/app/login/page.tsx
 M website/app/manufacturers/[slug]/page.tsx
 M website/app/manufacturers/page.tsx
 M website/app/medicines/[id]/page.tsx
 M website/app/notifications/page.tsx
 M website/app/orders/[id]/page.tsx
 M website/app/pages/[slug]/page.tsx
 M website/app/prescriptions/page.tsx
 M website/app/prescriptions/success/[id]/page.tsx
 M website/app/privacy/page.tsx
 M website/app/register/page.tsx
 M website/app/shop/layout.tsx
 M website/app/terms/page.tsx
 M website/components/AccountShell.tsx
 M website/components/AddToCart.tsx
 M website/components/AddressBook.tsx
 M website/components/ApplicationState.tsx
 M website/components/AuthForm.tsx
 M website/components/Catalogue.tsx
 M website/components/DirectoryPage.tsx
 M website/components/InfoPage.tsx
 M website/components/OrderCard.tsx
 M website/components/PrescriptionDetail.tsx
 M website/components/ProductDetail.tsx
 M website/components/ProfileEditor.tsx
 M website/components/StaticInfoPage.tsx
 M website/lib/account-feedback.ts
 M website/lib/checkout-feedback.ts
 M website/lib/locale.ts
 M website/next-env.d.ts
 M website/test/account-feedback.test.mjs
 M website/test/customer-final-qa.test.mjs
 M website/tsconfig.json
?? "docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md"
?? docs/DARI_CUSTOMER_SITE_AUDIT.md
?? docs/FINAL_PASHTO_CUSTOMER_WEBSITE_REPORT.md
?? website/lib/customer-copy.ts
?? website/test/pashto-customer.test.mjs
```

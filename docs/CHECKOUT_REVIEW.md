# Dari checkout review

Date: 2026-09-21. Branch: `reference-ui-transplant-homepage`.

Approved catalogue-detail checkpoint: `3c569cffd2e247a72cef3fe81516dab29ebd7dfa` (`Approve Dari contextual catalogue detail routes`). This checkpoint is local; it was not pushed.

Checkout is ready for visual review and remains uncommitted. No utility/static page work, English/Pashto redesign, or deployment was performed.

## Exact checkout files

- `website/app/checkout/page.tsx`: compact address/payment flow and Cart-like summary; safe errors, Dari required validation, loading/retry state, checkout-login redirect.
- `website/app/checkout/checkout.module.css`: scoped responsive checkout styling, without shared/global CSS changes.
- `website/app/checkout/login/page.tsx`: outer `auth-container` changed to the existing `auth-shell`.
- `website/lib/checkout-feedback.ts`: safe checkout error mapping and required-address-field helper.
- `website/test/checkout-feedback.test.mjs`: focused commerce-error, field/status/network, leakage-prevention and required-field tests.
- `docs/CHECKOUT_REVIEW.md`: this report.

## Presentation and preserved behavior

The desktop layout pairs the address/payment flow with an order summary. At narrower widths it stacks intentionally; the new-address heading is outside the form grid. Inputs remain at least 44px tall. Saved addresses retain compact radio selection and the default indicator. An unsaved new-address form can be cancelled without changing the selected address.

Authentication remains required. Logged-out checkout now goes to `/checkout/login`, whose existing AuthForm still uses `returnTo="/checkout"`. AuthForm itself is unchanged; only its outer wrapper is harmonized with Login.

Address creation retains `POST addresses/`, the existing address fields and `is_default: true`, followed by reloading addresses and selecting the created address. The existing five required fields remain required; district and landmark remain optional. No GPS action existed in checkout, so none was invented. Account's existing location action is unchanged.

COD remains the only payment method. The summary uses actual cart item quantities, line totals and backend subtotal, retaining the existing final-price/stock confirmation note. No fee, tax, discount, delivery estimate or payment method was invented.

The final action retains the native confirmation, `POST orders/` with `{ address_id: selected }`, and success navigation to `/account/orders/${order.id}?placed=1`. The backend remains authoritative for totals, FEFO stock allocation and prescription restrictions. The action is disabled while busy, without an address, for an empty cart, or while the new-address form is open.

## Validation and error localization

Dari blank/whitespace required-field submission is intercepted with `noValidate`; it marks the five fields, focuses the first invalid field and makes no address request. The alert is `بخش‌های مشخص‌شده را برای آدرس تحویل تکمیل کنید.` and field feedback is `این بخش را تکمیل کنید.`.

Known cart/address, unavailable branch, stock, inactive medicine, missing price and prescription approval/expiry/reuse/ownership/quantity errors receive safe Dari UI wording. Authentication, permission, rate-limit, server and network failures also receive safe feedback. Unknown errors use a safe localized fallback instead of raw backend messages. Structured field errors are handled without rendering debug text or translating legitimate data values. Backend semantics and logging are unchanged. If the existing API has already collapsed a failure to a generic message, the UI cannot recover the original reason and uses its safe fallback.

## Safe functional QA and limits

- Logged-out checkout redirect and return-to-checkout configuration verified.
- Existing authenticated saved address loaded and was selected; default/selected treatment and cancelling a new-address form were checked. Only one saved address existed, so switching between two different saved addresses was not exercised.
- Blank new-address submission produced five Dari field errors and no address creation.
- COD remained checked. Authenticated Cart and checkout matched: three units, AFN 192.
- At 390px the saved-address final CTA was enabled, 44px tall and clear of bottom navigation. It became disabled while adding an unsaved address.
- A native confirmation check could not be completed through browser automation. The blocked temporary tab was closed without accepting confirmation. The order list was subsequently verified empty and the authenticated cart remained unchanged. No order or address was created in the review database.
- Final order POST/success behavior was checked in source and through isolated backend tests, not by finalizing a live review order. Stock/Rx rules were tested in the isolated test database.
- Guest cart remained one unit, AFN 140. The temporary authenticated test session was signed out and its previous localhost locale restored.
- Screenshots use an empty new-address form and contain no credentials or saved private address details.

## Responsive and regression evidence

All requested CSS viewport widths, 1440, 1024, 768, 390 and 320, were checked in RTL with no horizontal overflow and inputs at least 44px tall. Summary and validation text remained readable; mobile lower-page checks covered the final action and bottom navigation/footer clearance. Screenshots are viewport captures; narrower layouts naturally continue below the fold. Browser raster dimensions may differ from the measured CSS viewport because of capture scaling and scrollbars.

Regression checks completed: Cart at 1440/390, Login at 390, Account new-address form at 390 and homepage at 1440. No shared component or shared chrome code was changed. The final mobile Login/Cart console check reported no errors.

Evidence lives in the ignored local directory `tmp/checkout-review/`:

| Evidence | Screenshot |
| --- | --- |
| Checkout 1440 | [Desktop](../tmp/checkout-review/checkout-1440.png) |
| Checkout 1024 | [Small desktop](../tmp/checkout-review/checkout-1024.png) |
| Checkout 768 | [Tablet](../tmp/checkout-review/checkout-768.png) |
| Checkout 390 | [Mobile](../tmp/checkout-review/checkout-390.png) |
| Checkout 320 | [Narrow mobile](../tmp/checkout-review/checkout-320.png) |
| New address mobile | [Blank form](../tmp/checkout-review/new-address-390.png) |
| Dari validation | [Five required fields](../tmp/checkout-review/validation-390.png) |
| Checkout login 390 | [Approved AuthForm in harmonized shell](../tmp/checkout-review/checkout-login-390.png) |
| Summary/payment/action 390 | [Lower checkout](../tmp/checkout-review/checkout-summary-390.png) |
| Lower checkout 320 | [Narrow lower checkout](../tmp/checkout-review/checkout-lower-320.png) |
| Cart 1440 / 390 | [Desktop](../tmp/checkout-review/cart-1440.png), [Mobile](../tmp/checkout-review/cart-390.png) |
| Login 390 | [Login](../tmp/checkout-review/login-390.png) |
| Account address form 390 | [Account form](../tmp/checkout-review/account-address-390.png) |
| Homepage 1440 | [Homepage](../tmp/checkout-review/home-1440.png) |

Non-sensitive DOM measurements and functional observations are in `tmp/checkout-review/review.json`.

## Engineering checks

- Frontend tests: **76 passed**, 0 failed (`frontend-tests.log`).
- Relevant backend tests: **33 passed** (`backend-tests.log`), running `tests/test_api.py`, `tests/test_prescriptions.py` and `tests/test_inventory_operations.py` with the isolated SQLite test database. These cover account addresses, cart/stock, prescription lifecycle/ownership and order inventory/totals behavior.
- TypeScript: passed.
- ESLint: passed.
- Production build: passed with isolated `NEXT_DIST_DIR=.next-build` (`build.log`); the generated route-type reference was restored afterward.
- `git diff --check`: passed.

No backend source or API contract was changed.

## Git and local review

Checkout's two existing route files are modified; its CSS, feedback helper, focused test and this report are untracked. No checkout file is staged or committed.

Pre-existing untracked `docs/DARI_CUSTOMER_SITE_AUDIT.md` and `docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md` are preserved. Git also marks `website/next-env.d.ts` and `website/tsconfig.json` modified, but they have no textual diff and were excluded from the checkpoint.

Local frontend: `http://127.0.0.1:3002/checkout` (authentication required). Local API: `http://127.0.0.1:8000`. Both were left running for review.

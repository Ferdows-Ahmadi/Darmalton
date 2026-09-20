# Dari login and register review

Date: 2026-09-20. Status: approved by the user; checkpoint authorized before protected-account work.

## Approved cart checkpoint

`f645dba5d83a301071f2f999ff744831c3a50f56`
— `Approve responsive reference-locked cart`.

Only the approved cart page, scoped CSS, required AppChrome route condition, and
cart review report were committed. Generated/no-content changes were excluded.
Nothing was pushed or deployed.

## Routes and scope

The existing entry routes are `/login` and `/register`. Both render AuthForm;
both accept `returnTo` and pass the configured Google client ID from the server.
The existing customer header, footer, and mobile bottom navigation are retained.

Intentional files:

- `website/components/AuthForm.tsx`: selects scoped styling only for Dari customer forms; adds an explicit POST fallback method.
- `website/components/AuthForm.module.css`: compact shared form presentation and responsive styles.
- `website/components/AppChrome.tsx`: includes exactly `/login` and `/register` in the approved Dari chrome condition.
- `docs/AUTH_DESIGN_REVIEW.md`: this report.

No other route was redesigned. English, Pashto, and staff visual presentation
remain unchanged. No backend, API contract, database, OAuth configuration, or
Flutter source changed.

## Presentation and preserved behavior

The shared 480px form uses the existing Darmalton logo, a restrained green top
border, small corner radii, compact spacing, and the approved storefront palette.
Name fields remain grouped; email, optional phone, and password use full-width
rows. Controls are at least 44px tall; mobile text inputs use 16px text. Focus
outlines, native labels/autocomplete, masked passwords, existing required fields,
and the existing eight-character HTML minimum remain intact. No password
requirements or show/hide mechanism were invented.

The existing submit/Google handlers, API endpoints, error mapping, busy state,
cookies, guest-cart synchronization, role routing, sanitized return paths,
forgot-password link, guest continuation, and login/register cross-links are
unchanged. Error messages remain local to the form with `role="alert"`.

During rapid browser testing, the pre-existing form could submit natively before
React hydration, using the default GET method. An explicit `method="post"`
prevents that fallback from placing form fields in the URL. This is the only
nonvisual safeguard; the normal JavaScript authentication flow is unchanged.
The rendered POST method and subsequent server validation rejection were verified.
No no-JavaScript authentication capability is claimed.

## Google and recovery status

The current local server supplies no Google client ID. Both Google entry points
remain visible and disabled with the existing localized configuration message.
The real Google component, script loading, credential callback, API endpoint,
and configured-state behavior are untouched. Successful Google OAuth was not
claimed or simulated.

The forgot-password link reaches the existing `/forgot-password` page, which
honestly states that email recovery is not configured locally. Recovery was not
redesigned or configured.

## Functional verification

- Empty login submission focused email; empty registration focused first name. Required inputs remained invalid, while phone remained optional.
- Invalid email was rejected on both forms by native validation; `typeMismatch` was observed.
- A nonexistent test login returned the existing safe Dari form error without exposing backend/debug details.
- Registration using the existing demo email and a deliberately invalid test password returned the same safe form-context error. No account was created.
- Both submissions visibly showed the existing disabled waiting button, then returned to the enabled action after rejection.
- Keyboard Tab moved from email to masked password with a visible solid focus outline.
- Protected-route flow passed: `/account` -> `/login?returnTo=%2Faccount` -> existing local demo login -> `/account` with the account UI loaded.
- Switching login -> register -> login preserved `returnTo=%2Faccount` throughout.
- The demo account was signed out through the existing menu action. Guest cart was restored to its original Amclav Plus item, quantity one, total 140 AFN.

The guest cart was temporarily emptied before demo login to avoid merging test
items into the demo account. No order was submitted. Successful new-account
creation and network-outage handling were not exercised; registration server
rejection and successful existing-account login were exercised.

## Responsive verification

Both forms were checked at 1440, 1024, 768, 412, 390, and 320px: all twelve
combinations remained RTL with zero horizontal overflow and no clipped controls
or headings. Desktop inputs measured 44px tall; mobile inputs measured 46px.
Google buttons remained usable in size and honestly disabled by configuration.

An additional 320 x 700 viewport check focused the register submit button by
keyboard. Submit bottom was approximately 464px and Google button bottom 547px,
both above the fixed bottom navigation at 642px. Normal scrolling keeps all form
content reachable. An actual handset/software keyboard was not emulated.

## Regression checks

| Approved route/state | 1440px | 390px |
| --- | --- | --- |
| Homepage `/` | Passed | Passed |
| `/shop` | Passed | Passed |
| `/categories` | Passed | Passed |
| `/manufacturers` | Passed | Passed |
| Product detail, Amlo 5mg | Passed | Passed |
| `/cart`, empty with existing recommendations | Passed | Passed |
| `/cart`, populated | Passed | Passed |

All fourteen views were visually inspected and had zero horizontal overflow.
Category and recommendation captures were refreshed after asynchronous images
and products loaded. No approved-page source or shared stylesheet was changed.
The captured browser error log was empty.

## Engineering checks and artifacts

- Existing frontend tests: 58 passed.
- TypeScript: passed.
- ESLint: passed.
- Production build in isolated `.next-build`: passed, 61/61 pages generated.
- `git diff --check`: passed.

These checks were repeated after the explicit POST fallback was added.

Local review: `http://127.0.0.1:3002/login` and
`http://127.0.0.1:3002/register`. Local services remain running.

Ignored evidence folder: `tmp/auth-review/`.

- `login-{1440,1024,768,412,390,320}.png`
- `register-{1440,1024,768,412,390,320}.png`
- `login-error-320.png`, `register-error-320.png`
- `register-320-short-viewport.png`
- `{homepage,shop,categories,manufacturers,product-detail,cart-empty,cart-populated}-{1440,390}-regression.png`
- `width-checks.json`, `functional-checks.json`, `regressions.json`, `console-errors.json`, `build.log`

The auth redesign was approved for a scoped checkpoint before protected-account work. Generated
`next-env.d.ts` and `tsconfig.json` status entries are not intentional source
changes. Work stops at login/register; nothing was pushed or deployed.

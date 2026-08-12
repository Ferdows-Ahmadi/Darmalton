# Full Product QA Matrix

This matrix is the release-audit source of truth for the current Darmalton
monorepo. A green automated check is evidence for the named behavior only; it
does not replace browser or physical-device acceptance where those columns are
still open.

Status keys: **PASS** verified in the current or immediately preceding
checkpoint, **PARTIAL** implemented with an explicitly open acceptance item,
**OPEN** not yet audited in this product-hardening milestone, **GATED** hidden
or disabled because the required production integration is unavailable, and
**DEFERRED** intentionally outside the MVP.

## Flutter customer application

| Feature | Route / surface | Role | Expected behavior | Automated evidence | Manual/device evidence | Current status |
|---|---|---|---|---|---|---|
| Startup and session restore | `/splash` | All | Resolve session once and open Home without loops | `guest_first_test.dart` | Cold launch previously passed on Pixel | PASS |
| Endpoint discovery | Debug startup, Settings diagnostics | All | Prefer USB reverse, then bounded LAN discovery/manual private endpoint | `api_endpoint_manager_test.dart` | USB and LAN recovery previously passed | PASS |
| Guest Home | `/catalogue` | Anonymous | Browse without forced authentication | `guest_first_test.dart` | Pixel render previously passed | PASS |
| Authenticated Home | `/catalogue` | Customer/staff identity | Normal login and restored sessions open Home | Auth navigation regression coverage | Physical re-check required after next APK | PARTIAL |
| Password login | `/login` | All | Valid login goes Home unless a protected destination requested authentication | Auth navigation regression coverage | Physical re-check open | PARTIAL |
| Registration | `/register` | Anonymous | Creates customer session and goes Home or explicit protected destination | Auth navigation regression coverage | Live registration re-check open | PARTIAL |
| Google login | Login/register Google action | All | Verify Google ID token and establish session; handle cancel/errors | Backend/client deterministic tests | External OAuth credentials absent | GATED |
| Logout/session expiry | Profile and API refresh | Authenticated | Clear private cache/tokens; no stale protected state | API/auth tests | Prior Pixel logout/refresh passed | PASS |
| Account/profile | `/profile`, `/settings/profile` | Authenticated | View/edit profile and phone safely | Widget/backend coverage | Prior device render; edit re-check open | PARTIAL |
| Settings/preferences | `/settings` | Authenticated | Persist language, text size, motion, image and notification preferences | `language_settings_test.dart`, account tests | Language persistence previously passed | PASS |
| Informational pages | `/settings/about`, `terms`, `privacy`, `help`, `contact` | All/authenticated | Useful localized copy with correct navigation | Flutter widget coverage pending | Device audit open | OPEN |
| Account security/deactivation | `/settings/security` | Authenticated | Change password or confirm irreversible deactivation | Backend account tests | Physical form audit open | PARTIAL |
| Home CMS hero | Home | All | Only eligible scheduled banners; cached fallback; safe internal actions | `promotion_carousel_test.dart` | Zero-state and carousel previously checked | PASS |
| Home search/quick actions | Home | All | Open one search surface; Rx action requires auth | Widget coverage and route audit | Device interaction open | PARTIAL |
| Category discovery | `/categories` | All | Useful discovery shelves and filtered See-all paths | Category media tests | Redesign and device QA open | OPEN |
| Manufacturer discovery | Home brand section | All | Real manufacturers, logo/fallback, swipe, filtered navigation | Coverage pending | Redesign open | OPEN |
| Catalogue/search | `/search` | All | Search, recent search, filters, sorting, pagination, clear/cancel | Language/filter regression tests | Prior filter smoke passed; full matrix open | PARTIAL |
| Medicine details | `/medicines/:id` | All | Localized product facts, safe Rx/add-to-cart actions and imagery | Model/widget tests | Device audit open | PARTIAL |
| Medicine imagery | Shared medicine image | All | Contain fit, stable dimensions, cache and neutral fallback | `app_test.dart` | Missing licensed demo photography documented | PARTIAL |
| Favorites/recently viewed/searches | Catalogue/detail/settings | All | Persist public preferences locally and clear on request | Local-cache contract tests | Device behavior audit open | PARTIAL |
| Guest cart | `/cart` | Anonymous | Add/update/remove/persist and merge safely after auth | Guest/local-cache tests | Full transition re-check open | PARTIAL |
| Authenticated cart | `/cart` | Customer | Server price/stock authority; enforce Rx authorization | Backend API tests | Device flow open | PARTIAL |
| Addresses | Checkout selector | Customer | CRUD/default/manual/GPS/map confirm/cancel, cached offline selection | `address_selector_test.dart` | Attended complete walkthrough open | PARTIAL |
| Checkout/COD | `/checkout` | Customer | Validate address/cart/Rx/stock and explicitly confirm COD once | Backend smoke/service tests | Attended checkout open | PARTIAL |
| Orders | `/orders`, `/orders/:id` | Customer | History/detail/status/snapshots without fake courier controls | Backend tests | UI cleanup and device audit open | PARTIAL |
| Prescription upload | `/prescription` | Customer | Camera/gallery/file, preview/remove/progress/retry and guarded upload | Prescription camera/upload tests | File flow passed; attended camera open | PARTIAL |
| Prescription lifecycle | `/prescription` | Customer | History, clarification response, rejection/approval and obvious next action | Backend transition tests | Browser staff/customer flow passed | PARTIAL |
| Approved Rx cart | Prescription/card/cart | Customer | Idempotently offer/add authorized medicines; customer still confirms checkout | Coverage not yet implemented | Open | OPEN |
| Health Articles | Home and `/health-articles/:slug` | All | Published bilingual content with guarded media and offline cache | `health_articles_test.dart` | Prior Pixel render passed | PASS |
| In-app notifications | Home/header or dedicated surface | Customer | Persistent accurate prescription/order events and read state | Backend foundation only | Customer UI audit open | OPEN |
| Offline/recovery | Global banner/cached public surfaces | All | Compact actionable state; never present live-sensitive data as current | `navigation_and_offline_test.dart`, cache tests | Docker stop/restart previously passed | PARTIAL |
| Android back | All routes/modals | All | Dismiss local UI, return safely, double-back exit at Home | Navigation regression tests | Prior partial device checks | PARTIAL |

## Public/customer website

| Route | Audience | Expected behavior | Current evidence | Status |
|---|---|---|---|---|
| `/` | Anonymous | Public landing page and clear route to shop | Previous browser QA and production build | PASS |
| `/shop` | All | Search/filter catalogue with server truth | Previous browser smoke; full action audit open | PARTIAL |
| `/medicines/[id]` | All | Product details and correct cart/Rx affordance | Build/browser smoke | PARTIAL |
| `/cart` | All | Guest/authenticated cart behavior | Integrated smoke; manual edge cases open | PARTIAL |
| `/checkout` | Customer | Protected COD checkout | Integrated smoke | PARTIAL |
| `/login`, `/register` | Anonymous | Customer auth and role-aware staff handoff | `auth-navigation.test.mjs` | PASS |
| `/account` | Customer | Account details and sign-out | Browser smoke | PARTIAL |
| `/orders`, `/orders/[id]` | Customer | Owner-scoped history and detail | Integrated smoke | PARTIAL |
| `/prescriptions` | Customer | Upload/history/clarification state | Backend/browser staff workflow evidence | PARTIAL |
| `/about`, `/contact`, `/privacy`, `/terms` | All | Stable public information | Production build | PARTIAL |
| Public CMS content | Landing/shop/article/page surfaces | All | Eligible scheduled bilingual CMS content only | Not fully integrated | OPEN |

## Staff portal

| Route / group | Roles | Expected behavior | Current evidence | Status |
|---|---|---|---|---|
| `/staff/login` | Anonymous | Dedicated staff login preserving requested route | Staff auth tests/browser QA | PASS |
| `/staff` | STAFF/PHARMACIST/ADMIN | Live attention queues and role-appropriate tasks | Staff navigation tests/browser QA | PASS |
| `/staff/prescriptions` | PHARMACIST/ADMIN | Complete state-aware operational review | Tests plus live browser lifecycle | PASS |
| `/staff/orders` | STAFF/PHARMACIST/ADMIN | Search/filter/detail/valid state transitions | Tests/browser QA | PASS |
| `/staff/customers` | STAFF/PHARMACIST/ADMIN | Safe customer lookup without excess disclosure | Tests/browser QA | PASS |
| `/staff/medicines` and `/import` | STAFF/PHARMACIST/ADMIN; import ADMIN | Catalogue/media management and validated staged import | Tests/browser QA | PASS |
| `/staff/categories` | Operations roles | Category CRUD/media/order | Tests/browser QA | PASS |
| `/staff/inventory`, `/ledger` | Operations roles | Stock truth, quality/quarantine, auditable movements | Backend/web tests | PASS |
| `/staff/warehouses`, `/locations` | Operations roles | Warehouse/rack/shelf management | Tests/browser QA | PASS |
| `/staff/suppliers` | Operations roles | Supplier lifecycle | Tests/browser QA | PASS |
| `/staff/purchase-orders` | Operations roles | Draft/approve/receive with inventory integration | Tests/browser QA | PASS |
| `/staff/returns` | Operations roles | Request/approval/verification/refund/pickup workflow | Tests/browser QA | PASS |
| `/staff/reports` | Authorized staff | Live operational reports | Build/browser QA | PARTIAL |
| `/staff/users` | ADMIN | Staff/customer administration with self-lockout protection | Tests/browser QA | PASS |
| `/staff/settings` | Authorized staff | Operational settings/help | Build/browser QA | PARTIAL |
| `/staff/cms` and resource pages | CMS roles | Banners, announcements, pages, featured medicines, articles | 34 web tests and browser QA | PASS |
| `/admin/` (Django) | Technical administrators | Separate emergency/audit fallback, not normal operations | Browser QA | PASS |

## Backend and cross-cutting audit queues

| Area | Required evidence | Current state |
|---|---|---|
| Anonymous/customer/staff/pharmacist/admin permissions | Targeted API tests plus UI visibility and IDOR attempts | Existing targeted coverage; full role matrix OPEN |
| Media validation/access | MIME, extension, size, replacement, cache, guarded/public access | Prescription/catalogue/CMS coverage; manufacturer logo OPEN |
| Network failure | Startup offline, cached/uncached state, retry, session expiry and recovery | Partial automated/device evidence; exhaustive pass OPEN |
| Accessibility | Text scale, semantics, focus, contrast, touch targets, reduced motion, RTL order | Partial settings coverage; systematic pass OPEN |
| Performance | Query counts, rebuild/API duplication, image memory, controller/timer disposal | OPEN |
| Production readiness | Secrets, HTTPS, hosts/CORS/CSRF, media/logging/backups/signing/OAuth | Existing docs are partial; dedicated audit OPEN |

## Current blocking acceptance items

1. Finish the English-copy audit across every Flutter screen; backend-authored
   catalogue/CMS content can fall back to Dari only when its English field is
   genuinely empty.
2. Redesign Home hierarchy, shared medicine cards, category discovery, and
   real manufacturer cards using backend data.
3. Implement the safe approved-prescription-to-cart path and customer in-app
   notification presentation.
4. Remove or hide remaining unsupported courier and other placeholder actions.
5. Complete attended Pixel camera, address CRUD/GPS, and COD checkout checks.
6. Integrate the eligible public CMS resources into the website and run the
   complete browser/role matrix after the redesigns stabilize.


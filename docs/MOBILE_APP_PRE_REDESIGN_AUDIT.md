# Darmalton mobile app: audit before redesign

Date: 2026-09-23. Audit only; no mobile implementation or translation changes.

## 1. Approved website checkpoint and branch

- Final English/customer-website checkpoint: `c90b4afdefe4bf6549304a965053404fb3efdcbf`.
- Commit: `Complete English customer website propagation and QA`.
- The reviewed commit contains 55 intentional English presentation, LTR, copy/helper, test and report files. Generated/status-only files, old audits and ignored evidence were excluded.
- Current branch: `mobile-app-ui-rebuild`, created from that commit.
- Current HEAD and merge-base with `english-storefront-propagation`: `c90b4afdefe4bf6549304a965053404fb3efdcbf`.
- The approved website remains recoverable on `english-storefront-propagation`. No website changes were made during this audit.
- The intended implementation tree is clean. The entire working tree is not pristine: two pre-existing website status-only entries and two historical untracked audits were preserved. This report is the only new non-ignored audit deliverable.
- No push, deployment, backend/database change, admin work, signing change or production APK build occurred.

## 2. Evidence and limits

The actual `mobile/lib`, routing, Android/iOS configuration, dependency manifest, all 15 existing test files, relevant backend customer routes/serializers and the approved website implementation were inspected. Existing analyzer, tests and Android debug compilation were executed.

No Android device/emulator was connected: `flutter devices --machine` returned Windows and Edge only. The repository has Android and iOS runners, with no Windows or web runner. No platform scaffolding was added. No APK was installed over an existing customer installation. Physical camera/gallery/GPS behavior, device screenshots, keyboard/overflow behavior and live authenticated mobile flows remain unverified in this audit. Widget tests use controlled fixtures; their success is not a claim of live backend/device acceptance.

Visual findings below are based on actual widget composition, dimensions, theme values and the approved website reference, not fresh mobile screenshots. Classification A is provisional source-level alignment, not new visual approval. B means an implemented workflow with legacy presentation; it does not certify every integration edge case. No records, orders or private uploads were created.

## 3. Flutter architecture

| Area | Actual implementation |
|---|---|
| Entry | `mobile/lib/main.dart`: initializes Flutter binding, then `ProviderScope(child: PharmacyApp())` |
| Application | `mobile/lib/src/app.dart`: `MaterialApp.router`, one `GoRouter` provider, theme/locales/direction/text scale |
| Routing | `go_router` 17.3.0, 23 customer routes and one debug-only route; flat route declarations, no stateful tab-shell router |
| State | `flutter_riverpod` 3.3.2; providers/controllers concentrated in `core/providers.dart`, settings in `core/app_settings.dart`; local form state in screens |
| HTTP | Dio 5.10.0 in `core/api_client.dart`; centralized request methods, multipart upload, JWT interceptor, refresh/retry and error conversion |
| Endpoint selection | `core/api_endpoint_manager.dart`: debug USB localhost, discovery, remembered LAN and manual configuration; release skips discovery and uses compile-time endpoint |
| Authentication | `AuthController`; login/register/Google, `/auth/me/`, profile/language update, password change, deactivation, logout/session expiry |
| Storage | `flutter_secure_storage` 10.3.1 for access/refresh tokens, guest cart, settings, metadata cache and user-scoped saved-address cache |
| Models | Handwritten immutable-style DTO classes in `core/models.dart`: user, category, manufacturer option, medicine, cart, address, order/items/status, prescriptions/authorizations/history, notifications, banners/articles |
| Localization | Custom `DariStrings` plus a wrapper named `Text` in `localized_text.dart`; not ARB/generated localization |
| Theme | Material 3, shared `design_system.dart`, Vazirmatn Regular/Medium/Bold assets; light theme only |
| Media | `MedicineImage`, `CachedNetworkImage`, public CMS/category imagery, explicit fallback for the server medicine SVG; image picker/compression and file picker for prescriptions |
| Native integrations | Camera/gallery/file selection, location permission/GPS, Flutter Map/OpenStreetMap, secure storage, Google identity |

There is no separate staff/admin Flutter route tree. A staff identity can sign in through the customer app, but the implemented routes remain customer routes. Django remains authoritative for ownership, stock, prices, prescription permissions and order transitions.

## 4. Complete routed screen inventory

Classification: **A** functional and reasonably aligned at source level; **B** implemented but visually outdated relative to the approved identity; **C** incomplete/placeholder; **D** alias/context/shared implementation; **E** internal/debug; **F** missing capability. Multiple labels identify separate aspects of a template.

| Route | Screen / source under `mobile/lib/src/` | Class | Workflow and finding |
|---|---|---|---|
| `/splash` | `features/auth/splash_screen.dart` | A | Branded logo/loading; listens for auth resolution and opens catalogue for guests and signed-in users. No onboarding sequence. Device startup still needs validation. |
| `/login` | `features/auth/login_screen.dart` | B | Email/password and configured Google identity, guest continuation, safe return destination; legacy spacious branded form. |
| `/register` | `features/auth/register_screen.dart` | B | Names/email/optional normalized phone/password; backend registration and optional Google; preserves return target. No account created during audit. |
| `/catalogue` | `features/catalog/catalogue_screen.dart` | B | Actual Home: address selector, search, CMS banners, Rx shortcut, categories, product rails, recent items, manufacturer rail, seasonal link, health cards. Not a separate complete Shop grid. |
| `/health-articles/:slug` | `features/catalog/health_article_screen.dart` | B/C | Article reader works from an in-memory `HealthArticle` passed in `state.extra`. A direct URL without that object renders Catalogue instead of fetching the slug or showing an article missing state. |
| `/categories` | `features/catalog/categories_screen.dart` | B | Category strip plus discovery shelves for first five categories; category actions open search with category context. |
| `/search` | `features/catalog/search_results_screen.dart` | B/C | Real product search, recent searches, category chips, manufacturer/stock/Rx/price filters and sort. Only first API result page consumed; no next-page controls/load-more. |
| `/medicines/:id` | `features/catalog/medicine_detail_screen.dart` | B/C | Exact SKU detail, image, stock/Rx/price, quantity, favorite, description expansion, buy/add or Rx route. No family/strength selector; image “gallery” repeats the same primary image as a thumbnail. |
| `/cart` | `features/cart/cart_screen.dart` | B | Guest/server cart, quantity changes, confirm removal, totals and checkout navigation. Server mutations refresh the cart. Promo UI is feature-disabled. |
| `/checkout` | `features/checkout/checkout_screen.dart` | B | Protected address selection/management, standard delivery, COD, summary, final confirmation, POST order and order-detail navigation. No order submitted. |
| `/prescription` | `features/prescription/prescription_screen.dart` | B | Protected combined upload and history. Patient/contact/note, local preview, progress, retry, status/notes/authorizations, clarification response, cancellation, authorized bundle-to-cart. No separate detail screen. |
| `/notifications` | `features/notifications/notifications_screen.dart` | B | Protected list, empty/error/loading, mark one/all read, order or Rx navigation. In-app center; no push registration implementation found. |
| `/orders` | `features/orders/order_history_screen.dart` | B/C | Protected active/completed/cancelled groups and pull-to-refresh; list consumes one backend page. |
| `/orders/:id` | `features/orders/order_detail_screen.dart` | B | Protected historical snapshots, totals, status timeline, delivery/courier data and expandable details. Live delivery tracking is disabled. |
| `/profile` | `features/profile/profile_screen.dart` | B | Protected overview, order count, edit, address sheet, Rx/help/about and logout; separate from settings. |
| `/settings` | `features/settings/settings_screen.dart` | B | Protected account links; Dari/English picker; larger text, reduced motion, notifications, thumbnail cache, recent-search preferences; clear public cache; documents. |
| `/settings/profile` | `features/settings/account_settings_screen.dart` → `ProfileEditScreen` | B | Protected first/last name and phone patch to `/auth/me/`. |
| `/settings/security` | same file → `SecuritySettingsScreen` | B | Protected current/new/confirm password and account-deactivation confirmation. Real mutations exist; none exercised. |
| `/settings/about` | `features/settings/settings_info_screen.dart` | D/A | Shared public document template with explicit Dari/English static text and hardcoded version `1.0.0`. |
| `/settings/terms` | same shared template | D/A | Static legal summary; not fetched from website/CMS. |
| `/settings/privacy` | same shared template | D/A | Static privacy/storage description; not fetched from CMS. |
| `/settings/help` | same shared template | D/A | General troubleshooting instructions, not an interactive FAQ/support workflow. |
| `/settings/contact` | same shared template | D/C | Says to use the official support channel, but provides no concrete phone/email/contact action. |
| `/dev-diagnostics` | `features/settings/settings_screen.dart` → `DevelopmentDiagnosticsScreen` | E | Exists only in `kDebugMode`; endpoint status, retry/discovery and manual endpoint dialog. Not customer release scope. |

### Non-route screens, sheets, dialogs and shared states

| Surface | Source / entry | Class | Behavior |
|---|---|---|---|
| Protected-account prompt | `core/auth_gate.dart` | A/D | Loading/account-required scaffold, sign-in/register with safe return path, Home exit |
| First guest account prompt | Catalogue | A/D | Optional one-time account prompt tracked in guest storage; browsing remains available |
| Search filter sheet | Search | A/D | Native bottom sheet; stock switch, Rx segmented control, manufacturer picker, price bounds/apply |
| Address guest gate | `features/addresses/address_selector.dart` | A/D | Explains account requirement and offers sign-in |
| Saved-address selector | Same; Home/Profile/Settings/Checkout | B/D | Shared sheet with current/default selection and add/edit/delete/default actions |
| Create/edit address | Same | B/D | Shared keyboard-aware form; required fields, Afghan phone normalization, optional GPS/map, POST/PATCH |
| Address location map | Same | A/D | Tap-to-place marker, coordinates, confirmation; external OSM tile provider and attribution |
| Address delete confirmation | Same | A/D | Confirm then owner-scoped API delete; selection repair |
| Cart removal confirmation | Cart | A/D | Confirms removal of a line item |
| Checkout confirmation | Checkout | A/D | Explicit COD/address confirmation before order POST |
| Rx source picker | Prescription | A/D | Camera/gallery/file native choices |
| Rx preview/upload state | Prescription `_UploadCard` | B/D | Selected filename/image, remove/retake, patient fields, progress/error/retry; selection kept after failed upload |
| Rx history/status card | Prescription `_PrescriptionCard` | B/D | Combined inline “detail”: safe notes, authorized medicines, allowed actions; parsed history/expiry are not presented as a full detail timeline |
| Rx clarification dialog | Prescription | A/D | Text response submitted only through explicit action |
| Language sheet | Settings | A/D | Dari and English only; saves locally and attempts account-language update |
| Account deactivation dialog | Account settings | A/D | Explicit email/current-password confirmation; real protected mutation |
| Logout confirmation | Profile | A/D | Clears session and private address cache, returns Home |
| About/license dialog | Profile `showAboutDialog` | D | Separate stock Flutter About/license surface, duplicating the custom About route |
| Error/empty/loading/offline | `core/widgets.dart`, auth gate and screen-local states | B/D | Retry, empty CTA, skeletons and dismissible offline banner; scattered visual variants and generic connection-error heading |
| Product description/order details expansions | Product and order detail | A/D | Native `ExpansionTile` content, not separate routes |
| Manual endpoint dialog | Diagnostics | E | Development-only endpoint setting |

### Missing or intentionally unsupported areas

| Area | Class | Evidence / distinction |
|---|---|---|
| Pashto UI, models and language selection | F | Settings, strings, user model and app locales accept only `fa` / `en` |
| Catalogue pagination; full order/Rx/notification histories | F | Providers discard paginated metadata and consume `results` once; backend default page size is 12 |
| Product-family variant selection/grouping | F | Backend supports `family_listing`, `family_code`, `family_variants`; mobile medicine model/query/UI do not use them |
| Prescription detail/deep link and stored-file viewing | F | No `/prescription/:id` route or authenticated file-viewer client; notifications route to combined `/prescription` |
| Standalone manufacturer directory/detail | D/F | Manufacturer rail/filter exists and opens shared `/search?manufacturer=…`; no dedicated index/detail content screen |
| Category detail | D | Shared `/search?category=…` is the existing implementation; no duplicate detail tree needed |
| Standalone Health index, slug retrieval, generic CMS pages | F | Home previews and extra-object reader only; CMS page API exists but no mobile page client |
| Customer return requests | F | Backend owner-scoped return create/list/retrieve/cancel routes exist; no mobile return UI/client found |
| FAQ, delivery/returns policy, prescription-help documents | F | Existing mobile static info enum exposes About/Terms/Privacy/Help/Contact only; website has fuller document family |
| Favorites directory | F | Product favorite toggle and stored IDs exist; no full favorites route |
| Password recovery/reset | C | Explicit `passwordRecovery = false`; no mobile route and no corresponding recovery endpoint in current auth URLs. Do not invent a working flow. |
| Wallet, card payment, discount codes, live tracking | C | Explicit false feature flags; not working customer capabilities |
| Dedicated onboarding/order-success/Rx-success screens | D / absent | No onboarding requirement implemented; startup goes Home, order creation goes detail, Rx success uses snackbar/history refresh. Their absence alone is not a defect. |

## 5. Navigation map

```text
main → ProviderScope → PharmacyApp → /splash → /catalogue (guest or signed in)

MainScaffold bottom tabs (declared order):
  Categories → /categories
  My orders  → /orders [protected]
  Home       → /catalogue
  Cart       → /cart [guest/server]
  Settings   → /settings [protected]

Home → Search → filters / category or manufacturer context → Medicine detail
     → Categories → shared Search
     → Manufacturer rail → shared Search
     → Prescription [protected]
     → Notifications [protected] → Order detail or combined Prescription
     → Account/Profile [protected] → Profile edit / Addresses / Rx / Help / About
     → Health preview → Article (requires state.extra)

Medicine → Add/buy → Cart or Checkout [protected]
         → Rx request with medicineId → combined Prescription
Cart → Checkout → Address selector/editor/map → confirm COD → Order detail
Settings → Profile / Security / Language sheet / shared information routes
Protected gate → Login/Register ?returnTo=… → validated internal destination
```

`MainScaffold` uses `context.go` for tab switches; there are no independent retained navigation stacks per tab. Detail pages generally use `push`; `FallbackBackScope` and scaffold back handling restore a sensible parent, with double-back exit on Home. Existing tests cover root/nested/fallback behavior. Home's menu-left/notification-right layout is deliberately pinned in both directions and explicitly tested; it should not be silently “fixed” as an assumed RTL defect.

Important navigation issues to carry into a later scoped correction phase:

- Protected `/prescription` supplies the literal destination `/prescription`, dropping its `medicineId` query through sign-in. Its expired-session redirect does the same. Normal checkout/order return paths have dedicated tests, but this Rx context needs one.
- Product and Notifications show the Home bottom-tab index. Checkout/Profile/auth use separate scaffolds; gate screens do not retain the underlying bottom navigation. This is the existing native flow, not website parent-state logic.
- Language/accessibility settings are behind authentication; guests have no direct language picker route even though previously saved locale settings are applied at startup.
- Article deep links without `extra` fall back to Home content; no custom route-level not-found handler is configured.

## 6. API and business-functionality map

| Workflow | Client implementation | API / preservation requirement |
|---|---|---|
| Session initialization | `AuthController.build` | GET `/auth/me/`; unsuccessful API initialization currently becomes guest; no cached identity is trusted as an authenticated session |
| Login/register/Google | Auth screens and controller | POST `/auth/login/`, `/auth/register/`, `/auth/google/`; tokens stored securely, backend validates identity |
| Refresh | API interceptor | POST `/auth/refresh/` without stale bearer; retry marker prevents loops; failed refresh clears tokens |
| Logout / account changes | Controller/security screens | Local token removal + Google sign-out + user-scoped address-cache removal; PATCH `/auth/me/`; POST password/deactivate endpoints |
| Catalogue | Category/manufacturer/medicine providers | GET `/categories/`, `/manufacturers/`, `/medicines/`, `/medicines/:id/`; search/category/manufacturer/Rx/stock/min/max/order filters; server prices/availability |
| Merchandising/CMS | Banner/article providers | GET `/cms/banners/`, `/cms/health-articles/`; cached public descriptions, limited to 10 banners/12 articles; restricted banner destinations |
| Guest cart | `GuestSessionStore`, `CartController` | Secure local medicine metadata and quantities; strips stored price/stock and refreshes each SKU; minor-unit arithmetic for display |
| Signed-in cart | `CartController` | GET `/cart/`; POST `/cart/items/`; PATCH/DELETE `/cart/items/:id/`; sequential guest transfer removes each local entry only after its POST succeeds |
| Rx authorization | Product/Rx/cart | Backend prescription flags and `can_*` actions remain authoritative; authorized bundle POST `/prescriptions/:id/add-authorized-to-cart/` returns server cart/counts; does not create order |
| Upload | Picker/repository | JPG/JPEG/PNG/PDF, one file, nonempty and at most 10 MiB in code; camera/gallery compression/orientation correction, EXIF removal when compression succeeds, temporary-file cleanup; multipart `document`, patient_name/contact_phone/customer_note |
| Rx history/actions | Combined Rx screen | GET `/prescriptions/`; POST `/:id/cancel/` or `/:id/respond/`; UI uses server permission flags; private file retrieval not implemented |
| Addresses | Shared selector/editor/providers | GET/POST `/addresses/`, PATCH/DELETE `/:id/`; default flag, persisted selection, country AF, delivery fields and optional coordinates; private cache keyed by user |
| Checkout | Checkout screen | POST `/orders/` with `address_id` only after confirmation; no client-authoritative totals; Django handles stock/Rx/FEFO/order snapshots. COD is the active payment path. |
| Orders | Providers/history/detail | GET `/orders/` and `/:id/`; immutable item/address snapshots and status history; no client status mutation |
| Notifications | Provider/actions/model | GET `/notifications/`, POST `/:id/read/`, `/read-all/`; titles/messages choose available English source fields, resource navigation |

Potential functional risks found, not changed:

1. Page truncation applies beyond Search: orders, prescriptions and notifications also ignore `next`/`count`.
2. Guest transfer is sequential, not atomic or explicitly idempotent in the client. A server-accepted POST whose response is lost can remain queued locally. Preserve current semantics while adding integration coverage before altering synchronization.
3. `ApiClient._mapError` passes an API envelope's `error.message` through; many screens display `'$error'`. Unlike the frozen website's allowlist, this is not a complete safe localized-feedback boundary. `FormatException` prefixes can also prevent exact dictionary translation in Rx errors.
4. Rx camera compression can fall back to the original picked file if compression returns null; metadata-removal guarantees need device verification on that fallback. Temporary cleanup is tested, but camera hardware and OS permission flows are not.
5. Protected lists' 401 handling and private provider invalidation across logout/login should receive explicit account-switch tests before the shell is reworked. Existing cache scoping is useful but does not replace those tests.

## 7. Localization, RTL/LTR and formatting

**Dari:** default `fa`, rendered as `Locale('fa', 'AF')`, RTL. Most UI source literals are Dari. **English:** `en`, LTR, dictionary/explicit paired copy and model source-field selection. **Pashto:** absent: unknown language codes become `fa` in settings, strings and user parsing; preferred-language updates also normalize to fa/en.

All current feature files use the custom localized `Text` wrapper for ordinary text. A focused direct-literal scan found 396 exact English dictionary keys and no unmatched simple, direct Dari `Text('…')` candidates. This is not complete coverage: composed strings, native-widget string parameters, exceptions, semantics and source data require separate handling. The wrapper translates every passed string by exact match, including server strings, so it is not a strong type boundary between UI copy and data.

| Screen family | Current localization assessment |
|---|---|
| Shared information routes | Complete explicit Dari/English static title/body pairs; version/contact-content limitations remain. No Pashto. |
| Login/register/protected prompt/profile edit/security | Extensive Dari/English labels and validation; tests cover the English auth-required prompt and return paths. Arbitrary API errors are not guaranteed localized. |
| Settings/language | Existing widget tests confirm switching, persistence and RTL/LTR updates; language sheet only has Dari/English. Password/metadata/OS dialogs are outside this coverage. |
| Home/categories/search/product | Names/descriptions/categories select actual English/Dari fields; product/manufacturer/strength data preserved. Untranslated tooltips, action labels and semantics remain. |
| Cart/checkout | Most visible copy maps through wrapper; quantities/prices use raw numeric strings and AFN label. Snackbar/native action strings and API errors need explicit mapping. |
| Rx | Main labels/statuses translated; selected filenames and pharmacist/patient data intentionally remain source values. Exception interpolation may leak untranslated Dari. No Pashto or fully localized detail timeline. |
| Orders/notifications | Known status labels and English notification fields supported; source notes/snapshots preserved. Dates/counters are manually formatted, not locale-aware. |
| Internal diagnostics | Mixed technical identifiers/English/Dari; debug-only and not customer translation scope. |

Confirmed leakage/boundary examples:

- Product favorite `tooltip` literals remain Dari; custom Text does not intercept IconButton tooltips.
- Product/Home snackbar action `label: 'مشاهده سبد'` and Rx action `label: 'سبد'` remain Dari in English.
- Home address `Semantics.label` and seasonal-campaign tooltip are literal Dari.
- Promotion carousel announces English `Banner … of …` / `… of …` in Dari.
- Missing medicine manufacturer defaults to English `Not listed`; card suppresses it, but other contexts require review.
- iOS permission-purpose strings in Info.plist are Dari only; no localized InfoPlist.strings found in the runner inventory.

Direction and accessibility findings:

- Global direction switches correctly in existing tests, with explicit LTR for email/phone/strength and several logical paddings/positions.
- Address form forces every non-phone field to `TextDirection.rtl`, including English entries. This is a concrete mismatch.
- Settings rows use `Icons.chevron_left_rounded`; these and other directional affordances need explicit direction-aware review rather than relying on a direction change alone.
- Home physical left/right header arrangement is intentional and tested in both languages. Article image alignment and brand gradients also use physical values; those are review points, not proven defects by themselves.
- `PharmacyApp` overwrites the platform text scaler with 1.0 or 1.12. System accessibility text size is therefore not preserved. Reduced-motion setting is passed via MediaQuery; custom timers/animations need individual verification.
- Dates use local Gregorian year/month/day strings with ASCII digits. Prices are backend decimal strings plus `AFN`/`افغانی`; counts interpolate raw integers. No shared locale-aware number/date formatter exists. Do not alter medicine strengths, IDs or monetary authority while adding one later.

## 8. Visual comparison with the approved website

The app already belongs to the teal pharmacy family, with the real wordmark, product imagery, Rx cues, white surfaces and native Material controls. It should retain these strengths. The gap is not a missing brand from scratch.

| Current source evidence | Difference / implication for later design |
|---|---|
| Primary `#079C9A`, dark `#087F7E`, bright teal gradients, mint image surfaces | Lighter/brighter emphasis than the approved deep-teal, restrained storefront hierarchy; align shared brand roles without copying website sections |
| Radius tokens 12/18/24; shared cards use 18 plus shadow, large image/content blocks use 24 | More rounded/padded than approved compact cards; revise as a native token system, not by shrinking all touch targets |
| Home rails about 300 high, cards 188 wide; category shelves 286; product image 300 plus same-image thumbnail | Large media/card blocks and redundant product gallery consume mobile space; needs real-device comparison before exact replacement values |
| Vazirmatn all locales; AppBar title 24, headline 30/24 | Website Dari uses Estedad; app typography hierarchy differs. Native font/line-height decisions should be tested for Dari/Pashto and English rather than copied blindly |
| Filled button min height 54, outlined 50, gradient/shadow buttons plus local overrides | Touch-friendly foundation worth keeping; visual hierarchy/styles are inconsistent across cart/product/forms |
| Native bottom NavigationBar 76 high; nested page Scaffolds and flat tab routes | Native pattern already exists. Improve hierarchy/back/retention only deliberately; do not paste web header/footer into Flutter |
| Error/empty states with 32 padding and large circular illustrations; screen-local loaders | Shared states have older spacious treatment and inconsistent placement; preserve retry/action clarity while consolidating later |
| Info documents use one plain icon/text card; filter/address sheets and segmented order groups | Reasonably aligned native building blocks; no reason to replace them with website grids or desktop sidebars |

No live device visual approval, clipping verdict or screenshot-based comparison is claimed. The next design milestone should first obtain a dedicated emulator/test-device baseline at narrow/wide phone sizes, with keyboard, system text scaling and both directions.

## 9. Shared component inventory

| File | Reusable elements and responsibilities |
|---|---|
| `core/design_system.dart` | `DarmaltonColors`, `DarmaltonSpace`, `DarmaltonRadius`, `buildDarmaltonTheme`, `DarmaltonCard`, `GradientButton`, `SectionTitle`, `StatusChip`, `LtrText` |
| `core/widgets.dart` | `MainScaffold`, `FallbackBackScope`, `DarmaltonWordmark`, `GoogleAuthButton`, `MedicineImage`/fallback, `CompactMedicineCard`, `CategoryTile`, `SkeletonBox`, `AsyncMessage`, `EmptyMessage` |
| `core/localized_text.dart`, `core/strings.dart` | Text wrapper, literal dictionary, paired text/status labels |
| `core/auth_gate.dart` | `ProtectedRoute`, safe return validation, account-required surface |
| `features/addresses/address_selector.dart` | Shared selection, create/edit, deletion/default actions, GPS/map picker and tiles |
| `features/catalog/promotion_carousel.dart` | Bounded CMS carousel, media retry/fallback, safe destination handling |
| `features/catalog/catalogue_screen.dart` | `HomeAppBar`, address bar, quick actions, shelves/brand/health sections (many remain private classes) |
| `features/prescription/prescription_picker.dart` | Injectable picker gateway, document validation and temporary lifecycle |
| Feature-local private widgets | Separate search/product/cart/order/checkout cards, summaries, quantity controls and forms; useful candidates for later consolidation, not duplicates to delete during this audit |

## 10. Behaviors that must survive redesign

- Public browsing and guest cart; safe login/register return paths and intentional guest prompt behavior.
- Secure token storage/refresh, logout/private-cache cleanup and owner-scoped backend access.
- Exact SKU IDs, authoritative stock/prices, Rx restrictions and historical order snapshots.
- Guest cart precision and incremental server synchronization; quantity/removal/retry behavior.
- File type/size checks, camera/gallery/file options, orientation/compression, temporary cleanup, failed-upload retry, permission-denial handling and no unintended private-file sharing.
- Backend-controlled Rx cancellation/clarification/bundle permissions. Adding a bundle must never silently create an order.
- Saved address fields/default selection, user-scoped cache, Afghan phone normalization, optional GPS/manual map and deletion-selection repair.
- Explicit checkout confirmation, COD truthfulness and server final totals/FEFO allocation.
- Notification read state/destination and order status history.
- Neutral-image fallback, offline metadata cache with no cached live prices/stock, offline retry/dismiss behavior and public-media endpoint rebasing.
- Existing native back behavior, readable touch targets, accessibility semantics and test-covered direction changes.
- Disabled incomplete features remain honest; no fabricated wallet/card payments/password reset/tracking.

## 11. Android and iOS findings

**Android:** package namespace and application ID remain `com.darmalton.pharmacy`; pubspec version `1.0.0+1`. Java/Kotlin target 17. AGP 9.0.1, Kotlin plugin 2.3.20, Gradle wrapper 9.1.0. Compile/target/min SDK values delegate to Flutter; launcher-icon generator separately declares min SDK 24, which is not the authoritative Gradle runtime minimum.

Release signing is conditional on the existing ignored `android/key.properties`; a local keystore exists. Contents/passwords were not read or reported. SHA-256 comparisons confirm that both existing release APK copies, key.properties and the release keystore are unchanged after the debug build. No release task, app-ID edit, signing edit, APK install, store configuration or public download replacement occurred. Website APK URL remains `https://darmalton.com/downloads/darmalton-android-1.0.0.apk`.

Main manifest requests Internet, coarse/fine location and camera. Debug alone explicitly permits cleartext traffic. Release endpoint should be supplied as HTTPS using `API_BASE_URL`; source falls back to a non-routable `api-not-configured.invalid` host when absent. The endpoint normalizer itself accepts an absolute URL without enforcing HTTPS, so release configuration remains an operational constraint, not a universal client validation guarantee. Google login also needs compile-time `GOOGLE_CLIENT_ID` and correct external platform registration; runtime Google readiness was not tested.

**iOS:** committed Runner, Xcode project/workspace, app/scene delegates, launch assets and RunnerTests exist. Bundle ID is `com.darmalton.pharmacy`; deployment target in the project is 13.0. Signing configuration contains developer/automatic settings but no DEVELOPMENT_TEAM entry was found. Camera/photo/location purpose strings exist in Dari. There is no evidence here of a configured/released iOS application. CocoaPods/plugin resolution, current deployment-target compatibility, provisioning, Google URL setup and compilation require macOS/Xcode verification. Nothing in signing/provisioning was changed. iOS is **not certified ready**.

## 12. Test/analyze/build baseline

Actual local toolchain: Flutter 3.44.7 stable, Dart 3.12.2, Windows. Existing dependency lockfile was retained; no package upgrade or `pub get` was requested.

| Executed command | Result |
|---|---|
| `flutter analyze --no-pub` | PASS, no issues, 103.3 seconds |
| `flutter test --no-pub --reporter expanded` | PASS, 71 tests across 15 files |
| `flutter build apk --debug --no-pub --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1` | PASS, assembleDebug 53.1 seconds; ignored `mobile/build/app/outputs/flutter-apk/app-debug.apk` |
| `flutter devices --machine` | Windows and Edge only; no Android/iOS target connected |
| Protected release/signing hash comparison | PASS, four pre-existing files unchanged |
| Git mobile source/config diff | Empty |

The debug build has existing toolchain warnings: Java native-access warning in Gradle's native-platform loader; Flutter warns about KGP usage in file_picker/flutter_image_compress_common/package_info_plus; SDK tooling reports XML version 4 versus reader support through 3. These did not fail compilation, were not introduced by UI edits, and remain unmodified baseline maintenance items. No production release build was run.

Tests cover models, API endpoint selection/refresh authorization rules, guest-first routes/return intent, local cache contracts, language switching/filter sheets, header positioning, back/offline states, addresses/phone/selection, notification destinations, CMS/category media and prescription camera/validation/retry/cleanup. They are not a complete authenticated end-to-end suite. No backend tests were rerun because no backend/integration contract changed. No new tests or application code were added for this audit.

Logs and read-only audit evidence are ignored under `tmp/mobile-app-audit/`: tests.log, debug-build.log, devices.json, localization-candidates.json and protected-artifact hash snapshot. The analyzer result was observed directly in the tool session.

## 13. Recommended redesign order — proposal only

1. Establish a dedicated local emulator/test-device capture baseline and agree native brand tokens, typography, accessibility, safe localized feedback and three-language architecture. Resolve scope for documented functional gaps before conflating them with visual edits.
2. Shared app shell/navigation/states, then Home. Preserve the existing native bottom navigation/app bars; agree tab retention/back behavior rather than importing web chrome.
3. Catalogue/search/filter sheet/category/manufacturer contexts and product detail. Address pagination and variant requirements as explicit, tested functional work if approved; keep exact SKU authority.
4. Cart and checkout/address sheets together. Protect guest synchronization, selected address, keyboard flow and explicit COD confirmation.
5. Prescription upload/history/detail and notifications. Retain privacy, picker cleanup, retry and pharmacist-controlled permissions.
6. Profile/settings/security, shared document/help routes, then comprehensive Dari/Pashto/English and accessibility/device regression.
7. Separate later release-readiness phase for Android packaging, warning remediation and iOS prerequisites. No signing or production delivery work belongs in the visual phase without explicit instruction.

## 14. Exact modules likely involved later

| Work package | Files (relative to repository root) |
|---|---|
| Theme/app shell | `mobile/lib/src/app.dart`, `mobile/lib/src/core/design_system.dart`, `mobile/lib/src/core/widgets.dart`, `mobile/lib/src/core/auth_gate.dart` |
| Localization/feedback | `mobile/lib/src/core/strings.dart`, `localized_text.dart`, `app_settings.dart`, `models.dart`, `api_client.dart`, `phone_number.dart`; `mobile/pubspec.yaml` only if approved font/localization tooling changes require it |
| Home/catalogue | `mobile/lib/src/features/catalog/catalogue_screen.dart`, `categories_screen.dart`, `search_results_screen.dart`, `medicine_detail_screen.dart`, `promotion_carousel.dart`, `health_article_screen.dart` |
| Cart/purchase/address | `mobile/lib/src/features/cart/cart_screen.dart`, `features/checkout/checkout_screen.dart`, `features/addresses/address_selector.dart` |
| Auth/account | `mobile/lib/src/features/auth/login_screen.dart`, `register_screen.dart`, `splash_screen.dart`; `features/profile/profile_screen.dart`; `features/settings/settings_screen.dart`, `account_settings_screen.dart`, `settings_info_screen.dart` |
| Rx/order/notification | `mobile/lib/src/features/prescription/prescription_screen.dart`, `prescription_picker.dart`; `features/orders/order_history_screen.dart`, `order_detail_screen.dart`; `features/notifications/notifications_screen.dart` |
| Integration-sensitive modules | `mobile/lib/src/core/providers.dart`, `guest_session.dart`, `local_cache.dart`, `api_endpoint_manager.dart`, `google_identity_service.dart` — preserve behavior; change only for explicitly scoped integration fixes |
| Assets | `mobile/assets/branding/`, `mobile/assets/fonts/`, `mobile/pubspec.yaml`; retain official identity and font licenses |
| Regression tests | Existing `mobile/test/` 15 files; later add missing pagination/variants/Rx-return-context/account-switch/formatting and device coverage as relevant |
| Release files protected from visual work | `mobile/android/app/build.gradle.kts`, manifests, signing files, `mobile/ios/Runner/Info.plist`, `mobile/ios/Runner.xcodeproj/project.pbxproj`; review only unless separately authorized |

## 15. Current status and stop boundary

**Audit complete. Mobile redesign has not started.** Functional/design findings are documented, not silently corrected. Native device visual acceptance and iOS readiness remain open. The website is frozen in Dari, Pashto and English.

Expected handoff status (no staged changes):

```text
 M website/next-env.d.ts
 M website/tsconfig.json
?? "docs/DARI_CUSTOMER_SITE_AUDIT - Copy.md"
?? docs/DARI_CUSTOMER_SITE_AUDIT.md
?? docs/MOBILE_APP_PRE_REDESIGN_AUDIT.md
```

The two website entries have no content diff and predate the audit. Historical audits were preserved. This report remains uncommitted. No mobile source/configuration changes, customer redesign, admin work, production changes, push or deployment were performed.

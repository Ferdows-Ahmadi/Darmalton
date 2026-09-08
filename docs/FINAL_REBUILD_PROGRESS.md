# Final storefront rebuild

## Starting state — 2026-09-06

- Repository: `C:\Users\AFerd\Documents\Darmalton`
- Starting branch: `codex/milestone-1`
- Starting HEAD: `7c7a1ec1c5c2939e71f058ebad429f497345f11a`
- Working tree: clean before baseline tools generated Next.js type references.
- Safety pointer: `pre-final-storefront-rebuild` at starting HEAD.
- Working branch: `customer-storefront-v1-final-rebuild`.
- Website: `website/`; data owner: `backend/catalog`, Django project `backend/pharmacy`.
- Baseline: 43 website tests; TypeScript; ESLint; Next.js production build; 103 backend tests (SQLite); Django check; migration consistency; Ruff lint/format all passed.
- Final database acceptance requires PostgreSQL; SQLite baseline is not final acceptance.

## Source inspection

Read the complete master prompt and v2 ROUTE_MAP, DESIGN_RULES, LOCALIZATION_RULES and CODEX_USAGE. Inspected both masters, all 42 desktop/mobile route references, state/overlay/localization sheets and all supplied packshots/campaigns/icons. Extracted references remain ignored under `tmp/final-rebuild/references`.

Workbook confirmed by the user: `C:\Users\AFerd\Desktop\Darmalton_Medicine_Inventory_Template.xlsx`, SHA256 `E28537E8445E4294E86E687C0670852B193D2D3281BE04694AE2AD055F16CC18`. Preserve source spellings, flags and nulls. Never commit the workbook or private purchase prices.

The existing checkout has fewer customer routes and no shared three-language website provider. Route additions must connect to its actual APIs rather than assume features from another checkout. Dari remains the default locale.

Existing Docker containers include a separate Darmalton-Team checkout on ports 3000/8000. Rebuild QA must use its own PostgreSQL container and ports.

## Acceptance — 2026-09-07

### Completed checkpoints

- `36310c8` prepared and verified the supplied V1 visual assets without repeating
  the already-completed source analysis or image mapping.
- `5d47b95` added the guarded, idempotent development workbook importer. The
  verified sample result is 61 medicines, 50 source batch rows, 11 documented
  deterministic synthetic batches and 59 mapped product images. The supplied
  medicine identity and medical/product fields remain unchanged.
- `f09ca2b` established the final customer shell, live catalogue and responsive
  home/shop/product composition.
- `a7016c0` completed the customer route surface and English, Dari and Pashto
  localization, including RTL behavior, account/auth/cart/checkout/order/
  prescription states, public information routes and responsive aliases.
- `93ad29e` completed the interrupted acceptance checkpoint: deterministic
  browser-independent localized numerals, synchronized locale switching, safe
  missing-image fallback responses, mapped local sample-media wiring and focused
  regression tests.

### Verification

- Backend on the final implementation: Ruff passed; Django system check passed;
  migration consistency reported no changes; all 107 tests passed on both the
  documented SQLite workstation fallback and PostgreSQL 17.11.
- Website on the final implementation: strict TypeScript and ESLint passed; all
  45 tests passed; the isolated production build compiled and generated 61
  pages successfully.
- Flutter: `flutter analyze` reported no issues and all 71 tests passed.
- Live route smoke returned HTTP 200 for 37 public/customer routes, with the
  real dynamic medicine route also checked. Dynamic category and manufacturer
  routes were separately verified with source-backed values.
- Browser QA covered the rebuilt customer route set at desktop and 390-pixel
  mobile widths. The final fresh-browser pass verified English LTR, Dari RTL and
  Pashto RTL switching, preserved search state, deterministic localized prices
  and counts, no document overflow, a persisted guest cart, real mapped product
  images, the missing-source image fallback and zero console warnings/errors.
- The exact-final-head PostgreSQL gate completed against
  `c94b3000f3c6d87b6638db1354f4e0d39959f0f4` using PostgreSQL 17.11 in an
  ephemeral loopback-only workspace cluster on port 55433. The portable archive
  SHA-256 was `4B8DB0930C38F6EF845DB919551DEDDA3B6B845AEB0927B3D79A6E8E9E4537CF`.
  Docker Desktop remained unresponsive and was not restarted; no existing
  container was inspected, stopped or changed.
- On that PostgreSQL database, Django reported no system issues or migration
  drift, all migrations applied cleanly and all 107 backend tests passed in
  53.06 seconds.
- The guarded workbook dry run read all 61 medicines and rolled back. The first
  committed import created 61 medicines and 61 batches (50 source rows plus 11
  deterministic synthetic batches), mapped 59 images and retained MED-0011 and
  MED-0012 as the only missing-image SKUs. The immediate rerun created no
  medicines or batches, updated 61 medicine records and skipped all 61 existing
  batches, confirming that reruns do not replenish consumed stock.
- Direct PostgreSQL/API assertions confirmed the exact MED-0001 through
  MED-0061 SKU set, no duplicate SKU groups, 54 active and 7 inactive medicines,
  61 active/approved/positive-stock/future-expiry sample batches, 59 mapped image
  files, safe SVG responses for missing files, and public selling prices/in-stock
  state for all 54 public medicines. Public payloads exposed no purchase price,
  cost price or private source-provenance fields.

### Handoff state

The rebuild remains on `customer-storefront-v1-final-rebuild`. All repository
acceptance gates for the rebuild are complete and the source is ready for the
separate deployment process. Local review runs at `http://127.0.0.1:3002`
against the isolated sample-data backend on port 8002. No push, deployment,
production service, VPS or DNS action was performed.

## Final visual polish — 2026-09-08

### Completed checkpoints

- `5cf9ee9` completed Checkpoint A: public legacy-demo isolation, the six-part
  shopper category layer, English/Dari/Pashto catalogue presentation, product
  family and strength grouping, CMS-managed responsive homepage heroes and
  conditional Health navigation. The supplied medicine identity and medical
  fields remain unchanged.
- `c7d7a05235b512b6296e78f29418628eacdd2f0b` completed Checkpoint B against
  `00_MASTER_HOMEPAGE_GLOBAL_VISUAL_AUTHORITY.png`: unified storefront surfaces,
  responsive CMS hero carousel, denser family-aware merchandising, prescription
  strip and upload dropzone, product/search/variant interactions, auth and app
  promotion pages, empty-cart recommendations, shared secondary pages, footer,
  skeletons, a one-time reduced-motion-aware intro, microanimations and
  accessible dismissible status feedback.

### Exact implementation-head acceptance

- PostgreSQL 17.11 ran in the isolated loopback-only QA workspace on port 55434;
  no Docker container, production service or unrelated user process was
  inspected, stopped or changed. Ruff format/lint, Django system checks and
  migration consistency passed. All 110 PostgreSQL-backed tests passed in
  54.41 seconds.
- The guarded workbook dry run and committed rerun each read all 61 medicine
  rows. The idempotent rerun created zero medicines and zero batches, updated
  all 61 medicine records and skipped all 61 existing batches. It reported 50
  source batch rows, 11 deterministic synthetic batches, 59 mapped images and
  MED-0011/MED-0012 as the only source-missing image SKUs.
- Direct database and anonymous API assertions confirmed the exact MED-0001
  through MED-0061 set, 54 active and 7 inactive medicines, no duplicate SKU,
  61 active/approved/positive-stock/future-expiry sample batches, 59 existing
  mapped image files, safe public SVG fallbacks for MED-0011/MED-0012, public
  selling prices for all 54 public medicines, and no public purchase price,
  cost price, barcode or private source-provenance fields.
- Website acceptance passed strict TypeScript, ESLint, all 45 tests and a
  production build that generated 61 pages. Flutter analysis reported no
  issues and all 71 tests passed.
- Browser QA exercised the homepage plus shop, category, manufacturer, product,
  cart, checkout/login, prescription, app, About and Health surfaces at desktop
  and 390-pixel mobile widths. The complete required width matrix (1440, 1366,
  1280, 1024, 900, 768, 430, 412, 390, 375, 360 and 320) had no horizontal
  overflow; hero controls stayed inside the viewport and the sticky header and
  footer did not overlap content. English was LTR, Dari and Pashto were RTL,
  keyboard search opened the selected medicine family, exact-SKU variant
  switching worked, guest cart checkout preserved its return path, and a fresh
  browser session reported no console warnings or errors.

The final-polish implementation is deployment-ready for the separate deployment
process. No push, deployment, VPS, production or DNS action was performed.

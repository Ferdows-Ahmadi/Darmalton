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
  migration consistency reported no changes; all 107 tests passed on the
  documented SQLite workstation fallback.
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
- The dedicated local PostgreSQL rebuild database passed the 106-test suite and
  guarded sample import earlier in this rebuild. Before the final-head rerun,
  Docker Desktop stopped responding: its API did not answer within 30 seconds
  and PostgreSQL connections to the still-bound rebuild port stalled. Docker was
  not restarted because unrelated user containers are in scope on that engine.
  The exact-final-head PostgreSQL/Compose/integrated-smoke rerun therefore remains
  an environmental acceptance blocker. No schema change was introduced after
  the successful PostgreSQL run; the subsequent backend change is covered by a
  focused missing-file fallback test in the 107-test fallback suite.

### Handoff state

The rebuild remains on `customer-storefront-v1-final-rebuild`. Local review runs
at `http://127.0.0.1:3002` against the isolated sample-data backend on port 8002.
No push, deployment, production service, VPS or DNS action was performed.

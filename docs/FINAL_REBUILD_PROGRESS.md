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

## Acceptance

Pending implementation and final verification. No push or deployment is authorized.

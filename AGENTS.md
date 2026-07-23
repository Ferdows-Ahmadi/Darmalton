# Online Pharmacy Engineering Guide

## Architecture

This monorepo implements one Django REST API backed by PostgreSQL, one Next.js
website, and one Flutter client. Django is the sole authority for authentication,
authorization, prices, inventory, and order status transitions. PostgreSQL is the
primary runtime database. SQLite is a documented workstation fallback only.

Milestone 1 uses one active fulfillment branch per cart/order. Inventory is
allocated using FEFO (earliest expiry first) inside a database transaction with
row locks. Orders and their item snapshots are historical records and are not
hard-deleted.

## Repository layout

- `backend/`: Django, DRF, admin, migrations, seed data, and tests
- `website/`: Next.js App Router and TypeScript customer website
- `mobile/`: Flutter application using Riverpod, Dio, and go_router
- `infrastructure/`: container build files
- `scripts/`: repeatable PowerShell developer commands
- `docs/`: contracts, decisions, verification, limitations, and progress

## Development commands

Run `./scripts/setup-local.ps1`, then use:

- `./scripts/dev-local.ps1`: local SQLite backend and website
- `docker compose up --build`: primary PostgreSQL stack
- `./scripts/test-all.ps1`: backend, website, and Flutter verification
- `python backend/manage.py seed_demo`: idempotent safe demo data

See `README.md` for exact prerequisites and platform-specific commands.

## Conventions

- Python: Ruff formatting/linting, type-friendly services, thin serializers/views
- TypeScript: strict mode, accessible semantic HTML, API types in one module
- Dart: feature-first code, immutable typed models, provider-owned async state
- Use UUIDs for exposed entities and `Decimal`/`NUMERIC` for money
- Use timezone-aware timestamps and explicit `TextChoices` state machines
- Keep user-visible errors stable and actionable; never expose stack traces

## Testing expectations

Every business rule has a service-layer test. Changes must pass Django checks,
migration consistency, backend tests, Ruff, website lint/type/build, Flutter
analyze/tests, Compose validation, and the integrated smoke test where the local
toolchain permits.

## Security rules

Never commit secrets, `.env`, tokens, private keys, customer data, database
files, or uploaded media. Clients never supply authoritative totals, ownership,
stock, roles, or status. All object access is owner-scoped. Uploaded images are
size/type validated. Production `DEBUG` defaults to false.

## Definition of done

A change is done only when its tests pass, documentation and API contracts remain
accurate, migrations are reviewed, no secret is introduced, and the demonstrated
user flow works through both clients or an honestly documented platform blocker
exists.


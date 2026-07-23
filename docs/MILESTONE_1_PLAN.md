# Milestone 1 Plan

## Scope

Deliver a demonstrable customer vertical slice: registration/login, searchable
category-filtered catalogue, medicine details and live stock, cart management,
address creation/selection, cash-on-delivery checkout, order history/details, and
validated administrator status updates visible to website and mobile clients.

## Exclusions

No online payment gateway, driver app/GPS, refunds/returns, supplier purchasing,
accounting, promotions, notifications, SMS, prescription approval workflow, OCR,
marketplace settlement, or production deployment.

## Architecture

Next.js and Flutter consume `/api/v1/` from Django REST Framework. Django owns all
business rules and persists to PostgreSQL. JWT access/refresh tokens support mobile
clients; the website exchanges credentials through a same-origin Next.js proxy
that stores tokens in secure HTTP-only cookies. Django Admin uses its normal secure
session authentication.

For workstation fallback, `DJANGO_USE_SQLITE=true` starts the identical Django
application without Docker. PostgreSQL remains the primary and CI/container
configuration.

## Milestone entities

Custom `User`, `CustomerProfile`, `Pharmacy`, `PharmacyBranch`, `Category`,
`Manufacturer`, `DosageForm`, `Medicine`, `MedicineImage`, `InventoryBatch`,
`CustomerAddress`, `Cart`, `CartItem`, `Order`, `OrderItem`,
`OrderItemAllocation`, and `OrderStatusHistory`.

The attached long-term design also defines operational, prescription, delivery,
payment, return, promotion, notification, and audit entities. They are deferred.

## API endpoints

The stable shapes and complete endpoint table are in `docs/API_CONTRACT.md`.
Swagger is served at `/api/docs/` and the OpenAPI document at `/api/schema/`.

## User flows

1. Register or log in.
2. Browse, search, filter, and inspect a medicine.
3. Add it to the server-owned cart and adjust quantity.
4. Create/select an owned delivery address.
5. Submit checkout without prices or totals.
6. Backend locks eligible inventory, allocates FEFO, calculates totals, creates
   immutable snapshots/history, decrements stock, and clears the cart atomically.
7. Admin advances `PENDING` to `CONFIRMED` through validated service logic.
8. Customer refreshes order details/history in either client.

## Implementation phases

1. Environment/repository/contracts
2. Django data model, migrations, admin, seed command
3. Auth/API/business services and tests
4. Next.js customer website and checks
5. Flutter client, analysis/tests, Android build where available
6. Integrated smoke test, documentation, final commit/tag

## Acceptance criteria

- PostgreSQL Compose stack validates and local fallback runs.
- Migrations and seed command succeed; at least 20 medicines are available.
- Ownership, inactive/expired/insufficient stock, price authority, FEFO,
  rollback, and state transition tests pass.
- Website production build and Flutter analyzer/tests pass.
- A scripted smoke flow proves registration through confirmed status.
- No secret or database file is tracked.

## Known platform limitations

Windows cannot build/sign iOS. A macOS machine with current stable Xcode,
CocoaPods, and an Apple developer team must run `flutter build ios` and complete
signing. Android emulator support depends on firmware virtualization. If Docker
Desktop/WSL2 cannot run for the same reason, use the SQLite fallback while keeping
the PostgreSQL Compose path intact.


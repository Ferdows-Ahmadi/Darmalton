# API Contract

Base path: `/api/v1/`. JSON uses UUID strings, ISO-8601 timestamps, ISO dates, and
money serialized as two-decimal strings. List endpoints return
`{"count": n, "next": url|null, "previous": url|null, "results": [...]}`.

Errors use:

```json
{
  "error": {
    "code": "stable_machine_code",
    "message": "Human-readable summary",
    "fields": {"field": ["Specific validation message"]}
  }
}
```

## Authentication

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/auth/register/` | `email`, `password`, `first_name`, `last_name`, optional `phone` | `user`, `access`, `refresh` |
| POST | `/auth/login/` | `email`, `password` | `user`, `access`, `refresh` |
| POST | `/auth/google/` | Google Identity Services `id_token` | `user`, `access`, `refresh` |
| POST | `/auth/refresh/` | `refresh` | `access` and rotated `refresh` |
| GET | `/auth/me/` | bearer access token | `User` |
| GET/PATCH/PUT | `/auth/me/medical-profile/` | `allergies[]`, optional `medical_notes` | Owner's minimal medical profile |

`User`: `id`, `email`, `phone`, `first_name`, `last_name`, `role`.

`/auth/google/` verifies the Google signature, configured audience, issuer,
expiry, stable `sub`, and verified email server-side. A stored social identity
is keyed by provider and subject. A new verified identity creates a customer
with an unusable local password. Automatic linking to an existing email is
limited to Gmail or Google Workspace accounts for which Google is authoritative;
otherwise the endpoint returns `google_link_required`.

## Catalogue

| Method | Path | Notes |
|---|---|---|
| GET | `/categories/` | Active categories |
| GET | `/medicines/?search=&category=&page=` | Active medicines, paginated |
| GET | `/medicines/{id}/` | Medicine detail |

`Medicine`: `id`, `sku`, `brand_name`, optional `brand_name_dari`,
`generic_name`, `manufacturer{name}`, `category{id,name,name_dari,slug}`,
`dosage_form{code,name,name_dari}`, `strength`, `pack_size`, `description`,
optional `description_dari`, `prescription_required`, `image_url`, `price`,
`available_quantity`, `in_stock`. English/Latin fields remain the fallback;
clients prefer populated Dari display fields.

### Medicine images

| Method | Path | Notes |
|---|---|---|
| GET | `/medicine-images/?medicine_id={uuid}` | Staff/admin image metadata |
| POST | `/medicine-images/` | Staff/admin multipart upload |
| GET/PATCH/DELETE | `/medicine-images/{id}/` | Staff/admin management |
| GET | `/medicine-images/{id}/content/` | Anonymous cacheable image bytes |

Uploads accept actual JPEG, PNG, or WebP images up to 5 MiB and dimensions from
128 through 6000 pixels. Django inspects image content rather than trusting the
filename or MIME header. Exactly one image can be primary per medicine; deleting
it promotes the next image. Medicine responses contain ordered `images[]` and a
primary `image_url`; clients use the neutral fallback when none exists.

## Cart

| Method | Path | Request |
|---|---|---|
| GET | `/cart/` | none |
| POST | `/cart/items/` | `medicine_id`, `quantity` |
| PATCH | `/cart/items/{id}/` | `quantity` |
| DELETE | `/cart/items/{id}/` | none |

`Cart`: `id`, `items[]`, `item_count`, `subtotal`. Each item includes `id`,
`medicine`, `quantity`, `unit_price`, `line_total`, and `available_quantity`.
Prices are informational until checkout and always computed by Django.

## Addresses

| Method | Path | Request |
|---|---|---|
| GET/POST | `/addresses/` | address fields on POST |
| PATCH | `/addresses/{id}/` | changed owned fields |
| DELETE | `/addresses/{id}/` | allowed unless protected by policy |

Address fields: `label`, `recipient_name`, `recipient_phone`, `country_code`,
`province`, `city`, optional `district`, `street_address`, optional `landmark`,
optional `delivery_instructions`, optional decimal `latitude`/`longitude`, and
`is_default`. Phone numbers are normalized to Afghan compact E.164. At most one
address per customer is default; the first becomes default automatically, and
deleting a default promotes a safe replacement when one exists.

## Corrected Phase 2 customer preferences and catalogue filters

- `/auth/me/` reads and updates `preferred_language` (`fa` or `en`). New users
  default to Dari. Customer phone input accepts common Afghan local/`0093`/`+93`
  forms and Persian/Arabic digits, then stores compact E.164.
- `GET /manufacturers/` is anonymous and read-only.
- `GET /medicines/` supports `search`, `category`, `manufacturer`,
  `prescription_required`, `in_stock`, `min_price`, `max_price`, and `ordering`.
  Supported ordering values are the allowlisted catalogue name and current-price
  directions exposed by the client. Invalid booleans, numbers, ranges, IDs, or
  ordering values return HTTP 400.
- Stock and current price filters are calculated from active, unexpired,
  quality-eligible inventory; client query values never override inventory or
  pricing authority.

## Orders

| Method | Path | Request/notes |
|---|---|---|
| POST | `/orders/` | `address_id`; creates cash-on-delivery order |
| GET | `/orders/?page=` | current customer's orders |
| GET | `/orders/{id}/` | current customer's order |
| GET | `/orders/{id}/status-history/` | append-only transitions |

`Order`: `id`, `order_number`, `status`, `payment_method`, `payment_status`,
`currency_code`, `subtotal`, `delivery_fee`, `discount_total`, `grand_total`,
`delivery_address`, `items[]`, `status_history[]`, `placed_at`.

Order items snapshot `medicine_id`, `medicine_name`, `strength`, `dosage_form`,
`quantity`, `unit_price`, and `line_total`. Clients never submit any monetary,
inventory, ownership, payment-status, or order-status field.

## Pharmacy operations

All `/operations/` endpoints require an authenticated pharmacist, pharmacy staff
member, administrator, or superuser. Django remains authoritative for totals,
stock quantities, workflow state, and actor fields.

### Suppliers and procurement

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/operations/suppliers/` | Search/filter suppliers; create normalized supplier records |
| GET/PATCH | `/operations/suppliers/{id}/` | Supplier detail and maintenance; deactivate instead of deleting |
| GET/POST | `/operations/purchase-orders/` | Search/filter or create a purchase order with nested items |
| GET/PATCH | `/operations/purchase-orders/{id}/` | Detail; core terms/items become immutable after submission |
| POST | `/operations/purchase-orders/{id}/submit/` | Draft to submitted |
| POST | `/operations/purchase-orders/{id}/approve/` | Submitted to approved, recording approver and time |
| POST | `/operations/purchase-orders/{id}/cancel/` | Cancel a permitted unreceived order |
| POST | `/operations/purchase-orders/{id}/receive/` | Receive batch quantities into an active location |

Purchase-order numbers, subtotals, line totals, net totals, ordered/approved/
received actors, receipt status, and delivery timestamps are server-generated.
Receipt items require the purchase-order item, quantity, batch number, expiry,
selling price, storage location, quality decision, and optional inspection note.
Partial receipts are supported and cannot exceed the outstanding ordered
quantity.

### Warehouses and inventory

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/operations/warehouses/` | Branch warehouse CRUD |
| GET/PATCH | `/operations/warehouses/{id}/` | Warehouse detail; deactivate instead of deleting |
| GET/POST | `/operations/storage-locations/` | Rack/shelf location CRUD |
| GET/PATCH | `/operations/storage-locations/{id}/` | Storage-location detail; deactivate instead of deleting |
| GET | `/operations/inventory-batches/` | Operational batch list |
| GET | `/operations/inventory-batches/{id}/` | Batch inspection, location, and verification detail |
| POST | `/operations/inventory-batches/{id}/inspect/` | Approve, quarantine, reject, or mark pending |
| POST | `/operations/inventory-batches/{id}/verify/` | Record physical count and any resulting adjustment |
| POST | `/operations/inventory-batches/{id}/adjust/` | Audited expiry, damage, or manual adjustment |
| GET | `/operations/inventory-transactions/` | Immutable stock-movement ledger |
| GET | `/operations/inventory-transactions/{id}/` | Ledger entry detail |

Every purchase receipt, checkout sale, eligible customer return, expiry,
damage, manual adjustment, and physical verification records the batch,
direction, quantity, before/after stock, actor, reference, and timestamp. Ledger
entries cannot be changed or deleted through the model or admin. Customer stock
and FEFO checkout include only active, unexpired, quality-approved batches.

### Customer returns and refunds

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/returns/` | Current customer's return requests; delivered orders only |
| GET | `/returns/{id}/` | Owner-scoped detail and customer-safe history |
| POST | `/returns/{id}/cancel/` | Cancel while still requested |
| GET | `/operations/returns/` | Staff search/filter queue |
| GET | `/operations/returns/{id}/` | Staff detail, history, and stock movements |
| POST | `/operations/returns/{id}/approve/` | Approve per-item quantities |
| POST | `/operations/returns/{id}/reject/` | Reject with reason |
| POST | `/operations/returns/{id}/schedule-pickup/` | Record pickup schedule |
| POST | `/operations/returns/{id}/mark-picked-up/` | Advance pickup status |
| POST | `/operations/returns/{id}/receive/` | Record received quantities |
| POST | `/operations/returns/{id}/verify/` | Record condition and eligible restocking |
| POST | `/operations/returns/{id}/complete-refund/` | Record completed manual refund reference |

Requested and approved refund amounts are derived from immutable order-item
prices. Return quantities are capped across active requests. Only staff-verified,
unopened items allocated from active, approved, unexpired source batches can be
restocked. Refund completion records an internal/manual reference and does not
call a payment gateway.

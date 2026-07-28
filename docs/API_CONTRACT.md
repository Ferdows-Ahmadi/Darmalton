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
`is_default`.

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

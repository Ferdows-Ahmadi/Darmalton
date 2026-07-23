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
| POST | `/auth/refresh/` | `refresh` | `access` and rotated `refresh` |
| GET | `/auth/me/` | bearer access token | `User` |

`User`: `id`, `email`, `phone`, `first_name`, `last_name`, `role`.

## Catalogue

| Method | Path | Notes |
|---|---|---|
| GET | `/categories/` | Active categories |
| GET | `/medicines/?search=&category=&page=` | Active medicines, paginated |
| GET | `/medicines/{id}/` | Medicine detail |

`Medicine`: `id`, `sku`, `brand_name`, `generic_name`, `manufacturer{name}`,
`category{id,name,slug}`, `dosage_form{code,name}`, `strength`, `pack_size`,
`description`, `prescription_required`, `image_url`, `price`, `available_quantity`,
`in_stock`.

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


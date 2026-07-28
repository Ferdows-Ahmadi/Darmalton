# Dari UI screen-to-data mapping

This mapping is the implementation boundary for the reference designs. Django
remains authoritative; visual elements never imply a backend capability that
does not exist.

| Screen | Existing model/API support | Presentation-only or derived | Missing/disabled in this milestone |
|---|---|---|---|
| Home | `Category`, `Medicine`; `/categories/`, `/medicines/` | promotion artwork, benefit strip, curated section order | notifications and promotion eligibility |
| Categories/search | category IDs/slugs/names; medicine search/category filters, price and stock | category icons, client sort choices, result count | brands as a first-class model, advanced filters |
| Product detail | medicine name, generic, manufacturer, category, dosage form, strength, pack size, description, prescription flag, image, price, stock | gallery layout, neutral pharmacist reminder | ratings/reviews, favorites, discount campaigns, ingredients and clinical dosing |
| Cart | cart/items, server price, quantity, availability, line totals and subtotal | delivery estimate label | coupons, saved-for-later |
| Checkout | customer addresses; COD order creation; server subtotal, fee, discount and grand total | secure-data note, delivery presentation | card/online payment, wallet, saved payment methods, order notes and selectable delivery methods |
| Orders | order number, current status, payment state, immutable items/address, totals and placed date | active/completed/cancelled tabs derived from status | cancellation endpoint |
| Tracking | current status and ordered status history | static map illustration, estimated progress | live GPS, assigned courier, chat and courier calls |
| Prescription | no model or endpoint | explanatory review process | upload, preview persistence, pharmacist review and prescription-order linkage |
| Profile | `/auth/me/`, addresses, orders | customer initials and derived order count | wallet, notification preferences, help tickets and saved payments |
| Authentication | register, password login, verified Google ID-token login, refresh, current user, logout token clearing | branded Dari copy | password-reset endpoint |

## Localization fields

The existing English/Latin catalogue fields remain canonical identifiers and
searchable fallback text. Optional Dari display fields are added to categories,
dosage forms, and medicines and exposed by the same endpoints. They do not
duplicate pricing, inventory, order, or product records.

## Honest unsupported-state rules

- Unsupported actions remain visible only where useful for orientation and are
  labeled `به‌زودی` (coming later) or disabled with an explanation.
- The tracking map is explicitly a route illustration, not live courier GPS.
- Prescription submission cannot be enabled until a server-side upload/review
  model, validation, permissions, and workflow exist.
- Checkout exposes cash on delivery as the only enabled method.
- Ratings, favorites, promotions, coupons, wallet balances, and chat are not
  populated with fabricated values.

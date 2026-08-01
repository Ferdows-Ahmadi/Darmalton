# Dari UI screen-to-data mapping

This mapping is the implementation boundary for the reference designs. Django
remains authoritative; visual elements never imply a backend capability that
does not exist.

| Screen | Existing model/API support | Presentation-only or derived | Missing/disabled in this milestone |
|---|---|---|---|
| Home | `Category`, `Medicine`, cached selected address; `/categories/`, `/medicines/`, `/addresses/` | promotion artwork, benefit strip, curated section order | notification icon is gated until Phase 8; no nearby-pharmacy content |
| Categories/search | category/manufacturer IDs and bilingual names; server search, category, manufacturer, prescription, availability, price, and ordering filters | category icons and result count | production merchandising/CMS workflow |
| Product detail | medicine, images, manufacturer, category, description, prescription flag, authoritative current price/stock | gallery layout and pharmacist reminder | ratings/reviews and real discount campaigns |
| Cart | cart/items, server price, quantity, availability, line totals and subtotal | delivery estimate explanation | promotion-code control gated until its backend is functional |
| Checkout | selected owned address, optional delivery coordinates/instructions, COD order creation, server totals | secure-data note and delivery presentation | card/wallet controls hidden behind feature flags |
| Addresses | owner-scoped CRUD/default, cached offline selection, manual fields, GPS/map coordinates | OpenStreetMap pin picker and preview | service-zone validation, dynamic fee/ETA, and fulfilment routing are Phase 7 |
| Orders | order number/status/payment state, immutable items/address/location snapshot, totals, history | active/completed/cancelled grouping | customer cancellation policy endpoint |
| Tracking | current status and append-only status history | honest progress presentation | fake map removed; courier assignment/GPS/map/chat are Phase 7 |
| Prescription | private upload/review API, status/history, clarification/cancellation, approved medicine authorization | camera/gallery/file selection, local preview, progress and retry | physical-device camera/review-to-checkout walkthrough remains required |
| Profile | `/auth/me/`, addresses, orders and account actions | customer initials and derived order count | no fake wallet; Settings is a separate bottom destination |
| Settings | local preferences/cache plus `/auth/me/` language/profile synchronization | immediate Dari/English and RTL/LTR switching | OS push notification delivery is Phase 8 |
| Authentication | register, password login, verified Google ID-token login, refresh, current user, logout token clearing | branded bilingual copy | password recovery remains gated until its endpoint exists |

## Localization fields

The existing English/Latin catalogue fields remain canonical identifiers and
searchable fallback text. Optional Dari display fields are added to categories,
dosage forms, and medicines and exposed by the same endpoints. They do not
duplicate pricing, inventory, order, or product records.

## Honest unsupported-state rules

- Unsupported actions are hidden or disabled through explicit feature flags;
  their backend models/routes/integration points are preserved where valid.
- Customers never select or compare a pharmacy. Branches, warehouses, partners,
  and fulfilment routing are staff-only concepts.
- Tracking never displays a static route as live GPS. Phase 7 owns service zones,
  delivery fees/ETAs, courier assignment, courier updates, and customer maps.
- Prescription images are private and accessible only through owner/staff-scoped
  endpoints; client previews never make the file public.
- Checkout exposes cash on delivery as the only enabled method.
- Notifications, password recovery, coupons, card payments, wallet balances,
  and courier chat are never populated with fabricated state.

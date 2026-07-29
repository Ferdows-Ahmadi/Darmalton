# Next Steps

This file tracks only work that remains after the latest verified build. Current
implementation progress is in `docs/BUILD_LOG.md`.

1. Supply production Google OAuth credentials/authorized origins and complete
   live website plus signed Android provider-consent tests.
2. Validate iOS, including its Google OAuth client and callback URL scheme, on a
   macOS CI runner or developer Mac.
3. Assign locations to migrated inventory batches and perform an opening
   physical stock verification before production cutover.
4. Choose and integrate the production payment/refund provider; until then,
   refund completion remains an explicit manual record.
5. Add delivery assignment/live tracking, rate limiting, managed secrets/object
   storage, observability, backups, and CI across PostgreSQL/web/mobile.
6. Build a dedicated staff operations console only if Django Admin and the
   staff APIs are insufficient for the pharmacy's day-to-day workflow.

# Production Environment

Use `.env.production.example` as the names-only template. The populated
`.env.production` is ignored by Git and must be readable only by the deploy user.

## Required

| Variable | Purpose |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL initialization; use unique random credentials |
| `DATABASE_URL` | URL-encoded PostgreSQL connection string using service host `db` |
| `DJANGO_SECRET_KEY` | Unique random value of at least 50 characters |
| `DJANGO_ALLOWED_HOSTS` | Final API host(s), comma separated |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Exact HTTPS browser origins |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Exact HTTPS trusted origins |
| `DARMALTON_WEB_HOST`, `DARMALTON_API_HOST` | Traefik host rules; no scheme |
| `TRAEFIK_CERT_RESOLVER` | Existing Hostinger Traefik resolver name |

`DJANGO_PRODUCTION=true`, `DJANGO_DEBUG=false` and PostgreSQL are mandatory.
Production startup rejects a missing/weak secret, missing PostgreSQL URL,
SQLite, debug mode, empty hosts or empty CSRF/CORS origins.

Compose appends the private service hostname `backend` to Django's runtime
allowlist so server-side Next.js calls work on the isolated edge network. Do not
add private service names to public DNS and do not replace the final API host in
`DJANGO_ALLOWED_HOSTS` with `backend`.

## Tunable defaults

- `DATABASE_CONN_MAX_AGE=60`
- `ACCESS_TOKEN_MINUTES=15`, `REFRESH_TOKEN_DAYS=7`
- `DJANGO_ANON_THROTTLE_RATE=120/min`, `DJANGO_USER_THROTTLE_RATE=600/min`
- `DJANGO_SECURE_HSTS_SECONDS=31536000`
- `DJANGO_LOG_LEVEL=INFO`
- `PRESCRIPTION_MAX_UPLOAD_BYTES=10485760`

The edge proxy must set `X-Forwarded-Proto: https`. Internal Next.js requests
set the same trusted header through `API_INTERNAL_FORWARDED_PROTO=https`.

## Optional external integrations

`GOOGLE_CLIENT_ID` is shared by Django and the server-rendered Next.js login
page. Leave it empty to hide Google login. `GOOGLE_CLIENT_SECRET` is reserved
for a future server-side authorization-code integration and remains empty for
the current ID-token verification flow. SMTP, object storage, payment gateway, courier and push-notification
credentials are intentionally absent because those integrations are not in the
current MVP.

For launch, create one Google Web OAuth client with the final website HTTPS
origin (and localhost only for local testing), then configure that client ID in
Django, Next.js and the Flutter build. The current popup callback posts the ID
token directly and does not use a redirect URI or client secret. Create a
separate Android OAuth client for `com.darmalton.pharmacy` with both SHA-1 and
SHA-256 from the final signing certificate. Keep production Google login hidden
until both clients and the consent screen are verified.

Do not commit or print the populated environment file. Rotate any value that
appears in logs, chat, screenshots or source control.

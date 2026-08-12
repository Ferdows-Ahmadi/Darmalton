# Online Pharmacy Milestone 1

A Django + PostgreSQL API, responsive Next.js website, and Flutter Android/iOS
client implementing the first complete cash-on-delivery pharmacy order flow.

## Dari-first interface

Both customer clients use right-to-left `fa-AF` layouts, bundled Vazirmatn
Regular/Medium/Bold fonts, and the supplied official Darmalton wordmark and
Android launcher artwork. Latin medicine identifiers, email addresses, phone
numbers, SKUs, and order numbers remain directionally isolated for readability.
The UI references are implemented as a coherent design system; values shown for
price, stock, carts, addresses, orders, and account data come from Django rather
than from screenshot placeholders.

## Quick start with Docker (primary)

1. Copy `.env.example` to `.env` and replace all placeholder secrets/passwords.
2. Run `docker compose up --build`.

The backend container waits for PostgreSQL, migrates, seeds the idempotent demo
data, collects static files, and then starts Gunicorn. Docker Desktop requires
WSL 2 or another supported virtualization backend on Windows.

Open:

- Public website: http://localhost:3000 (customer application: `/shop`)
- Staff portal: http://localhost:3000/staff
- Staff sign-in: http://localhost:3000/staff/login
- API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

For the physical Pixel and same-Wi-Fi meeting demo, use the single safe startup
command and checklist in `docs/DEMO_RUNBOOK.md` and
`docs/DEMO_ACCEPTANCE_CHECKLIST.md`. The script prints the current LAN links:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demo-start.ps1
```

The staff portal accepts `STAFF`, `PHARMACIST`, and `ADMIN` accounts and sends
unauthenticated visitors to its dedicated sign-in page while preserving the
requested staff route. A staff account entered through the public sign-in page
is also routed to `/staff`; customer accounts cannot enter the staff portal.
The custom portal is the normal interface for prescription review, catalogue
and media management, CMS, and administrator account management. Django Admin
remains a separate hidden technical fallback at backend port 8000; set
`DJANGO_ADMIN_ORIGIN` when production routing uses a different backend origin.

## Google sign-in configuration

Create a Google OAuth 2.0 **Web application** client, then set
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the ignored `.env`. Add
`http://localhost:3000` as an authorized JavaScript origin for local website
testing. `GOOGLE_CLIENT_ID` is intentionally public: Next.js passes it to
Google Identity Services and the Flutter build uses it as the backend ID-token
audience. `GOOGLE_CLIENT_SECRET` remains in Django's server environment and is
never compiled into either client.

For Android, also register package `com.darmalton.pharmacy` and the signing
certificate SHA-1 in the same Google Cloud project. Then build from a shell where
the public client ID is set:

```powershell
$env:GOOGLE_CLIENT_ID="<web-client-id>.apps.googleusercontent.com"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-device.ps1 -Mode usb -Build -Install -Launch
```

Django accepts only a Google-signed ID token whose audience matches that client
ID. It never accepts a client-provided Google user ID or email as proof of
identity. Existing Gmail/Google Workspace email accounts can be linked after
verification; other pre-existing email accounts must first use password login
to prevent automatic account takeover.

## Windows fallback without Docker

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-local.ps1
```

The setup script installs dependencies into `.venv`, migrates, and seeds an
ignored SQLite development database. The development script starts the backend
and website in hidden processes and writes ignored logs/PIDs under `tmp/dev`.
Stop both with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

Demo-only credentials:

- Customer: `customer@example.test` / `ChangeMe-Customer-123!`
- Administrator: `admin@example.test` / `ChangeMe-Admin-123!`

Never reuse these credentials outside local development.

Run the Flutter app separately after installing Flutter stable. For normal
Docker and physical-device development, use the idempotent startup command:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
```

Run it once from an Administrator PowerShell with `-ConfigureFirewall` to add
Private-profile rules for TCP 3000, TCP 8000, and UDP 53535. It starts PostgreSQL, Django,
the website, and the development discovery responder; updates the current
private LAN address in the ignored `.env`; verifies backend health; and applies
`adb reverse tcp:8000 tcp:8000` to every connected authorized Android device.

Install the debug application once:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-device.ps1 -Mode usb -Build -Install -Launch
```

That APK first probes the stable USB localhost tunnel, then performs one bounded
development-service broadcast, then retries the last successful LAN endpoint
and any explicit developer override. It therefore survives laptop DHCP changes
without rebuilding. Debug Settings and the sign-in screen expose connection
diagnostics, health, last success, rediscovery, and a manual private endpoint.
Release builds never run LAN discovery and require an explicit HTTPS
`API_BASE_URL`.

## Verification

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:MOBILE_API_BASE_URL='http://127.0.0.1:8000/api/v1'; & '.\scripts\test-all.ps1'"
docker cp .\scripts\smoke_flow.py darmalton-backend-1:/tmp/smoke_flow.py
docker compose exec -T -e PYTHONPATH=/app backend python /tmp/smoke_flow.py
docker compose config
```

The test script uses `website/.next-build` for the production build so it can run
without corrupting an active `next dev` cache. Flutter checks and an Android debug
APK are included when Flutter is on `PATH`, under `FLUTTER_ROOT`, or installed at
`C:\src\flutter`. Set `MOBILE_API_BASE_URL` before running the script to build for
a physical device instead of the emulator default. See `docs/KNOWN_ISSUES.md`
for the current platform and intentionally unsupported capabilities.

More detail: `docs/ENVIRONMENT.md`, `docs/API_CONTRACT.md`,
`docs/MILESTONE_1_PLAN.md`, `docs/BUILD_LOG.md`, `SECURITY.md`, and
`docs/KNOWN_ISSUES.md`.

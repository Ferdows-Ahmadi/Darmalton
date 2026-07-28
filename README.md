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

- Website: http://localhost:3000
- API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

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

Run the Flutter app separately after installing Flutter stable. The most
reliable physical-device workflow uses USB forwarding and does not depend on
the laptop's changing Wi-Fi address:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-device.ps1 -Mode usb -Build -Install -Launch
```

That command establishes `adb reverse tcp:8000 tcp:8000` and builds with
`API_BASE_URL=http://127.0.0.1:8000/api/v1`. For an emulator, use
`http://10.0.2.2:8000/api/v1`.

For Wi-Fi testing, first add the active private IPv4 address to
`DJANGO_ALLOWED_HOSTS` in the ignored `.env`, recreate the backend, and then use:

```powershell
Get-NetIPConfiguration | Where-Object IPv4DefaultGateway
docker compose up -d --force-recreate backend
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\android-device.ps1 -Mode lan -Build -Install -Launch
```

The LAN helper ignores Radmin/VPN adapters and reports the URL it selected.
Keep the Windows network profile Private and restrict the `Darmalton Django
8000` inbound rule to that profile.

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

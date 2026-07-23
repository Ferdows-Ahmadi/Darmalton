# Online Pharmacy Milestone 1

A Django + PostgreSQL API, responsive Next.js website, and Flutter Android/iOS
client implementing the first complete cash-on-delivery pharmacy order flow.

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

Run the Flutter app separately after installing Flutter stable:

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

For a physical phone, replace `10.0.2.2` with the Windows machine's LAN address
and allow only the necessary private-network firewall access.

## Verification

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-all.ps1
.\.venv\Scripts\python.exe .\scripts\smoke_flow.py
docker compose config
```

The test script uses `website/.next-build` for the production build so it can run
without corrupting an active `next dev` cache. Flutter checks and an Android debug
APK are included automatically when `flutter` is available. See
`docs/KNOWN_ISSUES.md` for the current workstation-specific mobile and container
limitations.

More detail: `docs/ENVIRONMENT.md`, `docs/API_CONTRACT.md`,
`docs/MILESTONE_1_PLAN.md`, `docs/BUILD_LOG.md`, `SECURITY.md`, and
`docs/KNOWN_ISSUES.md`.

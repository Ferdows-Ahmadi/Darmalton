# Online Pharmacy Milestone 1

A Django + PostgreSQL API, responsive Next.js website, and Flutter Android/iOS
client implementing the first complete cash-on-delivery pharmacy order flow.

## Quick start with Docker (primary)

1. Copy `.env.example` to `.env` and replace all placeholder secrets/passwords.
2. Run `docker compose up --build`.
3. In another terminal run:

```powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
```

Open:

- Website: http://localhost:3000
- API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

## Windows fallback without Docker

```powershell
./scripts/setup-local.ps1
./scripts/dev-local.ps1
```

The setup script creates a local ignored `.env`, installs dependencies into
`.venv`, migrates, and seeds an SQLite development database. Use the demo
credentials printed by the seed command; do not reuse them outside development.

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
./scripts/test-all.ps1
docker compose config
```

More detail: `docs/ENVIRONMENT.md`, `docs/API_CONTRACT.md`,
`docs/MILESTONE_1_PLAN.md`, `SECURITY.md`, and `docs/KNOWN_ISSUES.md`.


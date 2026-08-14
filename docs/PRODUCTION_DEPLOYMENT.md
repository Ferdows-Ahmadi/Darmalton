# Production Deployment

## Topology

The existing Hostinger Traefik owns public ports 80/443 and TLS. It routes the
selected website host to Next.js port 3000 and the API host to Django/Gunicorn
port 8000. Those ports and PostgreSQL 5432 are exposed only inside Docker; the
production Compose file has no host `ports` mappings.

Next.js serves both the public website and `/staff`. Django Admin remains the
separate technical fallback at `https://<api-host>/admin/`.

## First manual deployment

1. Choose the final web/API domains and create their DNS records only after the
   VPS target is confirmed.
2. Clone the private repository to a directory owned by the non-root deploy
   user. Checkout the reviewed release tag/commit.
3. Copy `.env.production.example` to the ignored `.env.production`, replace all
   placeholders, then set mode `600`. Never paste it into tickets or logs.
4. Confirm the existing Traefik resolver and Docker-provider routing names. The
   Compose profile assumes the resolver in `TRAEFIK_CERT_RESOLVER` and the
   bridge network `darmalton_edge`; validate this on the VPS before starting.
5. Validate and build:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
   docker compose --env-file .env.production -f docker-compose.production.yml build --pull backend website
   ```

6. Start PostgreSQL only, apply reviewed migrations, then start the application:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d db
   docker compose --env-file .env.production -f docker-compose.production.yml run --rm backend python manage.py migrate --plan
   docker compose --env-file .env.production -f docker-compose.production.yml run --rm backend python manage.py migrate --noinput
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --wait --wait-timeout 180
   ```

7. Create the first administrator deliberately. Do not run `seed_demo` in
   production. Verify HTTPS health, public routes, staff login, Django Admin,
   private prescription access and unauthorized rejection.
8. Run `scripts/production/backup-postgres.sh`, copy its dump and checksum to an
   encrypted off-server destination, and perform the restore drill.

## Updates and rollback

After the first deployment succeeds, `scripts/production/deploy-update.sh`
performs config validation, verified backup, image build, Django deployment
check, migration-plan pause, migrations and health-gated startup. It requires
both `CONFIRM_DEPLOY=DEPLOY_DARMALTON` and `APPLY_MIGRATIONS=yes`.

For application rollback, set `DARMALTON_BACKEND_IMAGE` and
`DARMALTON_WEBSITE_IMAGE` to the previously retained immutable image tags and
run Compose `up -d --wait`. Never run `down -v`. Database rollback is separate:
review migration reversibility and restore the pre-deploy dump only during an
approved maintenance window.

Static files are immutable inside the backend image and served by WhiteNoise.
Public catalogue/CMS uploads live in `public_media`; private prescriptions and
non-public CMS media live in `private_media` and are delivered only through
authorization-aware Django actions. Do not expose either volume through a
generic static-file server. A future object-store migration must retain this
public/private separation and signed or authenticated access for private data.

The backend entrypoint initializes only the two writable volume roots as
UID/GID 10001, then clears supplementary groups and permanently drops to that
identity before starting Gunicorn. Do not override this entrypoint or run the
application command as root.

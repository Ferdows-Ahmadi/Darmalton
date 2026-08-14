#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="${COMPOSE_FILE:-$repo_dir/docker-compose.production.yml}"
env_file="${ENV_FILE:-$repo_dir/.env.production}"

if [[ "${CONFIRM_DEPLOY:-}" != "DEPLOY_DARMALTON" ]]; then
  echo "Set CONFIRM_DEPLOY=DEPLOY_DARMALTON after reviewing the release and migration plan." >&2
  exit 1
fi
if [[ ! -f "$env_file" ]]; then
  echo "Missing production environment file: $env_file" >&2
  exit 1
fi

compose=(docker compose --env-file "$env_file" -f "$compose_file")
"${compose[@]}" config --quiet
ENV_FILE="$env_file" COMPOSE_FILE="$compose_file" "$repo_dir/scripts/production/backup-postgres.sh"
"${compose[@]}" build --pull backend website
"${compose[@]}" run --rm backend python manage.py check --deploy
"${compose[@]}" run --rm backend python manage.py migrate --plan

if [[ "${APPLY_MIGRATIONS:-}" != "yes" ]]; then
  echo "Migration plan printed. Re-run with APPLY_MIGRATIONS=yes after review." >&2
  exit 2
fi

"${compose[@]}" run --rm backend python manage.py migrate --noinput
"${compose[@]}" up -d --wait --wait-timeout 180
"${compose[@]}" ps

echo "Deployment update completed. Verify public HTTPS, staff login, and logs before closing the release window."

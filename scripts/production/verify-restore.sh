#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: CONFIRM_RESTORE=RESTORE_<database> $0 <backup.dump> <verification_database>" >&2
  exit 1
fi

backup_file="$(realpath "$1")"
target_database="$2"
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="${COMPOSE_FILE:-$repo_dir/docker-compose.production.yml}"
env_file="${ENV_FILE:-$repo_dir/.env.production}"

if [[ ! -f "$backup_file" || ! -s "$backup_file" ]]; then
  echo "Backup file is missing or empty: $backup_file" >&2
  exit 1
fi
if ! [[ "$target_database" =~ ^[a-zA-Z][a-zA-Z0-9_]{2,62}$ ]]; then
  echo "Verification database name is invalid." >&2
  exit 1
fi
if [[ "${CONFIRM_RESTORE:-}" != "RESTORE_${target_database}" ]]; then
  echo "Set CONFIRM_RESTORE=RESTORE_${target_database} to confirm the isolated restore." >&2
  exit 1
fi
if [[ ! -f "$env_file" ]]; then
  echo "Missing production environment file: $env_file" >&2
  exit 1
fi

compose=(docker compose --env-file "$env_file" -f "$compose_file")
IFS='|' read -r production_user production_database < <(
  "${compose[@]}" exec -T db sh -c 'printf "%s|%s\n" "$POSTGRES_USER" "$POSTGRES_DB"'
)
if [[ "$target_database" == "$production_database" ]]; then
  echo "Refusing to overwrite the production database." >&2
  exit 1
fi

"${compose[@]}" exec -T db pg_restore --list < "$backup_file" > /dev/null
"${compose[@]}" exec -T db dropdb --if-exists --force --username="$production_user" "$target_database"
"${compose[@]}" exec -T db createdb --username="$production_user" --owner="$production_user" "$target_database"
"${compose[@]}" exec -T db pg_restore \
  --exit-on-error --no-owner --no-privileges \
  --username="$production_user" --dbname="$target_database" < "$backup_file"
"${compose[@]}" exec -T db psql \
  --username="$production_user" --dbname="$target_database" \
  --set=ON_ERROR_STOP=1 --command='SELECT COUNT(*) AS applied_migrations FROM django_migrations;'

echo "Restore verification passed in isolated database: $target_database"
echo "Drop it after review: docker compose --env-file '$env_file' -f '$compose_file' exec -T db dropdb --username='$production_user' '$target_database'"

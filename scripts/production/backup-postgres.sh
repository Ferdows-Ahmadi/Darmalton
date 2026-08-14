#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="${COMPOSE_FILE:-$repo_dir/docker-compose.production.yml}"
env_file="${ENV_FILE:-$repo_dir/.env.production}"
backup_dir="${BACKUP_DIR:-$repo_dir/backups/postgres}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"

if [[ ! -f "$env_file" ]]; then
  echo "Missing production environment file: $env_file" >&2
  exit 1
fi
if ! [[ "$retention_days" =~ ^[0-9]+$ ]] || (( retention_days < 1 )); then
  echo "BACKUP_RETENTION_DAYS must be a positive integer." >&2
  exit 1
fi

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/darmalton-$timestamp.dump"
temporary="$target.partial"
compose=(docker compose --env-file "$env_file" -f "$compose_file")

cleanup() {
  rm -f -- "$temporary"
}
trap cleanup EXIT

"${compose[@]}" exec -T db sh -c \
  'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --compress=9 --no-owner --no-privileges' \
  > "$temporary"

test -s "$temporary"
"${compose[@]}" exec -T db pg_restore --list < "$temporary" > /dev/null
mv -- "$temporary" "$target"
sha256sum "$target" > "$target.sha256"
chmod 600 "$target" "$target.sha256"
find "$backup_dir" -maxdepth 1 -type f \
  \( -name 'darmalton-*.dump' -o -name 'darmalton-*.dump.sha256' \) \
  -mtime "+$retention_days" -delete
trap - EXIT

echo "Verified PostgreSQL backup: $target"

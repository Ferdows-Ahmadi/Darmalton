# Backup and Restore

Hostinger weekly VM backups are useful disaster-recovery layers but do not
replace database-level backups.

## Daily backup

Schedule `scripts/production/backup-postgres.sh` once daily from the deploy
user's cron. It creates a PostgreSQL custom-format compressed dump, validates
its archive, writes a SHA-256 sidecar and removes local archives older than
`BACKUP_RETENTION_DAYS` (default 14). The directory is mode 700 and files 600.

Example cron (choose a quiet UTC time and absolute repository path):

```cron
17 20 * * * ENV_FILE=/srv/darmalton/.env.production BACKUP_DIR=/srv/backups/darmalton /srv/darmalton/scripts/production/backup-postgres.sh >>/var/log/darmalton-backup.log 2>&1
```

Copy each successful dump and checksum to an encrypted off-server destination
with independent retention. Alert when no fresh dump exists, the script exits
non-zero, free space is low, or the off-server copy fails.

## Restore verification

At least monthly and before high-risk releases:

1. Verify the checksum with `sha256sum --check`.
2. Run `scripts/production/verify-restore.sh` against a new isolated database,
   never the production database:

   ```bash
   CONFIRM_RESTORE=RESTORE_darmalton_restorecheck \
     scripts/production/verify-restore.sh /srv/backups/darmalton/<file>.dump darmalton_restorecheck
   ```

3. Confirm the migration table query succeeds and inspect critical table counts.
4. Point a temporary backend container at the restored database, run
   `manage.py migrate --check` and the health/smoke checks without public routes.
5. Drop the verification database after recording date, dump checksum, operator
   and result.

Production restoration requires an approved outage, a fresh pre-restore dump,
application shutdown, explicit recovery-point selection and post-restore smoke
testing. Never use `docker compose down -v` during backup or deployment work.

Release-candidate evidence: the script created and archive-validated a custom
dump from PostgreSQL 17.6; `verify-restore.sh` restored it to an isolated
database, queried 56 applied migrations and the temporary database was removed.
This proves the tooling locally, not the first production/off-server backup.

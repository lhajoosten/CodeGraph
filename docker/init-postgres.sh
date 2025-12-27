#!/usr/bin/env bash
# make it robust: try to enable pipefail if available, otherwise fall back
set -eu
if (set -o pipefail) 2>/dev/null; then
  set -o pipefail
fi

ALLOWED_NETWORKS="${ALLOWED_NETWORKS:-172.18.0.0/16 127.0.0.1/32 ::1/128}"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"
MARKER="$PGDATA/.pg_hba_modified"

# idempotent guard
[ -f "$MARKER" ] && { echo "pg_hba already modified, skipping"; exit 0; }

# wait for server readiness
for i in $(seq 1 30); do
  if pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}"; then break; fi
  sleep 1
done

if ! pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}"; then
  echo "Postgres did not become ready in time" >&2
  exit 1
fi

# add networks only if missing
for net in $ALLOWED_NETWORKS; do
  if ! grep -Fq "$net" "$PGDATA/pg_hba.conf"; then
    echo "host all all $net md5" >> "$PGDATA/pg_hba.conf"
  fi
done

# reload the config via SQL (more reliable inside container)
if psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pg_reload_conf();" >/dev/null; then
  touch "$MARKER"
  echo "pg_hba updated and reloaded"
else
  echo "pg_reload_conf failed" >&2
  exit 1
fi

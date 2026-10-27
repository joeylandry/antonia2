#!/usr/bin/env bash
# Applies the migrations to a throwaway Postgres cluster and runs the RLS tests.
# Requires PostgreSQL 15+ binaries. Usage: scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(dirname "$(ls /usr/lib/postgresql/*/bin/initdb | sort -V | tail -1)")}"
DIR="$(mktemp -d)"; PORT="${PGPORT:-54329}"
RUN=""; [ "$(id -u)" = 0 ] && { chown "$(id -u postgres)" "$DIR"; RUN="runuser -u postgres --"; }
cleanup() { $RUN "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
$RUN "$PGBIN/initdb" -D "$DIR/data" -A trust -U postgres >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR" -l "$DIR/log" -w start >/dev/null
PSQL=("$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f supabase/tests/stub_auth.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f supabase/tests/rls.test.sql

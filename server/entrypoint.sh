#!/bin/sh
set -eu

# Feature flags (can override per environment)
: "${SKIP_DB_WAIT:=true}"
: "${SKIP_MIGRATIONS:=false}"
: "${SKIP_SEED:=false}"
: "${UVICORN_RELOAD:=false}"
: "${UVICORN_WORKERS:=1}"
: "${PORT:=8000}"

echo "Boot flags: SKIP_DB_WAIT=$SKIP_DB_WAIT SKIP_MIGRATIONS=$SKIP_MIGRATIONS SKIP_SEED=$SKIP_SEED RELOAD=$UVICORN_RELOAD WORKERS=$UVICORN_WORKERS PORT=$PORT"

mask_url() {
  # masks password in DSN for logs
  printf '%s' "$1" | sed -E 's#://([^:]+):[^@]+@#://\1:*****@#'
}

wait_for_db() {
  echo "Checking database readiness..."

  if [ -n "${DATABASE_URL-}" ]; then
    # psql doesn't understand SQLAlchemy driver suffixes; strip them via sed
    URL="$(printf '%s' "$DATABASE_URL" \
      | sed -E 's#^postgresql\+psycopg#postgresql#; s#^postgresql\+asyncpg#postgresql#')"

    # Append sslmode=require if missing
    case "$URL" in
      *"sslmode="*|*"ssl="* ) : ;;                    # already has SSL param
      *\?* ) URL="${URL}&sslmode=require" ;;          # has query already
      * )     URL="${URL}?sslmode=require" ;;
    esac

    echo "Waiting for Postgres via DATABASE_URL: $(mask_url "$URL")"
    i=0
    while [ $i -lt 30 ]; do
      if PGPASSWORD="" psql "$URL" -c 'select 1' >/dev/null 2>&1; then
        echo "Database is ready."
        return 0
      fi
      echo "Postgres is unavailable - sleeping"
      i=$((i+1))
      sleep 2
    done
    echo "ERROR: Timed out waiting for database"
    return 1
  fi

  # Fallback to POSTGRES_* envs (for docker-compose local)
  HOST="${POSTGRES_HOST:-db}"
  PORT_PG="${POSTGRES_PORT:-5432}"
  DB="${POSTGRES_DB:-postgres}"
  USER="${POSTGRES_USER:-postgres}"
  PASS="${POSTGRES_PASSWORD:-}"

  echo "Waiting for Postgres at $HOST/$DB..."
  i=0
  while [ $i -lt 30 ]; do
    if PGPASSWORD="$PASS" psql \
      "host=$HOST port=$PORT_PG user=$USER dbname=$DB sslmode=require" \
      -c 'select 1' >/dev/null 2>&1; then
      echo "Database is ready."
      return 0
    fi
    echo "Postgres is unavailable - sleeping"
    i=$((i+1))
    sleep 2
  done
  echo "ERROR: Timed out waiting for database"
  return 1
}

if [ "$SKIP_DB_WAIT" != "true" ]; then
  wait_for_db
else
  echo "Skipping DB wait (SKIP_DB_WAIT=true)"
fi

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "Running migrations..."
  alembic upgrade head
else
  echo "Skipping migrations (SKIP_MIGRATIONS=true)"
fi

if [ "$SKIP_SEED" != "true" ]; then
  echo "Seeding admin..."
  # Don't fail the whole boot if seeding is idempotent
  python -m app.seed || echo "Seed step failed or not needed; continuing."
else
  echo "Skipping seed (SKIP_SEED=true)"
fi

echo "Starting app..."
if [ "$UVICORN_RELOAD" = "true" ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
else
  exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers "$UVICORN_WORKERS"
fi


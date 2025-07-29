#!/bin/sh
set -e

HOST=${POSTGRES_HOST:-db}

echo "Waiting for Postgres at $HOST/$POSTGRES_DB..."

until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Running migrations..."
alembic upgrade head

echo "Seeding admin..."
python -m app.seed

echo "Starting app..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000


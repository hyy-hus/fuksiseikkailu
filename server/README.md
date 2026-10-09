# Fuksiseikkailu server

Rust backend (Axum + SQLx + PostgreSQL) for the Fuksiseikkailu app. See
[../arkkitehtuuri.md](../arkkitehtuuri.md) for the overview.

## Running locally

Start PostgreSQL from the repository root (`docker compose up -d`), create
`server/.env` (see below) and run:

```sh
cargo run
```

Migrations run on startup and an admin user is seeded if none exists. The
server listens on `127.0.0.1:3000` by default. Swagger UI is at `/swagger-ui`,
the OpenAPI document at `/api-docs/openapi.json` and a health check at `/health`.

## Configuration

Read from environment variables (a `.env` file is loaded via dotenvy) or CLI flags.

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | – (required) | `postgres://user:pass@host/db` |
| `JWT_SECRET` | – (required) | Use a long random value |
| `RESEND_API_KEY` | – (required) | Sends login codes via [Resend](https://resend.com) |
| `FROM_EMAIL` | `Fuksiseikkailu <noreply@fuksiseikkailu.fi>` | |
| `BIND_ADDR` | `127.0.0.1:3000` | |
| `MAX_DB_CONNECTIONS` | `5` | |
| `JWT_EXPIRATION_SECONDS` | `900` | |
| `SEED_ADMIN_EMAIL` | `admin@localhost` | Admin created when none exists. Login is by emailed code. |
| `SEED_ADMIN_PASSWORD` | `Admin` | Declared in config; the seed step does not currently use it. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | empty | S3 credentials for photos |
| `S3_BUCKET_NAME` | `fuksi-photos` | |
| `S3_REGION` | `fr-par` | |
| `S3_ENDPOINT` | `https://s3.fr-par.scw.cloud` | Defaults point to Scaleway |
| `S3_PUBLIC_BASE_URL` | `https://fuksi-photos.s3.fr-par.scw.cloud` | |

## Layout

```
src/
  main.rs, lib.rs    startup, router assembly
  config.rs          configuration
  openapi.rs         OpenAPI document
  seed.rs            initial admin user
  domains/<name>/    routes.rs, db.rs, models.rs, mod.rs
migrations/          SQL migrations (run automatically)
.sqlx/               offline query cache (commit it)
tests/               integration tests
```

## Database and SQLx

Queries use compile-time checked `sqlx::query!` macros. After changing a query
or migration, with `DATABASE_URL` pointing at a migrated database:

```sh
cargo install sqlx-cli --no-default-features --features postgres,rustls
cargo sqlx migrate run
cargo sqlx prepare
```

Commit the changed files in `.sqlx/`. The Docker build uses `SQLX_OFFLINE=true`.

## Tests

Integration tests in `tests/` use the database
`postgres://postgres:postgres@localhost/fuksiseikkailu_test` (see
`tests/common/mod.rs`):

```sh
cargo test
```

## Docker

```sh
docker build -t fuksiseikkailu-server .
```

The image runs `/app/server` and applies migrations on startup. Note that the
Dockerfile sets `PORT=8080`, but the server uses `BIND_ADDR`; set
`BIND_ADDR=0.0.0.0:8080` when running in a container.

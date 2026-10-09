# Fuksiseikkailu client

React 19 + TypeScript + Vite single-page app (PWA) for participants, checkpoint
staff and admins. See [../arkkitehtuuri.md](../arkkitehtuuri.md) for the overview.

## Running locally

```sh
npm install
npm run dev
```

The app talks to the API at `VITE_API_BASE_URL` (default `http://127.0.0.1:3000`),
so start the [server](../server/README.md) first. Set the variable in `client/.env`
for any other environment.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |
| `npm run generate:api` | Regenerate the API client from the running server |
| `npm run i18n:extract` | Extract translation keys (i18next-cli) |

## API client

`src/api/generated/` is generated from the server's OpenAPI document
(`http://127.0.0.1:3000/api-docs/openapi.json`). Do not edit it by hand. After
changing the server API, start the server and run `npm run generate:api`.

## Layout

```
src/
  routes/       TanStack Router file-based routes (routeTree.gen.ts is generated)
  components/   UI components (map, forms, lists, admin panels)
  hooks/        TanStack Query hooks wrapping the generated client
  auth/         Auth and news contexts
  api/          client setup and generated SDK
  i18n/         i18next config and locales (fi, sv, en)
  lib/          helpers, S3 uploader
public/         static assets and service worker
```

## Notes

- Routes: `/` home, `/checkpoints`, `/scores/$checkpointId`, `/leaderboard`,
  `/photos`, `/news`, `/stats`, `/teams` and `/admin`.
- The map loads vector tiles from a PMTiles file (default in
  `src/components/Map.tsx`). The MapLibre worker files are copied to
  `dist/assets` by a plugin in `vite.config.ts`.
- Translations live in `src/i18n/locales/{fi,sv,en}.json`.

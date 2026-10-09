# Arkkitehtuuri

Sovellus koostuu kolmesta osasta: selaimessa toimivasta PWA-käyttöliittymästä,
REST-rajapinnan tarjoavasta Rust-palvelimesta ja PostgreSQL-tietokannasta.
Valokuvat tallennetaan S3-yhteensopivaan objektivarastoon ja karttapalat
PMTiles-tiedostona objektivarastoon.

```
 Selain (React PWA) ──HTTP/JSON──▶ Axum-palvelin ──SQLx──▶ PostgreSQL
        │                               │
        │                               ├─▶ Resend (kirjautumiskoodit)
        └──presigned PUT──▶ S3 ◀────────┘ (allekirjoitetut URL:t)
        └──PMTiles (range requests)──▶ S3 (karttapalat)
```

## Server (`server/`)

- **Axum 0.8** + **Tokio**, **SQLx** (käännösaikaiset kyselyt, välimuisti
  `server/.sqlx/`), PostgreSQL.
- Koodi on jaettu *domaineihin* (`src/domains/<nimi>/`), joissa kussakin on
  `routes.rs` (HTTP), `db.rs` (kyselyt), `models.rs` ja `mod.rs` (reititin).
  Domainit: `areas`, `auth`, `checkpoints`, `news`, `photos`, `ratings`,
  `reports`, `scores`, `settings`, `teams`, `users`.
- **Autentikointi**: sähköpostiin lähetetty kertakäyttökoodi (OTP, voimassa 10
  min) vaihdetaan JWT-tokeniksi (oletus 15 min), joka uusitaan
  `/auth/refresh`-reitillä. Roolit: `admin`, `checkpoint`, `team`.
- **OpenAPI**: utoipa generoi spesifikaation (`/api-docs/openapi.json`) ja
  Swagger UI:n (`/swagger-ui`). Se on rajapinnan ja clientin välinen sopimus.
- **Migraatiot** (`server/migrations/`) ajetaan automaattisesti palvelimen
  käynnistyessä. Ensimmäinen admin luodaan `SEED_ADMIN_EMAIL`-osoitteella.
- **Tapahtuma-asetukset** (`event_settings`): ylläpito voi sulkea pisteytyksen ja
  tulostaulun sekä nollata pisteet.

## Client (`client/`)

- **React 19**, **TypeScript**, **Vite**, **Tailwind CSS 4**.
- **TanStack Router** (tiedostopohjainen reititys `src/routes/`),
  **TanStack Query** (datan haku) ja **TanStack Form**.
- **API-client generoidaan** palvelimen OpenAPI-spesifikaatiosta
  (`@hey-api/openapi-ts` → `src/api/generated/`). Generoituja tiedostoja ei
  muokata käsin. Datahaut on kääritty hookeiksi (`src/hooks/`).
- **Kartta**: MapLibre GL, PMTiles (`pmtiles://`-protokolla) ja supercluster
  rastien ryhmittelyyn. Teema luodaan `@protomaps/basemaps`-kirjastolla.
- **i18n**: i18next, kielet `fi`, `sv`, `en` (`src/i18n/locales/`). Rastien ja
  uutisten sisältö on tallennettu kielikohtaisina JSON-objekteina.
- **Rikasteksti**: Tiptap (uutiset, rastikuvaukset).
- **PWA**: `public/sw.js` on tällä hetkellä minimaalinen service worker, joka
  tyhjentää vanhat välimuistit.

## Valokuvat

1. Client pyytää palvelimelta allekirjoitetun URL:n (`POST /photos/presigned-url`).
2. Client lataa kuvan suoraan S3:een (`client/src/lib/s3Uploader.ts`).
3. Client rekisteröi kuvan palvelimelle (`POST /photos`).

## Julkaisu

Palvelimelle on Dockerfile (`server/Dockerfile`, monivaiheinen build,
`SQLX_OFFLINE=true`). Client rakennetaan staattisiksi tiedostoiksi
(`npm run build` → `client/dist/`). Automaattista julkaisuputkea ei ole
repositoriossa. Tuotannon ympäristömuuttujat ovat mallina tiedostossa
`.env.hosted`.

## Periaatteet

- OpenAPI-spesifikaatio on totuus: muuta rajapintaa palvelimella ja generoi
  client uudelleen.
- Pidä kyselyt SQLx-makroilla ja päivitä `.sqlx`-välimuisti
  (`cargo sqlx prepare`) kyselyjä muuttaessasi.

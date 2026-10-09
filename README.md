# Fuksiseikkailu

Fuksiseikkailu on [Helsingin yliopiston ylioppilaskunnan (HYY)](https://www.hyy.fi/)
järjestämä tapahtuma Helsingin yliopiston uusille opiskelijoille. Fuksit
kiertävät joukkueina Helsingin keskustassa opiskelijajärjestöjen rasteilla ja
keräävät pisteitä suorituksistaan. Illan kruunaavat jatkot, joilla palkitaan
parhaiten pukeutunut ja eniten pisteitä ansainnut joukkue.

Tämä repositorio sisältää tapahtuman web-sovelluksen (PWA).

## Mitä sovellus tekee

- **Kartta ja rastit**: rastit kartalla ja listana (suomi, ruotsi, englanti),
  mukaan lukien esteettömyys- ja rastikategoriatiedot.
- **Pisteytys**: rastien vastuuhenkilöt kirjaavat joukkueiden pisteet.
  Ylläpito voi sulkea pisteytyksen ja tulostaulun tapahtuman ajaksi.
- **Tulostaulu** ja **tilastot** (alueet, kategoriat, pisteiden kehitys).
- **Valokuvat ja pukukilpailu**: kuvien lataus suoraan S3:een, äänestys ja
  joukkueiden ehdottaminen kuviin.
- **Uutiset**: monikieliset, ajastettavat uutiset rikastekstieditorilla.
- **Arvioinnit ja raportit**: rastien ja joukkueiden arviointi sekä raportointi.
- **Ylläpito**: rastien ja joukkueiden hallinta, CSV-tuonti, rastien
  automaattinen numerointi.
- **Kirjautuminen** sähköpostiin lähetettävällä kertakäyttökoodilla.
  Käyttäjärooleja ovat `admin`, `checkpoint` (rasti) ja `team` (joukkue).

## Rakenne

| Hakemisto | Sisältö |
| --- | --- |
| [`server/`](server/README.md) | Rust-taustajärjestelmä (Axum, PostgreSQL, SQLx) |
| [`client/`](client/README.md) | React/TypeScript-käyttöliittymä (Vite) |
| `compose.yml` | Paikallinen PostgreSQL-kehityskanta |
| `.env.hosted` | Mallipohja tuotantoympäristön ympäristömuuttujille (ei salaisuuksia) |

Tarkempi kuvaus: [arkkitehtuuri.md](arkkitehtuuri.md).

## Kehitysympäristön käynnistys

Tarvitset [Rustin](https://rustup.rs/), [Node.js](https://nodejs.org/):n ja
Dockerin.

```sh
# 1. Tietokanta (portti 5432). compose.yml lukee DB_USER, DB_PASSWORD ja DB_NAME
#    ympäristöstä tai .env-tiedostosta.
docker compose up -d

# 2. Taustajärjestelmä (portti 3000), ks. server/README.md ympäristömuuttujista
cd server
# luo server/.env (DATABASE_URL, JWT_SECRET, RESEND_API_KEY ...)
cargo run

# 3. Käyttöliittymä (portti 5173)
cd client
npm install
npm run dev
```

Ensimmäisellä käynnistyksellä palvelin ajaa migraatiot ja luo ylläpitäjän
osoitteella `SEED_ADMIN_EMAIL`. Kirjaudu sillä sähköpostikoodilla.

API-dokumentaatio (Swagger UI): <http://127.0.0.1:3000/swagger-ui>.

## Julkaisut

Vuoden 2025 versio on tagissa
[`2025-release`](../../tree/2025-release) (Python/FastAPI-taustajärjestelmä).
`main` sisältää vuoden 2026 uudelleenkirjoituksen.

## Kielet ja lisenssi

Päätason asiakirjat on kirjoitettu suomeksi, tekniset README-tiedostot, commit-
viestit, koodi ja kommentit englanniksi. Koodi on julkaistu
[MIT-lisenssillä](LICENSE).

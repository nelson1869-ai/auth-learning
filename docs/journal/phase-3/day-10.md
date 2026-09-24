# Day 10 — 2026-09-24 · Phase 3

## Ano ang ginawa ko
- `npm install drizzle-orm pg` at `npm install -D drizzle-kit`
- `backend/.env` (DATABASE_URL, secret — ginawa ng AI mula sa `devops/.env` nang hindi ipinapakita ang password) at `backend/.env.example`
- `npm run dev` / `npm start` → `node --env-file=.env ...` (wala nang `dotenv`)
- `src/db/schema.js` (hugis ng `users`), `src/db/index.js` (koneksyon), `src/routes/users.js` → `GET /api/users/count`
- Code review ng AI: kinumpleto ang schema (`name`, `createdAt`), ang imports at pagkabit ng router, at nagdagdag ng `pool.on('error')`

## Ano ang natutunan ko (sa sarili kong salita)
- **Environment variable** = setting sa labas ng code (hal. password). Nasa `.env`, hindi sa Git.
- **`DATABASE_URL`** = `postgres://USER:PASSWORD@HOST:PORT/DATABASE`
- **ORM (Drizzle)** = JavaScript → SQL. `db.$count(users)` = `SELECT count(*) FROM users`. Si `pg` ang aktwal na kumokonekta.
- **`async` / `await`** = hintayin ang sagot ng database bago tumuloy.
- **Express 5 sinasalo ang error ng `async` route** → 500, hindi nakabitin.
- Live ang tanong: nag-INSERT sa psql → naging 3 ang count nang walang restart.

## Mga problema at paano ko nalutas
- **500 "Failed query"** — tumatakbo pa ang lumang `npm run dev` (walang `--env-file`), kaya walang `DATABASE_URL`. Aral: **i-restart ang server kapag binago ang `package.json` scripts o `.env`** — hindi iyon binabantayan ng `--watch`.
- **Nag-crash ang BUONG server nang huminto ang database** (`Unhandled 'error' event` … `terminating connection due to administrator command`). Kapag naputol ang idle na koneksyon at walang `pool.on('error')`, pinapatay ng Node ang proseso. Inayos: gumawa ng `Pool` nang tahasan at nilagyan ng `pool.on('error')`. Ngayon: 500 habang patay ang DB, buhay ang server, kusang gumagaling. (Parehong bug ang nakita sa reference project.)
- Nailagay ko ang `DATABASE_URL` sa `devops/.env.example` — sa `backend/` pala iyon (ang backend ang gumagamit). Ibinalik.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 11: Migrations — `drizzle-kit generate` at `migrate`; ang table ay gagawin ng migration, hindi ng kamay

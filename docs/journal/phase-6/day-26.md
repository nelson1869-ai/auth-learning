# Day 26 — 2026-09-26 · Phase 6

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko):
  - Test database `auth_learning_test` + `backend/.env.test` + `npm run db:migrate:test` (2 migration)
  - Hinati ang `index.js` → **`app.js`** (binubuo ang app, `export default app`) + **`index.js`** (`app.listen` lang)
  - Supertest, `vitest.config.js`, `src/test/setup.js` (`process.loadEnvFile('.env.test')` + pananggalang na `*_test` lang)
  - `src/routes/auth.test.js` — 7 API test: register (201, 409 kahit ibang titik, 400), login (200 + httpOnly cookie, parehong 401), me (200 / 401), logout → 401
- **10 passed** (3 unit + 7 API). Hindi nagalaw ang dev database; tumatakbo pa rin ang `npm run dev` habang nagte-test.

## Sinadyang sirain (patunay na totoo ang tests)
| Sinira | Pumula |
|---|---|
| `httpOnly: false` | "sets an httpOnly token cookie" |
| inalis ang `requireAuth` sa `/me` | "…and 401 without it" |
| ibang mensahe para sa walang account | "gives the same 401…" |
| `.env.test` → dev database | tumanggi ang lahat: "Tests must use a *_test database" |

## Ano ang natutunan ko (sa sarili kong salita)
- **Integration test** = maraming piraso nang magkakasama (route → Zod → argon2 → DB).
- **Supertest** = HTTP request sa app nang walang port. `request.agent(app)` = tinatandaan ang cookie, parang browser.
- **`app.js` vs `index.js`** — ini-import ng tests ang app nang hindi binubuksan ang port 3000 (gaya ng reference: `split app.ts from index.ts`).
- **Hiwalay na test database** + `db.delete(users)` sa `beforeEach` — malinis at pareho ang simula ng bawat test.
- **`process.loadEnvFile`** — built-in na paraan ng Node para mag-load ng `.env` sa loob ng code.
- **Sagot sa checkpoint (draft):** ang test ay kusa, inuulit sa bawat pagbabago, at *sumusuri* ng resulta (hal. "pareho ang 401") — ang `.http` ay kailangang ako mismo ang pumindot at tumingin.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 27: GitHub Actions — kusang `npm test` sa bawat PR (kasama ang Postgres sa CI) + linter

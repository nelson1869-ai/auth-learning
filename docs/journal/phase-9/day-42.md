# Day 42 — 2026-09-26 · Phase 9 · Structured logging (Pino + request ID)

> Bakit Day 42 bago ang 41? Kailangan ng error handler (41) ng lugar kung saan isusulat ang
> detalye ng error. Iyon ang logging. Tapos na ang Day 40 noong Phase 7. Tingnan ang D-021.

## Ano ang ginawa
- **`lib/logger.ts` (Pino):** JSON sa production, may kulay sa dev (pino-pretty), tahimik sa tests.
  - **Redact:** `cookie`, `authorization`, `set-cookie`, at anumang `password` → `[REDACTED]`.
- **`middleware/requestLogger.ts` (pino-http)**, **pinakauna** sa `app.ts`:
  - bagong **UUID bawat request** → `X-Request-Id` header + `requestId` sa log;
  - **`clientIp`** = totoong IP sa likod ng tunnel (`lib/clientIp.ts`, kapareho ng rate limiter);
  - method, url, user-agent, status, oras lang — hindi ang lahat ng headers;
  - 4xx = WARN, 5xx = ERROR; hindi itinatala ang `/api/health`.
- Pinalitan ang `console.*` sa `index.ts`, `db/index.ts`, at rate limiter (may `requestId` na ang
  "Rate limit hit"). Ang `db/migrate.ts` ay `console.log` pa rin: hiwalay na script ito, `DATABASE_URL`
  lang ang kailangan.
- **Tests: 24** (8 bago). Sinadyang sinira ang bawat feature → bumagsak ang test → ibinalik.

## Bug na nahuli ng pagpapatakbo (hindi ng unang tests)
- Unang takbo sa dev: may `X-Request-Id` sa header pero **wala sa log**. Hindi mahahanap ang request.
- Dahilan: pinalitan ko ang `req` serializer para kaunti lang ang isulat, at doon pala nakalagay ang ID.
- Ayos: `quietReqLogger: true` — ang `requestId` ay nakadikit na sa **bawat** log ng request.
- Idinagdag ang test na nagkukumpara ng header sa log line. Bumagsak ito nang alisin ang ayos.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Dev | register, login, `/me`, maling login, 404 | ✅ tamang level · **0** password · **0** token sa log |
| Dev | pekeng `X-Request-Id: fake-id` | ✅ bagong UUID ang ibinalik |
| Dev | 11 maling login | ✅ `Rate limit hit` + ang 429: **parehong requestId** |
| Dev | `10-logging.http` (5 requests) | ✅ tugma sa nakasulat |
| Production | `/me` mula sa internet → hanapin ang ID sa `docker compose logs` | ✅ nahanap · `clientIp` = totoong IP ko (hindi `172.x`) · walang cookie |

## Kumpara sa reference
- Pareho: Pino + pino-http, redact, request ID, level ayon sa status, walang log sa `/api/health`.
- **Iba — tinatanggap ng reference ang `X-Request-Id` ng client** nang walang tsek. Kami, hindi:
  kayang pekein, pareho ng aral ng `CF-Connecting-IP`.
- **Iba — default serializers ang reference** (lahat ng headers sa bawat log). Kami: kaunting field lang.
- Mas malayo ang reference: may audit logs sa database, OpenTelemetry at Prometheus. Iyon ay sa mga susunod na phase.

## Ang pinakanatutunan
- **Ang log ay para sa taong naghahanap ng problema.** Ang tanong: "kapag nag-report ang user, mahahanap ko ba?"
  Kaya ang request ID, at ang pagsubok na **hanapin** ito, hindi lang tingnan kung may header.
- **Ang logs ay puwedeng mag-leak.** Kaya redact + kaunting field. Sinuri gamit ang `grep`, hindi hula.
- **Patakbuhin, huwag lang i-test:** ang bug ay lumabas sa totoong output, hindi sa unang tests.

## Paano tingnan (production)
```bash
cd devops && export IMAGE_TAG=$(cat .deployed-sha)
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs --no-log-prefix backend | ../backend/node_modules/.bin/pino-pretty
```

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 41 — Sentral na error handling: generic na mensahe sa 5xx, buong detalye sa log (may `requestId` na).

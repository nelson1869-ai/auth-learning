# Backend

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng backend developer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 4 — tingnan kung nagbago ang pagkakaintindi mo.

Ito ang "utak" ng app. Tumatanggap ito ng request (hal. login), sinusuri kung tama ang password sa database, at sumasagot kung pasok ka o hindi.

**Pagkatapos ng Phase 4** *(draft ng AI — palitan ng sarili mong salita kung iba ang pagkakaintindi mo)*:
Hindi lang "sinusuri ang password" — ang backend ang huling bantay. Hindi ito nagtitiwala
sa input (Zod), hindi nagtatago ng password (hash lang), hindi nagbubunyag kung sino ang
may account, at pagkatapos ng login, isang pirmadong token sa cookie ang nagpapakilala
sa user sa bawat request.

---

## Ang role

Ang **backend** ang "utak" sa likod ng app. Tumatanggap ito ng **request** mula sa
frontend (hal. "i-login mo ako"), nagpapasya (tama ba ang password?), kumakausap
sa database, at nagbabalik ng **response** (hal. "ok, naka-login ka na").

Hindi ito nakikita ng user — pero dito nangyayari ang karamihan ng security.

## Mga responsibilidad
- API endpoints (routes) — hal. `POST /api/auth/login`
- Business rules — hal. "dapat may `@` ang email", "hindi puwedeng doble ang email"
- Security — password hashing, sino ang puwedeng gumawa ng ano
- Tests — patunay na gumagana ang lahat

## Tools
Node.js · Express · JavaScript (→ TypeScript sa Phase 7) · Zod · argon2 · jsonwebtoken · Vitest
— tingnan ang [tech stack](../docs/02-tech-stack.md).

## Ano ang laman ng folder na ito (Phase 4 — totoo na, hindi na plano)
```
backend/
├── src/
│   ├── app.ts            ← recordMetrics (Day 81) → requestLogger → helmet → cors → csrf → json → cookies → routers → notFound → errorHandler
│   ├── index.ts          ← app.listen(3000) · metrics server · graceful shutdown sa SIGTERM/SIGINT (Day 85)
│   ├── test/setup.ts     ← naglo-load ng .env.test; tumatanggi kung hindi *_test ang database
│   ├── config/env.ts     ← sinusuri ang lahat ng env variable pagka-start (Zod, fail-fast)
│   ├── types/            ← dagdag na types (hal. req.userId sa Express)
│   ├── routes/           ← ROUTING LANG (Day 76) · auth.ts (lahat ng /api/auth/*: register, login, me, refresh, logout, sessions, change-password, forgot/reset,
│   │                        verify-email, resend-verification), admin.ts (Day 46), users.ts, health.ts, echo.ts
│   ├── controllers/      ← Day 74–76: HTTP lang — http.ts (cookies, parseOr400) · auth · admin · users controllers
│   ├── services/         ← Day 74–76: logic na walang Express — admin · users · auth/ (registration · login · session · password · verification)
│   ├── middleware/       ← requireAuth.ts — "naka-login ka ba?" (401) · requireRole.ts — "admin ka ba?" (403, Day 46) · rateLimiter.ts — "sobra na ang subok?" (Day 43)
│   │                        · requestLogger.ts — log + X-Request-Id bawat request (Day 42)
│   │                        · errorHandler.ts — notFound (404 JSON) + errorHandler (5xx: generic, detalye sa log) (Day 41)
│   │                        · csrf.ts — Origin check: POST/PUT/DELETE mula sa frontend lang (Day 44)
│   ├── lib/              ← logger.ts (Pino, redact) · clientIp.ts (totoong IP sa likod ng Cloudflare) · audit.ts (audit_logs, Day 48) · session.ts (access + refresh token, Day 51) · jwt.ts (RS256, Day 56) · email.ts (Resend, Day 58) · verificationTokens.ts · background.ts (Day 59) · trustedDevices.ts (device cookies, Day 64) · loginLockout.ts (atomic na bilang, Day 67) · metrics.ts (OpenTelemetry → /metrics sa METRICS_PORT, Day 81) · shutdown.ts (graceful shutdown, Day 85)
│   ├── scripts/          ← send-test-email.ts (`npm run email:test -- <email>`, Day 58) · login-timing.ts (`npm run timing:login`, Day 72, dev lang)
│   ├── validations/      ← Zod schemas — "tama ba ang input?" (+ responses.ts: ang hugis ng mga sagot, Day 78)
│   ├── openapi/          ← Day 78: OpenAPI spec mula sa Zod · generator ng frontend types · /api/docs (Swagger UI)
│   └── db/               ← koneksyon + schema ng tables
├── drizzle/              ← migrations (ginagawa ng `npm run db:generate`)
├── http/                 ← 01–30 .http files para subukan ang API (+ prod/ — read-only na pagsuri sa production)
├── playground/           ← mga practice script
├── .env                  ← DATABASE_URL, JWT_PRIVATE_KEY (RS256, Day 56), CLIENT_URL (SECRET — hindi sa Git)
├── .env.test             ← pareho, pero DATABASE_URL → auth_learning_test (hindi sa Git)
├── .env.example          ← kopya na walang totoong secret
└── package.json          ← dependencies + scripts (dev, start, db:*)
```

**Mga command:** `npm run typecheck` (TypeScript) · `npm run lint` (Oxlint + knip, Day 79 — mga pagbubukod sa `knip.jsonc`, bawat isa may dahilan) · `npm run dev` (server, kusang nagre-restart — nodemon) · `npm test` (Vitest + Supertest) ·
`npm run db:migrate:test` · `npm run db:generate` ·
`npm run db:migrate` · `npm run db:studio` · `npm run openapi` (Day 78: ang spec + frontend types — patakbuhin kapag binago ang schema o endpoint) · `npm run timing:login` (sukatin ang oras ng login: may account vs wala — tingnan ang script)

Tingnan ang [architecture](../docs/06-architecture.md) at ang [API contract](../docs/07-api-contract.md).

## Tests: unang setup (isang beses lang)
```bash
# 1. test database (sa psql, o:)
cd devops && docker compose exec postgres psql -U auth -d auth_learning -c "CREATE DATABASE auth_learning_test;"
# 2. backend/.env.test = kopya ng .env, pero /auth_learning_test sa dulo ng DATABASE_URL
# 3. tables sa test database
cd backend && npm run db:migrate:test
# 4.
npm test
```
⚠️ **Binubura ng tests ang `users`** bago ang bawat test — kaya hiwalay na database,
at tumatanggi ang `src/test/setup.ts` kapag hindi `*_test` ang `DATABASE_URL`.

## Docker (Day 34)
```bash
cd backend
docker build -t auth-learning-backend:dev .
# pansubok laban sa test DB — sa loob ng container, ang PC mo ay `host.docker.internal`
sed 's#@localhost:5435/#@host.docker.internal:5435/#' .env.test > /tmp/container.env
docker run --rm --env-file /tmp/container.env --add-host=host.docker.internal:host-gateway \
  -p 127.0.0.1:3099:3000 auth-learning-backend:dev
curl localhost:3099/api/health
```
- **Isang stage, walang build** — `node src/index.ts` (D-018); `node` user, hindi root; walang `npm` sa image
- **Ang `node` ay PID 1** (Day 85) — kapag walang SIGTERM handler, hindi pinapansin ang `docker stop` (14.6s → SIGKILL, exit 137).
  May handler na (`lib/shutdown.ts`): `docker stop` ≈ 1.3s, exit 0, at tinatapos ang mga request. Subukan: `docker stop` + `docker inspect -f '{{.State.ExitCode}}'`
- **Walang secret sa image** — ibinibigay sa `--env-file` (o compose `env_file`) sa pagpapatakbo
- `.dockerignore`: walang `.env*`, tests, `http/`, `playground/`, migrations sa image
- `NODE_ENV=production` sa image → `Secure` cookie (HTTPS lang) at walang detalye sa 500

## Production database (Day 35 — Neon)
- `backend/.env.production` (gitignored, `600`): `DATABASE_URL` ng Neon (**direct**, walang
  `-pooler`; `sslmode=verify-full`), ibang `JWT_PRIVATE_KEY` kaysa dev (Day 56; nandoon pa ang lumang `JWT_SECRET` para sa rollback sa lumang image), `CLIENT_URL=https://nelson1869.com`,
  `NODE_ENV=production`
- Migrations sa production: `node --env-file=.env.production node_modules/drizzle-kit/bin.cjs migrate`
- **Admin (Day 45):** `npm run db:set-role -- <email> admin` (dev) — para sa production, tingnan ang `devops/README.md`.
  Walang default na admin account o password sa code.
- **Restore:** Neon → Backup & Restore → branch `production` → **ilagay ang oras nang tahasan**
  (ang default ay "ngayon" — walang maibabalik). 6 na oras lang ang history sa Free plan.

## ❌ Hindi dapat nasa loob ng backend
- **Plain text na password** — laging hashed (argon2) bago i-save
- **Secrets sa code** (hal. `const JWT_SECRET = "abc123"`) — sa `.env` lang
- **HTML o disenyo ng page** — trabaho iyan ng frontend
- **Tiwala sa data mula sa user** — laging i-validate (Zod) bago gamitin
- **Mensahe ng error na nagbubunyag ng loob** (hal. "column users.email does not exist") — generic na mensahe lang sa user

## Mga natapos
- **Phase 2** — unang API (health, echo, routes/) ✅
- **Phase 4** — register, login, JWT sa httpOnly cookie, `/me`, logout ✅
- **Susunod para sa backend:** Phase 6 (tests), Phase 7 (TypeScript), Phase 9 (hardening).
  Tingnan ang [roadmap](../docs/03-roadmap.md).

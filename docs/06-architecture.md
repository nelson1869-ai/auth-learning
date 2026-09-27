# 06 — Architecture

> **Architecture** = ang sagot sa tanong na *"saan ilalagay ang code na ito, at
> ano ang HINDI dapat kasama nito?"* Kapag malinaw ito, alam ng buong team kung
> saan hahanapin at saan maglalagay — hindi nagkakalat ang code.
>
> Ang malaking larawan (frontend ↔ backend ↔ database): tingnan ang
> [`diagrams/00-architecture.md`](diagrams/00-architecture.md).

## 1. Ang daan ng isang request sa backend

```
Request mula sa frontend
   ↓
middleware   ← mga "checkpoint" na dinadaanan ng lahat (hal. JSON parser, "naka-login ka ba?")
   ↓
route        ← aling function ang hahawak sa URL na ito (hal. POST /api/auth/login)
   ↓
controller   ← HTTP lang: basahin ang request, sagutin ng tamang status code
   ↓
service      ← ang business logic: "tama ba ang password?", "doble ba ang email?"
   ↓
database     ← itago o kunin ang data
```

**Patakaran ng direksyon:** laging **pababa** ang tawag — hindi kailanman
pataas. Hindi kailangang malaman ng service kung ano ang HTTP; hindi kailangang
malaman ng database kung may login page. Kaya puwedeng baguhin ang isang layer
nang hindi nasisira ang iba.

## 2. Paano LALAKI ang backend, phase by phase

> Hindi natin gagawin ang buong structure sa simula — iyan ay over-engineering.
> **Magdadagdag lang ng folder kapag may problemang nilulutas ito.** Ganito rin
> ang tunay na pinagdaanan ng reference project (tingnan ang `git log` doon).

| Phase | Idadagdag | Anong problema ang nilulutas |
|---|---|---|
| **2** | `src/index.ts`, `src/routes/` | Isang file muna; hinahati sa `routes/` kapag dumami na ang URLs |
| **3** | `src/db/` (koneksyon + schema), `drizzle/` (migrations, labas ng `src/`) | Iisang lugar para sa lahat ng may kinalaman sa database; ang migrations ang gumagawa ng tables, hindi ang kamay |
| **4** | `playground/` (labas ng `src/`) | Mga practice script (hal. `01-hash.js`) — hindi bahagi ng app, hindi ini-import ng `src/` |
| **4** | `src/middleware/`, `src/validations/` | Paulit-ulit na "naka-login ka ba?" at "tama ba ang input?" sa bawat route |
| **6** | Hatiin ang `index.js` → `app.js` + `index.js` | Kailangang i-import ng tests ang app **nang hindi binubuksan ang port** |
| **7** | Lahat → `.ts`; `src/config/env.ts`, `src/types/` | TypeScript: ipinakita na puwedeng `undefined` ang bawat `process.env` → iisang lugar na sumusuri (mas maaga sa plano, dati Phase 9) |
| **9** | `helmet()` sa `app.ts`, `middleware/rateLimiter.ts`, `frontend/public/_headers` (CSP), `lib/` (logger, clientIp) + `middleware/requestLogger.ts`, `middleware/errorHandler.ts`, `middleware/csrf.ts` | Hardening bago buksan sa lahat: security headers (Day 39), sentral na error handling (Day 41), CSRF (Day 44), logs na may request ID (Day 42), limit sa panghuhula ng password (Day 43) |
| **10** | `routes/admin.ts` + `middleware/requireRole.ts` (Day 46), `db/set-role.ts` (Day 45), `lib/audit.ts` + `audit_logs` table (Day 48) | Hiwalay na grupo ng URL na may sariling patakaran (admin lang) |
| **11** | `lib/session.ts` + `lib/jwt.ts`, `refresh_tokens` table (migrations 0004–0006) | Mas ligtas na sessions: refresh tokens na kayang bawiin (Day 51–53), mga device (Day 54), change password (Day 55), RS256 (Day 56) — at walang `req` ang dalawang bagong lib file (tingnan ang review finding) |
| **12** | `lib/email.ts` (Resend) + `lib/verificationTokens.ts` + `lib/background.ts`, `verification_tokens` table (0007), `email_verified_at` (0008) · frontend: 3 page + `hooks/` | Totoong email: password reset (Day 59) at email verification (Day 60), mga page mula sa link (Day 61) |
| **13** | `lib/trustedDevices.ts`, `trusted_devices` table (0010), `users.failed_login_attempts`/`locked_until` (0009) | Per-account lockout (Day 63) at device cookies laban sa lockout DoS (Day 64). Walang `req` ang bagong lib, gaya ng `session.ts` |
| **14** | `lib/loginLockout.ts` (Day 67), partial UNIQUE indexes (0011), `routes/concurrency.test.ts` + `transactions.test.ts` | Tama kahit sabay-sabay: atomic na bilang (reserve-then-verify), transaction bago ang cookies sa login, ang database bilang huling bantay ng "isang aktibo" |
| **15** | `unknown_login_attempts` (0012) + `unknownEmailCounter` sa `lib/loginLockout.ts` · `scripts/login-timing.ts` | Hindi malaman kung sino ang may account: pareho ang sagot (Day 71) at ang oras (Day 72) sa login |
| **16** | `src/controllers/` + `src/services/` (✅ Day 74–76) | Masyadong mahaba na ang routes — hatiin ang HTTP sa business logic |

### Ang backend sa bawat yugto

**Phase 2 — simple:**
```
backend/src/
├── index.js          ← binubuksan ang server at kinakabit ang routes
└── routes/           ← Day 06: hinati dahil dumarami na ang URLs
    ├── health.js     ← GET /api/health
    └── echo.js       ← POST /api/echo (pang-aral ng request body)
```

Sa `index.js`: **middleware muna** (`app.use(express.json())`), **saka ang
routers** (`app.use('/api', healthRouter)`). Walang alam ang bawat router kung
saan ito ikakabit: `/health` lang ang nasa loob, at `index.js` ang
nagdadagdag ng `/api`.

**Phase 4 — may database at auth** (sinuri Day 19; `.ts` na mula Phase 7):
```
backend/
├── src/
│   ├── app.ts            ← (Day 26) cors + express.json + cookieParser, kinakabit ang routers
│   ├── index.ts          ← (Day 26) app.listen lang
│   ├── config/env.ts     ← (Phase 7) sinusuri ang env pagka-start
│   ├── types/            ← (Phase 7) hal. req.userId
│   ├── routes/           ← auth.ts (register/login/me/logout), users.ts (count),
│   │                        health.ts, echo.ts (pang-aral)
│   ├── middleware/       ← requireAuth.ts (cookie → jwt.verify → req.userId)
│   ├── validations/      ← auth.ts (registerSchema, loginSchema — Zod, + z.infer types)
│   └── db/               ← index.ts (pg Pool + Drizzle), schema.ts (users + User type)
├── drizzle/              ← migrations 0000 (users), 0001 (password_hash)
├── http/                 ← 01–07 .http walkthroughs
└── playground/           ← 01-hash.js (practice, hindi bahagi ng app)
```

**Ngayon — Phase 16: ang huling hugis, TAPOS** (Day 76 — lahat ng route ay routing lang; sinuri gamit ang grep, tingnan sa ibaba):
```
backend/
├── src/
│   ├── app.ts            ← recordMetrics (Day 81) → requestLogger → helmet → cors → csrf → json → cookies → routers → notFound → errorHandler
│   ├── index.ts          ← app.listen lang
│   ├── config/env.ts     ← sinusuri ang env pagka-start (Zod, fail-fast)
│   ├── types/            ← express.d.ts (req.userId)
│   ├── routes/           ← ROUTING LANG: auth.ts · admin.ts (+ ang bantay: requireAuth + requireRole) · users.ts · health.ts · echo.ts
│   │                        · docs.ts (/api/openapi.json, /api/docs — Day 78)
│   ├── controllers/      ← HTTP lang (Day 74–76): http.ts (cookies, deviceOf, parseOr400) · auth.controller.ts · admin.controller.ts ·
│   │                        users.controller.ts · health.controller.ts (live/ready, Day 80)
│   ├── services/         ← logic, WALANG Express (Day 74–76): admin.service.ts · users.service.ts · health.service.ts (Day 80)
│   │   └── auth/         ← registration · login · session (me, refresh, logout, sessions) · password (change, forgot, reset) ·
│   │                        verification (verify, resend, mga email)
│   ├── middleware/       ← requireAuth · requireRole · csrf · rateLimiter · requestLogger · errorHandler · metrics (Day 81)
│   ├── validations/      ← auth.ts · pagination.ts (Zod, input) · responses.ts (Zod, mga sagot — Day 78)
│   ├── openapi/          ← Day 78: document.ts (OpenAPI 3.1 mula sa Zod) · typescript.ts (generator ng frontend types) · openapi.test.ts
│   ├── lib/              ← logger.ts · clientIp.ts · audit.ts · session.ts (Day 51–55) · jwt.ts (RS256, Day 56) · email.ts (Day 58)
│   │                        · verificationTokens.ts · background.ts (Day 59) · trustedDevices.ts (Day 64) · loginLockout.ts (Day 67) · metrics.ts (Day 81)
│   ├── scripts/          ← send-test-email.ts (Day 58) · login-timing.ts (Day 72) · openapi.ts (Day 78) — mga script, hindi endpoint
│   ├── db/               ← index.ts (Pool, 5s timeout) · errors.ts (isUniqueViolation, Day 74) · schema.ts (users, audit_logs, refresh_tokens, verification_tokens, trusted_devices, unknown_login_attempts) · migrate.ts · set-role.ts
│   └── test/setup.ts     ← .env.test + pananggalang na *_test
├── drizzle/              ← migrations 0000–0012
├── openapi.json          ← Day 78: ang spec (ginawa ng `npm run openapi`, naka-commit)
├── knip.jsonc            ← Day 79: mga pagbubukod ng knip (unused code), bawat isa may dahilan
└── http/                 ← 01–28 .http walkthroughs
```

**`devops/` (production, Day 36 → Day 82):**
```
devops/
├── docker-compose.prod.yml   ← backend · cloudflared · prometheus (127.0.0.1:9091) · grafana (127.0.0.1:3002)
├── deploy.sh                 ← pull → migrate → backend → healthy → ready → monitoring (step 7, hindi fatal)
├── cloudflared/config.yml    ← tunnel → backend:3000 lang (walang daan sa :9464, :9091, :3002)
└── monitoring/               ← Day 82: prometheus/prometheus.yml · grafana/provisioning/ (datasource + app-overview.json)
```

> 🔍 **Review finding (Day 50) — utang sa arkitektura, sinadyang iwan hanggang Phase 16:**
> - `lib/audit.ts` at `lib/clientIp.ts` ay tumatanggap ng `req`, pero ayon sa table sa ibaba, ang `lib/` ay "walang alam sa HTTP".
>   *(Day 57: gumanda — ang `lib/session.ts` at `lib/jwt.ts` ng Phase 11 ay walang `req`; plain na `Device` ang ipinapasa ng route.)*
> - Ang `listUsers`/`listAuditLogs` (mga query) ay nasa `routes/admin.ts`, at ang login/register logic ay nasa `routes/auth.ts`.
>
> Gumagana at may tests ang lahat, pero habang dumarami ang features, mahirap nang subukan ang logic nang walang Express.
> **Ayos sa Phase 16:** `controllers/` (HTTP) + `services/` (logic, walang `req`). Ang `audit` ay tatanggap na lang ng plain na
> `{ ip, userAgent }` (katulad ng `auditFor(req)` ng reference).
> *(Day 74: ✅ `writeAudit(source, event)` na walang `req` + `auditFor(req)` bilang adapter · ✅ register at login · Day 75: ✅ me, refresh, logout, sessions, change-password · Day 76: ✅ forgot/reset/verify/resend, admin, users count · ✅ inalis ang pansamantalang `audit(req, …)`.)*
>
> **✅ NALUTAS (Day 76).** Sinuri gamit ang grep: walang controller na nag-i-import ng `db`/drizzle/argon2 · walang service na nag-i-import ng `express` o gumagamit ng `req`/`res` ·
> walang route na may `db`, argon2, Zod o `.status(`. Ang natitirang `req` sa `lib/`: ang `auditFor(req)` sa `lib/audit.ts` (sinadya — ito ang adapter)
> at ang `clientIp(req)` (tinatawag lang ng mga adapter). Ang `listUsers`/`listAuditLogs` ay nasa `services/admin.service.ts`.

**Phase 16 — ang huling hugis (katulad ng reference):**
```
backend/src/
├── index.ts          ← pinapatakbo lang ang server
├── app.ts            ← binubuo ang Express app (ini-import ng tests)
├── config/           ← env.ts — mga setting, sinusuri pagka-start
├── routes/           ← aling URL → aling controller
├── middleware/       ← requireAuth, requireRole, errorHandler, rateLimiter, csrf
├── controllers/      ← HTTP lang: validation → tawagin ang service → status code + cookies
├── services/         ← business logic, WALANG Express
├── validations/      ← Zod schemas
├── db/               ← koneksyon at schema
└── lib/              ← maliliit na helper na ginagamit ng marami (hal. password hashing)
```

## 3. Bawat layer: trabaho, at ano ang HINDI dapat nasa loob

| Layer | Trabaho | ❌ HINDI dapat nasa loob |
|---|---|---|
| **routes/** | Iugnay ang URL + method sa tamang function | Business logic, SQL |
| **middleware/** | Mga check na dinadaanan ng maraming route | Logic na para sa iisang route lang |
| **controllers/** | Basahin ang request, sagutin ng status code, cookies | SQL, pag-hash ng password, business rules |
| **services/** | Business rules at pakikipag-usap sa DB | `req`, `res`, status codes, cookies (walang Express!) |
| **validations/** | Hugis ng tamang input (Zod) | Pag-access sa database |
| **db/** | Koneksyon at kahulugan ng tables | Business rules |
| **config/** | Pagbasa at pagsusuri ng `.env` | Mga secret na naka-hardcode |
| **lib/** | Maliliit na tool na walang alam sa HTTP | Anumang partikular sa isang feature |

## 4. Ang frontend (Phase 5 · sinuri Day 50)

```
frontend/src/
├── main.tsx          ← simula ng app
├── App.tsx           ← aling page ang ipapakita
├── pages/            ← Login, Register, Profile, Admin, Sessions, ChangePassword,
│                        ForgotPassword, ResetPassword, VerifyEmail (Day 61) — isang screen bawat isa
├── hooks/            ← useHashToken.ts (Day 61) — token mula sa #fragment ng link sa email
├── components/       ← maliliit na pirasong ginagamit sa maraming page (hal. Button) — wala pang laman (Day 50)
└── api/              ← LAHAT ng pagtawag sa backend (fetch) — iisang lugar: auth.ts, admin.ts
```

**Bakit may sariling `api/`:** kapag nagbago ang URL o nagdagdag ng CSRF token,
iisang lugar lang ang babaguhin — hindi bawat page.

## 5. Mga patakaran

1. **Bago gumawa ng bagong file o folder:** tingnan ang table sa §2 at §3. Kung
   hindi malinaw kung saan ito, itanong — huwag hulaan.
2. **Kapag nagbago ang structure:** i-update ang dokumentong ito AT ang
   [`diagrams/00-architecture.md`](diagrams/00-architecture.md). Ang
   architecture doc na hindi tugma sa code ay mas nakakalito pa kaysa wala.
3. **"Anong problema ang nilulutas nito?"** — kung walang sagot, huwag idagdag
   ang folder o layer (tingnan ang [how we work](05-how-we-work.md) §6).

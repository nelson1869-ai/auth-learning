# 03 — Roadmap (phase by phase, day by day)

> **Ang "Day"** = isang study session (~1–2 oras), **hindi** calendar day. Kung
> kailangan ng dalawang session ang isang Day — ayos lang. Pag-intindi ang
> layunin, hindi bilis.
>
> **Paano gamitin:**
> - Lagyan ng `[x]` kapag tapos AT naiintindihan (tingnan ang "Definition of Done"
>   sa [how we work](05-how-we-work.md)).
> - Bawat Day → isang journal entry: `docs/journal/phase-N/day-NN.md`
>   (tuloy-tuloy ang numero ng Day sa lahat ng phase: day-01, day-02, ...).
> - **"Reference"** = ang katumbas na bahagi sa `express-authentication-demo`
>   (tingnan ang `AGENTS.md` doon, "What's implemented").
> - **📝 `.http` at 📊 diagram:** bawat araw na may **bagong endpoint** ay may
>   bagong `.http` file (`backend/http/NN-*.http`); bawat bagong o **nagbagong
>   flow** ay may bago o in-update na diagram (`docs/diagrams/NN-*.md`). Parehong
>   tuloy-tuloy ang numero — tingnan ang pinakamataas na numero bago gumawa ng bago.
>   Ang mga review day ay may 🔍 task: suriin na tugma pa ang lahat sa code.
> - **🏗️ Architecture:** kapag nagbabago ang folder structure, may 🏗️ task —
>   sundan ang [`06-architecture.md`](06-architecture.md), at i-update ito kapag nagbago.
> - **🧰 Tools:** kapag may bagong tool o library, may 🧰 task sa araw na iyon —
>   tingnan ang [`02-tech-stack.md`](02-tech-stack.md) kung para saan ito.
> - **Buhay na plano:** sa bawat checkpoint, suriin — tama pa ba ang bilis? Kung
>   may Day na umabot ng 3 session, o may konseptong kailangang ulitin, ayusin ang
>   natitirang plano. Alam ng reference **kung ano** ang gagawin; hindi nito alam
>   **kung gaano ka kabilis** matututo.
> - Sa dulo ng bawat phase: **checkpoint** — isang tag sa Git, at mga tanong na
>   dapat kaya mo nang sagutin nang hindi tumitingin.

**Tantya:** MVP (Phase 1–8) ≈ **38 Days** — mga 8 linggo kung 5 session bawat linggo.

---

## Phase 0 — Mga tool ✅
Node 24, npm, Git, Docker, VS Code — naka-install na.

---

## Phase 1 — Project setup · 🏗️ *buong team* · Day 01–02

### Day 01 — Blueprint at unang commit
- [x] Gumawa ng folder at role folders (Lesson 1)
- [x] `git init -b main` *(ginawa ulit — nawala ang unang `.git`)*
- [x] Basahin ang blueprint: `README.md`, `AGENTS.md`, `docs/01`–`05`
- [x] Isulat ang "sa sarili kong salita" sa 4 na role README
- [x] Unang journal: `docs/journal/phase-1/day-01.md`
- [x] Unang commit
- **Matututunan:** repo, commit, `git add` (staging), `.gitignore`

### Day 02 — GitHub at ang team workflow
- [x] Gumawa ng GitHub repo at i-push ang `main`
- [x] Unang branch → maliit na pagbabago → Pull Request → merge
- [x] `git pull`, at burahin ang merged branch
- **Matututunan:** remote, push/pull, branch, PR — ang araw-araw na workflow ng team

**✅ Checkpoint (tag `checkpoint-phase-1`):** Makikita ang project sa GitHub. — **TAPOS ✅**
Kaya mo bang ipaliwanag: *ano ang pagkakaiba ng commit at push? Bakit hindi
direktang nagtatrabaho sa `main`?*

---

## Phase 2 — Unang API · ⚙️ *Backend* · Day 03–06

### Day 03 — Node.js at npm
- [x] `npm init`, basahin ang `package.json`
- [x] Ano ang "dependency"; i-install ang Express; bakit hindi sine-save ang `node_modules/`
- **Matututunan:** Node vs browser JavaScript, npm, package.json

### Day 04 — Hello World server
- [x] `backend/src/index.js`: Express server na nakikinig sa port 3000
- [x] Unang route: `GET /api/health` → `{ "status": "ok" }`
- [x] Buksan sa browser at subukan gamit ang `curl`
- [x] 🏗️ Isang file muna (`src/index.js`) — tingnan ang `docs/06-architecture.md` §2, Phase 2
- [x] 📝 `backend/http/01-health.http` — health, route na wala, maling method
- [x] 📊 `docs/diagrams/01-request-lifecycle.md` — paano sinasagot ng server ang request (`TD`)
- **Matututunan:** server, port, route, request/response, JSON

### Day 05 — `.http` files at status codes
- [x] Subukan ang `01-health.http` gamit ang REST Client ("Send Request")
- [x] Mga status code: 200, 201, 400, 401, 404, 500 — ano ang ibig sabihin ng bawat isa
- [x] `node --watch` para kusang mag-restart ang server
- **Matututunan:** HTTP methods at status codes, manual na pagsubok

### Day 06 — Pagtanggap ng data
- [x] `express.json()` at isang `POST` route na nagbabalik ng natanggap na body
- [x] Hatiin ang routes sa `backend/src/routes/`
- [x] 📝 `backend/http/02-echo.http` — subukan ang POST na may body
- [x] 📊 I-update ang `01-request-lifecycle.md`: idagdag ang POST na may request body
- [x] 🏗️ Unang hati: `src/routes/` — bakit ngayon? (dumarami na ang URLs)
- **Matututunan:** request body, middleware (unang silip), pag-organisa ng files

**✅ Checkpoint (`checkpoint-phase-2`):** `GET /api/health` gumagana, may `.http`.
*Ano ang nangyayari mula sa pag-send ng request hanggang sa pagdating ng response?*

---

## Phase 3 — Unang database · 🗄️ *Database* + 🚀 *DevOps* · Day 07–11

### Day 07 — Docker at Postgres
- [x] Image vs container; `devops/docker-compose.yml` na may `postgres:17-alpine`
- [x] `docker compose up -d`, `docker ps`, `docker compose down`
- **Matututunan:** containers, ports, volumes (bakit hindi nawawala ang data)

### Day 08 — Unang SQL
- [x] Kumonekta gamit ang `psql`
- [x] `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE` — i-save sa `database/sql-practice/`
- **Matututunan:** table, row, column, ang apat na pangunahing SQL command

### Day 09 — Constraints (mga patakaran ng data)
- [x] `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`
- [x] Subukang mag-insert ng dobleng email — ano ang nangyari, at bakit ito mabuti?
- **Matututunan:** data integrity — ang database mismo ang huling bantay

### Day 10 — Backend ↔ database
- [x] `.env` at `.env.example` (ano ang secret, bakit hindi sa Git)
- [x] Drizzle: koneksyon mula sa backend, `users` schema
- [x] 🏗️ Bagong folder: `src/db/` — i-update ang `docs/06-architecture.md` kung may nagbago
- [x] 🧰 `npm install drizzle-orm pg` at `drizzle-kit`; basahin ang `.env` gamit ang `node --env-file=.env` (hindi na `dotenv` — tingnan ang tech stack)
- **Matututunan:** environment variables, ORM

### Day 11 — Migrations
- [x] `drizzle-kit generate` at `migrate` — ang unang migration
- [x] Tingnan ang table sa Drizzle Studio
- [x] 📊 `docs/diagrams/02-er-diagram.md` — ER diagram ng database (`erDiagram`); ia-update tuwing may bagong table
- **Matututunan:** bakit dumadaan sa migration ang pagbabago ng table

**✅ Checkpoint (`checkpoint-phase-3`):** May `users` table na ginawa ng migration.
*Bakit hindi natin binabago nang manual ang table? Ano ang silbi ng `UNIQUE`?*

---

## Phase 4 — Register at login · ⚙️ *Backend* + 🔐 *Security* · Day 12–19

### Day 12 — Password hashing
- [x] Bakit HINDI kailanman plain text; hash vs encryption
- [x] Maliit na script: `argon2.hash()` at `argon2.verify()`
- **Matututunan:** hashing, salt — *Reference: item 4*

### Day 13 — Register endpoint
- [x] `POST /api/auth/register` — hashed password, 201
- [x] Dobleng email → 409; 📝 `backend/http/04-register.http` (03 na ang users-count)
- [x] 📊 `docs/diagrams/03-register-flow.md` — flow ng register, kasama ang 409 branch
- [x] 📋 Simulan ang `docs/07-api-contract.md`: table ng bawat endpoint (method, path, request body, response, status codes) — i-update tuwing may bagong endpoint
- **Matututunan:** paglikha ng resource, error cases

### Day 14 — Validation
- [x] Zod schema para sa register (email format, haba ng password) → 400
- [x] 📝 Idagdag sa `04-register.http` ang mga maling input (walang `@`, maikling password) → 400
- [x] 📊 I-update ang `03-register-flow.md`: idagdag ang validation branch
- [x] 🏗️ Bagong folder: `src/validations/`
- **Matututunan:** "huwag magtiwala sa input ng user" — 🔐

### Day 15 — Login endpoint
- [x] `POST /api/auth/login` — i-verify ang password
- [x] Iisang mensahe para sa maling email AT maling password — bakit? 🔐
- [x] 📝 `backend/http/05-login.http` — tamang password, maling password, walang account
- [x] 📊 `docs/diagrams/04-login-flow.md` (`TD`)
- **Matututunan:** authentication, user enumeration (unang silip) — *Reference: item 28*

### Day 16 — JWT at cookies
- [x] Ano ang JWT (at ano ang HINDI dapat nasa loob nito)
- [x] I-set ito sa `httpOnly` cookie — bakit hindi `localStorage`? 🔐
- [x] 📝 Sa `05-login.http`, tingnan ang `Set-Cookie` header sa response
- [x] 📊 I-update ang `04-login-flow.md`: idagdag ang JWT + cookie
- [x] 🧰 `cookie-parser` para mabasa ang cookie; i-decode ang JWT sa **jwt.io** para makita ang laman nito
- **Matututunan:** stateless na session, cookie flags — *Reference: item 5*

### Day 17 — Protektadong route
- [x] Middleware na sumusuri sa JWT; `GET /api/auth/me`
- [x] 📝 `backend/http/06-me.http` — may cookie (200) at walang cookie (401)
- [x] 📊 `docs/diagrams/05-auth-middleware.md` — paano sinusuri ng middleware ang JWT
- [x] 🏗️ Bagong folder: `src/middleware/` — ano ang pagkakaiba ng middleware sa route?
- **Matututunan:** middleware, authentication vs authorization

### Day 18 — Logout at flow diagram
- [x] `POST /api/auth/logout` — i-clear ang cookie
- [x] 📝 `backend/http/07-logout.http`
- [x] 📊 `docs/diagrams/06-auth-sequence.md` — `sequenceDiagram` ng buong auth: register → login → me → logout
- **Matututunan:** buong auth flow mula simula hanggang dulo

### Day 19 — Review day
- [x] Balikan ang lahat ng code: may hindi ba malinaw? Linisin ang pangalan at files
- [x] Sagutin ang lahat ng "Mga tanong ko pa" sa journal hanggang ngayon
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?
- **Matututunan:** refactoring — pagpapaganda nang hindi binabago ang behavior

**✅ Checkpoint (`checkpoint-phase-4`):** Register → login → me → logout gumagana sa `.http`.
> ✅ **Tapos: 2026-09-25**, tag sa `3c09ea0`. **Buhay na plano — pagsusuri:** natapos ang
> Day 12–19 sa loob ng isang araw. Ang madalas na nakakaligtaan: imports, mga
> placeholder na naiwan sa code, at ang merge bago magsimula ng bagong araw. Ang
> mga checkpoint na tanong ay sinagot ng AI bilang answer key (`day-19.md`) —
> **balikan bago ang Phase 11** (refresh tokens), dahil doon nakasandal ang #5.
*Bakit hashed ang password? Bakit httpOnly ang cookie? Bakit iisa ang error message sa login?*

---

## Phase 5 — Login page · 🎨 *Frontend* · Day 20–24

### Day 20 — React + Vite
- [ ] `npm create vite@latest frontend` (React); patakbuhin
- [ ] Ano ang component at JSX
- [ ] 🏗️ Frontend structure: `pages/`, `components/`, `api/` (tingnan ang §4)
- [ ] 🧰 Buksan ang **Chrome DevTools** (F12) → Network tab — dito mo makikita ang bawat request
- **Matututunan:** frontend dev server, component

### Day 21 — State at forms
- [ ] `useState`; register form
- **Matututunan:** state, controlled inputs, events

### Day 22 — Pagtawag sa backend
- [ ] `fetch` sa `/api/auth/register`, ipakita ang tagumpay o error
- [ ] **CORS** — bakit hinaharangan ng browser, at paano ito ayusin nang ligtas 🔐
- [ ] 📊 `docs/diagrams/07-frontend-backend.md` — `sequenceDiagram`: browser → backend, kasama ang CORS preflight
- [ ] 🧰 `cors` package sa backend; tingnan ang CORS error sa DevTools **bago** ito ayusin
- [ ] 📋 Sundan ang `docs/07-api-contract.md` sa pagtawag sa backend — ito ang "kasunduan" ng frontend at backend
- **Matututunan:** frontend ↔ backend, CORS, `credentials: 'include'`

### Day 23 — Login at profile
- [ ] Login form; "Hello, <pangalan>" gamit ang `/me`; logout button
- **Matututunan:** paggamit ng cookie session mula sa browser

### Day 24 — Maayos na karanasan
- [ ] Loading state, malinaw na error messages, simpleng layout
- **Matututunan:** UX basics

**✅ Checkpoint (`checkpoint-phase-5`):** Buong auth mula sa browser.
*Ano ang CORS at bakit ito umiiral?*

---

## Phase 6 — Tests at CI · 🧪 *QA* + 🚀 *DevOps* · Day 25–28

### Day 25 — Unang unit test
- [ ] Vitest; test ng isang simpleng function
- **Matututunan:** arrange / act / assert, bakit may tests

### Day 26 — API tests
- [ ] Supertest: test ng `/api/health`, register, at login
- [ ] Hiwalay na test database
- [ ] 🏗️ Hatiin ang `index.js` → `app.js` + `index.js` (para ma-import ng tests nang hindi binubuksan ang port)
- **Matututunan:** integration test — *Reference: item 2*

### Day 27 — GitHub Actions
- [ ] `.github/workflows/ci.yml`: kusang pinapatakbo ang tests sa bawat push/PR
- [ ] 📊 `docs/diagrams/08-ci-pipeline.md` — push → CI jobs → ✅/❌
- [ ] 🧰 **ESLint** — idagdag sa CI kasama ng tests; i-install ang ESLint extension sa VS Code
- **Matututunan:** CI — *Reference: item 9*

### Day 28 — Protektahan ang `main`
- [ ] Branch protection: hindi puwedeng mag-merge kung pula ang CI
- **Matututunan:** "never break main"

**✅ Checkpoint (`checkpoint-phase-6`):** Berdeng ✅ sa bawat PR.
*Ano ang nahuhuli ng test na hindi mahuhuli ng `.http` file?*

---

## Phase 7 — TypeScript · ⚙️ *Backend* · Day 29–32

### Day 29 — TypeScript basics
- [ ] Types, `tsconfig.json`, `tsx`
- **Matututunan:** bakit may types (tingnan ang D-002)

### Day 30–32 — Paglipat, isang file bawat hakbang
- [ ] Ilipat ang backend sa TypeScript; `z.infer` para sa types ng Zod schemas
- [ ] Pansinin: anong mga pagkakamali ang nahuli ng TypeScript?
- **Matututunan:** unti-unting migration nang hindi sinisira ang gumagana

**✅ Checkpoint (`checkpoint-phase-7`):** `npx tsc --noEmit` malinis, at pumapasa pa rin ang tests.

---

## Phase 8 — Totoong deploy 🌐 · 🚀 *DevOps* + 🗄️ *Database* · Day 33–38

### Day 33 — Domain at Cloudflare
- [ ] Bumili ng domain (~$10/taon); ilipat ang DNS sa Cloudflare
- **Matututunan:** DNS, domain, nameservers

### Day 34 — Dockerfile
- [ ] Dockerfile para sa backend; patakbuhin sa container
- **Matututunan:** image build — *Reference: item 21*

### Day 35 — Managed database na may backup
- [ ] Neon o Supabase; patakbuhin ang migrations doon
- [ ] **Backup at restore:** subukan talagang mag-restore
- **Matututunan:** managed DB, "ang backup na hindi pa nasusubukang i-restore ay hindi backup"

### Day 36 — HTTPS gamit ang named Cloudflare Tunnel
- [ ] `https://api.<domain-mo>` at `https://<domain-mo>`
- [ ] Cookie flags para sa production (`Secure`, `SameSite`) 🔐
- **Matututunan:** HTTPS, tunnel, production config

### Day 37 — CD: kusang deploy pagka-merge sa `main`
- [ ] GitHub Actions job na nagde-deploy kapag pumasa ang CI (Phase 6)
- [ ] Deploy lang mula sa `main`, at lang kapag berde ang lahat ng tests
- [ ] 📊 `docs/diagrams/09-cd-pipeline.md` — merge → CI → deploy; i-update ang `00-architecture.md`
- **Matututunan:** CD — at kung bakit **manual muna, tapos automate** (hindi mo
  magagawang awtomatiko ang hindi mo pa nagagawa nang mano-mano) · *Reference: item 22*

### Day 38 — MVP launch 🎉
- [ ] Isang kaibigan: register → login → logout mula sa **sarili niyang phone**
- [ ] Isulat sa journal: ano ang pinakamahirap, ano ang pinakanatutunan
- **Matututunan:** ang saya ng "gumagana para sa totoong tao"

**✅ Checkpoint (`checkpoint-mvp`):** Tapos na ang MVP (tingnan ang [project brief](01-project-brief.md)).

---

## Pagkatapos ng MVP — ang daan papuntang senior-level

> Hango sa **tunay na pagkakabuo ng reference project** (129 commits, tingnan ang
> `git log` doon), pero **inayos para sa pag-aaral**:
> - Inuna ang mga pundasyon (hal. headers at error handling) bago ang mga advanced
> - Nilaktawan ang hindi na kailangan (hal. bcrypt → Argon2 migration — Argon2 na tayo mula Day 12)
> - **May frontend task ang bawat feature** — wala nito ang reference (backend lang siya)
>
> Bawat phase ay may **"Reference"** — ang mga commit sa reference project na
> gumawa ng parehong bagay. Tingnan gamit ang `git log --oneline --grep "<salita>"` doon.

**Tantya:** Phase 9–19 ≈ **62 Days** — mga 12–13 linggo pagkatapos ng MVP.

---

## Phase 9 — Pangunahing hardening · 🔐 *Security* + ⚙️ *Backend* · Day 39–44

### Day 39 — Secure headers
- [ ] `helmet`: ano ang bawat header (CSP, X-Frame-Options, HSTS) at anong atake ang pinipigilan
- **Matututunan:** clickjacking, XSS, MIME sniffing

### Day 40 — Fail-fast na config
- [ ] I-validate ang `.env` gamit ang Zod pagka-start — ayaw magsimula kung may kulang
- [ ] 🏗️ Bagong folder: `src/config/`
- **Matututunan:** "mas mabuting mag-crash agad kaysa tumakbo nang mali"

### Day 41 — Sentral na error handling
- [ ] Isang error handler para sa lahat; **generic na mensahe sa 5xx**, detalye sa logs lang
- [ ] 📊 `docs/diagrams/10-middleware-pipeline.md` — pagkakasunod ng middleware (helmet → parsers → routes → error handler)
- **Matututunan:** bakit mapanganib ipakita ang internal errors · *Reference: `fix(errors)`*

### Day 42 — Structured logging
- [ ] Pino + request ID sa bawat request; itago (redact) ang passwords at cookies sa logs
- **Matututunan:** paano mag-debug sa production · *Reference: `structured logging with Pino`*

### Day 43 — Rate limiting
- [ ] `express-rate-limit` sa login/register lang (hindi sa lahat ng route!)
- [ ] 📝 `backend/http/08-rate-limit.http` — pindutin nang 11 beses → 429
- [ ] 📊 I-update ang `10-middleware-pipeline.md`
- **Matututunan:** brute force, bakit iba ang limit ng bawat route · *Reference: `scope authLimiter`*

### Day 44 — CSRF protection
- [ ] Double-submit cookie; i-update ang frontend at lahat ng `.http` files
- [ ] 📝 `backend/http/09-csrf.http` — at **i-update ang LAHAT ng lumang `.http` files** na may POST (kailangan na ng CSRF token)
- [ ] 📊 I-update ang `10-middleware-pipeline.md` at `07-frontend-backend.md`
- **Matututunan:** bakit may CSRF kapag cookie ang gamit sa auth · *Reference: `CSRF protection`*

**✅ Checkpoint (`checkpoint-phase-9`):** *Anong atake ang pinipigilan ng bawat isa sa 6 na ito?*

---

## Phase 10 — Roles at admin · ⚙️ *Backend* + 🎨 *Frontend* + 🗄️ *Database* · Day 45–50

### Day 45 — Roles sa database
- [ ] `role` column (`user` / `admin`) gamit ang migration; seed script para sa unang admin
- [ ] 📊 I-update ang `02-er-diagram.md` (`role` column)
- **Matututunan:** enum, seed data · *Reference: `user_role enum`, `seed script`*

### Day 46 — Authorization middleware
- [ ] `requireRole('admin')` — 401 vs **403** (sino ka vs anong pinapayagan sa iyo)
- [ ] 📝 `backend/http/10-admin-rbac.http` — user (403), admin (200), walang login (401)
- [ ] 📊 `docs/diagrams/11-rbac.md` — 401 vs 403 na desisyon
- [ ] 🏗️ `routes/admin` + `requireRole` middleware — i-update ang `00-architecture.md`
- **Matututunan:** authentication vs authorization · *Reference: `requireRole`*

### Day 47 — Listahan ng users (admin) + pagination
- [ ] `GET /api/admin/users?page=&limit=` na may max limit
- [ ] 📝 `backend/http/11-pagination.http` — page, limit, at sobrang laking limit (400)
- **Matututunan:** bakit laging may limit ang listahan · *Reference: `pagination`*

### Day 48 — Audit log
- [ ] `audit_logs` table: sino, ano, kailan, saan (IP) — para sa login, logout, admin actions
- [ ] 📝 `backend/http/12-audit-logs.http`
- [ ] 📊 I-update ang `02-er-diagram.md` (`audit_logs` table)
- **Matututunan:** forensic trail · *Reference: `audit logging`*

### Day 49 — Admin page (frontend)
- [ ] Listahan ng users at audit logs; itago ang admin menu sa hindi admin
- **Matututunan:** bakit **hindi sapat** na itago lang sa frontend (dapat din sa backend) 🔐

### Day 50 — Review day
- [ ] Balikan ang Phase 9–10; sagutin ang "Mga tanong ko pa" sa journal
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-10`):** *Ano ang pagkakaiba ng 401 at 403?*

---

## Phase 11 — Mas ligtas na sessions · ⚙️ *Backend* + 🔐 *Security* · Day 51–57

### Day 51 — Refresh tokens
- [ ] Maikling access token (15 min) + mahabang refresh token na naka-hash sa DB
- **Matututunan:** bakit dalawang token · *Reference: `refresh-token session foundation`*

### Day 52 — Rotation at reuse detection
- [ ] Bagong refresh token bawat gamit; ang pag-replay ng luma = **nakaw** → i-revoke ang buong family
- [ ] 📝 `backend/http/13-refresh-tokens.http` — normal na refresh, at pag-replay ng lumang token
- [ ] 📊 `docs/diagrams/12-refresh-rotation.md` — `sequenceDiagram` ng rotation + reuse detection
- [ ] 📊 I-update ang `02-er-diagram.md` (`refresh_tokens` table)
- **Matututunan:** token rotation · *Reference: `refresh-token rotation with reuse detection`*

### Day 53 — Totoong logout
- [ ] I-revoke ang refresh token sa DB, hindi lang i-clear ang cookie
- [ ] 📝 I-update ang `07-logout.http`: subukang gamitin ang lumang refresh token pagkatapos mag-logout → 401
- **Matututunan:** stateful vs stateless na logout

### Day 54 — Mga device ko (sessions page)
- [ ] `GET /api/auth/sessions` at `DELETE /api/auth/sessions/:id` (naka-scope sa sariling user — IDOR 🔐)
- [ ] Frontend: listahan ng naka-login na devices, may "Logout" bawat isa
- [ ] 📝 `backend/http/14-sessions.http` — listahan, pag-revoke, at pag-revoke ng session ng IBANG user (404)
- [ ] 📊 `docs/diagrams/13-sessions.md`
- **Matututunan:** IDOR · *Reference: `session management`*

### Day 55 — Change password
- [ ] Kailangan ang kasalukuyang password (reauthentication); i-revoke ang LAHAT ng session
- [ ] Frontend: change-password form
- [ ] 📝 `backend/http/15-change-password.http`
- [ ] 📊 `docs/diagrams/14-change-password.md`
- **Matututunan:** high-risk events · *Reference: `change-password with reauthentication`*

### Day 56 — RS256 at JWT claims
- [ ] Asymmetric keys (private para mag-sign, public para mag-verify); `iss` at `aud`
- [ ] 📝 I-update ang `05-login.http`: i-decode ang JWT (jwt.io) at tingnan ang `alg`, `iss`, `aud`
- **Matututunan:** HS256 vs RS256 · *Reference: `HS256 to RS256`, `iss/aud claim validation`*

### Day 57 — Review day + session flow diagram
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-11`):** *Bakit nire-revoke ang BUONG family kapag may reuse?*

---

## Phase 12 — Email · ⚙️ *Backend* + 🎨 *Frontend* + 🚀 *DevOps* · Day 58–62

### Day 58 — Totoong email provider
- [ ] Resend o Brevo; API key sa `.env` lang
- **Matututunan:** transactional email, deliverability (bakit napupunta sa spam)

### Day 59 — Password reset
- [ ] Single-use na token (hashed, may expiry); laging "kung may account, may email na"
- [ ] 📝 `backend/http/16-password-reset.http`
- [ ] 📊 `docs/diagrams/15-password-reset.md`
- [ ] 📊 I-update ang `02-er-diagram.md` (`verification_tokens` table)
- **Matututunan:** single-use tokens · *Reference: `password reset and email verification`*

### Day 60 — Email verification
- [ ] Link sa email pagka-register; markahan ang `email_verified_at`
- [ ] 📝 `backend/http/17-verify-email.http`
- [ ] 📊 `docs/diagrams/16-verify-email.md`

### Day 61 — Frontend pages
- [ ] Forgot password, reset password, at verify email pages

### Day 62 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-12`):** Nakatanggap ka ng totoong reset email sa sarili mong inbox.

---

## Phase 13 — Account lockout · 🔐 *Security* · Day 63–65

### Day 63 — Per-account lockout
- [ ] 5 maling password → 15 minutong lock (hiwalay sa IP rate limit)
- [ ] 📝 `backend/http/18-lockout.http` — 5 maling password → 423
- [ ] 📊 I-update ang `04-login-flow.md`: idagdag ang lockout branch
- **Matututunan:** bakit hindi sapat ang IP limit (maraming IP ang attacker) · *Reference: `per-account lockout`*

### Day 64 — Lockout DoS at device cookies
- [ ] Kayang i-lock ng kahit sino ang account mo — ayusin gamit ang device cookies (OWASP)
- [ ] 📝 `backend/http/19-device-cookies.http`
- [ ] 📊 I-update ang `04-login-flow.md` at `02-er-diagram.md` (`trusted_devices`)
- **Matututunan:** kapag ang depensa mismo ang nagiging atake · *Reference: `device cookies`*

### Day 65 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-13`):** *Paano naaabuso ng attacker ang lockout, at paano ito naayos?*

---

## Phase 14 — Tama kahit sabay-sabay · 🗄️ *Database* + 🧪 *QA* · Day 66–70

> **Ang pinakamahalagang aral ng reference project:** gumagana ang lahat sa isang
> request, pero **nasisira kapag 20 request ang sabay** — at nagmukha itong "10/10" bago nahuli.

### Day 66 — Race conditions
- [ ] Test na nagpapadala ng 20 sabay na request (`Promise.all`) — mahuli ang bug
- **Matututunan:** TOCTOU ("check then act") · *Reference: `race-safe`*

### Day 67 — Atomic SQL
- [ ] `UPDATE ... WHERE ... RETURNING` sa halip na "hanapin muna, tapos baguhin"
- **Matututunan:** hayaang ang database ang magpasya kung sino ang mananalo

### Day 68 — Transactions
- [ ] Change/reset password: lahat o wala; side effects (email, cookies) PAGKATAPOS ng commit
- [ ] 📊 I-update ang `03-register-flow.md`, `14-change-password.md`, `15-password-reset.md`: markahan ang transaction boundary (`subgraph`)
- [ ] 📝 Hindi kayang magpadala ng sabay na request ang `.http` — dito, ang **tests** ang patunay
- **Matututunan:** atomicity · *Reference: `atomic with transactions`*

### Day 69 — Unique constraint bilang huling bantay
- [ ] Sabay na register ng parehong email → 409, hindi 500
- **Matututunan:** bakit ang DB constraint ang tunay na garantiya

### Day 70 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-14`):** *Bakit hindi sapat ang "hanapin muna ang user, tapos i-update"?*

---

## Phase 15 — Huwag ibunyag kung sino ang may account · 🔐 *Security* · Day 71–73

### Day 71 — Pareho ang sagot
- [ ] Login, forgot-password: pareho ang status at mensahe kahit may account o wala
- [ ] 📝 `backend/http/20-user-enumeration.http` — ikumpara ang sagot para sa may account at wala
- **Matututunan:** user enumeration · *Reference: `revealing which emails have accounts`*

### Day 72 — Pareho ang oras
- [ ] Dummy password hash para sa walang-account na email; sukatin ang timing
- [ ] 📊 I-update ang `04-login-flow.md`: ang dummy-hash branch
- **Matututunan:** timing attacks

### Day 73 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

---

## Phase 16 — Malinis na architecture · 🏗️ *Architect* + ⚙️ *Backend* · Day 74–79

### Day 74–76 — Service layer
- [ ] Hatiin: controller (HTTP lang) → service (business logic, walang Express)
- [ ] Isang flow bawat araw; **pumapasa pa rin ang lahat ng tests** pagkatapos ng bawat hakbang
- [ ] 📊 I-update ang LAHAT ng diagram: hiwalay na banggitin ang controller (HTTP) at service (logic)
- [ ] 🏗️ Ang huling hugis: `controllers/` + `services/` — i-update ang `docs/06-architecture.md` at LAHAT ng diagram
- **Matututunan:** separation of concerns, refactoring nang ligtas · *Reference: `service layer`*

### Day 77 — Mass-assignment guard
- [ ] Parsed na input lang ang ipinapasa sa service; test na may isiningit na `userId` 🔐
- **Matututunan:** mass assignment · *Reference: `mass-assignment guard`*

### Day 78 — API documentation
- [ ] OpenAPI + Swagger UI mula sa parehong Zod schemas
- [ ] 📝 `backend/http/21-openapi.http` — kunin ang spec
- **Matututunan:** docs na hindi naiiba sa code · *Reference: `OpenAPI 3.1 spec`*

### Day 79 — Walang naiwang unused code
- [ ] `noUnusedLocals` + knip sa CI
- **Matututunan:** bakit nakakalito ang patay na code · *Reference: `remove unused code`*

**✅ Checkpoint (`checkpoint-phase-16`):** *Ano ang dapat at HINDI dapat nasa loob ng isang controller?*

---

## Phase 17 — Observability · 🚀 *DevOps* · Day 80–86

### Day 80 — Health checks
- [ ] `/health/live` (buhay ba ang process) vs `/health/ready` (handa ba ang DB)
- [ ] 📝 `backend/http/22-health-checks.http` — `/live` at `/ready`
- **Matututunan:** bakit dalawa · *Reference: `two-tier health checks`*

### Day 81 — Metrics
- [ ] OpenTelemetry + `/metrics` (ilang request, gaano kabilis, ilang error)
- [ ] 📝 `backend/http/23-metrics.http`
- [ ] 📊 `docs/diagrams/17-observability.md` — app → Prometheus → Grafana/Alertmanager
- **Matututunan:** metrics vs logs · *Reference: `metrics + distributed tracing`*

### Day 82–83 — Dashboards
- [ ] Prometheus + Grafana: isang dashboard ng app
- **Matututunan:** "nakikita mo ba ang problema bago pa magreklamo ang user?"

### Day 84 — Alerts
- [ ] Alertmanager: email kapag down ang app — **subukan talaga** (patayin ang app)
- **Matututunan:** alert na may `for:` delay · *Reference: `monitoring stack`*

### Day 85 — Graceful shutdown
- [ ] Tapusin ang mga kasalukuyang request bago mag-exit sa deploy
- **Matututunan:** zero-drop deploys · *Reference: `graceful shutdown`*

### Day 86 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

**✅ Checkpoint (`checkpoint-phase-17`):** Nakatanggap ka ng alert email nang sadyang patayin ang app.

---

## Phase 18 — Production maturity · 🚀 *DevOps* + 🗄️ *Database* · Day 87–93

### Day 87 — Supply-chain security
- [ ] Dependabot, `npm audit` sa CI, secret scanning (gitleaks)
- **Matututunan:** bakit mapanganib ang dependencies · *Reference: `Dependabot, npm audit gate, and secret scanning`*

### Day 88 — Container scanning
- [ ] I-scan ang Docker image sa CI (Grype); tanggalin ang hindi kailangan sa runtime image
- **Matututunan:** CVEs · *Reference: `CI image scanning`*

### Day 89 — Ligtas na CD
- [ ] Deploy lang ang eksaktong commit na pumasa sa CI; i-verify ang migrations bago mag-restart
- [ ] 📊 I-update ang `09-cd-pipeline.md`: ang mga bagong safety check
- **Matututunan:** mga totoong insidente sa reference · *Reference: `fix(cd)` (2 commits)*

### Day 90 — Data retention
- [ ] Oras-oras na paglilinis ng expired na data, may advisory lock
- [ ] 📝 `backend/http/24-retention.http` — gabay kung paano obserbahan ang cleanup job
- [ ] 📊 `docs/diagrams/18-retention.md`
- **Matututunan:** bakit hindi puwedeng basta burahin ang revoked refresh tokens · *Reference: `data-retention`*

### Day 91 — Backup drill
- [ ] Sadyang "sirain" ang staging DB at i-restore mula sa backup; orasan ito
- **Matututunan:** RPO/RTO — gaano karaming data ang puwedeng mawala, at gaano katagal bago bumalik

### Day 92 — Distributed rate limiting
- [ ] Redis bilang store ng rate limiter (para gumana kahit maraming server)
- [ ] 📝 I-update ang `08-rate-limit.http`
- **Matututunan:** bakit nabubutas ang in-memory limit · *Reference: `Redis-backed distributed rate limiting`*

### Day 93 — Review day
- [ ] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`)
- [ ] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`?

---

## Phase 19 — Passkeys · 🔐 *Security* + 🎨 *Frontend* + 🧪 *QA* · Day 94–100

### Day 94 — Paano gumagana ang WebAuthn
- [ ] Public-key cryptography, challenge, at kung bakit hindi nananakaw ang passkey sa phishing
- **Matututunan:** ang konsepto bago ang code · *Reference: `WebAuthn/passkey`*

### Day 95–96 — Pagdagdag ng passkey
- [ ] Registration ceremony (backend + frontend button)
- [ ] 📝 `backend/http/25-passkeys.http` — options lang (kailangan ng browser para sa verify)
- [ ] 📊 `docs/diagrams/19-passkey-register.md`

### Day 97–98 — Login gamit ang passkey
- [ ] Authentication ceremony; decoy options para hindi ibunyag ang account 🔐
- [ ] 📊 `docs/diagrams/20-passkey-login.md`, kasama ang decoy options branch

### Day 99 — E2E test
- [ ] Playwright + virtual authenticator — totoong browser, walang totoong hardware
- **Matututunan:** kailan kailangan ng E2E sa halip na API test

### Day 100 — 🎓 Final review
- [ ] Isulat sa journal: ang buong paglalakbay, ang pinakamahirap, ang pinakanatutunan
- [ ] I-update ang "Sa sarili kong salita" sa 4 na role README — ikumpara sa Day 01!
- [ ] Ihambing ang project mo sa reference project — ano ang pareho, ano ang mas maganda?

**✅ Checkpoint (`checkpoint-senior`):** Kaya mong ipaliwanag ang bawat bahagi ng
system — **nang hindi tumitingin sa code.**

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
  **`NN-` sa plano = wala pang numero:** ibibigay lang ang numero sa araw na gagawin
  ang file. (Day 41: nagbanggaan ang mga numerong itinakda nang maaga — hal.
  `10-admin-rbac.http` vs `10-logging.http` — kaya inalis ang mga numero sa hinaharap.)
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

**✅ Checkpoint (`checkpoint-phase-2`):** `GET /api/health` gumagana, may `.http`. — **TAPOS ✅ (2026-09-24)** *(may tag na; idinagdag ang marka noong Day 62 review)*
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

**✅ Checkpoint (`checkpoint-phase-3`):** May `users` table na ginawa ng migration. — **TAPOS ✅ (2026-09-25)** *(may tag na; idinagdag ang marka noong Day 62 review)*
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

**✅ Checkpoint (`checkpoint-phase-4`):** Register → login → me → logout gumagana sa `.http`. — **TAPOS ✅ (2026-09-25)** *(may tag na; idinagdag ang marka noong Day 62 review)*
> ✅ **Tapos: 2026-09-25**, tag sa `3c09ea0`. **Buhay na plano — pagsusuri:** natapos ang
> Day 12–19 sa loob ng isang araw. Ang madalas na nakakaligtaan: imports, mga
> placeholder na naiwan sa code, at ang merge bago magsimula ng bagong araw. Ang
> mga checkpoint na tanong ay sinagot ng AI bilang answer key (`day-19.md`) —
> **balikan bago ang Phase 11** (refresh tokens), dahil doon nakasandal ang #5.
*Bakit hashed ang password? Bakit httpOnly ang cookie? Bakit iisa ang error message sa login?*

---

## Phase 5 — Login page · 🎨 *Frontend* · Day 20–24

> 📐 Plano ayon sa [D-013](04-decisions.md): basics muna, modern pagkatapos.
> Walang frontend ang reference project — dito tayo mismo ang nagpapasya.

### Day 20 — React + Vite
- [x] Ilipat muna palabas ang `frontend/README.md` (binubura ng Vite ang laman ng folder), tapos
      `npm create vite@latest frontend -- --template react`, ibalik ang README, `npm install`, `npm run dev`
- [x] Ano ang component at JSX; linisin ang template (alisin ang demo)
- [x] 🏗️ Frontend structure: `pages/`, `components/`, `api/` (tingnan ang §4)
- [x] 🧰 Buksan ang **Chrome DevTools** (F12) → Network tab — dito mo makikita ang bawat request
- **Matututunan:** frontend dev server, component, JSX, StrictMode

### Day 21 — State at forms (pundasyon)
- [x] Login form gamit ang `useState` (controlled inputs) at `onSubmit`
- [x] Ipakita ang tinype sa ilalim ng form (para makita kung paano nagre-render)
- **Matututunan:** state, re-render, controlled inputs, events

### Day 22 — Pagtawag sa backend
- [x] `src/api/auth.js`: `fetch` sa `/api/auth/login` na may `credentials: 'include'`
- [x] **CORS** — makita muna ang error sa DevTools, tapos ayusin sa backend (`cors`, `origin`, `credentials: true`) 🔐
- [x] 📊 I-update ang `docs/diagrams/07-frontend-backend.md` (sinimulan sa Day 21) — `sequenceDiagram`: browser → backend, kasama ang CORS preflight
- [x] 📋 Sundan ang `docs/07-api-contract.md` — ang "kasunduan" ng frontend at backend
- **Matututunan:** frontend ↔ backend, CORS, `credentials: 'include'`, cookie sa DevTools

### Day 23 — Register gamit ang React 19 (modern)
- [x] Register form gamit ang `useActionState` — kusang may loading at error state
- [x] Ikumpara sa login form ng Day 21: ano ang nabawas na code?
- [x] Ipakita ang `fields` mula sa 400 (Zod) sa tabi ng bawat input, at ang 409
- **Matututunan:** React 19 form actions, pending state, mga error mula sa backend

### Day 24 — Mga page at logout
- [x] React Router 8: `/login`, `/register`, `/profile`
- [x] `/profile`: "Hello, <pangalan>" gamit ang `/me`; kung 401 → balik sa `/login`
- [x] Logout button → `/api/auth/logout` → `/login`
- **Matututunan:** routing, protektadong page, paggamit ng cookie session mula sa browser

**✅ Checkpoint (`checkpoint-phase-5`):** Buong auth mula sa browser. — **TAPOS ✅ (2026-09-25)** *(may tag na; idinagdag ang marka noong Day 62 review)*
> ✅ **Tapos: 2026-09-25**, tag sa `2c424d6`. **Buhay na plano:** isang araw para sa Day 20–24.
> Mga natuklasan: binubura ng React 19 ang form kahit may error; namamatay ang
> `node --watch` sa `git checkout` → nodemon (D-014); ang tanong ng checkpoint
> (CORS) ay hindi pa nasasagot ni Nelson — balikan sa Phase 9 (CSRF).
*Ano ang CORS at bakit ito umiiral?*

---

## Phase 6 — Tests at CI · 🧪 *QA* + 🚀 *DevOps* · Day 25–28

### Day 25 — Unang unit test
- [x] Vitest; test ng isang simpleng function
- **Matututunan:** arrange / act / assert, bakit may tests

### Day 26 — API tests
- [x] Supertest: test ng `/api/health`, register, at login
- [x] Hiwalay na test database
- [x] 🏗️ Hatiin ang `index.js` → `app.js` + `index.js` (para ma-import ng tests nang hindi binubuksan ang port)
- **Matututunan:** integration test — *Reference: item 2*

### Day 27 — GitHub Actions
- [x] `.github/workflows/ci.yml`: kusang pinapatakbo ang tests sa bawat push/PR
- [x] 📊 `docs/diagrams/08-ci-pipeline.md` — push → CI jobs → ✅/❌
- [x] 🧰 **Oxlint** (D-015, hindi na ESLint) — sa CI kasama ng tests; VS Code extension `oxc.oxc-vscode`
- **Matututunan:** CI — *Reference: item 9*

### Day 28 — Protektahan ang `main`
- [x] Branch protection: hindi puwedeng mag-merge kung pula ang CI
- **Matututunan:** "never break main"

**✅ Checkpoint (`checkpoint-phase-6`):** Berdeng ✅ sa bawat PR. — **TAPOS ✅ (2026-09-26)** *(may tag na; idinagdag ang marka noong Day 62 review)*
*Ano ang nahuhuli ng test na hindi mahuhuli ng `.http` file?*

> ✅ **Tapos: 2026-09-26.** **Buhay na plano:** ginawang public ang repo (D-016) dahil
> hindi ipinapatupad ng GitHub Free ang ruleset sa private repo. Patunay: PR #33 na
> may sadyang bagsak na test → ❌ `backend` sa CI, hindi na-merge.
---

## Phase 7 — TypeScript · ⚙️ *Backend* + 🎨 *Frontend* · Day 29–32b

### Day 29 — TypeScript basics
- [x] Types, `tsconfig.json` — at si Node 24 ang nagpapatakbo ng `.ts` (hindi `tsx`, D-018)
- **Matututunan:** bakit may types (tingnan ang D-002)

### Day 30–32 — Paglipat, isang file bawat hakbang
- [x] Ilipat ang backend sa TypeScript; `z.infer` para sa types ng Zod schemas
- [x] Pansinin: anong mga pagkakamali ang nahuli ng TypeScript?
- **Matututunan:** unti-unting migration nang hindi sinisira ang gumagana

### Day 32b — Frontend sa TypeScript (idinagdag — napansin ni Nelson)
- [x] `.jsx` → `.tsx`, `auth.js` → `auth.ts`; `User`/`ApiError` types; `npm run typecheck` sa CI
- [x] Pansinin: 17 error nang pinalitan lang ang pangalan; `User` ay kopya ng sagot ng backend (D-019)
- **Matututunan:** types sa React (`useState<User | null>`, `FormEvent`, `useActionState<State, FormData>`)

**✅ Checkpoint (`checkpoint-phase-7`):** `npm run typecheck` malinis sa backend AT frontend (at sa CI), at pumapasa pa rin ang tests. — **TAPOS ✅ (2026-09-26)** *(may tag na; idinagdag ang marka noong Day 62 review)*

---

## Phase 8 — Totoong deploy 🌐 · 🚀 *DevOps* + 🗄️ *Database* · Day 33–38

> 📐 **Hybrid (D-020):** frontend sa **Cloudflare Pages** · backend sa **PC mo (Docker)**
> sa likod ng **named Cloudflare Tunnel** · database sa **Neon** · CD ng backend na
> **pull-based** (walang self-hosted runner — public ang repo).

### Day 33 — Domain at Cloudflare
- [x] Bumili ng domain (~$10/taon); ilipat ang DNS sa Cloudflare — **`nelson1869.com`** (Cloudflare Registrar, $10.46/taon)
- [x] Planuhin ang mga address: `https://nelson1869.com` (frontend) at `https://api.nelson1869.com` (backend)
- **Matututunan:** DNS, domain, nameservers; bakit **same-site** ang `api.` at ang main domain (para sa cookie)

### Day 34 — Dockerfile ng backend
- [x] Dockerfile: `npm ci --omit=dev` + `node src/index.ts` — **walang build step** (D-018); non-root user
- [x] Patakbuhin sa container (`docker run` laban sa test DB) — ang compose ng production ay sa Day 36 (may sariling `name:`, iwas-banggaan)
- **Matututunan:** image, layers, `.dockerignore`, bakit hindi root — *Reference: item 21*

### Day 35 — Managed database na may backup (Neon)
- [x] Neon project (Singapore, Postgres 17); `DATABASE_URL` sa `backend/.env.production` (`sslmode=verify-full`); migrations doon
- [x] **Backup at restore:** subukan talagang mag-restore — ginawa: binura ang row → point-in-time restore → bumalik
- **Matututunan:** managed DB, "ang backup na hindi pa nasusubukang i-restore ay hindi backup"

### Day 36 — Backend sa internet: named Cloudflare Tunnel
- [x] `cloudflared` → `https://api.nelson1869.com` → ang container sa PC mo (walang bukas na port sa router) — named tunnel `auth-learning`, `devops/docker-compose.prod.yml`
- [x] Production env sa `config/env.ts`: `NODE_ENV=production`, `CLIENT_URL=https://nelson1869.com` → `Secure` cookie 🔐 · **Always Use HTTPS** (http → 301)
- [x] 📝 `backend/http/prod/01-production.http` (health, CORS, http→https — walang test users sa prod)
- **Matututunan:** HTTPS, tunnel, production config — *Reference: item 22 (tunnel)*

### Day 36b — Frontend sa Cloudflare Pages
- [x] `VITE_API_URL` sa halip na naka-hardcode na `localhost:3000` sa `frontend/src/api/auth.ts` (tumatanggi ang production build kung wala)
- [x] Cloudflare Pages (`auth-learning`, root `frontend`): kusang build + deploy sa bawat merge sa `main`; custom domain **`https://nelson1869.com`**
- [x] SPA fallback para sa React Router (`/profile` kapag ni-refresh → 200, hindi 404 — default ng Pages)
- [x] **CDN + browser cache:** tingnan sa DevTools ang `cf-cache-status: HIT` at `Cache-Control` ng JS/CSS
      (may hash ang pangalan → puwedeng i-cache nang matagal) vs ang `index.html` (hindi, para makita ang bagong deploy)
- [x] 🔐 **`Cache-Control: no-store`** sa mga sagot na may personal na data (`/api/auth/*`) — may test; live: `cf-cache-status: DYNAMIC`
- **Matututunan:** static hosting, build-time env variables, bakit kailangan ng fallback ang SPA;
  **CDN** (kopya malapit sa user) at **HTTP caching** — ano ang puwede at HINDI puwedeng i-cache

### Day 37 — CD ng backend: manual muna, tapos automate
- [x] **Manual muna:** `devops/deploy.sh` — pull ng image ng huling berdeng commit → migrate (sa loob ng image) → restart → health check
- [x] GitHub Actions (GitHub-hosted, job `image`) → Docker image → **GHCR**, naka-tag sa commit SHA; ang PC ang **kumukuha** (pull)
- [ ] **Automate ang pull** (timer sa PC na nagpapatakbo ng `deploy.sh`) — pagkatapos ng Phase 9, kapag laging bukas na ang app
- [x] 🔐 **Walang self-hosted runner** — public ang repo (D-016, D-017, D-020)
- [x] Deploy lang ang eksaktong commit na pumasa sa CI
- [x] 📊 `docs/diagrams/09-cd-pipeline.md` — merge → CI → image → pull → restart; i-update ang `00-architecture.md`
- **Matututunan:** CD, push vs pull deploy, bakit **manual muna** (hindi mo magagawang
  awtomatiko ang hindi mo pa nagagawa nang mano-mano) · *Reference: item 22*

### Day 38 — MVP launch 🎉
- [x] 🔐 **BAGO ang lahat: i-reset ang password ng Neon** (`auth_learning_owner`) — ginawa sa Day 36b; patay na ang lumang password (500 hanggang ni-restart, tapos 200)
- [x] Register → login → logout mula sa **phone** sa totoong internet — sa phone ni Nelson (2026-09-26, 10:02 PM, user #1); kaibigan: kapag may pagkakataon
- [x] Isulat sa journal: ano ang pinakamahirap, ano ang pinakanatutunan
- **Matututunan:** ang saya ng "gumagana para sa totoong tao"

**✅ Checkpoint (`checkpoint-mvp`):** Tapos na ang MVP (tingnan ang [project brief](01-project-brief.md)). — **TAPOS ✅ (2026-09-26)** *(may tag na; idinagdag ang marka noong Day 62 review)*
> ✅ **Tapos: 2026-09-26.** Live: `https://nelson1869.com` + `https://api.nelson1869.com`.
> **Buhay na plano:** inagahan ang rate limiting (Day 43) bago ang launch; ang automate ng
> pull sa Day 37 ay pagkatapos ng Phase 9. **Susunod:** Phase 9 habang **bukas ang production**
> (D-021: pinili ni Nelson — mas maraming natututunan; may kill switch).

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

**Tantya:** Phase 9–19 ≈ **64 Days** — mga 12–13 linggo pagkatapos ng MVP.
> *Buhay na plano (2026-09-26):* idinagdag ang CDN at HTTP caching (Day 36b), load
> balancing (Day 91b) at Redis cache (Day 92b) — mga tanong ni Nelson.

---

## Phase 9 — Pangunahing hardening · 🔐 *Security* + ⚙️ *Backend* · Day 39–44

> 📐 **Pagkakasunod (D-021):** 39 helmet → 42 logging → 41 error handler → 44 CSRF · tapos na ang 40 (Phase 7) at 43 (bago ang launch)

### Day 39 — Secure headers
- [x] `helmet` sa API + **CSP at security headers sa frontend** (`public/_headers`) — ano ang bawat header at anong atake ang pinipigilan
- **Matututunan:** clickjacking, XSS, MIME sniffing

### Day 40 — Fail-fast na config
- [x] I-validate ang `.env` gamit ang Zod pagka-start — ayaw magsimula kung may kulang *(nagawa na sa Phase 7: `config/env.ts` — ipinakita ng TypeScript na kailangan)*
- [x] 🏗️ Bagong folder: `src/config/` *(Phase 7)*
- [x] Balikan: may bagong env ba mula sa Phase 8 (hal. production values) na dapat idagdag sa schema? *(oo: `TRUST_CLOUDFLARE`, idinagdag sa Day 43 · sinuri Day 42)*
- **Matututunan:** "mas mabuting mag-crash agad kaysa tumakbo nang mali"

### Day 41 — Sentral na error handling
- [x] Isang error handler para sa lahat; **generic na mensahe sa 5xx**, detalye sa logs lang *(+ `requestId` sa sagot ng 5xx, JSON 404, at `connectionTimeoutMillis` — dati nakabitin ang request kapag patay ang DB)*
- [x] 📝 `backend/http/11-errors.http`
- [x] 📊 `docs/diagrams/11-middleware-pipeline.md` — pagkakasunod ng middleware (requestLogger → helmet → cors → parsers → routes → 404 → error handler)
- **Matututunan:** bakit mapanganib ipakita ang internal errors · *Reference: `fix(errors)`*

### Day 42 — Structured logging
- [x] Pino + request ID sa bawat request; itago (redact) ang passwords at cookies sa logs *(+ totoong IP ng client sa likod ng tunnel; hindi tinatanggap ang X-Request-Id ng client)*
- [x] 📝 `backend/http/10-logging.http`
- **Matututunan:** paano mag-debug sa production · *Reference: `structured logging with Pino`*

### Day 43 — Rate limiting
- [x] `express-rate-limit` sa login/register lang (hindi sa lahat ng route!) — **inagahan bago ang MVP launch**; bawat totoong IP sa likod ng tunnel (`CF-Connecting-IP`, sinukat nang live); may sariling test
- [x] 📝 `backend/http/08-rate-limit.http` — pindutin nang 11 beses → 429
- [x] 📊 I-update ang `11-middleware-pipeline.md` *(kasama na sa pagkagawa nito, Day 41)*
- **Matututunan:** brute force, bakit iba ang limit ng bawat route · *Reference: `scope authLimiter`*

### Day 44 — CSRF protection
- [x] ~~Double-submit cookie~~ → **Origin check** (D-022): sinubukan muna ang totoong atake mula sa pekeng site; ang butas lang ay ibang subdomain ng `nelson1869.com`. Walang binago sa frontend at sa lumang `.http` files
- [x] 📝 `backend/http/12-csrf.http`
- [x] 📊 Bagong `12-csrf.md` (ang atake at ang mga depensa) · in-update ang `11-middleware-pipeline.md` at `07-frontend-backend.md`
- **Matututunan:** bakit may CSRF kapag cookie ang gamit sa auth · *Reference: `CSRF protection`*

**✅ Checkpoint (`checkpoint-phase-9`):** *Anong atake ang pinipigilan ng bawat isa sa 6 na ito?* — **TAPOS ang code ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-9/day-44.md`

---

## Phase 10 — Roles at admin · ⚙️ *Backend* + 🎨 *Frontend* + 🗄️ *Database* · Day 45–50

### Day 45 — Roles sa database
- [x] `role` column (`user` / `admin`) gamit ang migration; ~~seed script para sa unang admin~~ → **`set-role.ts`**: ginagawang admin ang account na naka-register na (D-023 — walang password sa code)
- [x] 📊 I-update ang `02-er-diagram.md` (`role` column)
- **Matututunan:** enum, seed data · *Reference: `user_role enum`, `seed script`*

### Day 46 — Authorization middleware
- [x] `requireRole('admin')` — 401 vs **403** (sino ka vs anong pinapayagan sa iyo) *(role mula sa database bawat request, hindi sa JWT — agad tumatalab ang pagbabago)*
- [x] 📝 `backend/http/13-admin-rbac.http` — user (403), admin (200), walang login (401)
- [x] 📊 `docs/diagrams/13-rbac.md` — 401 vs 403 na desisyon
- [x] 🏗️ `routes/admin` + `requireRole` middleware — i-update ang `00-architecture.md`
- **Matututunan:** authentication vs authorization · *Reference: `requireRole`*

### Day 47 — Listahan ng users (admin) + pagination
- [x] `GET /api/admin/users?page=&limit=` na may max limit *(+ `total`/`totalPages`; test sa `REPEATABLE READ` na transaction para hindi flaky)*
- [x] 📝 `backend/http/14-pagination.http` — page, limit, at sobrang laking limit (400)
- **Matututunan:** bakit laging may limit ang listahan · *Reference: `pagination`*

### Day 48 — Audit log
- [x] `audit_logs` table: sino, ano, kailan, saan (IP) — para sa login, logout, admin actions *(+ login_failed, access_denied; totoong IP; `GET /api/admin/audit-logs`)*
- [x] 📝 `backend/http/15-audit-logs.http`
- [x] 📊 I-update ang `02-er-diagram.md` (`audit_logs` table)
- **Matututunan:** forensic trail · *Reference: `audit logging`*

### Day 49 — Admin page (frontend)
- [x] Listahan ng users at audit logs; itago ang admin menu sa hindi admin *(`/admin` page na may Prev/Next; `/me` + role; ang hindi admin na nag-type ng `/admin` → 403 mula sa backend)*
- **Matututunan:** bakit **hindi sapat** na itago lang sa frontend (dapat din sa backend) 🔐

### Day 50 — Review day
- [x] Balikan ang Phase 9–10; sagutin ang "Mga tanong ko pa" sa journal *(lahat ng journal may Q&A; backlog sa `journal/phase-10/day-50.md`)*
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(14 `.http`, bagong server bawat isa · 6 diagram ang inayos, PR #74)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(+ tree na "Ngayon — Phase 10" at review finding)*

**✅ Checkpoint (`checkpoint-phase-10`):** *Ano ang pagkakaiba ng 401 at 403?* — **TAPOS ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-10/day-50.md`

---

## Phase 11 — Mas ligtas na sessions · ⚙️ *Backend* + 🔐 *Security* · Day 51–57

### Day 51 — Refresh tokens
- [x] Maikling access token (15 min) + mahabang refresh token na naka-hash sa DB *(+ `POST /api/auth/refresh`; frontend: 401 → isang refresh → ulit; `16-refresh-tokens.http`)*
- **Matututunan:** bakit dalawang token · *Reference: `refresh-token session foundation`*

### Day 52 — Rotation at reuse detection
- [x] Bagong refresh token bawat gamit; ang pag-replay ng luma = **nakaw** → i-revoke ang buong family *(+ reuse interval 10s para sa sabay na refresh; claim + bagong token sa iisang transaction)*
- [x] 📝 `backend/http/16-refresh-tokens.http` — normal na refresh, at pag-replay ng lumang token
- [x] 📊 `docs/diagrams/14-refresh-rotation.md` — `sequenceDiagram` ng rotation + reuse detection
- [x] 📊 I-update ang `02-er-diagram.md` (`refresh_tokens` table, `revoke_reason`)
- **Matututunan:** token rotation · *Reference: `refresh-token rotation with reuse detection`*

### Day 53 — Totoong logout
- [x] I-revoke ang refresh token sa DB, hindi lang i-clear ang cookie *(ang buong family, isang atomic na statement; ibang device hindi ginagalaw)*
- [x] 📝 I-update ang `07-logout.http`: subukang gamitin ang lumang refresh token pagkatapos mag-logout → 401 *(#6)*
- **Matututunan:** stateful vs stateless na logout

### Day 54 — Mga device ko (sessions page)
- [x] `GET /api/auth/sessions` at `DELETE /api/auth/sessions/:id` (naka-scope sa sariling user — IDOR 🔐) *(+ device at IP bawat session, migration 0006)*
- [x] Frontend: listahan ng naka-login na devices, may "Logout" bawat isa *(`/sessions`)*
- [x] 📝 `backend/http/17-sessions.http` — listahan, pag-revoke, at pag-revoke ng session ng IBANG user (404)
- [x] 📊 `docs/diagrams/15-sessions.md`
- **Matututunan:** IDOR · *Reference: `session management`*

### Day 55 — Change password
- [x] Kailangan ang kasalukuyang password (reauthentication); i-revoke ang LAHAT ng session *(isang transaction + bagong session para rito; 400 sa maling password; rate limit; audit)*
- [x] Frontend: change-password form *(`/change-password`)*
- [x] 📝 `backend/http/18-change-password.http`
- [x] 📊 `docs/diagrams/16-change-password.md`
- **Matututunan:** high-risk events · *Reference: `change-password with reauthentication`*

### Day 56 — RS256 at JWT claims
- [x] Asymmetric keys (private para mag-sign, public para mag-verify); `iss` at `aud` *(D-024: `JWT_PRIVATE_KEY` base64 sa env, public mula rito; fail-fast ≥ 2048-bit RSA)*
- [x] 📝 I-update ang `05-login.http`: i-decode ang JWT (jwt.io) at tingnan ang `alg`, `iss`, `aud`
- **Matututunan:** HS256 vs RS256 · *Reference: `HS256 to RS256`, `iss/aud claim validation`*

### Day 57 — Review day + session flow diagram
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(18 `.http`, bagong server bawat isa · 1 lumang pangako sa diagram 06)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(naayos ang maling edit ng Day 51 sa Phase 4 tree; + Phase 11 row)*
- [x] 📊 Session flow diagram: `docs/diagrams/17-session-lifecycle.md`

**✅ Checkpoint (`checkpoint-phase-11`):** *Bakit nire-revoke ang BUONG family kapag may reuse?* — **TAPOS ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-11/day-57.md`

---

## Phase 12 — Email · ⚙️ *Backend* + 🎨 *Frontend* + 🚀 *DevOps* · Day 58–62

### Day 58 — Totoong email provider
- [x] Resend o Brevo; API key sa `.env` lang *(Resend — D-025; domain na-verify: SPF/DKIM/DMARC PASS; `npm run email:test`; fail-fast sa production na walang key)*
- **Matututunan:** transactional email, deliverability (bakit napupunta sa spam)

### Day 59 — Password reset
- [x] Single-use na token (hashed, may expiry); laging "kung may account, may email na" *(+ token sa `#fragment`; sumasagot muna, email sa background; isang aktibong link lang; rate limit 5/15 min)*
- [x] 📝 `backend/http/19-password-reset.http`
- [x] 📊 `docs/diagrams/18-password-reset.md`
- [x] 📊 I-update ang `02-er-diagram.md` (`verification_tokens` table)
- **Matututunan:** single-use tokens · *Reference: `password reset and email verification`*

### Day 60 — Email verification
- [x] Link sa email pagka-register; markahan ang `email_verified_at` *(soft — D-026; + resend-verification; `emailVerified` sa `/me`)*
- [x] 📝 `backend/http/20-verify-email.http`
- [x] 📊 `docs/diagrams/19-verify-email.md`

### Day 61 — Frontend pages
- [x] Forgot password, reset password, at verify email pages *(+ paalala at "Ipadala ulit" sa Profile; button ang verify, hindi kusa; `useHashToken`: tinatanggal ang token sa address bar)*

### Day 62 — Review day
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(20 `.http` + prod, bagong server bawat isa, pati ang mga PASTE-DITO na hakbang · 40 diagram · 5 `.http` at 2 diagram ang naayos)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(oo; + Phase 12 row)*
- [x] 📚 Sa hiling ko: suriin ang LAHAT ng `.md`, `.html` at `.http` *(115 file: links, paths, endpoints, ER, AGENTS.md, how-we-work)*

**✅ Checkpoint (`checkpoint-phase-12`):** Nakatanggap ka ng totoong reset email sa sarili mong inbox. — **TAPOS ✅ (2026-09-27)**; nasa Inbox (hindi Spam) ang reset email, tingnan ang `journal/phase-12/day-62.md`

---

## Phase 13 — Account lockout · 🔐 *Security* · Day 63–65

### Day 63 — Per-account lockout
- [x] 5 maling password → 15 minutong lock (hiwalay sa IP rate limit) *(423 + Retry-After kahit tama ang password; migration 0009; audit `account_locked`; sinadyang iniwan ang race para sa Day 66–67 — sinukat: 20 sabay → 20 nasuri, hindi na-lock)*
- [x] 📝 `backend/http/21-lockout.http` — 5 maling password → 423
- [x] 📊 I-update ang `04-login-flow.md`: idagdag ang lockout branch *(+ `02-er-diagram.md`)*
- **Matututunan:** bakit hindi sapat ang IP limit (maraming IP ang attacker) · *Reference: `per-account lockout`*

### Day 64 — Lockout DoS at device cookies
- [x] Kayang i-lock ng kahit sino ang account mo — ayusin gamit ang device cookies (OWASP) *(migration 0010; change/reset password: bawiin ang tiwala ng lahat; reset = labasan ng naka-lock; sinubukan sa totoong browser)*
- [x] 📝 `backend/http/22-device-cookies.http`
- [x] 📊 I-update ang `04-login-flow.md` at `02-er-diagram.md` (`trusted_devices`) *(+ 16, 18, 00)*
- **Matututunan:** kapag ang depensa mismo ang nagiging atake · *Reference: `device cookies`*

### Day 65 — Review day
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(22 `.http` gamit ang review script na ikinukumpara ang bawat status — sinubukan muna kung nakakahuli ng mali · 40 diagram · 3 lumang teksto)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(oo; + Phase 13 row)*

**✅ Checkpoint (`checkpoint-phase-13`):** *Paano naaabuso ng attacker ang lockout, at paano ito naayos?* — **TAPOS ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-13/day-65.md`

---

## Phase 14 — Tama kahit sabay-sabay · 🗄️ *Database* + 🧪 *QA* · Day 66–70

> **Ang pinakamahalagang aral ng reference project:** gumagana ang lahat sa isang
> request, pero **nasisira kapag 20 request ang sabay** — at nagmukha itong "10/10" bago nahuli.

### Day 66 — Race conditions
- [x] Test na nagpapadala ng 20 sabay na request (`Promise.all`) — mahuli ang bug *(`concurrency.test.ts`: tahasang sinusukat ang bug sa lockout — account at device: 20/20 nasuri, hindi na-lock · register at verify-email: ligtas na · 📊 bagong `20-race-conditions.md`)*
- **Matututunan:** TOCTOU ("check then act") · *Reference: `race-safe`*

### Day 67 — Atomic SQL
- [x] `UPDATE ... WHERE ... RETURNING` sa halip na "hanapin muna, tapos baguhin" *(reserve-then-verify sa `lib/loginLockout.ts` — 5 × 401, 15 × 423, isang audit; binaligtad ang mga Day 66 test pagkatapos nilang bumagsak gaya ng inaasahan)*
- **Matututunan:** hayaang ang database ang magpasya kung sino ang mananalo

### Day 68 — Transactions
- [x] Change/reset password: lahat o wala; side effects (email, cookies) PAGKATAPOS ng commit *(tapos na mula Day 55/59; + rollback tests para sa mga device (Day 64) · 🐛 nahuli: LOGIN ay nagse-set ng cookie BAGO i-save ang refresh token → 500 pero naka-login · inayos: transaction, saka cookies)*
- [x] 📊 I-update ang `03-register-flow.md`, `16-change-password.md`, `18-password-reset.md`: markahan ang transaction boundary (`subgraph`) *(+ `04-login-flow.md`; ang register ay walang email noon sa diagram — naidagdag)*
- [x] 📝 Hindi kayang magpadala ng sabay na request ang `.http` — dito, ang **tests** ang patunay *(note sa 05, 18, 19 → `transactions.test.ts`)*
- **Matututunan:** atomicity · *Reference: `atomic with transactions`*

### Day 69 — Unique constraint bilang huling bantay
- [x] Sabay na register ng parehong email → 409, hindi 500 *(ligtas na mula Day 13 — INSERT agad + 23505 → 409; patunay: Day 66 test · 🐛 nahuli: "isang aktibong link" at "isang aktibong token bawat family" ay code lang ang bantay → 20 sabay = 18 aktibong link · ayos: partial UNIQUE indexes (migration 0011) + upsert)*
- **Matututunan:** bakit ang DB constraint ang tunay na garantiya

### Day 70 — Review day
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(22/22 · PASTE-DITO ng 19/20 · 43 diagram · ER kasama ang mga index · 4 na lumang teksto)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(oo; + Phase 14 row)*

**✅ Checkpoint (`checkpoint-phase-14`):** *Bakit hindi sapat ang "hanapin muna ang user, tapos i-update"?* — **TAPOS ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-14/day-70.md`

---

## Phase 15 — Huwag ibunyag kung sino ang may account · 🔐 *Security* · Day 71–73

### Day 71 — Pareho ang sagot
- [x] Login, forgot-password: pareho ang status at mensahe kahit may account o wala *(login: bilang para sa walang account (`unknown_login_attempts`, hash lang) → pareho ang 401 ×5 → 423 + Retry-After · forgot: pareho na mula Day 59 · natitira: register 409)*
- [x] 📝 `backend/http/23-user-enumeration.http` — ikumpara ang sagot para sa may account at wala
- **Matututunan:** user enumeration · *Reference: `revealing which emails have accounts`*

### Day 72 — Pareho ang oras
- [x] Dummy password hash para sa walang-account na email; sukatin ang timing *(may dummy na mula Day 15 · `npm run timing:login`: ±1ms sa ~100ms, 3 takbo · sadyang walang dummy → 56ms, kaya nakikita ng pagsukat · parehong argon2 settings · forgot: 1.2 vs 1.3ms)*
- [x] 📊 I-update ang `04-login-flow.md`: ang dummy-hash branch *(+ timing table ng Day 72)*
- **Matututunan:** timing attacks

### Day 73 — Review day
- [x] 🔍 Suriin: tugma pa ba ang LAHAT ng `.http` at diagram sa code? (i-rebuild: `node docs/diagrams/build.mjs`) *(23/23 · prod 8/8 · 43 diagram · ER/contract/links/bilang ✅ · 4 na lumang pangungusap sa diagram 04)*
- [x] 🏗️ Tugma pa ba ang folder structure sa `docs/06-architecture.md`? *(oo; + Phase 15 row)*

**🏁 Tapos ang Phase 15 (tag `checkpoint-phase-15`, 2026-09-27)** — walang checkpoint question ang phase na ito sa roadmap; ang buod ay nasa `journal/phase-15/day-73.md`

---

## Phase 16 — Malinis na architecture · 🏗️ *Architect* + ⚙️ *Backend* · Day 74–79

### Day 74–76 — Service layer
- [x] Hatiin: controller (HTTP lang) → service (business logic, walang Express) *(Day 74 pundasyon + register + login · Day 75 me, refresh, logout, sessions, change-password · Day 76 forgot/reset/verify/resend, admin, users count · `routes/auth.ts` 470 → 63 linya)*
- [x] Isang flow bawat araw; **pumapasa pa rin ang lahat ng tests** pagkatapos ng bawat hakbang *(10 hakbang, 175/175 bawat isa; ang tanging binago sa tests: isang import path)*
- [x] 📊 I-update ang LAHAT ng diagram: hiwalay na banggitin ang controller (HTTP) at service (logic) *(sinuri ang header ng bawat diagram · 03, 16 may kahon ng controller/service · 00 bagong layers)*
- [x] 🏗️ Ang huling hugis: `controllers/` + `services/` — i-update ang `docs/06-architecture.md` at LAHAT ng diagram *(+ sinuri gamit ang grep ang mga tuntunin ng bawat layer)*
- **Matututunan:** separation of concerns, refactoring nang ligtas · *Reference: `service layer`*

### Day 77 — Mass-assignment guard
- [x] Parsed na input lang ang ipinapasa sa service; test na may isiningit na `userId` 🔐 *(`mass-assignment.test.ts` + `24-mass-assignment.http` · 4 na depensa, sinira nang isa-isa at magkasama: kailangang sirain ang DALAWA para magtagumpay ang atake)*
- **Matututunan:** mass assignment · *Reference: `mass-assignment guard`*

### Day 78 — API documentation
- [x] OpenAPI + Swagger UI mula sa parehong Zod schemas *(`z.toJSONSchema` ng Zod 4 · `/api/docs` · Redocly: valid · 3 test na bantay laban sa lumang docs — D-027)*
- [x] **Gumawa ng types ng frontend mula sa OpenAPI spec** — para hindi na kopya ang `User` type sa `frontend/src/api/auth.ts` (D-019) *(sariling generator: kailangan ng openapi-typescript ang TS 5 · nahuli: ang login/register ay hindi nagbabalik ng role/emailVerified)*
- [x] 📝 `backend/http/25-openapi.http` — kunin ang spec *(+ 📊 `docs/diagrams/21-openapi.md`)*
- **Matututunan:** docs na hindi naiiba sa code · *Reference: `OpenAPI 3.1 spec`*

### Day 79 — Walang naiwang unused code
- [x] knip sa CI (unused files, exports, dependencies) — *naka-on na ang `noUnusedLocals` mula Phase 7* *(bahagi ng `npm run lint`, kaya tumatakbo sa CI nang hindi binabago ang workflow · 12 unused na export/type ang inalis · napatunayang exit 1 sa unused export, file at dependency)*
- **Matututunan:** bakit nakakalito ang patay na code · *Reference: `remove unused code`*

**✅ Checkpoint (`checkpoint-phase-16`):** *Ano ang dapat at HINDI dapat nasa loob ng isang controller?* — **TAPOS ✅ (2026-09-27)**; ang sagot ay nasa `journal/phase-16/day-79.md`

---

## Phase 17 — Observability · 🚀 *DevOps* · Day 80–86

### Day 80 — Health checks
- [x] `/health/live` (buhay ba ang process) vs `/health/ready` (handa ba ang DB) *(HEALTHCHECK = live (walang DB — para makatulog ang Neon) · deploy.sh = ready mula sa internet · 3s na limit · nahuli: walang log kapag timeout)*
- [x] 📝 `backend/http/26-health-checks.http` — `/live` at `/ready`
- **Matututunan:** bakit dalawa · *Reference: `two-tier health checks`*

### Day 81 — Metrics
- [x] OpenTelemetry + `/metrics` (ilang request, gaano kabilis, ilang error) *(metrics SDK + sariling middleware, D-028 · hiwalay na port, hindi publiko · route template, hindi URL · + bilang ng audit actions · nahuli: ang pagpalya ng metrics port ay nagpapabagsak sa app → hindi na)*
- [x] 📝 `backend/http/27-metrics.http`
- [x] 📊 `docs/diagrams/22-observability.md` — app → Prometheus → Grafana/Alertmanager *(+ diagram 11: recordMetrics)*
- **Matututunan:** metrics vs logs · *Reference: `metrics + distributed tracing`*

### Day 82–83 — Dashboards
- [x] Prometheus + Grafana: isang dashboard ng app *(8 panel, provisioned mula sa file — walang click sa UI · 127.0.0.1 lang · may memory limit · nahuli: "No data" sa halip na 0% · ang unang audit event pagkatapos ng restart ay hindi nakikita ng `increase()` → sinisimulan sa 0)*
- [x] 📝 `backend/http/28-prometheus-queries.http` — ang mga query sa likod ng bawat panel
- [x] 📊 `docs/diagrams/22-observability.md` — Prometheus at Grafana (buong linya na)
- **Matututunan:** "nakikita mo ba ang problema bago pa magreklamo ang user?"

### Day 84 — Alerts
- [x] Alertmanager: email kapag down ang app — **subukan talaga** (patayin ang app) *(pinatay ang backend sa production: +117s firing, +149s email, RESOLVED ~5m pagkatapos · 5 rule, may promtool tests · Resend SMTP, walang secret sa Git · inulit sa Gmail ko nang may pahintulot: FIRING 16:10 at RESOLVED 16:15 UTC, tinanggap ng Resend · ☐ kumpirmahin kong nasa inbox)*
- [x] 📝 `backend/http/29-alerts.http` — rules, alerts, silences
- [x] 📊 diagram 22 — Alertmanager + ang buhay ng isang alert
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
- [ ] 📝 `backend/http/NN-retention.http` — gabay kung paano obserbahan ang cleanup job
- [ ] 📊 `docs/diagrams/NN-retention.md`
- **Matututunan:** bakit hindi puwedeng basta burahin ang revoked refresh tokens · *Reference: `data-retention`*

### Day 91 — Backup drill
- [ ] Sadyang "sirain" ang staging DB at i-restore mula sa backup; orasan ito
- **Matututunan:** RPO/RTO — gaano karaming data ang puwedeng mawala, at gaano katagal bago bumalik

### Day 91b — Load balancing (idinagdag — tanong ni Nelson)
- [ ] 2 backend container + **load balancer** (Caddy) sa harap nila; round-robin
- [ ] Patayin ang isang container habang may request → tuloy pa rin ba ang serbisyo? (health checks)
- [ ] **Makita ang problema:** ang in-memory rate limiter ay may sariling bilang sa bawat container
      → 10 na limit ay nagiging ~20 → dahilan ng Day 92
- [ ] 📊 I-update ang `00-architecture.md`
- **Matututunan:** horizontal scaling, stateless na server (bakit JWT sa cookie ay madaling i-scale),
  health checks. ⚠️ Sa iisang PC — para sa konsepto, hindi para sa tunay na pakinabang

### Day 92 — Distributed rate limiting
- [ ] Redis bilang store ng rate limiter (para gumana kahit maraming server)
- [ ] 📝 I-update ang `08-rate-limit.http`
- **Matututunan:** bakit nabubutas ang in-memory limit · *Reference: `Redis-backed distributed rate limiting`*

### Day 92b — Server cache gamit ang Redis (idinagdag — tanong ni Nelson)
- [ ] I-cache ang isang bagay na madalas basahin pero bihirang magbago (hal. `/api/users/count`), may TTL
- [ ] **Cache invalidation:** burahin ang cache kapag may bagong register — ano ang mangyayari kung hindi?
- [ ] 🔐 **Huwag i-cache ang personal na data** (`/me`) sa shared cache — at kung kailangan, susi na may user id
- [ ] Sukatin: gaano kabilis kapag HIT vs MISS?
- **Matututunan:** cache-aside pattern, TTL, "dalawang mahirap sa computer science: cache invalidation at pagpapangalan"

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
- [ ] 📝 `backend/http/NN-passkeys.http` — options lang (kailangan ng browser para sa verify)
- [ ] 📊 `docs/diagrams/NN-passkey-register.md`

### Day 97–98 — Login gamit ang passkey
- [ ] Authentication ceremony; decoy options para hindi ibunyag ang account 🔐
- [ ] 📊 `docs/diagrams/NN-passkey-login.md`, kasama ang decoy options branch

### Day 99 — E2E test
- [ ] Playwright + virtual authenticator — totoong browser, walang totoong hardware
- **Matututunan:** kailan kailangan ng E2E sa halip na API test

### Day 100 — 🎓 Final review
- [ ] Isulat sa journal: ang buong paglalakbay, ang pinakamahirap, ang pinakanatutunan
- [ ] I-update ang "Sa sarili kong salita" sa 4 na role README — ikumpara sa Day 01!
- [ ] Ihambing ang project mo sa reference project — ano ang pareho, ano ang mas maganda?

**✅ Checkpoint (`checkpoint-senior`):** Kaya mong ipaliwanag ang bawat bahagi ng
system — **nang hindi tumitingin sa code.**

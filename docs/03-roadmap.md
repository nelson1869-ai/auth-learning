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
- [ ] `npm init`, basahin ang `package.json`
- [ ] Ano ang "dependency"; i-install ang Express; bakit hindi sine-save ang `node_modules/`
- **Matututunan:** Node vs browser JavaScript, npm, package.json

### Day 04 — Hello World server
- [ ] `backend/src/index.js`: Express server na nakikinig sa port 3000
- [ ] Unang route: `GET /api/health` → `{ "status": "ok" }`
- [ ] Buksan sa browser at subukan gamit ang `curl`
- **Matututunan:** server, port, route, request/response, JSON

### Day 05 — `.http` files at status codes
- [ ] I-install ang REST Client; `backend/http/01-health.http`
- [ ] Mga status code: 200, 201, 400, 401, 404, 500 — ano ang ibig sabihin ng bawat isa
- [ ] `node --watch` para kusang mag-restart ang server
- **Matututunan:** HTTP methods at status codes, manual na pagsubok

### Day 06 — Pagtanggap ng data
- [ ] `express.json()` at isang `POST` route na nagbabalik ng natanggap na body
- [ ] Hatiin ang routes sa `backend/src/routes/`
- [ ] Unang diagram mo: request → route → response (`docs/diagrams/`)
- **Matututunan:** request body, middleware (unang silip), pag-organisa ng files

**✅ Checkpoint (`checkpoint-phase-2`):** `GET /api/health` gumagana, may `.http`.
*Ano ang nangyayari mula sa pag-send ng request hanggang sa pagdating ng response?*

---

## Phase 3 — Unang database · 🗄️ *Database* + 🚀 *DevOps* · Day 07–11

### Day 07 — Docker at Postgres
- [ ] Image vs container; `devops/docker-compose.yml` na may `postgres:17-alpine`
- [ ] `docker compose up -d`, `docker ps`, `docker compose down`
- **Matututunan:** containers, ports, volumes (bakit hindi nawawala ang data)

### Day 08 — Unang SQL
- [ ] Kumonekta gamit ang `psql`
- [ ] `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE` — i-save sa `database/sql-practice/`
- **Matututunan:** table, row, column, ang apat na pangunahing SQL command

### Day 09 — Constraints (mga patakaran ng data)
- [ ] `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT`
- [ ] Subukang mag-insert ng dobleng email — ano ang nangyari, at bakit ito mabuti?
- **Matututunan:** data integrity — ang database mismo ang huling bantay

### Day 10 — Backend ↔ database
- [ ] `.env` at `.env.example` (ano ang secret, bakit hindi sa Git)
- [ ] Drizzle: koneksyon mula sa backend, `users` schema
- **Matututunan:** environment variables, ORM

### Day 11 — Migrations
- [ ] `drizzle-kit generate` at `migrate` — ang unang migration
- [ ] Tingnan ang table sa Drizzle Studio
- [ ] ER diagram ng `users` (`docs/diagrams/`)
- **Matututunan:** bakit dumadaan sa migration ang pagbabago ng table

**✅ Checkpoint (`checkpoint-phase-3`):** May `users` table na ginawa ng migration.
*Bakit hindi natin binabago nang manual ang table? Ano ang silbi ng `UNIQUE`?*

---

## Phase 4 — Register at login · ⚙️ *Backend* + 🔐 *Security* · Day 12–19

### Day 12 — Password hashing
- [ ] Bakit HINDI kailanman plain text; hash vs encryption
- [ ] Maliit na script: `argon2.hash()` at `argon2.verify()`
- **Matututunan:** hashing, salt — *Reference: item 4*

### Day 13 — Register endpoint
- [ ] `POST /api/auth/register` — hashed password, 201
- [ ] Dobleng email → 409; `backend/http/02-register.http`
- **Matututunan:** paglikha ng resource, error cases

### Day 14 — Validation
- [ ] Zod schema para sa register (email format, haba ng password) → 400
- **Matututunan:** "huwag magtiwala sa input ng user" — 🔐

### Day 15 — Login endpoint
- [ ] `POST /api/auth/login` — i-verify ang password
- [ ] Iisang mensahe para sa maling email AT maling password — bakit? 🔐
- **Matututunan:** authentication, user enumeration (unang silip) — *Reference: item 28*

### Day 16 — JWT at cookies
- [ ] Ano ang JWT (at ano ang HINDI dapat nasa loob nito)
- [ ] I-set ito sa `httpOnly` cookie — bakit hindi `localStorage`? 🔐
- **Matututunan:** stateless na session, cookie flags — *Reference: item 5*

### Day 17 — Protektadong route
- [ ] Middleware na sumusuri sa JWT; `GET /api/auth/me`
- **Matututunan:** middleware, authentication vs authorization

### Day 18 — Logout at flow diagram
- [ ] `POST /api/auth/logout` — i-clear ang cookie
- [ ] Flowchart ng login (`TD`) sa `docs/diagrams/`
- **Matututunan:** buong auth flow mula simula hanggang dulo

### Day 19 — Review day
- [ ] Balikan ang lahat ng code: may hindi ba malinaw? Linisin ang pangalan at files
- [ ] Sagutin ang lahat ng "Mga tanong ko pa" sa journal hanggang ngayon
- **Matututunan:** refactoring — pagpapaganda nang hindi binabago ang behavior

**✅ Checkpoint (`checkpoint-phase-4`):** Register → login → me → logout gumagana sa `.http`.
*Bakit hashed ang password? Bakit httpOnly ang cookie? Bakit iisa ang error message sa login?*

---

## Phase 5 — Login page · 🎨 *Frontend* · Day 20–24

### Day 20 — React + Vite
- [ ] `npm create vite@latest frontend` (React); patakbuhin
- [ ] Ano ang component at JSX
- **Matututunan:** frontend dev server, component

### Day 21 — State at forms
- [ ] `useState`; register form
- **Matututunan:** state, controlled inputs, events

### Day 22 — Pagtawag sa backend
- [ ] `fetch` sa `/api/auth/register`, ipakita ang tagumpay o error
- [ ] **CORS** — bakit hinaharangan ng browser, at paano ito ayusin nang ligtas 🔐
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
- **Matututunan:** integration test — *Reference: item 2*

### Day 27 — GitHub Actions
- [ ] `.github/workflows/ci.yml`: kusang pinapatakbo ang tests sa bawat push/PR
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
- **Matututunan:** CD — at kung bakit **manual muna, tapos automate** (hindi mo
  magagawang awtomatiko ang hindi mo pa nagagawa nang mano-mano) · *Reference: item 22*

### Day 38 — MVP launch 🎉
- [ ] Isang kaibigan: register → login → logout mula sa **sarili niyang phone**
- [ ] Isulat sa journal: ano ang pinakamahirap, ano ang pinakanatutunan
- **Matututunan:** ang saya ng "gumagana para sa totoong tao"

**✅ Checkpoint (`checkpoint-mvp`):** Tapos na ang MVP (tingnan ang [project brief](01-project-brief.md)).

---

## Phase 9+ — Security at production upgrades · *lahat*

Isa-isa, mga 2–3 Days bawat isa. Pagkatapos ng MVP, idedetalye natin ang bawat isa.

| Upgrade | Bakit | Reference |
|---|---|---|
| Rate limiting | Pigilan ang panghuhula ng password | item 7, 25 |
| CSRF protection | Pigilan ang pekeng request mula sa ibang site | item 6 |
| Refresh tokens + rotation | Maikling access token nang hindi laging nagla-login | item 3 |
| Account lockout | 5 maling password → pansamantalang lock | item 7, 27 |
| Password reset + email verification | Totoong email | item 13 |
| Race conditions at transactions | Tamang behavior kahit maraming sabay na request | item 25, 26 |
| Monitoring | Malaman agad kapag may sira | item 20, 24 |
| Data retention | Hindi lumalaki nang walang hanggan ang DB | item 31 |
| Passkeys | Login nang walang password | item 17 |

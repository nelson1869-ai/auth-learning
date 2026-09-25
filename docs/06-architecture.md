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
| **2** | `src/index.js`, `src/routes/` | Isang file muna; hinahati sa `routes/` kapag dumami na ang URLs |
| **3** | `src/db/` (koneksyon + schema), `drizzle/` (migrations, labas ng `src/`) | Iisang lugar para sa lahat ng may kinalaman sa database; ang migrations ang gumagawa ng tables, hindi ang kamay |
| **4** | `playground/` (labas ng `src/`) | Mga practice script (hal. `01-hash.js`) — hindi bahagi ng app, hindi ini-import ng `src/` |
| **4** | `src/middleware/`, `src/validations/` | Paulit-ulit na "naka-login ka ba?" at "tama ba ang input?" sa bawat route |
| **6** | Hatiin ang `index.js` → `app.js` + `index.js` | Kailangang i-import ng tests ang app **nang hindi binubuksan ang port** |
| **9** | `src/config/` | Iisang lugar para sa lahat ng `.env`, na sinusuri pagka-start |
| **10** | `routes/admin` | Hiwalay na grupo ng URL na may sariling patakaran (admin lang) |
| **16** | `src/controllers/` + `src/services/` | Masyadong mahaba na ang routes — hatiin ang HTTP sa business logic |

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

**Phase 4 — may database at auth** (tugma sa code, sinuri Day 19):
```
backend/
├── src/
│   ├── app.js            ← (Day 26) cors + express.json + cookieParser, kinakabit ang routers
│   ├── index.js          ← (Day 26) app.listen lang
│   ├── routes/           ← auth.js (register/login/me/logout), users.js (count),
│   │                        health.js, echo.js (pang-aral)
│   ├── middleware/       ← requireAuth.js (cookie → jwt.verify → req.userId)
│   ├── validations/      ← auth.js (registerSchema, loginSchema — Zod)
│   └── db/               ← index.js (pg Pool + Drizzle), schema.js (users)
├── drizzle/              ← migrations 0000 (users), 0001 (password_hash)
├── http/                 ← 01–07 .http walkthroughs
└── playground/           ← 01-hash.js (practice, hindi bahagi ng app)
```

**Phase 16 — ang huling hugis (katulad ng reference):**
```
backend/src/
├── index.js          ← pinapatakbo lang ang server
├── app.js            ← binubuo ang Express app (ini-import ng tests)
├── config/           ← env.js — mga setting, sinusuri pagka-start
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

## 4. Ang frontend (Phase 5)

```
frontend/src/
├── main.jsx          ← simula ng app
├── App.jsx           ← aling page ang ipapakita
├── pages/            ← Login, Register, Profile (isang screen bawat isa)
├── components/       ← maliliit na pirasong ginagamit sa maraming page (hal. Button)
└── api/              ← LAHAT ng pagtawag sa backend (fetch) — iisang lugar
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

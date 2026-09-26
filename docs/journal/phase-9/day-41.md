# Day 41 — 2026-09-26 · Phase 9 · Sentral na error handling

> Ginawa pagkatapos ng Day 42 (D-021): kailangan ng error handler ang logs para doon isulat ang detalye.

## Bago ang Day 41 (sinubukan muna, bago nagsulat ng code)
| Kaso | Dev | Production |
|---|---|---|
| `GET /` | 404 **HTML** "Cannot GET /" | pareho — ito ang nakita ng scanner (Palo Alto Networks) |
| Sirang JSON | 400 **HTML** + **stack trace** + **mga folder ng PC ko** | 400 HTML "Bad Request" |
| Patay ang DB | ⏳ **nakabitin — walang sagot, walang log** | ganoon din |

## Ano ang ginawa
- **`middleware/errorHandler.ts`**, **huli** sa `app.ts`:
  - `notFound` → `404 { "error": "Not found" }` (hindi ibinabalik ang URL);
  - `errorHandler` → 4xx ng library: maikling mensahe (`Invalid JSON`, `Payload Too Large`);
    5xx: `{ "error": "Internal server error", "requestId" }`. Ang **buong** error (SQL, stack) ay nasa **log** lang.
- **`db/index.ts`: `connectionTimeoutMillis: 5000`.** Ang default ng `pg` ay 0, ibig sabihin maghihintay
  **magpakailanman**. Ngayon: 500 pagkalipas ng ~5 segundo, at may log.
- **Roadmap:** ang mga file na hindi pa nagagawa ay `NN-` na (nagbanggaan na ang mga numero,
  hal. `10-admin-rbac.http` vs `10-logging.http`).
- **Tests: 30** (6 bago). Sinadyang sinira ang bawat bahagi → bumagsak ang test → ibinalik.
  Kasama ang pagbabalik ng `err.message` sa 5xx (ang pagkakamaling inayos ng reference sa `fix(errors)`).

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Dev | `GET /` · sirang JSON | ✅ `Not found` · `Invalid JSON` — walang stack trace |
| Dev | `docker stop` ng Postgres → `/api/users/count` | ✅ **500 sa 5.2s** (dati: nakabitin) · ang log: `DrizzleQueryError` + SQL + stack, parehong `requestId` |
| Dev | ibinalik ang DB | ✅ 200 agad |
| Production | `GET /` · sirang JSON · body na 200kb | ✅ 404 · 400 · 413 — lahat JSON |
| Production | register → login → `/me` (test account, binura pagkatapos) | ✅ 201 · 200 · 200 |

## Kumpara sa reference
- Pareho: generic na mensahe sa 5xx, buong error sa log, nasa dulo ng `app.ts`.
- **Iba — sa amin, walang stack sa sagot kahit sa dev.** Ang reference ay may `detail` + `stack` kapag
  development. Sa amin, iisa ang sagot sa lahat ng environment. Sa terminal (pino-pretty) makikita ang stack.
- **Iba — `requestId` sa sagot ng 5xx**, para maibigay ng user.
- **Iba — 4xx: nakapirming mensahe**, hindi ang `err.message` ng library.

### Mga kulang na nakita sa reference (backlog, para ayusin doon balang araw)
- `db/index.ts`: walang `connectionTimeoutMillis` → nakabitin ang request kapag hindi maabot ang DB.
- `db/index.ts`: walang `pool.on('error')` (nakita noong Day 10).
- `notFoundHandler`: ibinabalik ang `req.originalUrl` sa sagot (echo ng input ng client).
- `errorHandler`: walang `res.headersSent` check.

## Ang pinakanatutunan
- **Subukan muna ang "sira" bago mag-ayos.** Hindi ko inasahan ang nakabiting request. Lumabas lang
  ito dahil pinatay ko talaga ang database.
- **Ang error message ay puwedeng mag-leak:** ang Drizzle error ay may SQL at pangalan ng table.
  Kaya ang tuntunin: detalye sa log, generic sa user, at ang `requestId` ang nagdudugtong sa dalawa.
- **Mas mabuti ang mabilis na error kaysa sa walang sagot.** Ang nakabitin ay walang log, kaya hindi mo alam na may problema.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 44 — CSRF protection (kailangang i-update ang frontend at lahat ng `.http` na may POST).

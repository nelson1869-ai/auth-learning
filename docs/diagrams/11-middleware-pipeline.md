# 11 — Middleware pipeline (ang pagkakasunod sa `app.ts`)

> 📅 Day 41 · Phase 9 (Pangunahing hardening) · kasama ang Day 39 (helmet), Day 42 (logging), Day 43 (rate limit), Day 44 (CSRF)
> **Code:** `backend/src/app.ts` · `backend/src/middleware/errorHandler.ts` · `backend/src/db/index.ts` (timeout)
> **Subukan:** `backend/http/11-errors.http` · test: `backend/src/routes/errors.test.ts`

## Ang daan ng bawat request

Mahalaga ang **pagkakasunod**: dinadaanan ang bawat `app.use(...)` mula itaas pababa.

```mermaid
flowchart TD
    Req(["Request"]) --> Log["1 · requestLogger (Day 42)<br/>requestId → X-Request-Id<br/>(log kapag tapos na ang sagot)"]
    Log --> Helmet["2 · helmet() (Day 39)<br/>security headers"]
    Helmet --> Cors["3 · cors() (Day 22)<br/>sagot sa OPTIONS preflight"]
    Cors --> Csrf{"3b · requireSameOrigin (Day 44)<br/>POST/PUT/DELETE: Origin = frontend?"}
    Csrf -->|"ibang site · ibang subdomain · null"| R403["403 { error: 'Forbidden' }<br/>(hindi na binabasa ang body)"]
    Csrf -->|"frontend · o hindi browser<br/>(walang Origin) · o GET"| Json{"4 · express.json()<br/>tama ba ang JSON? ≤ 100kb?"}
    Json -->|"sira"| Err
    Json -->|"lampas 100kb"| Err
    Json -->|"ok"| Cookie["5 · cookieParser()<br/>req.cookies"]
    Cookie --> Routes{"6 · routers sa /api<br/>health · echo · users · auth"}
    Routes -->|"login / register"| Limit{"rateLimiter (Day 43)<br/>sobra na ang subok?"}
    Limit -->|"oo"| R429["429 Too many attempts"]
    Limit -->|"hindi"| Handler["route handler<br/>(Zod · argon2 · db)"]
    Routes -->|"ibang route"| Handler
    Handler -->|"ok"| OK["200 / 201 / 204 JSON"]
    Handler -->|"400 · 401 · 409<br/>(sinadyang sagot)"| R4xx["4xx JSON"]
    Handler -->|"throw / nabigong await<br/>hal. patay ang DB (5s timeout)"| Err
    Routes -->|"walang tumugma<br/>hal. GET /"| NotFound["7 · notFound (Day 41)<br/>404 { error: 'Not found' }"]
    Err["8 · errorHandler (Day 41)<br/>HULI sa lahat"] --> Kind{"anong status?"}
    Kind -->|"4xx mula sa library"| E4["400 { error: 'Invalid JSON' }<br/>413 { error: 'Payload Too Large' }"]
    Kind -->|"5xx o walang status"| E5["500 { error: 'Internal server error',<br/>requestId }"]
    E5 -.->|"BUONG detalye: mensahe, SQL, stack"| Logs[("logs<br/>parehong requestId")]
```

## Ang 500: ano ang nakikita ng user at ano ang nasa log

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as API
    participant D as Database
    participant L as Logs
    U->>A: GET /api/users/count
    A->>D: select count(*) from users
    Note over D: patay / hindi maabot
    D--xA: ⏱️ 5 segundo → "connection timeout"
    A->>L: ERROR Unhandled error · requestId fe640dcb · DrizzleQueryError · SQL · stack
    A-->>U: 500 { error: "Internal server error", requestId: "fe640dcb-..." }
    Note over U,L: ibibigay ng user ang requestId → hanapin sa logs → ang eksaktong error
```

## Mga dapat pansinin

- **4 na parameter** `(err, req, res, next)` ang error handler — iyon ang palatandaan ni Express.
  Kaya ito ay nasa **dulo**: ang mga error mula sa itaas ay "lumalaktaw" diretso rito.
- **Express 5**: kusang napupunta rito ang nabigong `await` sa route. Hindi na kailangan ng
  `try/catch` sa bawat route (ang `try/catch` sa register ay para lang gawing 409 ang duplicate email).
- **Hindi kailanman ibinabalik ang `err.message` sa 5xx.** Ang mensahe ni Drizzle ay may SQL at
  pangalan ng table. Ito ang inayos ng reference sa commit na `fix(errors)`.
- **Hindi ibinabalik ang URL sa 404.** Ang reference ay `Route not found: GET /...`, na nag-e-echo ng input ng client.
- **Bago ang Day 41, nakabitin nang walang hanggan** ang request kapag patay ang DB. Ang dahilan:
  `connectionTimeoutMillis` = 0 ang default ng `pg`. Ngayon: 5 segundo → 500 + log.

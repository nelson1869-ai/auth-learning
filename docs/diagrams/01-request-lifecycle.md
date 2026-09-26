# 01 — Request Lifecycle (ang buhay ng isang request)

> 📅 Day 04 · Phase 2 (Unang API) · in-update sa Day 05 (`time`), Day 06 (`express.json()`, `routes/`, POST na may body) Day 10 (database), Day 19 (auth routes), Day 39 (`helmet()`), Day 42 (logging) at Day 41 (error handler)
>
> **Code:** `backend/src/index.ts`, `backend/src/routes/health.ts`, `backend/src/routes/echo.ts`, `backend/src/routes/users.ts`, `backend/src/db/index.ts`
> **Subukan:** `backend/http/01-health.http`, `backend/http/02-echo.http`, `backend/http/03-users-count.http`

## Paano sinasagot ng server ang isang request

```mermaid
flowchart TD
    Start(["Client: browser, curl, o REST Client"]) -->|"HTTP request<br/>hal. POST /api/echo + JSON body"| Listen["app.listen(3000)<br/>backend/src/index.ts"]
    Listen --> Log["MIDDLEWARE: requestLogger<br/>bagong requestId → X-Request-Id header<br/>(ang log ay isinusulat kapag tapos na ang sagot)"]
    Log --> Helmet["MIDDLEWARE: helmet()<br/>security headers sa BAWAT sagot<br/>(tingnan ang diagram 10)"]
    Helmet --> Json{"MIDDLEWARE: express.json()<br/>Content-Type ba ay application/json?"}
    Json -->|"hindi (o GET na walang body)"| Skip["Hindi ginagalaw<br/>req.body = undefined"]
    Json -->|"oo"| Parse{"Tama ba ang JSON?"}
    Parse -->|"oo"| Body["req.body = { name: 'Nelson' }"]
    Parse -->|"sira, hal. { name:"| Bad["400 { error: 'Invalid JSON' }<br/>(errorHandler, Day 41 · dati: HTML + stack trace)<br/>hindi na umaabot sa route"]
    Skip --> Match
    Body --> Match{"May route ba na tugma sa<br/>'/api' + METHOD + PATH?"}
    Match -->|"GET /health<br/>routes/health.ts"| Health["res.json({ status, time })"]
    Match -->|"POST /echo<br/>routes/echo.ts"| Echo["res.json({ received: req.body })"]
    Match -->|"GET /users/count<br/>routes/users.ts"| Users["➡️ tingnan ang diagram sa ibaba<br/>(kumakausap sa database)"]
    Match -->|"/auth/register · login ·<br/>me · logout<br/>routes/auth.ts"| AuthR["➡️ tingnan ang diagrams<br/>03 register · 04 login ·<br/>05 middleware · 06 sequence"]
    Match -->|"wala (hal. GET /api/echo)"| NotFound["404 { error: 'Not found' }<br/>(notFound, Day 41 · dati: HTML 'Cannot GET ...')"]
    Health --> OK["200 OK · application/json"]
    Echo --> OK
    OK --> Done(["Client: natanggap ang sagot"])
    Bad --> Done
    NotFound --> Done
```

## Mga dapat pansinin

- **Ang middleware ay dinadaanan BAGO ang route.** Kaya nauuna ang
  `app.use(express.json())` sa pagkabit ng routers: kapag nahuli ito, wala
  pang `req.body` pagdating sa route.
- **Walang `Content-Type: application/json` → walang `req.body`.** Hindi
  hinuhulaan ng `express.json()` kung JSON ang ipinadala. Ang
  `{ received: undefined }` ay nagiging `{}` sa JSON.
- **Sirang JSON → 400 `{ "error": "Invalid JSON" }`.** Bago ang Day 41: HTML na may stack
  trace at mga file path ng PC (sa dev). Ngayon ay JSON na ang lahat ng error. Tingnan ang
  diagram 11 (middleware pipeline).
- **Ang route ay METHOD + PATH.** Kaya 404 ang `GET /api/echo`: `router.post`
  lang ang mayroon.
- **Kailangang SUMAGOT ang bawat route function.** Kapag walang `res.json()`
  o `res.send()`, hindi 404 ang mangyayari. **Nakabitin** ang request hanggang
  mag-timeout ang client. Nangyari ito noong Day 06.

## Kapag kailangan ang database: `GET /api/users/count`

> 📅 Day 10 · Phase 3 (Unang database) · **Code:** `backend/src/routes/users.ts`,
> `backend/src/db/index.ts` · **Subukan:** `backend/http/03-users-count.http`

```mermaid
flowchart TD
    Req(["GET /api/users/count"]) --> Route["routes/users.ts<br/>async (req, res) =>"]
    Route --> Await["await db.$count(users)<br/>Drizzle → SQL: select count(*) from users"]
    Await --> Pool["db/index.ts · pg Pool<br/>kumokonekta sa DATABASE_URL (.env)<br/>localhost:5435"]
    Pool --> Up{"Buhay ba ang Postgres?"}
    Up -->|"oo"| Rows["Postgres: { count: 2 }"]
    Rows --> OK["200 OK<br/>{ count: 2 }"]
    Up -->|"hindi (docker compose stop)<br/>5s timeout (Day 41)"| Fail["Error: Failed query ..."]
    Fail --> Catch["Express 5: kusang sinasalo<br/>ang error ng async route"]
    Catch --> E500["500 { error: 'Internal server error', requestId }<br/>errorHandler (Day 41) — ang SQL + stack<br/>ay nasa LOG lang"]
    Pool -.->|"naputol ang idle na koneksyon"| PoolErr["pool.on('error') → log lang<br/>BUHAY pa rin ang server<br/>(kung wala ito: crash ang buong server)"]
    OK --> Done(["Client"])
    E500 --> Done
```

- **`await`**: naghihintay ang route sa database bago sumagot. Habang naghihintay,
  puwedeng sumagot ang server sa ibang request.
- **Dalawang magkaibang error:** ang *query na nabigo* ay nagiging 500 (sinasalo
  ng Express 5). Ang *koneksyon na naputol habang idle* ay walang request na
  kasama, kaya `pool.on('error')` ang sumasalo. Kung wala iyon, namamatay ang
  buong server (nangyari ito sa Day 10).
- **Live ang sagot:** kapag nag-INSERT ka sa psql, magbabago ang bilang nang
  walang restart ng server.

## Logging at request ID (Day 42)

> 📅 Day 42 · Phase 9 (Pangunahing hardening) · **Code:** `backend/src/lib/logger.ts`,
> `backend/src/middleware/requestLogger.ts`, `backend/src/lib/clientIp.ts`
> **Subukan:** `backend/http/10-logging.http`

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as API (requestLogger)
    participant R as Route (hal. login)
    participant L as Logs (terminal · docker logs)
    U->>A: POST /api/auth/login (may password sa body)
    A->>A: requestId = randomUUID() · binabalewala ang X-Request-Id ng client
    A->>R: tuloy sa helmet → cors → ... → route
    R-->>A: 401 Invalid email or password
    A-->>U: 401 + X-Request-Id: 1532bd12-...
    A->>L: WARN request completed · requestId 1532bd12 · clientIp · POST /api/auth/login · 401 · 55ms
    Note over L: 🔐 walang password, cookie o token — redact + kaunting field lang
    U->>U: "hindi ako maka-login" → ibinigay ang X-Request-Id
    Note over L: hanapin ang 1532bd12 sa logs → ang eksaktong request
```

- **Isang linya ng JSON bawat request** (sa production): `level` 30 = info, 40 = warn (4xx),
  50 = error (5xx). Sa dev, pino-pretty ang nagpapaganda (may kulay).
- **`clientIp`** ay ang totoong IP (`CF-Connecting-IP` sa likod ng tunnel), hindi ang IP ng
  cloudflared container — pareho ng patakaran ng rate limiter (`lib/clientIp.ts`).
- **Hindi itinatala ang `/api/health`** — tinatawag ito ng Docker HEALTHCHECK nang paulit-ulit.
- **Pareho ang `requestId`** ng lahat ng log ng isang request (hal. `Rate limit hit` + ang 429),
  kaya madaling pagdugtungin.

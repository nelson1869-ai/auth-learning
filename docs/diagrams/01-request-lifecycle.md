# 01 — Request Lifecycle (ang buhay ng isang request)

> 📅 Day 04 · Phase 2 (Unang API) · in-update sa Day 05 (`time`), Day 06 (`express.json()`, `routes/`, POST na may body) Day 10 (database) at Day 19 (auth routes)
>
> **Code:** `backend/src/index.ts`, `backend/src/routes/health.ts`, `backend/src/routes/echo.ts`, `backend/src/routes/users.ts`, `backend/src/db/index.ts`
> **Subukan:** `backend/http/01-health.http`, `backend/http/02-echo.http`, `backend/http/03-users-count.http`

## Paano sinasagot ng server ang isang request

```mermaid
flowchart TD
    Start(["Client: browser, curl, o REST Client"]) -->|"HTTP request<br/>hal. POST /api/echo + JSON body"| Listen["app.listen(3000)<br/>backend/src/index.ts"]
    Listen --> Json{"MIDDLEWARE: express.json()<br/>Content-Type ba ay application/json?"}
    Json -->|"hindi (o GET na walang body)"| Skip["Hindi ginagalaw<br/>req.body = undefined"]
    Json -->|"oo"| Parse{"Tama ba ang JSON?"}
    Parse -->|"oo"| Body["req.body = { name: 'Nelson' }"]
    Parse -->|"sira, hal. { name:"| Bad["400 Bad Request<br/>HTML na may SyntaxError<br/>(hindi na umaabot sa route)"]
    Skip --> Match
    Body --> Match{"May route ba na tugma sa<br/>'/api' + METHOD + PATH?"}
    Match -->|"GET /health<br/>routes/health.ts"| Health["res.json({ status, time })"]
    Match -->|"POST /echo<br/>routes/echo.ts"| Echo["res.json({ received: req.body })"]
    Match -->|"GET /users/count<br/>routes/users.ts"| Users["➡️ tingnan ang diagram sa ibaba<br/>(kumakausap sa database)"]
    Match -->|"/auth/register · login ·<br/>me · logout<br/>routes/auth.ts"| AuthR["➡️ tingnan ang diagrams<br/>03 register · 04 login ·<br/>05 middleware · 06 sequence"]
    Match -->|"wala (hal. GET /api/echo)"| NotFound["404 Not Found<br/>HTML na 'Cannot GET ...'"]
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
- **Sirang JSON → 400, at may stack trace sa HTML.** Sa development lang
  lumalabas ang stack trace (tinatago kapag `NODE_ENV=production`). Aayusin
  natin sa Phase 9 (error handler, JSON na lahat ng error).
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
    Up -->|"hindi (docker compose stop)"| Fail["Error: Failed query ..."]
    Fail --> Catch["Express 5: kusang sinasalo<br/>ang error ng async route"]
    Catch --> E500["500 Internal Server Error<br/>HTML na may SQL + stack trace<br/>(🔐 aayusin sa Phase 9)"]
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

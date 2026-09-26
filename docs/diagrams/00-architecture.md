# 00 — Architecture (ang malaking larawan)

> Paano nag-uusap ang mga bahagi ng system. Ang bawat kahon ay isang role/folder.
> Tingnan sa Chrome: `node docs/diagrams/build.mjs`, tapos buksan ang `index.html`.
> Kusa rin itong nire-render sa GitHub at sa VS Code Markdown Preview.

## Ngayon: ano na ang totoong mayroon

> 📅 in-update sa Day 32b · Phase 7 (TypeScript na ang frontend at backend) · **Code:** `frontend/src/`, `backend/src/`, `devops/docker-compose.yml`
> **Subukan:** `backend/http/01`–`07`

```mermaid
flowchart LR
    Browser(["🌐 Chrome<br/>localhost:5173"]) -->|"HTML + JS"| FE
    subgraph FEG["frontend/ · Vite 8 + React 19 + TypeScript"]
        FE["App.tsx — React Router 8<br/>pages/ Login · Register · Profile<br/>api/auth.ts — fetch, credentials: 'include'"]
    end
    FE -->|"fetch · localhost:3000<br/>CORS preflight + Cookie: token"| MW
    Client(["REST Client / curl<br/>(may cookie jar)"]) -->|"HTTP · localhost:3000<br/>+ Cookie: token"| MW
    subgraph BE["backend/ · Express + TypeScript (node src/index.ts)"]
        MW["cors({ origin: env.CLIENT_URL, credentials })<br/>express.json() · cookieParser()"]
        Env["config/env.ts<br/>sinusuri ang env pagka-start (Zod)"]
        Routes["routes/<br/>auth.ts: register · login · me · logout<br/>users.ts: count · health.ts · echo.ts"]
        Val["validations/auth.ts<br/>Zod: registerSchema · loginSchema"]
        Auth["middleware/requireAuth.ts<br/>jwt.verify (JWT_SECRET)"]
        Hash["argon2<br/>hash · verify"]
        DB["db/index.ts<br/>Drizzle + pg Pool"]
        MW --> Routes
        Routes --> Val
        Routes -->|"/me"| Auth
        Routes --> Hash
        Routes --> DB
    end
    DB -->|"SQL · localhost:5435"| PG
    subgraph Docker["Docker · project: auth-learning"]
        PG[("postgres:17-alpine<br/>users (migrations 0000, 0001)")]
        Vol[/"volume: auth-learning_pgdata"/]
        PG --- Vol
    end
```

**Pansinin:** dalawang server — frontend sa **:5173** (Vite), backend sa **:3000**
(Express). Nag-uusap na sila (Day 22): pinapayagan ng `cors()` ang `CLIENT_URL` lang,
at ang cookie na `token` ay itinatago ng browser para sa `localhost:3000`.

## Habang nagde-develop (sa sarili mong PC)

```mermaid
flowchart LR
    User(["👤 User<br/>(browser)"])

    subgraph FE["frontend/ · React + Vite"]
        Pages["Pages at forms<br/>Login, Register, Profile"]
    end

    subgraph BE["backend/ · Node.js + Express"]
        API["API routes<br/>/api/auth/..."]
        Logic["Business rules<br/>+ password hashing"]
    end

    subgraph DB["database/ · PostgreSQL (sa Docker)"]
        Users[("users table")]
    end

    User -->|"nag-click ng Login"| Pages
    Pages -->|"HTTP request (fetch)<br/>POST /api/auth/login"| API
    API --> Logic
    Logic -->|"SQL (gamit ang Drizzle)"| Users
    Users -->|"data"| Logic
    API -->|"HTTP response (JSON)<br/>+ httpOnly cookie"| Pages
```

**Paano basahin:**
1. Nag-click ang user ng "Login" sa **frontend**.
2. Nagpapadala ang frontend ng **HTTP request** sa **backend**.
3. Tinatanong ng backend ang **database** kung may ganitong user at tama ang password.
4. Sumasagot ang backend (JSON), at nagse-set ng **cookie** na nagpapatunay na naka-login ka.

## Kapag naka-deploy na (Phase 8 — hybrid, D-020)

> 📅 in-update sa Day 36b · ✅ domain, Dockerfile, Neon, Tunnel, **Pages (live — https://nelson1869.com)** · **CD (Day 37, manual pull)**
> **Subukan:** `backend/http/prod/01-production.http`

```mermaid
flowchart LR
    User(["👤 Kaibigan<br/>(phone, kahit saan)"]) -->|"https://nelson1869.com"| Pages["Cloudflare Pages + CDN ✅ Day 36b<br/>frontend (React, static)<br/>assets: max-age 1 taon · cf-cache-status HIT"]
    User -->|"https://api.nelson1869.com<br/>+ Cookie: token"| Edge["Cloudflare<br/>DNS + HTTPS"]
    Edge -->|"named Tunnel auth-learning ✅ Day 36<br/>4 koneksyon (Cebu ×2, Hong Kong ×2)<br/>walang bukas na port sa router"| PC
    subgraph PC["🖥️ PC ni Nelson"]
        CFD["cloudflared container<br/>devops/docker-compose.prod.yml"] -->|"http://backend:3000<br/>(Docker network lang)"| BE["backend container<br/>node src/index.ts ✅ Day 34"]
    end
    BE -->|"TLS · sslmode=verify-full"| Neon[("Neon · Singapore<br/>Postgres 17 · point-in-time restore<br/>✅ Day 35")]
    GH["GitHub<br/>CI ✅ · image → GHCR ✅ Day 37"] -.->|"./devops/deploy.sh:<br/>pull ng image ng berdeng SHA"| BE
    GH -.->|"kusang build + deploy"| Pages
```

> Babalikan at ia-update natin ang mga diagram na ito habang nabubuo ang project —
> dapat laging tugma ang diagram sa totoong code.

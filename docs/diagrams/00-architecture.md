# 00 — Architecture (ang malaking larawan)

> Paano nag-uusap ang mga bahagi ng system. Ang bawat kahon ay isang role/folder.
> Tingnan sa Chrome: `node docs/diagrams/build.mjs`, tapos buksan ang `index.html`.
> Kusa rin itong nire-render sa GitHub at sa VS Code Markdown Preview.

## Ngayon: ano na ang totoong mayroon

> 📅 in-update sa Day 24 · Phase 5 (buong auth mula sa browser) · **Code:** `frontend/src/`, `backend/src/`, `devops/docker-compose.yml`
> **Subukan:** `backend/http/01`–`07`

```mermaid
flowchart LR
    Browser(["🌐 Chrome<br/>localhost:5173"]) -->|"HTML + JS"| FE
    subgraph FEG["frontend/ · Vite 8 + React 19 (npm run dev)"]
        FE["App.jsx — React Router 8<br/>pages/ Login · Register · Profile<br/>api/auth.js — fetch, credentials: 'include'"]
    end
    FE -->|"fetch · localhost:3000<br/>CORS preflight + Cookie: token"| MW
    Client(["REST Client / curl<br/>(may cookie jar)"]) -->|"HTTP · localhost:3000<br/>+ Cookie: token"| MW
    subgraph BE["backend/ · Express (npm run dev)"]
        MW["cors({ origin: CLIENT_URL, credentials })<br/>express.json() · cookieParser()"]
        Routes["routes/<br/>auth.js: register · login · me · logout<br/>users.js: count · health.js · echo.js"]
        Val["validations/auth.js<br/>Zod: registerSchema · loginSchema"]
        Auth["middleware/requireAuth.js<br/>jwt.verify (JWT_SECRET)"]
        Hash["argon2<br/>hash · verify"]
        DB["db/index.js<br/>Drizzle + pg Pool"]
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

## Kapag naka-deploy na (Phase 8)

```mermaid
flowchart LR
    User(["👤 User<br/>(kahit saan sa internet)"]) -->|"https://auth.domain-mo.com"| CF["Cloudflare<br/>DNS + HTTPS + Tunnel"]
    CF --> App["backend + frontend<br/>(Docker)"]
    App --> Neon[("Managed Postgres<br/>Neon / Supabase<br/>🔁 automatic backup")]

    GH["GitHub<br/>code + Actions (CI)"] -.->|"deploy kapag pumasa ang tests"| App
```

> Babalikan at ia-update natin ang mga diagram na ito habang nabubuo ang project —
> dapat laging tugma ang diagram sa totoong code.

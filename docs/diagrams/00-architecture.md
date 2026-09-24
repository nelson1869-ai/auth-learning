# 00 — Architecture (ang malaking larawan)

> Paano nag-uusap ang mga bahagi ng system. Ang bawat kahon ay isang role/folder.
> Tingnan sa Chrome: `node docs/diagrams/build.mjs`, tapos buksan ang `index.html`.
> Kusa rin itong nire-render sa GitHub at sa VS Code Markdown Preview.

## Ngayon: ano na ang totoong mayroon

> 📅 in-update sa Day 10 · Phase 3 · **Code:** `backend/src/`, `devops/docker-compose.yml`
> **Subukan:** `backend/http/03-users-count.http`

```mermaid
flowchart LR
    Client(["REST Client / curl"]) -->|"HTTP · localhost:3000"| Routes
    subgraph BE["backend/ · Express (npm run dev = node --env-file=.env)"]
        Routes["routes/<br/>GET /api/health<br/>POST /api/echo<br/>GET /api/users/count"]
        DB["db/index.js<br/>Drizzle + pg Pool<br/>(DATABASE_URL galing sa .env)"]
        Schema["db/schema.js<br/>hugis ng users table"]
        Routes -->|"db.$count(users)"| DB
        Schema -.-> Routes
    end
    You(["👤 Ikaw (psql)"]) -->|"localhost:5435"| PG
    DB -->|"SQL: select count(*) from users<br/>localhost:5435"| PG
    subgraph Docker["Docker · project: auth-learning"]
        PG[("postgres:17-alpine<br/>database: auth_learning")]
        Vol[/"volume: auth-learning_pgdata"/]
        PG --- Vol
    end
```

**Pansinin:** magkakonekta na ang backend at database. Kapag huminto ang
database, **500** ang sagot pero **buhay pa rin ang server** (`pool.on('error')`),
at kusang gagaling kapag bumalik ito.

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

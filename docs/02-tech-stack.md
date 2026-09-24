# 02 — Tech Stack (ang mga tools ng bawat role)

> Sa totoong team, pinag-uusapan ito bago magsimula para iisa ang gamit ng lahat.
> Ang **"Kailan"** ay ang phase sa [roadmap](03-roadmap.md) kung kailan natin ito unang gagamitin.

## Para sa buong team

| Tool | Para saan | Kailan |
|---|---|---|
| **VS Code** | Code editor | Ngayon |
| **Git** | Nagtatanda ng bawat pagbabago (version control) | Ngayon |
| **GitHub** | Kopya ng repo sa internet, Pull Requests, CI | Phase 1 |
| **REST Client** (VS Code extension) | Pagsubok ng API gamit ang `.http` files | Phase 2 |
| **Mermaid** | Mga diagram na isinusulat bilang text sa `.md` (kaya nasa Git at may history) | Ngayon |
| **`docs/diagrams/build.mjs`** | Gumagawa ng `index.html` na may navigator para makita ang lahat ng diagram sa Chrome | Ngayon |

## Frontend Developer

| Tool | Para saan | Kailan |
|---|---|---|
| **React** | Paggawa ng UI mula sa maliliit na piraso (components) | Phase 5 |
| **Vite** | Mabilis na development server at build tool para sa React | Phase 5 |
| **JavaScript** → **TypeScript** | Ang language (TypeScript ay idadagdag mamaya) | Phase 5 / 7 |
| **fetch** (built-in sa browser) | Pagtawag sa backend API | Phase 5 |

## Backend Developer

| Tool | Para saan | Kailan |
|---|---|---|
| **Node.js** (v24) | Nagpapatakbo ng JavaScript sa server | Phase 2 |
| **Express** (v5) | Framework para sa API: routes, requests, responses | Phase 2 |
| **JavaScript** → **TypeScript** | Ang language | Phase 2 / 7 |
| **Zod** | Pagsuri kung tama ang datos na ipinadala (validation) | Phase 4 |
| **argon2** | Pag-hash ng password (hindi kailanman plain text) | Phase 4 |
| **jsonwebtoken** | "Pass" na nagpapatunay na naka-login ka (JWT) | Phase 4 |
| **Vitest** + **Supertest** | Automated tests | Phase 6 |

## Database Engineer

| Tool | Para saan | Kailan |
|---|---|---|
| **PostgreSQL** (v17) | Ang database | Phase 3 |
| **Docker** | Pagpapatakbo ng Postgres sa sarili mong PC nang walang manual install | Phase 3 |
| **SQL** | Ang wika ng database | Phase 3 |
| **Drizzle ORM** + **drizzle-kit** | Pag-access sa DB mula sa JavaScript + migrations (pagbabago ng tables) | Phase 3 |
| **Neon** o **Supabase** | Managed Postgres sa internet — **may automatic backup** | Phase 8 |

## DevOps Engineer

| Tool | Para saan | Kailan |
|---|---|---|
| **Docker** + **Docker Compose** | Pagpapatakbo ng buong system sa iisang command | Phase 3 / 6 |
| **GitHub Actions** | CI: kusang pinapatakbo ang tests sa bawat push | Phase 6 |
| **Sariling domain** (~$10/taon) | Stable na address, hal. `auth.<pangalan-mo>.com` | Phase 8 |
| **Cloudflare** (DNS + named Tunnel) | HTTPS at pag-expose ng app sa internet nang libre | Phase 8 |
| **Prometheus** + **Grafana** | Monitoring (ilang request, gaano kabilis, may error ba) | Phase 9+ |

> ⚠️ Madalas magbago ang presyo at libreng tier ng mga online service —
> tingnan ang kasalukuyang pricing page bago mag-sign up.

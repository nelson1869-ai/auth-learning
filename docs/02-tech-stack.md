# 02 — Tech Stack (ang mga tools ng bawat role)

> Sa totoong team, pinag-uusapan ito bago magsimula para iisa ang gamit ng lahat.
>
> **Mga patakaran:**
> - **Idinadagdag lang ang tool kapag dumating na ang Day nito** sa
>   [roadmap](03-roadmap.md) — hindi lahat nang sabay.
> - **Bawat tool ay may problemang nilulutas.** Walang tool dahil lang "sikat" ito.
> - **Versions:** sinusuri sa araw ng pag-install (`npm install` ang kumukuha ng
>   pinakabago). Kapag iba ang API sa nasa tutorial, isusulat natin:
>   `LUMANG PARAAN → KASALUKUYANG PARAAN`.

---

## 1. Development tools — ang ginagamit mo araw-araw

Hindi ito bahagi ng app — ito ang "gamit sa workshop" mo.

| Tool | Para saan | Unang gamit |
|---|---|---|
| **WSL2 terminal (bash)** | Kung saan mo pinapatakbo ang lahat ng command | Day 01 |
| **Git** | Nagtatanda ng bawat pagbabago (version control) | Day 01 |
| **GitHub** (website) | Kopya ng repo sa internet, Pull Requests, CI | Day 02 |
| **SSH key + `keychain`** | Ligtas na koneksyon sa GitHub; passphrase isang beses lang bawat araw | Day 02 |
| **GitHub CLI (`gh`)** | PR, CI status at merge mula sa terminal (`gh pr create`, `gh pr checks --watch`, `gh pr merge`) | Day 28 |
| **VS Code** | Code editor | Day 01 |
| **npm / npx** | Pag-install at pagpapatakbo ng mga package (kasama ng Node) | Day 03 |
| **`node --watch`** → **`nodemon`** | Kusang nire-restart ang server kapag nag-save ka (nodemon mula Day 23 — matibay kahit may `git checkout`, D-014) | Day 05 / 23 |
| **`curl`** | Pagpapadala ng request mula sa terminal | Day 04 |
| **Docker** + **Docker Compose** | Pagpapatakbo ng Postgres (at mamaya, ng buong app) sa container | Day 07 |
| **`psql`** | Direktang pakikipag-usap sa Postgres gamit ang SQL | Day 08 |
| **Drizzle Studio** | Pagtingin sa tables at data sa browser | Day 11 |
| **Chrome DevTools** (F12) | **Network tab:** tingnan ang bawat request, response, cookie, at CORS error | Day 20 |
| **jwt.io** | I-decode at tingnan ang laman ng isang JWT | Day 16 |
| **Mermaid** + `docs/diagrams/build.mjs` | Mga diagram bilang text, makikita sa Chrome na may navigator | Day 01 |

### VS Code extensions

I-install lang kapag kailangan na (`code --install-extension <id>`):

| Extension | ID | Para saan | Unang gamit |
|---|---|---|---|
| **REST Client** | `humao.rest-client` | Pagpapatakbo ng `.http` files | Day 05 |
| **Markdown Preview Mermaid Support** | `bierner.markdown-mermaid` | Makita ang diagrams sa Markdown Preview | Day 06 |
| **Oxc** | `oxc.oxc-vscode` | Makita agad sa editor ang mga babala ng Oxlint (D-015) | Day 20 / 27 |
| **Docker** | `ms-azuretools.vscode-docker` | Makita ang containers sa VS Code (optional) | Day 07 |

### AI assistants (Claude Code, ChatGPT, …)

**Gabay, hindi developer.** Ipinapaliwanag, nagbibigay ng maliit na halimbawa,
at nagre-review ng code mo — pero **ikaw ang nagta-type ng code.** Puwede nilang
i-edit ang docs kapag hiniling mo. Tingnan ang [`AGENTS.md`](../AGENTS.md).

---

## 2. Frontend Developer

> "Basics muna, modern pagkatapos" — tingnan ang [D-013](04-decisions.md).

| Tool | Para saan | Unang gamit |
|---|---|---|
| **React 19** | Paggawa ng UI mula sa maliliit na piraso (components) | Day 20 |
| **Vite 8** | Mabilis na development server at build tool para sa React | Day 20 |
| **Oxlint** | Linter na kasama na sa template ng Vite (mabilis, gawa sa Rust) | Day 20 (kasama), Day 27 (CI) |
| **JavaScript** → **TypeScript 7** | Ang language — `.tsx`/`.ts` mula Day 32b; `tsc -b` = type-check lang, si Vite ang gumagawa ng JS (D-019) | Day 20 / 32b |
| **`useState`** → **`useActionState`** (React 19) | State ng form: una ang pundasyon, tapos ang modernong paraan | Day 21 / 23 |
| **fetch** (built-in sa browser) | Pagtawag sa backend, may `credentials: 'include'` para sa cookie | Day 22 |
| **React Router 8** | Mga page: `/login`, `/register`, `/profile` | Day 24 |
| **Plain CSS** | Styling — ang pundasyon bago ang kahit anong CSS tool | Day 20 |
| **Chrome DevTools** | Network tab: request, cookie, CORS error | Day 20 |

**Hindi muna (pagkatapos ng MVP):** TanStack Query (data fetching), Tailwind
(styling), react-hook-form. Magagaling na tool — pero itinatago nila ang mga
bagay na gusto nating makita muna.

## 3. Backend Developer

| Tool | Para saan | Unang gamit |
|---|---|---|
| **Node.js** (v24) | Nagpapatakbo ng JavaScript sa server | Day 03 |
| **Express** (v5) | Framework para sa API: routes, requests, responses | Day 03 |
| **`node --env-file=.env`** | Pagbasa ng `.env` — **built-in na sa Node**, hindi na kailangan ng `dotenv` | Day 10 |
| **Zod** | Pagsuri kung tama ang datos na ipinadala (validation) | Day 14 |
| **argon2** | Pag-hash ng password (hindi kailanman plain text) | Day 12 |
| **jsonwebtoken** | "Pass" na nagpapatunay na naka-login ka (JWT) | Day 16 |
| **cookie-parser** | Pagbasa ng cookies mula sa request (dito nakatira ang JWT) | Day 16 |
| **cors** | Pinapayagan ang frontend (ibang port/domain) na tumawag sa backend | Day 22 |
| **Vitest** + **Supertest** | Automated tests | Day 25 |
| **Oxlint** | Nahuhuli ang mga karaniwang pagkakamali bago pa tumakbo ang code (D-015, dati ESLint) | Day 27 |
| **TypeScript 7** (`tsc` = type-check lang) | Types — nahuhuli ang mali bago tumakbo. Si **Node 24** ang nagpapatakbo ng `.ts` (walang `tsx`, D-018) | Day 29 |

> **`dotenv` → `--env-file`:** Sa maraming tutorial, `require('dotenv').config()`
> ang makikita mo. **Luma na iyan** — mula Node 20.6, built-in na ang
> `node --env-file=.env src/index.js`. Isang dependency na hindi na kailangan.

## 4. Database Engineer

| Tool | Para saan | Unang gamit |
|---|---|---|
| **PostgreSQL** (v17) | Ang database | Day 07 |
| **SQL** | Ang wika ng database | Day 08 |
| **Drizzle ORM** + **drizzle-kit** | Pag-access sa DB mula sa JavaScript + migrations | Day 10 |
| **pg** | Ang "driver" — ang aktwal na nakikipag-usap sa Postgres (ginagamit ng Drizzle) | Day 10 |
| **Neon** (Singapore, Postgres 17) | Managed Postgres sa internet — **may point-in-time restore** (6 oras sa Free plan) | Day 35 |

## 5. DevOps Engineer

| Tool | Para saan | Unang gamit |
|---|---|---|
| **Docker Compose** | Postgres ngayon; ang buong system mamaya | Day 07 |
| **GitHub Actions** | CI (`.github/workflows/ci.yml`: tests, lint, build sa bawat PR) at CD (kusang deploy) | Day 27 / 37 |
| **Dockerfile** | Pagbuo ng image ng backend para sa deploy | Day 34 |
| **Sariling domain** (~$10/taon) | Stable na address, hal. `auth.<pangalan-mo>.com` | Day 33 |
| **Cloudflare** (DNS + named Tunnel + Pages/CDN) | HTTPS, pag-expose ng backend, at frontend sa CDN nang libre (D-020) | Day 33 / 36 / 36b |

---

## 6. Pagkatapos ng MVP (Phase 9–19)

Idadagdag lang kapag dumating na ang phase nila — hindi pa ngayon.

| Tool | Para saan | Role | Phase |
|---|---|---|---|
| **helmet** | Secure HTTP headers | Backend / Security | 9 |
| **Pino** | Structured logging | Backend / DevOps | 9 |
| **express-rate-limit** | Limitahan ang dami ng request (brute force) | Security | 9 |
| **csrf-csrf** | CSRF protection (double-submit cookie) | Security | 9 |
| **Resend** o **Brevo** | Totoong pagpapadala ng email | Backend | 12 |
| **OpenAPI** + **Swagger UI** | API documentation mula sa Zod schemas | Backend | 16 |
| **knip** | Paghahanap ng unused code at dependencies | QA | 16 |
| **OpenTelemetry** | Metrics at tracing | DevOps | 17 |
| **Prometheus** + **Grafana** | Pag-iipon ng metrics at dashboards | DevOps | 17 |
| **Alertmanager** | Email kapag may sira | DevOps | 17 |
| **Dependabot**, **gitleaks**, **Grype** | Supply-chain at container security | DevOps / Security | 18 |
| **Redis** | Shared na store ng rate limiter (maraming server) + **server cache** (Day 92b) | DevOps | 18 |
| **Caddy** | **Load balancer** sa harap ng 2 backend container (Day 91b) | DevOps | 18 |
| **@simplewebauthn** | Passkeys (server + browser) | Security / Frontend | 19 |
| **Playwright** | End-to-end test sa totoong browser | QA | 19 |

> ⚠️ Madalas magbago ang presyo at libreng tier ng mga online service —
> tingnan ang kasalukuyang pricing page bago mag-sign up.

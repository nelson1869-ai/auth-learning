# auth-learning

Isang **authentication system** (register, login, logout) na ginagawa mula
sa simula para matuto — hakbang-hakbang, ayon sa trabaho ng bawat role sa
isang totoong software team.

> **Reference project:** `../Next.js-15-Tutorials/express-authentication-demo`
> — ang "senior version" ng parehong system. Hindi natin kinokopya; tinitingnan
> lang natin kapag gusto nating makita kung paano ito ginagawa nang mas advanced.

## Ang team (at ang mga folder nila)

| Folder | Role | Trabaho |
|---|---|---|
| [`frontend/`](frontend/README.md) | Frontend Developer | Ang nakikita at hinahawakan ng user: pages, forms, buttons |
| [`backend/`](backend/README.md) | Backend Developer | Ang API: tumatanggap ng request, nagpapasya, sumasagot |
| [`database/`](database/README.md) | Database Engineer | Kung paano itinatago ang data: tables, SQL, backups |
| [`devops/`](devops/README.md) | DevOps Engineer | Kung paano tumatakbo ang lahat: Docker, deploy, monitoring |
| [`docs/`](docs/) | Buong team | Ang plano, mga desisyon, diagrams, at ang learning journal mo |

### Mga "sombrero" — role na walang sariling folder

May mga role na **hindi** nakatira sa isang folder dahil saklaw nila ang **lahat**.
Isinusuot mo ang "sombrero" nila sa bawat feature:

| Sombrero | Tanong na laging itinatanong |
|---|---|
| 🔐 **Security Engineer** | "Paano ito aabusuhin ng isang attacker?" (hal. hulaan ang password, magpanggap na ibang user) |
| 🧪 **QA Engineer** | "Paano ko mapapatunayan na gumagana ito — at na hindi nito sinira ang iba?" |
| 🏗️ **Architect** | "Saan dapat nakatira ang code na ito — at ano ang HINDI dapat nasa loob nito?" |

## Saan magsisimula

1. [`docs/01-project-brief.md`](docs/01-project-brief.md) — ano ang ginagawa natin at bakit
2. [`docs/02-tech-stack.md`](docs/02-tech-stack.md) — anong tools ang gagamitin ng bawat role
3. [`docs/03-roadmap.md`](docs/03-roadmap.md) — ang mga phase at lesson
4. [`docs/04-decisions.md`](docs/04-decisions.md) — mga desisyong nagawa na (at bakit)
5. [`docs/05-how-we-work.md`](docs/05-how-we-work.md) — paano nagtatrabaho ang team (Git, commits, PRs)
6. [`docs/06-architecture.md`](docs/06-architecture.md) — saan nakatira ang bawat code, at paano lalaki ang structure
7. [`docs/07-api-contract.md`](docs/07-api-contract.md) — bawat endpoint: request, response, status codes
8. [`docs/diagrams/`](docs/diagrams/) — mga diagram ng system. Patakbuhin ang
   `node docs/diagrams/build.mjs`, tapos buksan ang `docs/diagrams/index.html`
   sa Chrome — may navigator sa kaliwa
9. [`docs/journal/`](docs/journal/) — ang learning journal mo, isang file bawat araw

> 🤖 Gumagamit ng AI assistant? Ang [`AGENTS.md`](AGENTS.md) ang instruksyon para sa kanya —
> lalo na ang pangunahing patakaran: **ikaw ang nagta-type ng code, gabay lang ang AI.**

## Kasalukuyang estado

**🎉 MVP tapos (2026-09-26)** — tag `checkpoint-mvp`. Live sa `https://nelson1869.com`
(Cloudflare Pages) + `https://api.nelson1869.com` (Cloudflare Tunnel → PC → Neon), may CI/CD
at rate limiting. **✅ Phase 9 — hardening tapos (2026-09-27)**, tag `checkpoint-phase-9`: secure headers, error handler,
logging, rate limiting, CSRF. **Susunod: Phase 10 — roles at admin.**
Tingnan ang [roadmap](docs/03-roadmap.md).

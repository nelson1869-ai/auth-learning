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
logging, rate limiting, CSRF. **✅ Phase 10 — roles at admin tapos (2026-09-27)**, tag `checkpoint-phase-10`: roles, 401 vs 403, pagination, audit log,
admin page. **✅ Phase 11 — mas ligtas na sessions tapos (2026-09-27)**, tag `checkpoint-phase-11`: refresh tokens + rotation, totoong logout,
mga device ko, change password, RS256. **✅ Phase 12 — email tapos (2026-09-27)**, tag `checkpoint-phase-12`: Resend (SPF/DKIM/DMARC PASS),
password reset (email sa Inbox), email verification (soft), mga page sa frontend. **✅ Phase 13 — account lockout tapos (2026-09-27)**, tag `checkpoint-phase-13`:
per-account lockout, device cookies laban sa lockout DoS. **✅ Phase 14 — tama kahit sabay-sabay tapos (2026-09-27)**, tag `checkpoint-phase-14`: race tests, atomic na lockout,
transaction bago ang cookies sa login, partial UNIQUE indexes. **✅ Phase 15 — huwag ibunyag kung sino ang may account tapos (2026-09-27)**, tag `checkpoint-phase-15`:
pareho ang sagot at ang oras ng login, may account man o wala (natitira: register 409). **✅ Phase 16 — malinis na architecture tapos (2026-09-27)**, tag `checkpoint-phase-16`: routes → controllers (HTTP) → services (logic),
mass-assignment guard, OpenAPI + Swagger UI + frontend types mula sa spec, knip. **✅ Phase 17 — observability tapos (2026-09-29)**, tag `checkpoint-phase-17`: health checks (live vs ready), metrics (OpenTelemetry),
Prometheus + Grafana dashboard, alert email (sinubukan sa pagpatay sa app), graceful shutdown. **Ngayon: Phase 18 — production maturity** (✅ Day 87 supply-chain security: gitleaks, npm audit, Dependabot · ✅ Day 88 container scanning: Grype, mas maliit na image · ✅ Day 89 ligtas na CD: attestation, sinusuring migrations · ✅ Day 90 data retention · ✅ Day 91 backup drill: sariling backup + restore na inorasan · ✅ Day 91b load balancing (lab) · ✅ Day 92 rate limiter sa Redis · ✅ Day 92b server cache sa Redis · ✅ Day 93 review + Neon restore drill — **tapos ang Phase 18**). **Susunod: Phase 19 — passkeys** (✅ Day 94 konsepto ng WebAuthn).
Tingnan ang [roadmap](docs/03-roadmap.md).

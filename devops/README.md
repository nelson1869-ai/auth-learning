# DevOps

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng DevOps engineer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 8.

Siya ang nagpapatakbo ng app sa labas ng PC ko: Docker, automatic tests, at deploy sa internet, para gumana ito para sa lahat.

---

## Ang role

Ang **DevOps engineer** ang nagsisiguro na ang code ay **tumatakbo nang
maaasahan** sa labas ng laptop ng developer: kung paano ito binubuo, sinusubok,
dine-deploy, at binabantayan.

Tanong na sinasagot ng DevOps: *"Gumagana sa PC ko — paano ito gagana para sa lahat?"*

## Mga responsibilidad
- Containers (Docker) — pareho ang takbo sa kahit anong makina
- CI/CD — kusang tests sa bawat push, at ligtas na deploy
- Infrastructure — server, domain, HTTPS
- Monitoring at alerts — malalaman agad kapag may sira
- Secrets — ligtas na paghawak ng mga password at keys

## Tools
Docker · Docker Compose · GitHub Actions · Cloudflare (domain + Tunnel) · Prometheus/Grafana
— tingnan ang [tech stack](../docs/02-tech-stack.md).

## Ano ang lalaman ng folder na ito (plano)
```
devops/
├── docker-compose.yml  ← pinapatakbo ang database (at mamaya, ang buong system)
├── deploy/             ← mga script at dokumentasyon ng deploy
└── monitoring/         ← Prometheus, Grafana (Phase 9+)
```
> Ang GitHub Actions workflows ay nasa `/.github/workflows/` sa root —
> requirement iyon ng GitHub, hindi puwedeng ilipat dito.

## Paano patakbuhin ang database (Day 07)

```bash
cd devops                   # 🚨 dito lang — ang down ay para sa project ng folder mo
cp .env.example .env        # unang beses lang; lagyan ng sariling password
docker compose up -d        # simulan (tumatakbo sa likod)
docker compose ps           # tumatakbo ba?
docker compose logs postgres | tail    # hanapin: "ready to accept connections"
docker compose down         # ihinto — buhay pa rin ang data sa volume
```

| Setting | Value |
|---|---|
| Host / port sa PC mo | `localhost:5435` (5432 at 5434 ay gamit na ng iba) |
| Database / user | `auth_learning` / `auth` |
| Password | nasa `devops/.env` (hindi naka-commit) |
| Volume | `auth-learning_pgdata` |

> ⚠️ **Sa UNANG pagbuo lang ng volume binabasa ang `POSTGRES_USER`,
> `POSTGRES_PASSWORD` at `POSTGRES_DB`.** Kapag binago mo sila pagkatapos, walang
> mangyayari ("Skipping initialization" sa logs). Para magsimula ulit mula sa
> wala: `docker compose down -v` — **binubura nito ang lahat ng data.**

## ❌ Hindi dapat nasa loob ng devops
- **Totoong secrets sa Git** (passwords, keys, `.env`) — `.env.example` lang ang naka-commit
- **Manual na hakbang na walang dokumentasyon** — kung ikaw lang ang nakakaalam, hindi ito maulit
- **Deploy nang walang tests** — dapat pumasa muna ang CI
- **"Latest" na version na walang pin** (hal. `postgres:latest`) — puwedeng biglang magbago; gumamit ng eksaktong version

## Unang gawain
**Phase 3** — `docker-compose.yml` para sa Postgres. Tingnan ang [roadmap](../docs/03-roadmap.md).

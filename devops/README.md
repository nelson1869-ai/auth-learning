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
├── docker-compose.yml       ← dev: Postgres (project `auth-learning`)
├── docker-compose.prod.yml  ← production: backend + cloudflared + prometheus + grafana + alertmanager (project `auth-learning-prod`)
├── cloudflared/config.yml   ← tunnel → api.nelson1869.com
├── deploy.sh                ← pull ng image mula GHCR → migrate → restart → health (Day 37)
├── deploy/             ← mga script at dokumentasyon ng deploy
└── monitoring/              ← Day 82: Prometheus + Grafana (lahat ng config ay naka-commit, walang click sa UI)
    ├── prometheus/prometheus.yml                       ← scrape ng backend:9464 bawat 15s
    ├── prometheus/alerts.yml · alerts.test.yml         ← Day 84: 5 alert rule + ang mga unit test nila (promtool)
    ├── alertmanager/alertmanager.yml · start.sh        ← Day 84: email (Resend SMTP); walang secret sa file
    └── grafana/provisioning/
        ├── datasources/prometheus.yml                  ← Grafana → http://prometheus:9090
        └── dashboards/{dashboards.yml, json/app-overview.json}   ← ang dashboard ng app
```
> Ang GitHub Actions workflows ay nasa `/.github/workflows/` sa root —
> requirement iyon ng GitHub, hindi puwedeng ilipat dito.
> Day 87: `/.github/dependabot.yml` (lingguhang update PRs) at `/.gitleaksignore` (mga sinuring false positive ng gitleaks) —
> nasa root din, requirement ng GitHub at ng gitleaks. Tingnan ang `docs/diagrams/08-ci-pipeline.md` at D-029.

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

## Production (Day 36) — backend sa internet
```bash
cd devops
./deploy.sh                                               # i-deploy ang huling BERDENG main (Day 37)
ROLLBACK=1 ./deploy.sh <sha>                              # bumalik sa mas lumang commit (Day 89: kailangan ang ROLLBACK=1)
ROLLBACK=1 ALLOW_UNATTESTED=1 ./deploy.sh <sha>           # ...sa image na bago pa ang Day 89 (walang attestation)
ALLOW_NO_BACKUP=1 ./deploy.sh                             # Day 91: lumampas kahit pumalya ang backup bago mag-migrate (sadya lang)
gh attestation verify oci://ghcr.io/nelson1869-ai/auth-learning-backend:<sha> --repo nelson1869-ai/auth-learning   # sino ang gumawa ng image?
export IMAGE_TAG=$(cat .deployed-sha)                    # ⚠️ kailangan ng ps/logs/down/restart (itinatakda lang ng deploy.sh)
docker compose -f docker-compose.prod.yml ps              # backend (healthy) + cloudflared
docker compose -f docker-compose.prod.yml logs cloudflared | grep Registered   # 4 na koneksyon
docker compose -f docker-compose.prod.yml logs -f backend                      # logs ng API (JSON, Day 42)
docker compose -f docker-compose.prod.yml logs --no-log-prefix backend | ../backend/node_modules/.bin/pino-pretty   # may kulay
docker compose -f docker-compose.prod.yml logs --no-log-prefix backend | grep <X-Request-Id>                       # isang request
docker compose -f docker-compose.prod.yml down            # ihinto (patay ang api.nelson1869.com)
# gawing admin ang account na NAKA-REGISTER na (Day 45) — user para ibalik
# magpadala ng test email mula sa production (Day 58) — tingnan ang Resend → Emails at ang Gmail "Show original"
docker run --rm --env-file ../backend/.env.production ghcr.io/nelson1869-ai/auth-learning-backend:$IMAGE_TAG node src/scripts/send-test-email.ts <email>
docker run --rm --env-file ../backend/.env.production ghcr.io/nelson1869-ai/auth-learning-backend:$IMAGE_TAG node src/db/set-role.ts <email> admin
curl https://api.nelson1869.com/api/health        # liveness: buhay ba ang process (Day 80: pareho ng /api/health/live)
curl https://api.nelson1869.com/api/health/ready  # readiness: naaabot ba ang Neon (200 ready · 503 not_ready)
```
- **Named Cloudflare Tunnel** `auth-learning` → `https://api.nelson1869.com` → `http://backend:3000`
  (`cloudflared/config.yml`). Walang bukas na port sa router o sa PC.
- **Secrets, wala sa repo:** `backend/.env.production` (Neon, JWT secret) at
  `~/.cloudflared/<tunnel-id>.json` (credentials ng tunnel) · `~/.cloudflared/cert.pem`
  (pang-gawa ng tunnel/DNS — huwag i-share)
- **Mga bantay ng `deploy.sh` (Day 89, D-031)** — tumatanggi bago gumalaw ng kahit ano kapag: mas luma ang commit kaysa sa naka-deploy
  (walang `ROLLBACK=1`) · wala sa `main` · **iba ang `devops/` sa commit** (ibang branch, o may binago na hindi naka-commit) ·
  walang valid na attestation ang image. **Day 91:** backup (`database/backups/backup.sh`) BAGO mag-migrate — tumatanggi kapag pumalya.
  Pagkatapos ng migrate: tumatanggi kapag may migration na hindi na-apply. Diagram: `docs/diagrams/09-cd-pipeline.md`
- `name: auth-learning-prod` — hiwalay sa dev (`auth-learning`), iwas-banggaan
- **Ang image ay galing sa CI** (`ghcr.io/nelson1869-ai/auth-learning-backend:<sha>`), hindi binubuo sa PC —
  tumatanggi ang compose kung walang `IMAGE_TAG` (itinatakda ng `deploy.sh`). Diagram: `docs/diagrams/09-cd-pipeline.md`
- `restart: unless-stopped` — babangon ulit kapag nag-restart ang Docker. ⚠️ Sa WSL, siguraduhing
  tumatakbo ang Docker pagka-boot ng PC, kung hindi, patay ang API.
- Cloudflare: **SSL/TLS → Edge Certificates → Always Use HTTPS: ON** (http → 301)
- `TRUST_CLOUDFLARE=true` sa `backend/.env.production` — rate limit bawat totoong IP (`CF-Connecting-IP`).
  Ligtas LANG dahil walang bukas na port ang backend. Na-block? `docker compose … restart backend` (memory store)

## Monitoring (Day 82–83) — Prometheus + Grafana
| | URL (sa PC lang) | Login |
|---|---|---|
| Grafana dashboard | http://127.0.0.1:3002/d/auth-learning-app | `admin` + `GRAFANA_ADMIN_PASSWORD` sa `devops/.env` |
| Prometheus | http://127.0.0.1:9091 (Status → Targets: dapat **UP** · Alerts: ang 5 rule) | wala (kaya 127.0.0.1 lang) |
| Alertmanager | http://127.0.0.1:9094 (mga alert na naipadala · **silences**) | wala (127.0.0.1 lang) |

```bash
cd devops && export IMAGE_TAG=$(cat .deployed-sha)
docker compose -f docker-compose.prod.yml up -d prometheus grafana     # simulan (ginagawa na rin ng deploy.sh, step 7)
docker compose -f docker-compose.prod.yml restart prometheus           # ⚠️ pagkatapos baguhin ang prometheus.yml (hindi kusang binabasa ulit)
# app-overview.json: kusang binabasa ulit ng Grafana (bawat ~10s) — i-refresh lang ang browser
docker compose -f docker-compose.prod.yml logs grafana | tail           # kapag ayaw mag-load
# (opsyonal) burahin ang 4 na plugin na na-download bago pinatay ang preinstall (Day 82), tapos i-restart ang grafana:
docker compose -f docker-compose.prod.yml exec grafana sh -c 'for p in grafana-exploretraces-app grafana-lokiexplore-app grafana-metricsdrilldown-app grafana-pyroscope-app; do grafana cli plugins remove $p; done'
```
- **🔐 127.0.0.1 lang** (hindi `0.0.0.0`): hindi maaabot mula sa LAN o sa tunnel. Sinubukan mula sa LAN IP → walang koneksyon.
  Iba ang port sa reference (9090/3001 ay gamit na nito sa PC na ito).
- **Walang password ang Prometheus.** Ayos lang dahil sa PC lang ito naaabot. Kapag ilalabas, kailangan ng login sa harap nito.
- **Grafana:** walang sign-up, walang anonymous, walang pag-download ng plugin tuwing boot, walang analytics.
  Ang password ay galing sa `devops/.env`. ⚠️ Sa **unang** boot lang ito ginagamit (nakaimbak na sa volume pagkatapos, gaya ng Postgres);
  para palitan: `docker compose -f docker-compose.prod.yml exec grafana grafana cli admin reset-admin-password <bago>`.
- **May memory limit** (512M / 256M) at retention (15 araw o 1GB): hindi puwedeng kainin ng monitoring ang PC na nagpapatakbo ng app.
- Ang mga query ay nasa `backend/http/28-prometheus-queries.http`. Diagram: `docs/diagrams/22-observability.md`.

## Alerts (Day 84) — email kapag may problema
```bash
# devops/.env (gitignored): kung kanino ang email, at ang Resend API key (SMTP password)
#   ALERT_EMAIL_TO=...  ALERT_SMTP_PASSWORD=re_...     ← tingnan ang .env.example
# Mga unit test ng rules (walang kailangang tumatakbo — pekeng data lang). Patakbuhin mula sa root ng repo, bago i-commit ang alerts.yml:
docker run --rm -v "$PWD/devops/monitoring/prometheus:/p:ro" --entrypoint promtool prom/prometheus:v3.7.3 test rules /p/alerts.test.yml
# Pagkatapos baguhin ang alerts.yml → restart prometheus · ang alertmanager.yml o ALERT_* sa .env → up -d alertmanager
docker compose -f docker-compose.prod.yml restart prometheus
docker compose -f docker-compose.prod.yml up -d alertmanager
# Naipadala ba ang email? (walang log kapag tagumpay; WARN kapag pumalya, hal. "535" = maling password)
curl -s http://127.0.0.1:9094/metrics | grep 'alertmanager_notifications.*email'
docker compose -f docker-compose.prod.yml logs alertmanager | grep WARN
```
- **Planong maintenance** (hal. papatayin ang PC): gumawa ng **silence** sa http://127.0.0.1:9094 (o `backend/http/29-alerts.http` #6),
  para hindi ka ma-email nang walang dahilan. Kapag hindi mo pinapatay nang sadya pero dumating ang email, **iyan ang silbi nito.**
- **🔐 Walang secret sa Git:** ang `start.sh` ang nagsusulat ng password sa isang tmpfs file (0600, user ng alertmanager) at pumapalit sa
  `__ALERT_EMAIL_TO__`. Hindi gumana ang Compose `secrets:` dahil hindi nito sinusunod ang `uid`/`mode` sa labas ng swarm.
- **⚠️ Kapag kulang ang `devops/.env`**, tumatanggi ang BUONG compose (pati ang backend), kaya may pre-flight check ang `deploy.sh`.
- **⚠️ Hindi nito nakikita ang pagkamatay ng buong PC** (kasama nitong namamatay ang Prometheus at Alertmanager), o ng tunnel lang.
  Kailangan ng bantay mula sa labas (backlog).

## ❌ Hindi dapat nasa loob ng devops
- **Totoong secrets sa Git** (passwords, keys, `.env`) — `.env.example` lang ang naka-commit
- **Manual na hakbang na walang dokumentasyon** — kung ikaw lang ang nakakaalam, hindi ito maulit
- **Deploy nang walang tests** — dapat pumasa muna ang CI
- **"Latest" na version na walang pin** (hal. `postgres:latest`) — puwedeng biglang magbago; gumamit ng eksaktong version

## Unang gawain
**Phase 3** — `docker-compose.yml` para sa Postgres. Tingnan ang [roadmap](../docs/03-roadmap.md).

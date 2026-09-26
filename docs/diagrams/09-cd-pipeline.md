# 09 — CD pipeline (pull-based deploy)

> 📅 Day 37 · Phase 8 · **Code:** `.github/workflows/ci.yml` (job `image`) · `devops/deploy.sh` ·
> `devops/docker-compose.prod.yml` · `backend/src/db/migrate.ts` · **Desisyon:** D-020

## Mula merge hanggang live

```mermaid
flowchart TD
    Merge(["👤 Merge ng PR sa main"]) --> CI["GitHub Actions — CI<br/>backend (tests) · frontend (build)"]
    CI -->|"❌"| Stop["Walang image — walang deploy"]
    CI -->|"✅"| Img["job: image<br/>docker build backend/<br/>→ GHCR: auth-learning-backend:&lt;SHA&gt; at :main"]
    Merge -.->|"sabay"| Pages["Cloudflare Pages<br/>kusang build + deploy ng frontend"]
    Img --> Wait(["⏳ naghihintay sa PC"])
    Wait --> Deploy["🖥️ PC: ./devops/deploy.sh<br/>(manual — Day 37)"]
    Deploy --> Pick["gh run list … --status success<br/>→ SHA ng huling BERDENG main"]
    Pick --> Pull["docker pull …:&lt;SHA&gt;<br/>ang EKSAKTONG image na pumasa"]
    Pull --> Mig["docker run … node src/db/migrate.ts<br/>migrations MUNA (Neon)"]
    Mig -->|"pumalya"| Abort["❌ huminto — hindi nagalaw ang tumatakbong app"]
    Mig -->|"OK"| Up["IMAGE_TAG=&lt;SHA&gt; docker compose up -d backend<br/>(hindi ginagalaw ang cloudflared)"]
    Up --> Health{"HEALTHCHECK healthy?<br/>+ https://api.nelson1869.com/api/health"}
    Health -->|"oo"| Live["✅ Live — .deployed-sha"]
    Health -->|"hindi"| Fail["❌ tingnan ang logs<br/>rollback: ./deploy.sh &lt;lumang SHA&gt;"]
```

## Mga dapat pansinin

- **Pull, hindi push:** ang PC ang humihila ng image. Walang self-hosted runner, kaya walang
  code mula sa labas (hal. PR ng ibang tao sa public repo) na kusang tumatakbo sa PC (D-020).
- **Eksaktong commit:** ang dine-deploy ay ang image na binuo ng CI para sa SHA na iyon —
  hindi "kung ano ang nasa working copy". Parehong prinsipyo sa reference (item 22), ibang paraan.
- **Migrations sa loob ng image** (`drizzle-orm` migrator, prod dependency) — walang hiwalay
  na "migrate" image na puwedeng maging luma (aral ng reference: stale migrate image, #21).
- **Rollback:** `./devops/deploy.sh <lumang SHA>` — nasa GHCR pa ang lumang image.
  ⚠️ Hindi binabawi ang migration — ang schema ay dapat laging tugma sa luma AT bagong code.
- **Manual muna, tapos automate:** isang command ngayon; sa susunod, timer na nagpapatakbo nito.

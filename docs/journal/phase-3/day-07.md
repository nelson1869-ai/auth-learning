# Day 07 — 2026-09-24 · Phase 3

## Ano ang ginawa ko
- Gumawa ng `devops/docker-compose.yml`: `postgres:17-alpine`, project `name: auth-learning`, port `5435:5432`, volume `pgdata`
- Password sa `devops/.env` (naka-ignore sa Git); `devops/.env.example` para sa teammates
- Pinatakbo: `docker compose up -d` → `docker ps` → `logs` → `down`
- Na-check (ng AI) gamit ang `psql` sa loob ng container: PostgreSQL 17.11, database `auth_learning`, user `auth`

## Ano ang natutunan ko (sa sarili kong salita)
- **Image** = blueprint (hindi tumatakbo). **Container** = ang tumatakbong kopya.
- **`5435:5432`** = `PC-ko:loob-ng-container`. 5435 dahil gamit na ng reference project ang 5432/5434.
- **Volume** = data sa labas ng container. Pagkatapos ng `down` at `up`, lumabas sa logs ang "Skipping initialization" — nandoon pa ang data.
- **`name:` sa compose file** = iwas-banggaan sa ibang project (nangyari ito sa reference project).
- **`POSTGRES_*` variables ay binabasa lang sa UNANG pagbuo ng volume.** Kapag pinalitan ang password pagkatapos, walang epekto — kailangan ng `down -v` (buburahin ang data).

## Mga problema at paano ko nalutas
- **Na-merge ang PR #9 pero wala ang compose file ko.** Nag-push ako nang hindi muna nag-`git add` + `commit` ng sarili kong files — ang docs commit lang ng AI ang nakasama. Aral: **tingnan ang `git status` bago mag-push**; dapat walang `??` sa files na ginawa ko.
- Walang laman ang `.env.example` noong una.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 08: Unang SQL — `psql`, `CREATE TABLE users`, `INSERT`, `SELECT`

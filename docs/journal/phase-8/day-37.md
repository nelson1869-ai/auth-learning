# Day 37 — 2026-09-26 · Phase 8 · CD (pull-based)

## Ano ang ginawa (AI, sa kahilingan ko — "go 37")
- **Ako:** `gh auth refresh -s workflow` (para mabago ng AI ang `.github/workflows/`)
- `backend/src/db/migrate.ts` — migrations sa loob ng production image (`drizzle-orm` migrator); `drizzle/` kasama na sa image
- CI job **`image`**: build sa bawat PR; sa merge sa main → push sa **GHCR** (`:SHA` at `:main`), `GITHUB_TOKEN` lang
- `devops/docker-compose.prod.yml` — image mula GHCR, **tumatanggi kung walang `IMAGE_TAG`**
- **`devops/deploy.sh`** — huling berdeng SHA → pull → migrate → restart backend → health check (+ rollback gamit ang lumang SHA)
- 📊 `docs/diagrams/09-cd-pipeline.md`

## Sinubukan bago i-push
- `migrate.ts` sa bagong database → 2 migration; inulit → walang bago; sa test DB na ginawa ni drizzle-kit → walang inulit (ligtas sa Neon)
- Sa loob ng image: `node src/db/migrate.ts` gumagana
- shellcheck · actionlint · compose config — lahat malinis; 11 tests passed

## Ano ang natutunan ko (sa sarili kong salita)
- **CD** = kusang paghahatid ng code na pumasa sa CI.
- **Push vs pull deploy:** ang reference ay self-hosted runner (push); tayo ay pull — mas ligtas sa public repo.
- **Container registry (GHCR)** — imbakan ng mga image, naka-tag sa commit → eksaktong bersyon, madaling rollback.
- **Migrations muna, saka ang code** — kapag pumalya ang migration, hindi nagalaw ang tumatakbong app.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Ang unang totoong `./devops/deploy.sh` pagkatapos ng merge
- Rate limiting (mula Day 43) → Day 38 🎉 maikling launch

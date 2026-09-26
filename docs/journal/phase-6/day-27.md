# Day 27 — 2026-09-26 · Phase 6 · unang araw bilang DevOps

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko):
  - `.github/workflows/ci.yml` — 2 job: **backend** (Postgres service → npm ci → audit → lint → migrate → test) at **frontend** (npm ci → lint → build)
  - `setup.js`: gumagana kahit walang `.env.test` (CI), pero may pananggalang pa rin na `*_test`
  - Oxlint sa backend (`npm run lint`) — D-015 (pinalitan ang ESLint ng D-011)
- Sinubukan bago i-push: `actionlint` walang error; malinis na kopya ng repo + bagong database → lahat ng hakbang pumasa

## Ano ang natutunan ko (sa sarili kong salita)
- **CI** = robot sa GitHub na, sa bawat push/PR, gumagawa ng bagong malinis na makina at pinapatakbo ang lint/test/build.
- **Jobs** ay sabay-sabay; **services** (Postgres) ay buhay lang habang tumatakbo ang job.
- **`npm ci`** = eksaktong versions mula sa lock file.
- **Walang `.env` sa CI** — galing sa `env:` ng workflow (pang-CI lang, hindi totoong secret).
- **Nahuli bago pa mag-push:** kung walang `.env.test`, `ENOENT` → lahat ng test ay papalya sa CI.

## ✅ Resulta sa GitHub
- Unang tunay na run sa PR ng `feature/day-27-ci`: **berde** ang `backend` at `frontend` (nakita ni Nelson sa Checks ng PR).

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit `npm audit` sa CI?**
  S: Para mahuli ang mga kilalang butas sa mga package (CVE) bago pa ma-merge. Kapag may high-severity sa production dependencies, pula ang CI.
- **T: Ano ang mangyayari kapag pumasa sa PC ko pero bumagsak sa CI?**
  S: Kadalasan: may file sa PC ko na wala sa Git (hal. `.env.test`), o ibang bersyon ng Node. Kaya malinis na makina ang CI: ipinapakita nito kung ano talaga ang nasa repo.
- **T: Bakit hindi totoong secret ang nasa `env:` ng workflow?**
  S: Pang-test lang ang mga iyon (lokal na Postgres ng CI, pansamantala). Ang totoong secret (hal. Neon URL) ay hindi kailanman nasa workflow file dahil public ang repo.

## Susunod
- Day 28: Branch protection — hindi puwedeng mag-merge kung pula ang CI

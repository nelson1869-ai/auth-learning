# Day 09 — 2026-09-24 · Phase 3

## Ano ang ginawa ko
- Sinubukang lagyan ng `UNIQUE` ang lumang table → tumanggi dahil may dobleng email na
- `DROP TABLE` at ginawa ulit ang `users`: `email TEXT NOT NULL UNIQUE`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Sinubukang sirain: doble, walang email, at malaking titik
- `database/sql-practice/02-constraints.sql` — isinulat ng AI mula sa totoong resulta ng psql session ko, sinubukan sa hiwalay na test database

## Ano ang natutunan ko (sa sarili kong salita)
- **Constraint** = patakaran na ipinapatupad ng database. Kahit may bug ang backend, tatanggi pa rin ito — ang huling bantay.
- **`NOT NULL`** bawal walang laman · **`UNIQUE`** bawal doble · **`DEFAULT`** kusang value · **`PRIMARY KEY`** = NOT NULL + UNIQUE
- Hindi puwedeng maglagay ng constraint na **nilalabag na** ng kasalukuyang data
- **Kinakain ng nabigong INSERT ang id.** Ang bagong user pagkatapos ng dalawang error ay id 4, hindi 2.
- ⚠️ **Magkaiba ang `Ana@` at `ana@` para sa `UNIQUE`** — pumayag ito. Aayusin sa backend (lowercase bago i-save, Day 14).
- **Database ang tunay na patakaran:** kapag sabay na nag-register ang dalawa, pareho silang papasa sa check ng backend pero isa lang ang papayagan ng `UNIQUE`. Sa Day 13, gagawing `409 Conflict` ang error na iyon.

## Mga problema at paano ko nalutas
- Na-merge ang PR #12 bago ko na-push ang huling commit (VS Code settings) → hindi ito nakasama sa `main`. Inilipat (cherry-pick) sa Day 09 branch. Aral: **push muna lahat, saka merge.**

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung may `UNIQUE` na sa database, kailangan pa ba ng check sa backend?**
  S: Ang database ang huling bantay at ang tanging tama kapag sabay ang dalawang request. Sa backend, ginagawa lang nating magandang error ang violation nito (409, Day 13), at nilo-lowercase ang email bago i-save (Day 14).
- **T: Bakit `TIMESTAMPTZ` at hindi `TIMESTAMP`?**
  S: May kasamang timezone. Pareho ang oras kahit saang bansa basahin (hal. PC ko sa Manila at Neon sa Singapore). Ang walang timezone ay madaling magkamali ng ilang oras.
- **T: Bakit kinakain ng nabigong INSERT ang id?**
  S: Kinukuha ang susunod na numero bago pa suriin ang constraints, at hindi na ito ibinabalik kahit mabigo. Normal ito, hindi bug.

## Susunod
- Day 10: Backend ↔ database — `--env-file`, Drizzle, pg; unang query mula sa Express

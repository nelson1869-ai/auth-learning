# Day 12 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- `npm install argon2` (0.45.1)
- `backend/playground/01-hash.js` — hash ng `password123`, `verify` ng tama (`true`) at mali (`false`)
- Mga eksperimento (pinatakbo ng AI): dalawang hash ng iisang password, at gaano katagal

## Ano ang natutunan ko (sa sarili kong salita)
- **Hindi kailanman plain text ang password** — kapag na-leak ang database, makukuha ang password ng lahat (at ng iba pa nilang account).
- **Hashing = one-way** (hindi maibabalik). **Encryption = maibabalik** kung may key. Para sa password: hashing.
- **Login:** hina-hash ulit ang tinype at ikinukumpara — iyan ang `argon2.verify()`.
- **Salt:** random na dagdag, kaya magkaiba ang hash ng iisang password (pareho pa rin ang `verify` = `true`). Nasa loob ng hash mismo ang salt at settings.
- **Sinadyang mabagal:** ~50–65ms bawat hash sa PC ko. 1 bilyong hula ≈ 1.6 taon sa isang core.
- **Argon2id** — inirerekomenda ng OWASP; gumagamit ng 64 MB memory, mahirap pabilisin sa GPU.

## Mga problema at paano ko nalutas
- Wala. (Ang hakbang 4 — dalawang hash at `console.time` — ay pinatakbo ng AI, hindi ko pa idinagdag sa script.)

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 13: `POST /api/auth/register` — `password_hash` column (bagong migration!), hash bago i-save, 201 / 409

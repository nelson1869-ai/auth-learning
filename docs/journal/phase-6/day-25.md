# Day 25 — 2026-09-26 · Phase 6 · unang araw bilang QA

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko): `npm install -D vitest` (5.0.2), `npm test` = `vitest run`, at `src/validations/auth.test.js` — 3 test para sa `registerSchema`
- Sinubukan muna ng AI ang Vitest 5 sa hiwalay na folder gamit ang totoo kong schema

## Ano ang natutunan ko (sa sarili kong salita)
- **Unit test** = sinusubok ang isang maliit na piraso nang mag-isa (walang server/database) — kusa at inuulit, hindi ako ang pumipindot.
- **Arrange → Act → Assert.** `describe` (grupo) · `it` (isang test) · `expect(x).toBe(y)`
- **Nasa tabi ng code ang test** (`auth.js` → `auth.test.js`), gaya ng reference.
- **Dapat makitang PUMULA ang test.** Sinadyang sirain:
  - inalis ang `.toLowerCase()` → pumula: Expected `ana@example.com`, Received `Ana@Example.COM`
  - ginawang `z.looseObject` (pinapayagan ang dagdag na field) → pumula ang "drops unknown fields like role"
  - ibinalik → 3 passed
- Ang test na hindi kailanman pumupula ay walang silbi ("tests that pass for the wrong reason" — AGENTS.md ng reference).

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano ko malalaman kung ano ang dapat i-test?**
  S: Ang mga bagay na masakit kapag nasira: security (hal. tinatanggal ang `role`), mga patakaran (lowercase ng email), at mga bug na nangyari na (para hindi maulit). Hindi kailangang i-test ang bawat linya.
- **T: Bakit kailangang makitang pumula muna ang test?**
  S: Kapag hindi pa ito pumupula kahit kailan, hindi mo alam kung may sinusuri ba talaga ito. Baka mali ang `expect` o hindi tumatakbo ang code. Kaya lagi nating sinisira ang code nang sadya (hanggang Day 45).
- **T: Ano ang pagkakaiba ng `toBe` at `toEqual`?**
  S: `toBe` = eksaktong pareho (para sa numbers, strings). `toEqual` = pareho ang laman (para sa objects at arrays, hal. `{ error: 'Not found' }`).

## Susunod
- Day 26: API tests (Supertest), hiwalay na test database, at hatiin ang `index.js` → `app.js` + `index.js`

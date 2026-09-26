# Day 13 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- Isinulat ang register route (`POST /api/auth/register`) mula sa halimbawa
- Code review ng AI: idinagdag ang `passwordHash` sa schema → migration `0001` (`ALTER TABLE ... ADD COLUMN password_hash`), kinumpleto ang `auth.js` (imports, Router, export, mga comment), at ikinabit sa `index.js`
- Sinubukan: 201, 409, walang name, walang password, walang email, malaking titik, at 5 sabay na register

## Ano ang natutunan ko (sa sarili kong salita)
- **201 Created** = may bagong nagawa · **409 Conflict** = salungat sa kasalukuyang data (may account na)
- **INSERT agad, hindi SELECT muna.** Ang `UNIQUE` ng database ang tunay na bantay — 5 sabay na request → isang 201, apat na 409.
- **`err.cause?.code === '23505'`** — binabalot ni Drizzle ang error ng Postgres. Sa lumang tutorial `err.code` — `undefined` na iyon ngayon.
- **`.returning({...})`** piling column lang — hindi lumalabas ang `password_hash`.
- **Bagong column = bagong migration.** `ALTER TABLE` ang ginawa ni drizzle-kit, hindi `CREATE TABLE` — ikinumpara nito ang schema sa snapshot ng 0000.

## Mga problema at paano ko nalutas
- Na-paste ko lang ang route; kulang ang imports, ang schema, ang migration at ang pagkabit sa `index.js`. Aral: ang "ikaw ang bahala sa ..." sa lesson ay bahagi pa rin ng gagawin.
- Nasa branch pa ako ng Day 12 (hindi pa naka-merge ang PR) — ginawa ang Day 13 branch mula roon.
- **Mga butas na nakita (para sa Day 14):** walang password → 500 (argon2 TypeError); walang email → 500 at **lumalabas ang password hash sa error**; `Nelson@` at `nelson@` → dalawang account.

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit hindi `SELECT` muna para malaman kung may account na?**
  S: Kapag sabay ang dalawang request, pareho silang makakakita ng "wala pa" at pareho silang mag-i-INSERT (race condition). Ang `UNIQUE` ng database lang ang siguradong tama. Sinubukan: 5 sabay na request → isang 201, apat na 409.
- **T: Bakit hindi dapat bumalik ang `password_hash` kahit hash lang?**
  S: Puwedeng i-crack offline ang hash (panghuhula sa sariling PC ng attacker, walang rate limit). Kaya hindi ito kailanman lumalabas sa API: `.returning({ id, email, name })` lang.
- **T: Ano ang ibig sabihin ng "ikaw ang bahala" sa lesson?**
  S: Bahagi pa rin ito ng gagawin mo: imports, pagkabit ng router, schema, migration. Madalas itong makaligtaan, kaya laging subukan ang endpoint pagkatapos.

## Susunod
- Day 14: Validation (Zod) — 400 para sa maling input, lowercase ang email

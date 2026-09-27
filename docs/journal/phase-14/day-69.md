# Day 69 — 2026-09-27 · Phase 14 · Unique constraint bilang huling bantay

## Ang tanong
Ang register ng parehong email nang sabay ay **ligtas na mula Day 13** (INSERT agad, ang `UNIQUE` ang bantay, 23505 → 409). Napatunayan na ito ng test noong Day 66.
Kaya ang tanong ngayon: **may iba pa bang "dapat isa lang" sa app na CODE lang ang nagbabantay?**

## Ang nahanap (dalawa)
| Patakaran | Paano binabantayan dati | Sa ilalim ng sabay-sabay |
|---|---|---|
| Isang aktibong link bawat user at layunin (Day 59) | code: "UPDATE ang luma, tapos INSERT" (dalawang statement) | ❌ **20 sabay na "Ipadala ulit" → 18 aktibong link** · 20 sabay na "forgot password" → 11–20 |
| Isang aktibong refresh token bawat family (Day 52) | code: laging binabawi muna sa parehong transaction | ✅ tama ang code, pero ❌ **tinanggap ng database ang pangalawang aktibo** kapag may code na nagkamali |

## Ang ayos
- **Migration 0011: dalawang partial UNIQUE index**
  - `verification_tokens (user_id, purpose) WHERE used_at IS NULL`
  - `refresh_tokens (family_id) WHERE revoked_at IS NULL`
  - "Partial": ang mga row lang na tumutugma sa `WHERE` ang binabantayan. Ang mga nagamit o binawi ay puwedeng marami.
- **Bago gawin ang index, nililinis ang mga dati nang doble** (iniiwan ang pinakabago). 0 doble sa dev at production, pero kung may lumitaw bago ang deploy, papalya ang migration kung walang paglilinis.
- **`createVerificationToken` = isang upsert:** `INSERT … ON CONFLICT (user_id, purpose) WHERE used_at IS NULL DO UPDATE SET token_hash, expires_at`.
  Pinapalitan sa lugar ang aktibong link, kaya hindi na gagana ang luma (parehong ugali ng dati), sa **isang** statement.

## Isang eksperimento: sapat na ba ang index lang?
Ibinalik ko pansamantala ang lumang code (UPDATE-then-INSERT) habang naroon ang index. 20 sabay na "Ipadala ulit":

| Code | Aktibong link | Pumalya sa background | Email |
|---|---|---|---|
| Luma, **may index** | 1 ✅ | **17** (23505) | 3 |
| **Bago: upsert + index** | 1 ✅ | 0 | 20 (ang huli lang ang gagana) |

**Aral:** ang index lang ay sapat para **hindi masira ang data** (huling bantay). Pero ang tinanggihan ay nagiging **error**. Kaya kailangan din ng code na tugma sa patakaran.
Pareho ito sa register: ang `UNIQUE` ang bantay, at ang `catch 23505 → 409` ang nagpapaganda ng sagot.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 3 bagong test BAGO ang ayos | ✅ bumagsak: 18 aktibo · 11–20 aktibo · tinanggap ang pangalawang token sa family |
| Pagkatapos ng ayos (3 takbo) · buong suite | ✅ 170 |
| Tinanggal ang family index sa test DB | ✅ bumagsak ang family test · ibinalik |
| Rehearsal ng migration: sadyang doble (3 link, 2 token) · sa **parehong command ng deploy** (`src/db/migrate.ts`) | ✅ 3 → 1, 2 → 1 (ang pinakabago) · nagawa ang 2 index |
| 22 `.http` (review script) | ✅ 22/22 |
| Production (deploy: "Migrations applied") · `delivered+…@resend.dev`: register → login → 3 × resend → 2 × forgot | ✅ 2 index · 12 migration · 202 lahat · **1** aktibong verify link at **1** aktibong reset link · binura |

## Mga pagkakamali ko ngayon (at paano nahuli)
1. **Unang resend test ay pumalya sa maling dahilan:** nagbilang ako BAGO matapos ang background task (sumasagot muna ang resend, saka gumagawa ng token).
   Nakita ko na 0 kanina, 9 ngayon, kaya nakadepende sa timing. Ayos: `drainBackground()` bago magbilang.
2. **Natigil na eksperimento:** ang `wait` sa script ko ay naghintay rin sa dev server (sa parehong shell), kaya hindi natapos, at **naiwan ang lumang code sa file**.
   Nahuli dahil tiningnan ko agad ang `git status`, at ibinalik mula sa commit. Sa sumunod na eksperimento, nasa **`trap … EXIT`** ang pagbabalik: siguradong mangyayari kahit pumalya.
3. **Mga claim na hindi pa napatunayan:** isinulat kong "ligtas mula Day 12" (Day 13 pala, ayon sa git), at "0 pumalya, 20 email" para sa lumang code na walang index (hindi ko sinukat).
   Inayos bago i-commit.
4. **Gumana ang bantay ng review script:** may natirang account mula sa natigil na eksperimento. Tumanggi ang script (exit 2) sa halip na magbigay ng maling ❌.

## Kumpara sa reference
- **Pareho:** ang `UNIQUE` sa email + 23505 → 409 bilang huling bantay sa register.
- **Dagdag dito:** mga partial UNIQUE index para sa "isang aktibo". Ang reference ay may `UNIQUE` lang sa email at sa mga token hash, at walang partial index (sinuri sa `schema.ts` at `drizzle/*.sql` nila).

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit "huling bantay" ang database, hindi ang code?**
  S: Ang code ay puwedeng magkamali: sabay na request, bagong feature na nakalimutan ang patakaran, script na direktang sumusulat. Ang constraint ay laging sinusuri ng database,
  kahit anong code ang sumulat. Hindi ito malalampasan.
- **T: Ano ang partial index?**
  S: Index na may `WHERE`. Ang mga row lang na tumutugma ang kasama. Dito: "isa lang ang puwedeng **aktibo**", pero puwedeng maraming lumang link.
- **T: Kung sapat ang index, bakit binago pa ang code (upsert)?**
  S: Dahil ang tinatanggihan ng index ay **error**. Sa eksperimento, 17 ang pumalya sa background. Tama ang data, pero pangit ang ugali. Kasama ng index ang code na tugma rito.
- **T: Bakit may paglilinis sa migration kung 0 naman ang doble?**
  S: Dahil puwedeng magkaroon ng doble sa pagitan ng pagsuri ko at ng deploy (luma pa ang code sa production hanggang sa deploy). Kapag walang paglilinis, papalya ang `CREATE UNIQUE INDEX`, at hihinto ang deploy.

## Susunod
- **Day 70 — Review day** at ang checkpoint ng Phase 14: *Bakit hindi sapat ang "hanapin muna ang user, tapos i-update"?*

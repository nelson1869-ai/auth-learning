# Day 14 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- `npm install zod` (4.6.5)
- `src/validations/auth.js` — `registerSchema` (email: trim + lowercase + email format; password: 8–128; name: optional)
- Sa `routes/auth.js`: `safeParse` → 400 kung mali, at `result.data` (hindi `req.body`) ang ginagamit
- Code review ng AI: idinagdag ang dalawang nakalimutang import (`z` at `registerSchema`) at ang mga comment

## Ano ang natutunan ko (sa sarili kong salita)
- **Huwag magtiwala sa input.** Maling input = **400** (ang client ang mag-aayos), hindi 500.
- **Naglilinis din si Zod:** `"  Nelson@Example.COM "` → `"nelson@example.com"`, kaya iisang account na → 409.
- **Tinatanggal ang dagdag na field** (hal. `"role": "admin"`) — depensa laban sa mass assignment. Kaya `result.data`, hindi `req.body`.
- **`max(128)` sa password** — para hindi mapahirapan ang argon2 ng napakahabang input.
- **Lahat ng mali, sabay** ang iniuulat sa `fields`.
- **Zod 3 → 4:** `z.string().email()` → `z.email()` · `error.flatten()` → `z.flattenError(error)`
- **May `NOT NULL`/`UNIQUE` pa rin sa database:** Zod = magandang sagot; database = katotohanan (5 sabay na register → isang 201, apat na 409 pa rin).

## Mga problema at paano ko nalutas
- **500 sa BAWAT register:** `ReferenceError: registerSchema is not defined` — nakalimutan ang import. Tumatakbo pa rin ang server (lumalabas lang ang error kapag tinawag ang route) — kaya kailangang subukan ang endpoint, hindi lang tingnan kung nag-start.
- **404 sa register** bago iyon — luma pa ang code ng `npm run dev` pagkatapos ng `git checkout main && git pull` (nangyari na rin noong Day 06). Aral ulit: **i-restart ang server pagkatapos ng checkout/pull.**

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 15: Login — hanapin ang user, `argon2.verify`, 200 o 401

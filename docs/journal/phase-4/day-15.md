# Day 15 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- `loginSchema` sa `validations/auth.js` (password `min(1)`, hindi 8)
- `POST /api/auth/login` sa `routes/auth.js`: hanapin ang user (`eq`), `argon2.verify`, 200 o 401, at `DUMMY_HASH`
- Code review ng AI: idinagdag ang validation block (naiwan ang placeholder comment → `ReferenceError: result is not defined` → 500), ang `eq` at `loginSchema` imports, at ang mga comment

## Ano ang natutunan ko (sa sarili kong salita)
- **Authentication** = patunayan kung sino ka. **401** = hindi napatunayan.
- **User enumeration:** kapag magkaiba ang sagot para sa "walang account" at "maling password", malalaman ng attacker kung sino ang may account. Kaya iisang mensahe.
- **Timing:** kahit pareho ang mensahe, ang BILIS ng sagot ang nagsasabi. Kaya laging may `argon2.verify` — sa `DUMMY_HASH` kapag walang user.
  Sinukat: maling password 52.3ms vs walang account 52.3ms (median, 20×). Ang 400 (walang hashing) ay 1.0ms — ganyan kabilis ang "walang account" kung walang `DUMMY_HASH`.
- **`eq(users.email, email)`** = `WHERE email = ...` sa Drizzle.
- Butas pa rin ang register (409 → may account). Sinadyang iwan sa reference project; rate limiting ang depensa (Phase 9).

## Mga problema at paano ko nalutas
- Naiwan ang placeholder na `// (validation — ...)` → `result is not defined` → 500 sa bawat login. Aral: ang comment na nasa panaklong sa lesson ay "ikaw ang magsusulat nito".
- Nasa branch pa ako ng Day 14 (hindi pa naka-merge ang PR) — ginawa ang Day 15 branch mula roon.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 16: JWT at cookies — para "maalala" ng server na naka-login ka

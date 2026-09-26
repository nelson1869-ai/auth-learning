# Day 17 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- `src/middleware/requireAuth.js` — binabasa ang cookie, `jwt.verify` na may `algorithms: ['HS256']`, `req.userId`, `next()`
- `GET /api/auth/me` sa `routes/auth.js` — `requireAuth` muna, tapos kinukuha ang user sa database
- Code review ng AI: idinagdag ang nakalimutang `import { requireAuth }`, ang mga comment, at ginawa ang branch (nasa `main` pa ako)

## Ano ang natutunan ko (sa sarili kong salita)
- **Middleware = `(req, res, next)`** — dinadaanan bago ang route. `next()` = tuloy; walang `next()` = hinto (at dapat may sagot).
- **Isang beses isinulat, gamit ng marami** — idinadagdag lang ang `requireAuth` sa route na kailangan ng login.
- **`jwt.verify`** sinusuri ang pirma AT ang `exp`; nagtatapon ng error → `try/catch`.
- **`algorithms: ['HS256']`** — hindi malilinlang ng `alg: none` o pagpalit ng algorithm.
- Sinubukan, lahat **401**: walang cookie, binagong `sub`, sira, expired, `alg: none`, ibang secret, nabura ang user.
- **401 = sino ka?** (authentication) · **403 = bawal ka rito** (authorization — Phase 10)

## Mga problema at paano ko nalutas
- **Hindi nag-start ang buong server** — `ReferenceError: requireAuth is not defined`. Iba ito sa Day 14: dito ginagamit ang `requireAuth` habang nilo-load ang file (`router.get(...)`), kaya patay ang lahat, pati `/api/health`. Aral: **laging i-import ang bawat ginagamit.**
- Nasa `main` ako nagtrabaho — nakalimutan ang `git checkout -b`. Inilipat ang mga pagbabago sa `feature/day-17-me` (hindi pa naka-commit kaya madaling ilipat).

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit kailangan ng `algorithms: ['HS256']`?**
  S: May lumang atake: babaguhin ng attacker ang header sa `alg: none` (walang pirma) o ibang algorithm. Kapag nakasaad kung aling algorithm lang ang tinatanggap, tatanggihan ang lahat ng iba. Sinubukan: `alg: none` → 401.
- **T: Bakit hinahanap pa sa database ang user sa `/me` kung may `sub` na sa token?**
  S: Puwedeng nabura na ang user habang valid pa ang token. Sinubukan: nabura ang user → 401. Ang database ang katotohanan; ang token ay patunay lang ng login.
- **T: Bakit namatay ang buong server nang makalimutan ang import sa Day 17, pero hindi noong Day 14?**
  S: Sa Day 17, ginagamit ang `requireAuth` habang nilo-load ang file (`router.get('/me', requireAuth, ...)`), kaya error agad sa start. Sa Day 14, ginagamit lang ang `registerSchema` kapag may tumawag sa route, kaya error lang sa request na iyon.

## Susunod
- Day 18: Logout (burahin ang cookie) + buong auth flow diagram

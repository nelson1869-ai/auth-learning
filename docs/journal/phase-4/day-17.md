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
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 18: Logout (burahin ang cookie) + buong auth flow diagram

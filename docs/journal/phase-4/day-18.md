# Day 18 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko): `COOKIE_OPTIONS` (iisang settings ng cookie), ginamit sa login (`{ ...COOKIE_OPTIONS, maxAge }`), at `POST /api/auth/logout`
- Inayos ng AI ang `npm run dev`: `--watch-path=./src --watch-path=./.env` (tingnan ang "Mga problema")

## Ano ang natutunan ko (sa sarili kong salita)
- **Logout = `res.clearCookie`** — nagpapadala ng cookie na may petsang 1970 para burahin ito ng browser.
- **Magkaparehong options** sa `res.cookie` at `res.clearCookie` — kaya isang `COOKIE_OPTIONS` constant (iwas-duplicate).
- **204 No Content** = nagawa, walang body.
- **Walang `requireAuth` ang logout** — laging dapat gumana, kahit expired na ang token (idempotent).
- **⚠️ Limitasyon ng stateless JWT:** sinubukan — ang token na kinopya BAGO mag-logout ay gumagana pa (200). Hindi alam ng server na nag-logout ako. Phase 11: refresh tokens sa database.
- **Sequence diagram** (`06-auth-sequence.md`) — ang buong kuwento: register → login → me → logout.

## Mga problema at paano ko nalutas
- **Ika-apat na beses na luma ang code ng server pagkatapos ng `git pull`** (404 sa `/me` na naka-merge na). Ang ugat: binabantayan ng `--watch` ang mismong file; pinapalitan ng git ang file, kaya nawawala ito sa paningin. Sinubukan sa hiwalay na folder: `--watch` → v1 v2 (nakaligtaan ang v3); `--watch-path=./src` → v1 v2 v3. Inayos ang `dev` script — hindi na kailangang tandaan ang restart pagkatapos ng pull.

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nabura na ang cookie, bakit gumagana pa ang kinopyang token?**
  S: Stateless ang JWT: walang listahan ang server ng mga naka-logout na token. Sinusuri lang nito ang pirma at `exp`. Ang ayos (Phase 11): maikling access token + refresh token sa database na kayang i-revoke.
- **T: Bakit walang `requireAuth` ang logout?**
  S: Dapat laging gumana ang logout, kahit expired o sira ang token. Kung may `requireAuth`, 401 ang makukuha ng user na may expired na token, at hindi mabubura ang cookie niya.
- **T: Bakit 204 at hindi 200?**
  S: Ang 204 No Content ay "nagawa, pero walang ibabalik". Walang kailangang body ang logout.

## Susunod
- Day 19: Review day — balikan ang lahat ng code, `.http`, diagram at architecture → checkpoint Phase 4

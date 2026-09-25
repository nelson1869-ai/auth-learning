# Day 16 — 2026-09-25 · Phase 4

## Ano ang ginawa ko
- `npm install jsonwebtoken cookie-parser`
- `JWT_SECRET` sa `backend/.env` (idinagdag ng AI: random, 64 characters, `openssl rand -base64 48`) at placeholder sa `.env.example`
- Ni-restart ang `npm run dev` para mabasa ang bagong `.env`
- `index.js`: `cookieParser` import + `app.use(cookieParser())`; `auth.js`: `jwt` import
- Ang `jwt.sign` + `res.cookie` sa login ay idinagdag ng AI (sa kahilingan ko), kasama ang mga comment

## Ano ang natutunan ko (sa sarili kong salita)
- **HTTP ay walang alaala** — kaya kailangan ng token para "maalala" ako ng server.
- **JWT = header.payload.signature.** Nababasa ng KAHIT SINO ang payload (base64) — kaya `sub` (id) lang ang laman.
- **Hindi mapepeke:** pinalitan ang `sub` ng `"999"` → `invalid signature`. Ang `JWT_SECRET` ang susi ng lahat.
- **`httpOnly` cookie > `localStorage`:** hindi mababasa ng JavaScript (XSS), at kusang ipinapadala ng browser.
- **Cookie flags:** `httpOnly`, `sameSite: 'lax'`, `secure` (production), `maxAge` (1 oras = `expiresIn` ng JWT).
- Ang maling login ay walang `Set-Cookie`. Ang cookie ay nasa HEADERS ng sagot, hindi sa body.
- Desisyon **D-012:** HS256 muna (iisang secret), RS256 sa Phase 11.

## Mga problema at paano ko nalutas
- Hindi ko alam kung saan ilalagay ang bawat linya — ipinakita ng AI ang eksaktong puwesto: pagkatapos ng `if (!user || !ok)`, bago ang `res.json` (headers muna bago ang body).
- Kinopya ko pati ang `// ⬅️ BAGO` na pananda ng lesson — pinalitan ng tunay na comment (bakit, hindi "bago").

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 17: Protektadong route — middleware na nagbabasa ng cookie at `jwt.verify`, `GET /api/auth/me`

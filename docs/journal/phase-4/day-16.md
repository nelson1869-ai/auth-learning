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
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nababasa ng kahit sino ang payload ng JWT, ligtas ba ito?**
  S: Oo, basta walang secret sa loob (id lang, `sub`). Ang proteksyon ay ang pirma: hindi ito mababago nang hindi nalalaman. Huwag maglagay ng email, password o personal na data sa payload.
- **T: Ano ang mangyayari kapag na-leak ang `JWT_SECRET`?**
  S: Makakagawa ang attacker ng token para sa kahit sinong user (hal. `sub: 1`). Kaya nasa `.env` lang ito, iba sa dev at production, at mahaba (64 characters). Kapag na-leak: palitan, at lahat ay kailangang mag-login ulit.
- **T: Bakit parehong 1 oras ang `maxAge` ng cookie at `expiresIn` ng JWT?**
  S: Para sabay silang mag-expire. Kung mas mahaba ang cookie, magpapadala ang browser ng patay na token; kung mas maikli, mawawala ang cookie kahit valid pa ang token.

## Susunod
- Day 17: Protektadong route — middleware na nagbabasa ng cookie at `jwt.verify`, `GET /api/auth/me`

# Day 22 — 2026-09-25 · Phase 5

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko), sa pagkakasunod ng lesson:
  - **Bahagi A (frontend):** `src/api/auth.js` (`login()` gamit ang `fetch`, `credentials: 'include'`, `res.ok`), at `LoginPage` na may `user` at `error` state
  - Sinubukan sa browser → **nakita ang CORS error**
  - **Bahagi B (backend):** `npm install cors`, `CLIENT_URL` sa `.env`/`.env.example`, `app.use(cors({ origin, credentials: true }))` bago ang lahat
- Idinagdag ang preflight (#6, #7) sa `05-login.http`

## Ang CORS error (bago ayusin)
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173'
has been blocked by CORS policy: Response to preflight request doesn't pass access control
check: No 'Access-Control-Allow-Origin' header ...
```
Sa page: "❌ Failed to fetch". Walang cookie.

## Pagkatapos ayusin (sinubukan sa totoong browser)
- Tamang password → "✅ Naka-login", POST 200, cookie `token` (HttpOnly, SameSite=Lax) sa `localhost:3000`
- Maling password → "❌ Invalid email or password" (401)
- **Pekeng site** (`127.0.0.1:5199`) na tumawag din gamit ang tamang password → **hinarang** ("Failed to fetch")

## Ano ang natutunan ko (sa sarili kong salita)
- **Origin** = protocol + host + port. `:5173` ≠ `:3000`.
- **CORS** = hinaharangan ng BROWSER ang pagbasa ng sagot mula sa ibang origin, maliban kung payagan ng backend. Proteksyon ng user — hindi ng server (gumagana pa rin ang curl/REST Client).
- **Preflight (OPTIONS)** = tanong muna ng browser bago ang POST na may JSON.
- **`credentials` sa dalawang lugar** — `'include'` sa fetch at `true` sa cors.
- **Isang tiyak na origin**, hindi `*`. Para sa pekeng site, ibinabalik pa rin ng server ang `localhost:5173` — ang browser ang nagkukumpara at humaharang.
- **`fetch` ay hindi nagtatapon sa 401** — kaya `res.ok`.
- Ang bagong `--watch-path` ay napansin ang pagbabago sa `.env` → kusang nag-restart ✅.

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Pinoprotektahan ba ng CORS ang server ko?**
  S: Hindi, ang user ang pinoprotektahan nito. Ang browser ang humaharang sa pagbasa ng sagot; ang curl ay hindi pinapansin ang CORS. Nakita rin natin sa Day 44 na nakakarating pa rin sa server ang HTML form kahit may CORS, kaya kailangan ang Origin check.
- **T: Bakit hindi puwedeng `origin: '*'`?**
  S: Kapag may cookie (`credentials`), tinatanggihan ng browser ang `*`. At kahit puwede, papayagan nito ang kahit anong site na tawagin ang API gamit ang cookie ng user.
- **T: Bakit may preflight (OPTIONS) bago ang POST?**
  S: Dahil JSON ang `Content-Type`. Ang mga "hindi simpleng" request ay tinatanong muna ng browser sa server kung pinapayagan. Ang HTML form (simpleng request) ay walang preflight, kaya kailangan ng ibang depensa (Day 44).

## Susunod
- Day 23: Register gamit ang React 19 `useActionState`

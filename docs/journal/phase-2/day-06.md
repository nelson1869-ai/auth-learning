# Day 06 — 2026-09-24 · Phase 2

## Ano ang ginawa ko
- Idinagdag ang `app.use(express.json())` para mabasa ang JSON body → `req.body`
- Gumawa ng `POST /api/echo` na ibinabalik ang natanggap na body
- Hinati ang routes: `src/routes/health.js` at `src/routes/echo.js`, kinakabit sa `index.js` gamit ang `app.use('/api', router)`
- Sinubukan ang `02-echo.http` (4 na kaso: tamang JSON, walang Content-Type, sirang JSON, maling method)
- ✅ Tapos ang Phase 2 → tag `checkpoint-phase-2`

## Ano ang natutunan ko (sa sarili kong salita)
- **Request body** = ang data na kasama ng request (hal. email at password sa login). Karaniwang nasa `POST`.
- **Middleware** = function na dinadaanan ng request BAGO umabot sa route. Kaya **middleware muna, saka routes** sa `index.js`.
- **`express.json()`** = ginagawang object ang JSON text. Binabasa lang nito kapag `Content-Type: application/json` — kapag wala, `undefined` ang `req.body`.
- **`Router()`** = mini-app na may sariling routes. `/health` lang ang nasa loob; `index.js` ang nagdadagdag ng `/api`.
- **Kailangang may `.js`** sa import ng sariling file (`./routes/health.js`) — hindi hinuhulaan sa ES modules.

## Mga problema at paano ko nalutas
- **Nakabitin ang `GET /api/health`** (walang sagot, nag-timeout ang curl). Kinopya ko ang `{ /* ... */ }` mula sa halimbawa — placeholder pala iyon. Walang `res.json()` → **hindi 404, kundi walang sagot kailanman.** Aral: dapat laging sumagot ang bawat route.
- **Nasa ibaba ng router ang `express.json()`** — inilipat sa itaas (middleware muna).
- **Luma pa rin ang sagot ng server pagkatapos ng `git pull`** (404 sa echo kahit nasa code na). Hindi napapansin ng `node --watch` kapag pinalitan ng git ang buong file. Aral: **i-restart ang `npm run dev` (Ctrl+C) pagkatapos ng `git checkout` / `git pull`.**

## Mga command na natutunan ko
- `curl -H 'Content-Type: application/json' -d '{"name":"Nelson"}' URL` — magpadala ng JSON body
- `git tag -a checkpoint-phase-2 -m "..."` + `git push origin checkpoint-phase-2` — markahan ang checkpoint
- `lsof -ti :3000` — alamin kung anong proseso ang may hawak ng port 3000

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit nakabitin ang request (hindi 404) kapag walang `res.json()`?**
  S: Nakita ng Express ang route, kaya hindi 404. Pero walang sumagot, kaya naghihintay ang client hanggang mag-timeout. Ang bawat route ay kailangang sumagot sa bawat daan (`res.json`, `res.status(...).json`, o `throw`).
- **T: Bakit kailangang nasa itaas ang `express.json()`?**
  S: Pinapatakbo ang middleware ayon sa pagkakasunod. Kapag nasa ibaba ito, dumating na sa route ang request bago pa nabasa ang body, kaya `undefined` ang `req.body`. (Sa Day 41, gumawa tayo ng diagram ng buong pagkakasunod: diagram 11.)
- **T: Ano ang mangyayari kapag sira ang JSON?**
  S: 400 bago umabot sa route. Dati HTML na may stack trace; mula Day 41, `{ "error": "Invalid JSON" }`.

## Susunod
- Phase 3, Day 07: Docker at Postgres — unang araw bilang Database Engineer

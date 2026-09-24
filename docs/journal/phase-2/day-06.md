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
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Phase 3, Day 07: Docker at Postgres — unang araw bilang Database Engineer

# Day 04 — 2026-09-24 · Phase 2

## Ano ang ginawa ko
- Isinulat ang una kong server: `backend/src/index.js` (Express, port 3000)
- Unang route: `GET /api/health` → `{ "status": "ok" }`
- Sinubukan sa browser at gamit ang `curl -i`
- Code review: tama ang lahat ng linya ng `index.js` ✅
- Idinagdag ang `backend/http/01-health.http` at ang unang flowchart ng app (`01-request-lifecycle.md`)

## Ano ang natutunan ko (sa sarili kong salita)
- **Server** = programang naghihintay ng request at sumasagot; hindi humihinto hangga't hindi ko pinapatay (Ctrl+C).
- **Port** = ang "pinto" kung saan nakikinig ang server (`localhost:3000`).
- **Route = METHOD + PATH.** Kaya 404 ang `POST /api/health` kahit tama ang path.
- **`res.json()`** = sumagot ng JSON; kusang 200 ang status.
- **Default na 404 ng Express ay HTML**, hindi JSON (aayusin sa Phase 9).
- **Docker port mapping `3001->3000`:** kaliwa = port sa PC ko, kanan = port sa loob ng container. Kaya hindi ito sumasalungat sa server ko sa 3000.

## Mga command na natutunan ko
- `node src/index.js` — patakbuhin ang server
- `curl -i <url>` — magpadala ng request at makita ang headers
- `ss -ltnp | grep :3000` — alamin kung sino ang nakikinig sa isang port
- Ctrl+C — patayin ang server

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit 3000 ang port?**
  S: Karaniwan lang ito sa Node development; puwedeng kahit anong libreng port. Ang mahalaga: isang program lang ang puwedeng makinig sa isang port.
- **T: Ano ang `localhost`?**
  S: Ang sarili kong PC (`127.0.0.1`). Ang `localhost:3000` ay hindi maaabot ng ibang device; sa production, dumadaan tayo sa Cloudflare Tunnel (Day 36).
- **T: Bakit HTML ang 404 ng Express at hindi JSON?**
  S: Default iyon ng Express, para sa mga website. Sa API, dapat JSON. Inayos natin ito sa Day 41 (`notFound` → `{ "error": "Not found" }`).

## Mga problema at paano ko nalutas
- Nag-alala ako na may ibang program sa port 3000 — sinuri sa WSL, Docker, at Windows: ang server ko mismo pala iyon, at ang Grafana ay nasa 3001 (hindi conflict).

## Susunod
- Day 05: status codes at `node --watch`

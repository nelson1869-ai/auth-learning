# Day 39 — 2026-09-26 · Phase 9 · Secure headers (helmet + CSP)

## Ano ang ginawa
- **API:** `app.use(helmet())` sa `backend/src/app.ts`, **una** sa lahat ng middleware.
  - Nawala ang `X-Powered-By: Express` (bago nito, sinasabi ng server namin sa lahat kung Express ang gamit).
  - Nadagdag: HSTS, `nosniff`, `X-Frame-Options`, CSP, `Referrer-Policy`, `Cross-Origin-Opener-Policy`.
- **Frontend:** security headers sa `frontend/public/_headers` (Cloudflare Pages):
  CSP na `script-src 'self'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Test:** `backend/src/routes/security.test.ts` — sinadyang tinanggal ang `helmet()` → **bumagsak** ang test → ibinalik → pumasa (16 tests).
- **D-021:** production ay nananatiling online habang Phase 9, test accounts lang.

## Paano napatunayan (sa totoong browser, hindi lang curl)
| Saan | Sinubukan | Resulta |
|---|---|---|
| Preview (PR #52) | headers + load ng `/login` | ✅ kumpleto · 0 CSP violation |
| Preview | ipinasok na inline `<script>` (parang XSS) | ✅ **hindi tumakbo** — hinarang ng CSP |
| Production API | headers | ✅ walang `x-powered-by` · kumpleto ang helmet headers |
| Production frontend | register → login → reload → logout → `/profile` | ✅ gumana lahat · **pero 1 CSP violation** ⬇️ |

## Ang nahuli ng production (at hindi ng preview)
- Sinisingit ng Cloudflare ang **Web Analytics beacon** (`static.cloudflareinsights.com/beacon.min.js`) sa **custom domain lang** — wala ito sa preview.
- Hinarang ito ng CSP namin. Hindi nasira ang app, pero **tahimik na namatay ang analytics**.
- Ayos (PR #53): pinayagan ang **eksaktong host lang** — `script-src … https://static.cloudflareinsights.com` at `connect-src … https://cloudflareinsights.com`. Hindi `https:` (lahat) at hindi `'unsafe-inline'`.
- Pagkatapos: buong flow ulit → **0 CSP violation**, na-load ang beacon (200).
- Binura ang 3 test account na ginawa sa production (eksaktong email lang).

## Ang pinakanatutunan
- **Ang CSP ay listahan ng pinapayagan.** Lahat ng wala sa listahan ay hinaharang — kahit ang sariling tool ng Cloudflare. Kaya kailangang subukan sa **totoong production domain**, hindi lang sa preview.
- **Ang CSP ay nasa frontend ang silbi** (doon tumatakbo ang JavaScript). Sa API, helmet ang bahala sa iba pang headers.
- **Mali rin minsan ang test, hindi ang app:** una kong inasahan na lilipat sa `/profile` pagkatapos mag-register — pero by design, "Mag-login na" ang lumalabas. Basahin ang code bago sabihing may bug.
- **Maliit na detalye:** ang 404 ng Express ay may sariling CSP na `default-src 'none'` (mas mahigpit pa).

## Kumpara sa reference
- Ang reference (`server/src/app.ts`) ay may `app.use(helmet())` rin, at hiwalay na mas maluwag na CSP para sa `/api-docs` (Swagger UI, kailangan ng inline scripts). Wala pa kaming Swagger, kaya hindi pa kailangan.
- Walang frontend ang reference — kaya ang `_headers` / CSP ng frontend ay bago sa amin.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 42 — Logging (Pino, request ID, redaction), ayon sa D-021.

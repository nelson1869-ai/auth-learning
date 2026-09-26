# Day 44 — 2026-09-27 · Phase 9 · CSRF protection (Origin check) · 🏁 Tapos ang Phase 9

## Sinubukan muna ang atake, bago nagsulat ng code
Gumawa ng pekeng site (`127.0.0.1:8081`, "Libreng load! 🎁") at binuksan ito sa naka-login na Chromium:

| Atake | Nakarating sa server? | Epekto |
|---|---|---|
| HTML form → `/logout` | ✅ oo | ❌ wala — hindi isinama ang cookie (`SameSite=Lax`) |
| Pekeng "JSON" form (`text/plain`) → `/register` | ✅ oo | ❌ 400, walang account na nagawa |
| `fetch` na JSON + cookie | preflight lang | ❌ hinarang ng CORS |
| `no-cors` fetch → `/logout` | ✅ oo | ❌ walang cookie, walang epekto |

**Nakakarating** ang CSRF request sa server. Ang proteksyon ay nasa browser (cookie) at sa pagtanggap ng JSON lang.
**Ang butas:** ang `blog.nelson1869.com` ay parehong "site" para sa SameSite, kaya kapag na-hack ito, maipapadala na ang cookie.

## Ang desisyon (D-022) — pinili ko: Origin check
- **Hindi** double-submit token (`csrf-csrf`, ang gamit ng reference). Para sa JSON API na may SameSite + CORS,
  halos walang dagdag na proteksyon ang token, pero kailangan pa ng token endpoint, bagong secret, at pagbabago sa frontend.
- **`middleware/csrf.ts`:** POST/PUT/DELETE mula sa browser ay dapat may `Origin` na **eksaktong**
  `CLIENT_URL`. Kung hindi → 403, bago pa basahin ang body. Walang `Origin` (curl, REST Client) → pinapayagan.
- **Walang binago sa frontend at sa lumang `.http` files.** Kusang inilalagay ng browser ang `Origin`.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | 7 bago (37 lahat) | ✅ bumabagsak kapag inalis ang middleware · nahuhuli ang `endsWith()` na pagkakamali |
| Dev, browser | ang parehong pekeng site | ✅ 3× `csrf_blocked` sa log · naka-login pa ang biktima |
| Dev, browser | totoong frontend (Vite :5173): register → login → logout | ✅ 0 na 403 |
| Dev | lahat ng lumang `.http` (42 requests) | ✅ 0 na 403 |
| Production | `curl` na may `Origin: https://evil.example` at `https://blog.nelson1869.com` | ✅ 403 · nasa log |
| Production, browser | `https://nelson1869.com`: register → login → logout | ✅ 0 na 403 · 0 CSP violation |

## Mga pagkakamali ko ngayong araw (at paano nahuli)
- **Mali ang una kong "pagsira" ng code para sa test.** Dahil sa port (`:5173`), hindi nasubukan ang talagang
  pagkakamali. Inulit ko nang tama, at ang sibling-subdomain test na ang bumagsak, gaya ng dapat.
- **"0 na 403" na hindi ko nakitang tumakbo.** Sinuri ko: 42 requests nga ang tumakbo, at nakagawa ang mga ito
  ng 4 na account sa dev. Binura ang 4 na iyon (eksaktong id + email).

## Ang pinakanatutunan
- **Site ≠ origin.** Ang SameSite ay tumitingin sa *site* (`nelson1869.com`). Ang CORS at ang Origin check ay tumitingin
  sa *origin* (`https://nelson1869.com`, buo).
- **Subukan ang atake bago magdepensa.** Kung hindi ko sinubukan, baka gumawa ako ng malaking solusyon
  (token sa bawat request) para sa butas na maliit lang pala.
- **Hindi laging tama ang kopya ng reference.** Ibang arkitektura ang reference, kaya iba ang tamang sagot para sa amin.

## 🏁 Tapos ang Phase 9 (tag `checkpoint-phase-9`)
| Day | Ginawa |
|---|---|
| 39 | helmet (API) + CSP at security headers (frontend) |
| 40 | fail-fast config (Zod) — noong Phase 7 pa |
| 41 | sentral na error handler + DB connect timeout |
| 42 | Pino logging + request ID + redaction |
| 43 | rate limiting sa login/register — bago pa ang MVP launch |
| 44 | CSRF: Origin check |

### ✅ Checkpoint question — sagutin ko sa sarili kong salita
*Anong atake ang pinipigilan ng bawat isa sa 6 na ito?*
1. helmet / CSP: …
2. fail-fast config: …
3. error handler: …
4. logging + redaction: …
5. rate limiting: …
6. CSRF Origin check: …

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- **D-021:** "test accounts lang hanggang matapos ang Phase 9". Tapos na ang Phase 9, kaya kailangan kong pagpasyahan
  kung bubuksan na ito sa totoong users.
- Phase 10 — Roles at admin.

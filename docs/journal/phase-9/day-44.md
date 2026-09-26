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

### ✅ Checkpoint question
*Anong atake ang pinipigilan ng bawat isa sa 6 na ito?*

> ✍️ Sinulat ng AI sa hiling ko ("let you answer that act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

1. **helmet / CSP** — **XSS**: kahit may maipasok na `<script>` ang attacker, hindi ito tatakbo (nakita ko ito
   sa browser noong Day 39). **Clickjacking**: hindi mailalagay ang site ko sa invisible na iframe ng iba
   (`X-Frame-Options`). **MIME sniffing**: `nosniff`. **Downgrade sa http**: HSTS. Dagdag pa: hindi na alam ng
   attacker na Express ang gamit ko (walang `X-Powered-By`).
2. **fail-fast config** — hindi ito atake, **maling setup** ang pinipigilan nito. Kapag kulang o mali ang `.env`
   (hal. maikling `JWT_SECRET`, madaling hulaan), ayaw mag-start ng server, sa halip na tumakbo nang hindi ligtas.
3. **error handler** — **information leak**: hindi na nakikita ng attacker ang stack trace, SQL, pangalan ng table,
   o mga folder ng PC ko. Ang nakikita lang niya ay "Internal server error" at isang `requestId`.
4. **logging + redaction** — hindi nito pinipigilan ang atake, pero **nakikita** ko ito (hal. ang scanner ng
   Palo Alto, ang `Rate limit hit`, ang `csrf_blocked`). Ang **redaction** naman ay pumipigil sa **leak ng secrets
   sa logs**: walang password, cookie o token sa log.
5. **rate limiting** — **brute force / panghuhula ng password**: 10 maling login bawat 15 minuto bawat totoong IP,
   pagkatapos ay 429. Sa register: pumipigil sa paggawa ng napakaraming account.
6. **CSRF Origin check** — **CSRF**: ibang site (o na-hack na subdomain ko) na gumagamit ng browser ko para
   magpadala ng request na may cookie ko. Ang POST ay tinatanggap lang mula sa `https://nelson1869.com`.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- **D-021:** "test accounts lang hanggang matapos ang Phase 9". Tapos na ang Phase 9, kaya kailangan kong pagpasyahan
  kung bubuksan na ito sa totoong users.
- Phase 10 — Roles at admin.

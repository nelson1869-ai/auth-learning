# Day 62 — 2026-09-27 · Phase 12 · Review day · 🏁 Tapos ang Phase 12

## Ano ang ginawa (review)
Sa hiling ko ("review all .md and html and .http"), **lahat** ng 115 na `.md`, `.html` at `.http` ang sinuri, hindi lang ang sa Phase 12.

- **🔍 Lahat ng `.http` (20 + production):**
  - Bawat file sa **bagong dev server**, sunod-sunod. Ikinumpara ang **bawat inaasahan** (status at body) sa aktuwal na sagot.
  - Ginawa rin nang totoo ang mga hakbang na manual:
    - `PASTE-DITO` gamit ang token mula sa terminal: reset `202 204 400 200`; verify `200 202 204 400 · true · 409`;
    - `db:set-role` sa gitna ng session: `403 → 200` nang walang bagong login;
    - 11 maling login: `10 × 401 → 429`;
    - pinatay ang DB: `500` pagkalipas ng ~5s, may `requestId`.
  - `prod/01-production.http` (read-only lang): **8/8 tugma** sa production.
  - Binura ang 15 demo account sa dev. Admin na lang ang natira.
- **🔍 Lahat ng diagram:** na-render ang 40. Ikinumpara ang ER sa `schema.ts` (4 na table, lahat ng column) at ang diagram 11 sa `app.ts` (pagkakasunod ng middleware).
- **🔍 Mga link at file path** sa lahat ng doc: walang sira. Ang mga "nawawala" ay folder, gitignored (`.env.production`, `index.html`), o makasaysayan (`index.js` noong Phase 2).
- **🔍 API contract:** 17/17 na endpoint ang tugma sa code.
- **🔍 59 na journal:** lahat ay may "Mga tanong ko pa" na may laman.
- **Kalusugan:**
  - backend: 146 tests · tsc · lint · `npm audit` 0;
  - frontend: typecheck · lint · build · `npm audit` 0.

## Ang mga nakitang luma, at inayos
| File | Luma | Ngayon |
|---|---|---|
| `01-health`, `02-echo`, `03-users-count.http` | HTML ang inaasahang error ("Cannot GET", "SyntaxError", "Failed query" na may SQL!) | JSON mula Day 41 (`{ "error": "Not found" }`, `Invalid JSON`, `Internal server error` + `requestId`). Iniwan ang "dati" bilang aral |
| `06-me.http` | walang `emailVerified` | nandoon na (Day 60) |
| `07-logout.http` | isang Set-Cookie | dalawa (pati `refresh_token`, Day 51) |
| diagram 11 | rate limit sa "login / register" lang; audit sa 4 na action | 5 endpoint na may limit; 14 na audit action |
| diagram 02 (ER) | 6 na `action` + "admin_…" | kumpletong listahan ng 14 |
| `06-architecture.md` | "Phase 11, sinuri Day 57"; walang `resend-verification`; walang Phase 12 row | Phase 12, sinuri Day 62 |
| `04-decisions.md` | "lulutasin" pa ang pagbawi ng token | Update: nalutas noong Day 53 |
| `AGENTS.md` | "Iwan ang Mga tanong ko pa kay Nelson"; walang deploy/HTTPS push/resend.dev | tugma sa aktuwal na paraan ng trabaho |
| `05-how-we-work.md` | walang AI Q&A; walang "huwag i-paste ang token sa chat" | idinagdag |
| `03-roadmap.md` | walang "TAPOS ✅" ang checkpoint ng Phase 2–7 at MVP (kahit may tag na) | may marka at petsa na |

**Bakit ito mahalaga:** ang `.http` na mali ang inaasahan ay nagtuturo ng mali. Kapag HTML pa ang sinasabi pero JSON ang lumabas, iisipin kong sira ang server.
At ang **tanging paraan para mahuli ito ay patakbuhin at ikumpara**. Ang mga linyang ito ay tama noong isinulat, kaya hindi sila mapapansin sa pagbasa lang.

## 🏁 Buod ng Phase 12 (tag `checkpoint-phase-12`)
| Day | Ginawa |
|---|---|
| 58 | Resend + sariling domain: SPF, DKIM, DMARC PASS · fail-fast sa production na walang key |
| 59 | password reset: single-use token (hash, 1 oras) sa `#fragment` · laging "kung may account…" · email sa background |
| 60 | email verification (soft, D-026) · resend na may rate limit · `emailVerified` sa `/me` |
| 61 | mga page sa frontend: forgot, reset, verify, paalala sa Profile · `useHashToken` |
| 62 | review ng lahat ng doc |

### ✅ Checkpoint: *Nakatanggap ka ng totoong reset email sa sarili mong inbox.*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.

**TAPOS ✅.** Humingi ako ng reset link para sa `nelson1869ai@gmail.com` sa production. Dumating ito sa **Inbox**, hindi na sa Spam
(noong Day 58, Spam pa ang test email kahit PASS ang SPF/DKIM/DMARC, dahil bago pa ang domain).
Natutunan ko rin na **hindi dapat i-paste ang link** kahit kanino: nai-paste ko ito sa chat, kaya pinatay ang token sa database.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| **I-verify ang admin email ko sa production** | Hindi pa verified (Profile → "Ipadala ulit ang link" → buksan sa Gmail) | ako, kahit kailan |
| **D-021: bubuksan na ba sa totoong users?** | Desisyon ko | bago ang friend test |
| Durable na email queue | Nasa memory ang `runInBackground`: kapag nag-crash ang server, nawawala ang email | kapag may totoong users |
| Reputasyon ng domain (warm-up) | Nag-Spam ang unang email | kusang gumaganda sa paggamit |
| `tokenVersion` · absolute na limit ng session · key rotation (`kid`) · cursor pagination | mula sa Day 57 | kapag kailangan |
| Retention (`audit_logs`, tokens) | Lumalaki nang walang hangganan | Phase 18, Day 90 |
| Controllers + services | Review finding (Day 50) | Phase 16 |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano nangyaring luma ang `.http` kung pumapasa naman lahat ng tests?**
  S: Ang tests ay sumusuri sa **code**. Ang komentong `### Ang inaasahan: …` sa `.http` ay **teksto lang**, walang nagpapatakbo nito.
  Nang dumating ang errorHandler (Day 41), nagbago ang sagot, pero walang test na bumagsak dahil sa lumang komento. Kaya kailangan ng review day.
- **T: Bakit hindi na lang burahin ang "dati: HTML" na paliwanag?**
  S: Aral iyon: dati, nakikita ng kahit sino ang SQL sa error. Mas naiintindihan ko kung bakit may errorHandler kapag nakikita ko ang dati at ngayon.
- **T: Bakit binasa muna ang production `.http` bago patakbuhin?**
  S: Kung may register ito na `@example.com`, magba-bounce ang email at masisira ang reputasyon ng domain (Day 60). Read-only pala ito (health, CORS, headers), kaya ligtas.

## Susunod
- **Phase 13 — Account lockout** (Day 63): 5 maling password → 15 minutong lock bawat account, hiwalay sa IP rate limit.

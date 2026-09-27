# Day 74 — 2026-09-27 · Phase 16 · Service layer (1/3): pundasyon, register, login

## Bakit
Ang `routes/auth.ts` ay 470 linya: URL, pagsuri ng input, SQL, argon2, lockout, cookies at status codes, **lahat magkakahalo**.
Review finding pa noong Day 50. Ang problema: hindi masubok ang logic nang walang Express, at madaling magkamali sa pagkakasunod.
Halimbawa, ang cookie na nauna sa pagsulat sa database (ang bug ng Day 68).

**Ang hati:**
| Layer | Trabaho | Hindi dapat nasa loob |
|---|---|---|
| **route** (`routes/auth.ts`) | URL + middleware (rate limit, requireAuth) → handler | logic, SQL |
| **controller** (`controllers/`) | suriin ang input → tawagin ang service → status, body, cookies | SQL, argon2, patakaran |
| **service** (`services/auth/`) | ang patakaran ng negosyo; tumatanggap ng plain na input at `audit` function; nagbabalik ng maliit na resulta | `req`, `res`, status codes, cookies |

## Ano ang ginawa (4 na hakbang, bawat isa ay may commit at 175/175 na test)
1. **`lib/audit.ts`:** `writeAudit(source, event)` na walang `req`, at `auditFor(req)` bilang "adapter". Ang controller ay nagbibigay sa service ng `Audit` function
   na nakakabit na ang IP at user agent. **Naayos ang Day 50 finding.** Nananatili muna ang lumang `audit(req, …)` para sa mga route na hindi pa nalilipat.
2. **`controllers/http.ts`:** cookie options at setters, `deviceOf(req)`, at bagong `parseOr400(schema, input, res)`.
3. **Register:** `services/auth/registration.service.ts` → `created | email_taken`. Ang controller → 201/409, at ang email pagkatapos sumagot.
   Kasama: `db/errors.ts` (`isUniqueViolation`) at `services/auth/verification.service.ts` (ang dalawang email). Nawala ang doble na `sendVerificationEmail` sa route.
4. **Login:** `services/auth/login.service.ts` → `invalid | locked(retryAfter) | ok(tokens)`. Nasa service ang buong desisyon: aling bilang, reserve, argon2, at transaction.
   Ang controller → 401, o 423 + `Retry-After`, o 200 + cookies, **pagkatapos** bumalik ang service. Kaya imposible na ngayong mag-set ng cookie bago ang commit.

**Resulta:** `routes/auth.ts` 470 → 302 linya. Walang binagong test, at walang binagong ugali.

## 🐛 Nahuli sa gitna: isang bug sa tests mula Day 71
Sa hakbang 3, bumagsak ang "same 401 for a wrong password and an unknown email". **Hindi ko sinisi ang refactor**: walang kinalaman ang register sa login.
Tiningnan ko ang test DB: **50 row sa `unknown_login_attempts`, at naka-lock ang `wala@example.com`**.
- **Sanhi:** walang user na kasamang nabubura ang mga row na ito (walang FK), kaya naiipon sila sa bawat takbo ng test.
  Ang test na laging parehong email ay naging 423 pagkatapos ng 5 takbo sa loob ng 15 minuto. Hindi ito lumabas noong Day 71–73 dahil hindi pa ganoon kadalas ang takbo.
- **Ayos:** binubura ng `test/setup.ts` ang table bago ang bawat test file. Hiwalay na commit. 3 sunod-sunod na buong takbo: 175/175.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Bawat hakbang: tsc · lint · buong suite | ✅ 175/175, **walang binagong test** |
| Sinira ang login service | ✅ bumagsak ang 6 na test, kaya ang bagong code talaga ang tinatakbo |
| 23 `.http` (review script) | ✅ 23/23 |
| Production | (pagkatapos ng deploy) |

## Mga diagram
- **03 (register):** may kahon na ang **CONTROLLER** at ang **SERVICE**. **Nahuling sira mula Day 68:** nawala ang arrow mula sa `argon2.hash`
  papunta sa INSERT (nang ilagay ko ang INSERT sa kahon). Naibalik.
- **04 (login):** bagong maliit na diagram na "sino ang gumagawa ng ano" (route → controller → service → lib).
- **01, 19, 20** at ang `.http` 04, 05, 21, 22, 23: tumuturo na sa controller o service.
- **`backend/README.md`:** "auth.ts (register/login/me/logout)" pa ang nakasulat (12 endpoint na). Hindi ito nahuli ng mga review, dahil bilang at path ang hinahanap ko, hindi listahan.

## Kumpara sa reference
- **Pareho:** walang Express ang services, `auditFor(req)`, `parseOr400`, result union (`{ status: … }`), at server-derived na mga field sa HULI ng spread.
- **Iba:** dito, isang flow bawat commit, at may pagsira para patunayang ang bagong code ang tinatakbo ng tests.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang pakinabang kung pareho lang ang ginagawa ng app?**
  S: Ang refactor ay pagbabago ng HUGIS, hindi ng ugali. Ang pakinabang ay sa susunod na pagbabago: alam mo kung saan ilalagay ang bagong patakaran (service)
  at ang bagong status code (controller). At hindi na posibleng mag-set ng cookie bago ang commit, dahil walang `res` ang service.
- **T: Paano ko nalaman na walang nasira?**
  S: 175 test na hindi ko binago, na pumasa sa bawat hakbang. Kung binago ko ang test kasabay ng code, hindi ko malalaman kung alin ang mali.
- **T: Bakit may `auditFor(req)` pa, hindi ba `req` pa rin iyon?**
  S: Sa controller lang ito tinatawag, dahil HTTP layer iyon. Ang service ay tumatanggap ng function na "itala ito", at hindi nito alam kung saan galing ang IP.
- **T: Bakit hindi ko binago ang test nang bumagsak ito sa hakbang 3?**
  S: Dahil ang unang tanong ay "bakit?", hindi "paano ko ito papasahin?". Totoong bug sa isolation ng tests ang sagot, at hiwalay itong inayos.

## Susunod
- **Day 75:** me, refresh, logout, sessions, at change-password → controller + service.

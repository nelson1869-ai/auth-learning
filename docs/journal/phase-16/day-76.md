# Day 76 — 2026-09-27 · Phase 16 · Service layer (3/3): ang natitira, at ang huling hugis

## Ano ang ginawa (3 hakbang, bawat isa ay may commit at 175/175 na test)
| Hakbang | Service | Controller (HTTP) |
|---|---|---|
| a | `password.service.ts`: `requestPasswordReset`, `resetPassword` | forgot: **sumasagot muna** (202), saka ang lahat sa background · reset: `invalid` → 400, `reset` → 204 + device cookie |
| b | `verification.service.ts`: `verifyEmail`, `checkResendVerification` | verify: 204/400 · resend: 401/409, o 202 + email sa background |
| c | `admin.service.ts`, `users.service.ts` | admin: pagination → JSON · users count |

- **`routes/auth.ts` ay routing na lang: 470 (Day 73) → 302 → 157 → 63 linya.** Ang `routes/admin.ts` ay 16 linya (nandoon pa rin ang bantay: `requireAuth + requireRole` para sa lahat ng `/api/admin/*`).
- **Inalis ang pansamantalang `audit(req, …)`** (Day 74). Ang `requireRole` ay gumagamit na ng `auditFor(req)`, kaya wala nang tumatawag sa luma.
- **Isinulat ulit ang buong `routes/auth.ts`**, at ikinumpara ang bawat URL at middleware bago at pagkatapos: pareho. Ang handler lang ang nagbago.
- **Ang tanging binago sa mga test:** ang import path ng `listUsers` sa `pagination.test.ts` (lumipat mula `routes/admin.ts` papuntang `services/admin.service.ts`).

### Isang maliit na pagbabago sa forgot-password
Ang `auditFor(req)` ay tinatawag na **bago** ang background task, hindi sa loob nito. Parehong data (IP at user agent), pero hindi na umaasa ang background sa `req`
pagkatapos masagot ang request.

## Sinuri ang mga tuntunin ng bawat layer (grep, hindi hula)
| Tuntunin | Resulta |
|---|---|
| Walang controller na nag-i-import ng `db`, drizzle o argon2 | ✅ (ang isang "tumugma" ay comment lang) |
| Walang service na nag-i-import ng `express` o gumagamit ng `req`/`res` | ✅ |
| Walang route na may `db`, argon2, Zod o `.status(` | ✅ pagkatapos ilipat ang `/users/count` (Day 9), na tumatawag pa noon sa `db` sa route |
| `lib/` na may Express | `audit.ts` lang: ang `auditFor(req)`, **sinadya** (ito ang adapter) |

**Nalutas na ang review finding ng Day 50** (nakasulat na sa `06-architecture.md`).

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Bawat hakbang: tsc · lint · buong suite | ✅ 175/175 |
| Sinira ang `verifyEmail` at `resetPassword` sa mga service | ✅ bumagsak ang 4 at 6 na test |
| 23 `.http` (review script) | ✅ 23/23 |
| Mga manual na hakbang na nagbago ngayon: reset gamit ang totoong token · verify at resend · `db:set-role` → admin · patay na DB → `/users/count` | ✅ 202 204 400 200 · 202 204 400 409 · 403 → 200, 400 sa `limit=999`, audit-logs 200 · 500 + requestId |
| Production | (pagkatapos ng deploy) |

## Mga diagram at docs: "LAHAT ng diagram" (ayon sa roadmap)
- **00 (architecture):** isinulat ulit ang backend: **routes → controllers → services → lib/db**.
  **Nahuling luma:** walang ForgotPassword, ResetPassword at VerifyEmail (Day 61) sa listahan ng frontend pages, at "registerSchema · loginSchema" lang ang `validations`.
- **01, 11, 13, 18, 19, 07, 04:** tumuturo na sa controller at service.
  **Nahuling luma mula Day 74:** ang "audit(req, login)" sa **loob ng mga node** ng login diagram. Hindi ito nahuli noon, dahil ang header lang ang sinuri ko.
- **Sinuri ang header ng bawat diagram:** lahat ng diagram ng endpoint na may logic (03–06, 13–19) ay bumabanggit sa controller at service.
  Ang wala: ER, CI/CD, headers, CSRF, at race (service lang ang tinatalakay nito), na hindi naman tungkol sa isang endpoint.
- **`.http`** 03, 13, 14, 15, 19, 20 · **`06-architecture.md`** (ang huling hugis + nalutas na finding) · `backend/README.md` · roadmap · README.

## 🏁 Buod ng Day 74–76
| | Day 73 | Day 76 |
|---|---|---|
| `routes/auth.ts` | 470 linya (lahat magkakahalo) | 63 linya (routing lang) |
| Logic | nasa routes | 7 service file, walang Express |
| HTTP (status, cookies) | nasa routes | 3 controller + `http.ts` |
| Tests | 175 | 175, walang binago (maliban sa isang import path) |
| Mga bug na nahuli sa daan | — | 1 sa test isolation (Day 71) + ilang luma sa docs bawat araw (nakalista sa journal ng Day 74, 75 at 76) |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit nasa controller pa rin ang "sumagot muna" ng forgot-password?**
  S: Tungkol iyon sa KAILAN ipinapadala ang sagot (HTTP), hindi sa patakaran ng negosyo. Ang service ay walang alam sa "sagot". Ginagawa lang nito ang lookup, audit at email kapag tinawag.
- **T: Kung routing lang ang `routes/`, bakit nandoon pa ang `requireAuth + requireRole` ng admin?**
  S: Dahil iyon ang "sino ang puwedeng pumasok sa URL na ito": bahagi ng routing. Isang lugar lang para sa lahat ng `/api/admin/*`, kaya hindi makakalimutan sa bagong admin route.
- **T: Paano ko nalaman na walang nawalang route nang isulat ko ulit ang buong file?**
  S: Ikinumpara ko ang listahan ng bawat `router.get/post/delete/use` (URL at middleware) bago at pagkatapos. Ang tanging pagkakaiba ay ang pangalan ng handler.
- **T: Bakit may mga luma pa rin sa docs kahit ilang review na?**
  S: Iba-iba ang hinahanap ng bawat pagsusuri: mga path, bilang, header. Ang "audit(req, login)" ay nasa loob ng isang node, kaya hindi nahuli ng pagsuri sa header.
  Aral: kapag nag-refactor, hanapin ang **pangalan ng function** na nagbago (`audit(req`), hindi lang ang pangalan ng file.

## Susunod
- **Day 77 — Mass-assignment guard:** test na may isiningit na `userId` sa body. Parsed na input lang ang ipinapasa sa service.

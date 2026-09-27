# Day 75 — 2026-09-27 · Phase 16 · Service layer (2/3): sessions at change password

## Ano ang ginawa (3 hakbang, bawat isa ay may commit at 175/175 na test na walang binago)
| Hakbang | Service | Resulta ng service → HTTP (controller) |
|---|---|---|
| a | `session.service.ts`: `getMe`, `listMySessions`, `revokeMySession` | user o `undefined` → 200/401 · `not_found` → 404 · `revoked(wasCurrent)` → 204 (+ burahin ang cookies kung ito mismo) |
| b | `session.service.ts`: `refreshSession`, `logout` | `rotated` → 204 + 2 cookie · `grace` → 204 + access cookie · `reused`/`invalid` → 401 + burahin ang cookies |
| c | `password.service.ts`: `changePassword` | `no_user` → 401 · `wrong_password` → 400 · `changed` → 204 + 3 cookie |

**`routes/auth.ts`: 470 (Day 73) → 302 (Day 74) → 157 linya.** Ang natitira: forgot, reset, verify, resend (Day 76).

### Mga desisyon sa disenyo
- **Refresh reuse:** ang **service** ang nagtatala sa audit (patakaran ng negosyo: "ito ay pagnanakaw"), at ang **controller** ang nagla-log gamit ang `req.log`,
  para kasama ang `requestId` ng request sa log.
- **Change password:** `{ ...input, userId, device }`. Ang mga field na galing sa server ay nasa **HULI** ng spread, kaya hindi ito mapapalitan ng body.
  Iyon ang Day 77 (mass assignment).
- **Hindi UUID na session id → 404 sa controller**, bago pa tanungin ang database. HTTP-level na pagsuri ito ng URL, kaya hindi na kailangang umabot sa service.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Bawat hakbang: tsc · lint · buong suite | ✅ 175/175, walang binagong test |
| Sinira ang bawat bagong service: refresh laging invalid · getMe laging undefined · laging maling password | ✅ bumagsak ang 14, 8 at 5 test, kaya ang bagong code talaga ang tinatakbo |
| Rollback tests (Day 55, 68) na may `vi.mock` ng `lib/` | ✅ pumasa pa rin: ang service ay gumagamit ng parehong mga module |
| 23 `.http` (review script) | ✅ 23/23 |
| Production (**dalawang** totoong browser, `delivered+…@resend.dev`) | ✅ login A at B → "Mga device ko" ng A: **2 session**, may "ito ang device mo" → A: change-password 204 → A naka-login pa rin · **B: refresh 401** (na-logout) → A logout · DB: `password_change` ×2, `logout` ×1 · 0 JS error · binura |

## Mga diagram at docs
- **16 (change password):** may kahon na ang **CONTROLLER** at **SERVICE**, at nasa loob ng service ang transaction.
  Makikita na ang cookies ay "PAGKATAPOS ng commit lang".
- **"Code:" header** ng 05, 06, 12, 14, 15, 16, 17, at ng `.http` 06, 07, 16, 17, 18: tumuturo na sa controller at service.
- **Dalawang luma mula kahapon (Day 74) na nahuli ngayon:**
  - ang header ng diagram 04 ay `routes/auth.ts` pa rin (nagdagdag ako ng section pero hindi ko binago ang header);
  - ang diagram 12 at `.http` 07 ay tumuturo pa sa `COOKIE_OPTIONS` sa `routes/auth.ts`, pero nasa `controllers/http.ts` na ito mula kahapon.

  Nahuli dahil hinanap ko ang **lahat** ng `routes/auth.ts` sa docs, hindi lang ang mga may kinalaman sa flow ngayong araw.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit may `userId` sa input ng change password pero wala sa body?**
  S: Galing ito sa `requireAuth` (sa token), hindi sa user. Idinadagdag ito ng controller **pagkatapos** ng mga field na galing sa body, kaya kahit magpadala
  ang attacker ng `"userId": 1` sa body, hindi nito mapapalitan ang password ng ibang tao. (Wala rin iyon sa schema, kaya tinatanggal ito ni Zod.)
- **T: Bakit hindi sa service ang 404 para sa hindi-UUID na id?**
  S: Pagsuri iyon ng hugis ng URL, kaya HTTP. Ang service ay tumatanggap ng tamang UUID. At hindi na tinatanong ang database sa maling id (dati: 500 mula sa Postgres).
- **T: Paano ko malalaman na hindi nagbago ang ugali?**
  S: 175 test na hindi ko ginalaw ang pumasa pagkatapos ng bawat hakbang, at 23/23 ang `.http`. Kapag binago ko ang test kasabay ng code,
  hindi ko malalaman kung alin ang nagbago.

## Susunod
- **Day 76:** forgot, reset, verify, resend at admin → controller + service. Aalisin na ang pansamantalang `audit(req, …)`, at ia-update ang LAHAT ng diagram at architecture (ang huling hugis).

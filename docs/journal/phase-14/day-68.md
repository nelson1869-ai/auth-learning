# Day 68 — 2026-09-27 · Phase 14 · Transactions (lahat o wala, side effects pagkatapos)

## Ang dalawang tuntunin
1. **Lahat o wala:** kapag maraming pagsulat ang isang aksyon, nasa iisang transaction ang lahat. Kapag pumalya ang isa, **rollback** ang lahat.
2. **Side effects PAGKATAPOS ng commit:** cookies, email at audit. Kapag nauna ang side effect at nag-rollback ang database,
   naipadala na ang cookie o email para sa bagay na **hindi nangyari**.

## Ano ang ginawa
Hindi lang change at reset password ang sinuri (tapos na iyon noong Day 55/59). **Lahat ng route** ay tiningnan kung may cookie na nauuna sa pagsulat sa database.

### 🐛 Nahuli: ang login
- Dati: `setAccessCookie(...)` **muna**, saka `await createRefreshToken(...)`.
- **Pinatunayan muna bago inayos** (pass-through mock na pumapalya ang pag-save ng refresh token):
  `login = 500`, pero may `Set-Cookie: token` at `device_token`, at **200 ang `/me`**.
  Ibig sabihin: **"nabigo" ang login pero naka-login ako nang 15 minuto**, at **walang `login` sa audit log**.
- Bakit nangyari? Nilalagay lang ng `res.cookie()` ang header sa sagot. Kapag nag-error pagkatapos, ipinapadala ng errorHandler ang 500 **kasama ang mga header na iyon**.
- **Ayos:** iisang transaction ang refresh token at ang trusted device, at **pagkatapos** ng commit lang ang cookies at audit.

### Mga bagong rollback test (`routes/transactions.test.ts`)
| Kaso | Patunay |
|---|---|
| Login: pumalya ang refresh token | 500, **walang Set-Cookie**, 401 ang `/me`, walang naiwang device, walang `login` audit |
| Login: pumalya ang trusted device | 500, walang cookie, **walang naiwang refresh token** (rollback) · ang ulit ay gumagana |
| Change password: pumalya ang huling hakbang | hindi nabawi ang tiwala ng mga device (Day 64 na pagsulat), hindi na-logout, gumagana ang lumang password |
| Reset password: pumalya ang huling hakbang | naka-lock pa rin, hindi nabawi ang device, hindi na-logout, at **magagamit ULIT ang link** |

### Mga diagram (transaction boundary gamit ang `subgraph` / `rect`)
- **16 (change password):** 5 hakbang sa loob ng kahon, commit → cookies, pumalya → rollback.
- **18 (reset):** 4 na hakbang sa loob ng `rect`.
- **04 (login):** bagong transaction bago ang cookies.
- **03 (register):** iisang INSERT, kaya atomic na, at walang kailangang transaction. **Nahuling luma:** wala pa sa diagram ang verification email (Day 60). Naidagdag na.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Probe bago ang ayos | ⚠️ `login=500 cookies=device_token,token /me=200` |
| Bagong tests bago ang ayos | ✅ bumagsak ang 1 (login, refresh token); pumasa ang 3 (tama na ang pagkakasunod noon) |
| Sadyang sira 1: cookie bago ang transaction | ✅ bumagsak ang 2 test. (Unang subok: **hindi na-apply ang sira** dahil bumagsak ang script ko, kaya ang "pumasa" ay galing sa hindi binagong code. Inulit nang tama.) |
| Sadyang sira 2: walang transaction | ✅ bumagsak ang "walang naiwang refresh token" (at nahuli rin ng tsc ang hindi nagamit na `tx`) |
| 22 `.http` (review script) | ✅ 22/22 |
| Buong suite · tsc · lint | ✅ 167 |

## Isang pagkakamali ko sa pagpapatakbo, at ang bantay na idinagdag
Dalawang beses kong pinatakbo nang sunod ang review script. `exit=1` ang pangalawa. **Hindi ang code ang mali:** hindi ko binura ang mga account
mula sa unang takbo, kaya 409 ang mga register na inaasahang 201. Pinatunayan: sa malinis na DB, `exit=0`, 22/22.
**Bantay:** tumatanggi na ngayon ang script kapag hindi malinis ang dev DB (`⛔ … burahin muna`, exit 2). Sinubukan gamit ang isang pekeng row.

## Kumpara sa reference
- **Pareho:** `db.transaction`, hash BAGO ang transaction, cookies/email/audit pagkatapos ng commit, pass-through `vi.mock` + `mockRejectedValueOnce`.
- **Iba:** ang reference ay may `createSessionTokens` (DB, tx-able) + `setSessionCookies` (HTTP) para sa lahat ng route. Dito, inayos lang ang pagkakasunod
  sa login. Kapag nagkaroon ng controllers/services (Phase 16), magiging ganoon din.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit may cookie pa rin kahit 500 ang sagot?**
  S: Hindi agad ipinapadala ng `res.cookie()` ang cookie. Isinusulat lang nito ang `Set-Cookie` header sa sagot na binubuo pa. Kapag nag-error pagkatapos,
  ang errorHandler ang nagpapadala ng sagot (500), at kasama pa rin ang header na naisulat na.
- **T: Bakit hindi na lang ilagay sa transaction ang audit?**
  S: Puwede, pero ang audit ay talaan ng **nangyari**. Kapag isinama at pumalya ito, mawawala ang login kahit tama ang lahat. Ang tuntunin ng reference:
  audit pagkatapos ng commit. Ang panganib ay isang login na walang audit kapag pumalya ang audit mismo (bihira, at makikita sa error log).
- **T: Bakit hindi kailangan ng transaction ang register?**
  S: Iisang INSERT lang ito, at atomic na ang bawat statement sa Postgres. Kailangan lang ang transaction kapag **dalawa o higit pa** ang pagsulat na dapat magkasama.
- **T: Paano ko nalaman na talagang na-apply ang sadyang sira?**
  S: Tingnan ang `git diff` bago patakbuhin ang test. Nang bumagsak ang script ko, walang diff, pero pinatakbo ko pa rin ang test, at "pumasa" ito. Iyon ang aral.

## Susunod
- **Day 69 — Unique constraint bilang huling bantay:** sabay na register ng parehong email → 409, hindi 500. (May test na mula Day 66, at pumasa. Susuriin kung may ibang lugar na kailangan pa.)

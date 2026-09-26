# Day 50 — 2026-09-27 · Phase 10 · Review day · 🏁 Tapos ang Phase 10

## Ano ang ginawa (review)
- **🔍 Lahat ng `.http` laban sa code:** 14 na file (hindi kasama ang rate-limit), **bagong server bawat file**. Tugma ang lahat.
  - ⚠️ **Invalid ang unang subok:** iisang server para sa lahat, kaya nag-429 ang rate limiter mula sa mga naunang file,
    at mukhang sira ang mga huli kahit hindi. Aral: suriin ang precondition bago magtiwala sa resulta.
- **🔍 Lahat ng diagram laban sa code** (PR #74): 6 na diagram ang luma na mula Day 44–49 (walang audit, walang admin,
  walang CSRF sa diagram 00). Inayos, na-render-check (10 block), at nire-rebuild ang `index.html`.
- **🏗️ Folder structure** laban sa `06-architecture.md`:
  - nadagdag ang tree na "Ngayon — Phase 10";
  - naitama ang `index.js`/`env.js` → `.ts`;
  - may **review finding**: ang `lib/audit.ts` ay tumatanggap ng `req`, at nasa routes ang mga query.
    Lumalabag ito sa sarili nating patakaran; aayusin sa Phase 16 (controllers + services).
- **Kalusugan ng `main`:** backend 75 tests · tsc · lint · `npm audit` (high) — lahat ✅ · frontend typecheck · lint (0 babala) · build — lahat ✅.

## 🏁 Buod ng Phase 10 (tag `checkpoint-phase-10`)
| Day | Ginawa |
|---|---|
| 45 | `role` (enum `user`/`admin`) + `set-role.ts`, walang password sa code (D-023) |
| 46 | `requireRole`: 401 vs 403, role mula sa database (agad tumatalab) |
| 47 | pagination: `?page=&limit=`, may max, 400 kapag mali |
| 48 | audit log: sino, ano, kanino, totoong IP, kailan |
| 49 | admin page sa frontend; nakatago ang link, pero ang backend ang bantay |
| 50 | review |

### ✅ Checkpoint question: *Ano ang pagkakaiba ng 401 at 403?*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

- **401 Unauthorized = "Sino ka?"** Hindi ka kilala ng server: walang cookie, sira o expired ang token, o nabura na ang account.
  Ang ayos: **mag-login**. Sa app ko: `requireAuth` → `{ "error": "Not authenticated" }`, at ililipat ako ng frontend sa `/login`.
- **403 Forbidden = "Kilala kita, pero bawal ka rito."** Naka-login ako, pero hindi sapat ang role ko (hal. `user` sa `/api/admin/*`).
  Hindi ito maaayos ng pag-login ulit. Sa app ko: `requireRole('admin')` → `{ "error": "Forbidden" }`, may log na `forbidden`
  at audit row na `access_denied`.
- **Ang pagkakasunod:** authentication muna (401), saka authorization (403). Hindi masasabi kung bawal ka kung hindi pa alam kung sino ka.
- **Kakaibang pangalan:** "Unauthorized" ang pangalan ng 401, pero ang ibig sabihin talaga ay *unauthenticated*.
- **Mga detalye sa app ko:**
  - Kahit sa `/api/admin/wala-ganito`, 401 ang makukuha ng hindi naka-login, hindi 404, para hindi malaman kung anong admin routes ang mayroon.
  - Hindi sinasabi ng 403 kung anong role ang kailangan.
  - Ang role ay binabasa sa database, kaya ang tinanggalan ng admin ay agad na 403, walang hintay sa pag-expire ng token.

## 📋 Backlog (pinagsama mula Day 39–50)
| Ano | Bakit | Kailan |
|---|---|---|
| **D-021: bubuksan na ba sa totoong users?** | Tapos na ang Phase 9 (ang kondisyon). Desisyon ko | ngayon / bago ang friend test |
| Friend test ng MVP | Ang success criterion ng Day 01 | kapag may pagkakataon |
| Retention ng `audit_logs` (hal. 1 taon) | Lumalaki nang walang hangganan; personal na data (IP, email) | bago buksan sa lahat |
| Cursor pagination (`?before=<id>`) | Nakita ang pag-usog ng page 2 (Day 48) | kapag malaki na ang data |
| Controllers + services | Review finding sa itaas | Phase 16 |
| Kusang deploy (timer sa PC) | Manual pa ang `deploy.sh` | pagkatapos ng Phase 9 (na tapos na) |
| Coverage report (`@vitest/coverage-v8`) | Hindi pa sinusukat kung gaano kalaki ang nasusubukan | Phase 16 (QA) |
| Mga kulang sa reference: `connectionTimeoutMillis`, `pool.on('error')`, echo ng URL sa 404, `headersSent` | Nakita sa Day 10 at 41 | kapag inayos ang reference |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit kailangang bagong server bawat `.http` file sa review?**
  S: Nasa memory ng server ang bilang ng rate limiter. Kapag iisang server, ang mga maling login sa naunang file ay sumasalo sa bilang
  ng mga susunod, kaya 429 ang lalabas kahit tama ang code. Ang restart ang nagbubura ng bilang.
- **T: Kung gumagana naman, bakit problema na nasa routes ang logic?**
  S: Ngayon, maliit pa ito. Pero para masubukan ang logic, kailangan ng buong Express at HTTP request. Kapag nasa service ito
  (plain na function na walang `req`), mas madali itong subukan at gamitin muli (hal. sa script o background job).
- **T: Bakit mahalaga ang review day kung may tests at CI na?**
  S: Hindi sinusubukan ng CI ang docs. Anim na diagram ang luma na, at walang error na lumabas. Ang review lang ang nakahuli.

## Susunod
- **Phase 11 — Mas ligtas na sessions** (refresh tokens na kayang i-revoke, para gumana talaga ang logout, D-012).

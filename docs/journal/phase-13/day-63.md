# Day 63 — 2026-09-27 · Phase 13 · Per-account lockout

## Bakit
Ang rate limit (Day 43) ay **bawat IP**: 10 maling login bawat 15 minuto. Pero ang attacker na may 1000 IP (botnet, mga proxy)
ay may 10 × 1000 = **10,000 hula** sa isang account bawat 15 minuto. Kaya kailangan ng bilang **bawat account**.

## Ano ang ginawa
- **`users.failed_login_attempts`** (bilang ng sunod-sunod na mali) at **`users.locked_until`** (migration `0009`).
- **5 sunod-sunod na maling password → naka-lock nang 15 minuto.** Habang naka-lock:
  **`423 Locked`** + `Retry-After: <segundo>`, **kahit tama ang password**. Walang cookie.
- **Tamang login → 0 ulit ang bilang.** Pagka-lock, 0 din, para pagkatapos ng 15 minuto ay 5 subok ulit (hindi 1).
- **Audit:** `account_locked` (isang beses, sa ika-5 mali), at `login_failed` na may `reason: locked` habang naka-lock.
- **Frontend:** walang binago. Ipinapakita na ng Login ang `error` ng kahit anong status (sinubukan sa browser: 5 × "Invalid…", tapos "Account temporarily locked…").
- **Tests: 152** (6 bago, `routes/lockout.test.ts`).

## Tatlong alam na kahinaan (sinadya, at may nakaplanong araw)
1. **Kayang i-lock ng KAHIT SINO ang account ko.** Kailangan lang ang email ko at 5 maling password bawat 15 minuto → **Day 64** (device cookies).
2. **Sabay na hula (race condition).** Binabasa ang bilang, +1 sa JavaScript, saka isinusulat. **Sinukat ko** gamit ang pansamantalang test
   (20 sabay na maling password, 3 beses):

   | Takbo | Nasuring hula (401) | 423 | Naitalang bilang | Na-lock? |
   |---|---|---|---|---|
   | 1 | 20 | 0 | 3 | ❌ |
   | 2 | 20 | 0 | 2 | ❌ |
   | 3 | 20 | 0 | 2 | ❌ |

   Mas malala pa sa inaasahan: hindi lang "higit sa 5" ang nasuri, **hindi pa na-lock**, dahil nagsulat ang bawat request ng sarili nitong "luma + 1".
   Sa production, ang IP rate limit (10 bawat IP) pa rin ang humaharang dito, gaya ng dati. **Day 66** ang test na huhuli nito, at **Day 67** ang ayos (`UPDATE … WHERE … RETURNING`).
   Ganito rin ang nangyari sa reference: ang unang lockout nito (commit `b2ad08a`) ay may parehong race, at nahuli lang pagkatapos.
3. **Ang 423 ay nagsasabing may account ang email** (ang walang account ay laging 401), at may isang dagdag na UPDATE sa maling password ng totoong account → **Phase 15**.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | 6 bago · buong suite | ✅ 152 |
| Sadyang sinira | (A) walang lock check · (B) walang reset sa tamang login · (C) hindi 0 ang bilang pagka-lock | ✅ bumagsak ang 2, 2 at 1 test |
| Race | pansamantalang test (hindi naka-commit), 20 sabay × 3 | ⚠️ 20/20 nasuri, hindi na-lock — isusulat bilang test sa Day 66 |
| Dev | `21-lockout.http` sa bagong server | ✅ 201 · 401 ×5 · 423 · 423 (tamang password) · 401 (walang account) · 423 → SQL "lumipas ang 15 min" → 200 · `Retry-After: 900` |
| Audit | sa dev DB | ✅ 5 × login_failed → account_locked ×1 → login_failed (locked) → login |
| Browser | Login page | ✅ lumalabas ang mensahe ng 423 |

## Kumpara sa reference
- **Pareho:** 5 subok, 15 minuto, 423, 0 ulit ang bilang pagka-lock, `account_locked` sa audit.
- **Dagdag dito:** `Retry-After` header, at audit ng bawat subok habang naka-lock.
- **Pareho ring may race sa unang bersyon.** Ang pagkakaiba: dito, **alam at sinukat** na, at nakaplano ang ayos.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit 423 kahit TAMA ang password? Hindi ba ako mismo ang mahihirapan?**
  S: Kung 200 ang tamang password habang naka-lock, tuloy lang ang paghula ng attacker. Kapag 200 ang lumabas, alam niyang tumama siya. Kaya walang silbi ang lock kung hindi pareho ang sagot.
  Oo, 15 minuto akong maghihintay. Iyon ang kapalit (at ang problema ng Day 64).
- **T: Bakit iniwan ang race kung alam na?**
  S: Iyon ang aral ng Phase 14: gumagana ang lahat sa isang request, pero nasisira kapag sabay-sabay. Mas matututunan ko ito kung makikita kong bumagsak ang test (Day 66) bago ang ayos (Day 67).
  Hindi ito mas malala kaysa kahapon: walang lockout noon, at ang IP rate limit pa rin ang humaharang sa sabay na hula.
- **T: Bakit hindi "3 subok na lang" ang mensahe?**
  S: Tutulong iyon sa attacker: malalaman niyang may account ang email, at kung ilang hula pa ang kaya niya bago ma-lock.
- **T: Ano ang `Retry-After`?**
  S: Standard na header (HTTP) na nagsasabi kung ilang segundo bago puwedeng subukan ulit. Magagamit ito ng frontend para magpakita ng countdown.

## Susunod
- **Day 64 — Lockout DoS at device cookies:** ayusin ang kahinaan #1, para hindi ako ma-lock ng iba sa browser na lagi kong ginagamit.

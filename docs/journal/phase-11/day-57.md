# Day 57 — 2026-09-27 · Phase 11 · Review day · 🏁 Tapos ang Phase 11

## Ano ang ginawa (review)
- **🔍 Lahat ng `.http`** (18 file), bawat isa sa **bagong dev server**, sunod-sunod para mabuo ang mga kailangang account.
  Tugma ang lahat sa nakasulat. Ang `08-rate-limit` ay sa sariling server at huli: 10 × 401 → 429. Binura ang 10 demo account.
- **🔍 Lahat ng diagram (35 + bago):** na-render lahat. Isang luma na pangako ang naayos: sinasabi pa ng diagram 06 na "lulutasin sa Phase 11" ang
  limitasyon ng logout, pero **nalutas na**.
- **📊 Bagong diagram 17: ang buhay ng isang session.** Ang Phase 11 sa isang tingin: mga estado ng refresh token (aktibo → rotated / reuse / logout / password_change / expired),
  at kung paano gumagana ang dalawang token sa bawat request.
- **🏗️ Folder structure:**
  - **Nahuling pagkakamali ko (Day 51):** ang "refresh" ay naidagdag sa **lumang Phase 4 tree** sa halip na sa "Ngayon" na tree, dahil unang tugma
    ang pinalitan ng script. Naibalik ang kasaysayan, at inayos ang kasalukuyan (+ `jwt.ts`, sessions, change-password).
  - Nadagdag ang **Phase 11 row** sa "paano lumalaki ang backend".
  - Review finding: **gumanda** — walang `req` ang `lib/session.ts` at `lib/jwt.ts`. Ang `audit.ts` at `clientIp.ts` ay may `req` pa (Phase 16).
- **Kalusugan:** backend 121 tests (×2) · tsc · lint · `npm audit` — ✅ · frontend typecheck · lint (0) · build — ✅.

## 🏁 Buod ng Phase 11 (tag `checkpoint-phase-11`)
| Day | Ginawa |
|---|---|
| 51 | refresh tokens: 15-min access + 7-araw refresh (hash sa DB) · single-flight refresh sa frontend |
| 52 | rotation + reuse detection · reuse interval 10s · nahuling race (transaction) |
| 53 | totoong logout: binabawi sa database |
| 54 | mga device ko · IDOR (404, `user_id` sa WHERE) |
| 55 | change password: reauthentication, lahat o wala, nala-logout ang lahat |
| 56 | RS256 + `iss`/`aud` · walang kailangang mag-login ulit sa paglipat |
| 57 | review |

### ✅ Checkpoint question: *Bakit nire-revoke ang BUONG family kapag may reuse?*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

- Sa **rotation**, **isang beses lang** magagamit ang bawat refresh token. Pagkatapos gamitin, papalitan ito ng bago.
- Kaya kapag may gumamit ng token na **na-rotate na**, may **dalawang tao** na may kopya nito: ako (ang tunay na user) at ang magnanakaw.
- **Hindi alam ng server kung sino ang tunay.** Puwedeng ako ang nag-refresh at ang magnanakaw ang gumamit ng luma, o kabaligtaran
  (nauna ang magnanakaw, at ako ang may luma).
- Kung ang lumang token lang ang bawiin, **tuloy ang magnanakaw** gamit ang bagong token (kung siya ang nauna). Kaya ang tanging ligtas:
  **patayin ang buong family**, ang login na iyon at lahat ng token na nanggaling doon.
- **Kapalit:** mala-logout din ako, pero makakapag-login ulit ako gamit ang password ko, samantalang ang magnanakaw ay walang password.
- **Family lang, hindi lahat:** ang ibang device ko (ibang login) ay hindi ginagalaw. At may **10 segundong palugit** para sa sabay na refresh
  (dalawang tab), dahil hindi iyon pagnanakaw.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| **D-021: bubuksan na ba sa totoong users?** | Desisyon ko | ngayon / bago ang friend test |
| `tokenVersion` (agad na hindi gagana ang access token ng ibang device pagkatapos ng change password) | ≤ 15 min pa ngayon | kapag kailangan |
| Absolute na limit ng session (hal. 30 araw mula login) | Sliding ang 7 araw ngayon (Day 52 Q&A) | kapag kailangan |
| Key rotation (`kid`) | Iisang RSA key ngayon | kapag may ikalawang serbisyo |
| Retention ng `audit_logs` at lumang `refresh_tokens` | Lumalaki nang walang hangganan; may IP/email | bago buksan sa lahat |
| Cursor pagination | Nakita ang pag-usog ng page (Day 48) | kapag malaki na ang data |
| Controllers + services (`audit.ts`/`clientIp.ts` na may `req`) | Review finding | Phase 16 |
| Kusang deploy (timer) · coverage report · friend test | mula sa naunang backlog | — |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit bagong server para sa bawat `.http` sa review?**
  S: Nasa memory ang bilang ng rate limiter. Kapag iisang server, sumasalo ang mga naunang file sa bilang, at magkakaroon ng 429 na hindi dahil sa code (natutunan sa Day 50).
- **T: Paano nangyaring napunta sa maling tree ang edit?**
  S: Ang script ay nagpapalit ng **unang** tugma ng text, at magkapareho ang linya sa dalawang tree. Ngayon, sinusuri ng script na **iisa lang** ang tugma bago magpalit.
- **T: Ano ang pinakamahalagang natutunan sa Phase 11?**
  S: Ang pagkakaiba ng stateless (JWT, mabilis, hindi mababawi) at stateful (refresh token sa database, kayang bawiin), at kung paano sila pinagsasama.

## Susunod
- **Phase 12 — Email** (password reset sa email, email verification): kailangan ng totoong email provider.

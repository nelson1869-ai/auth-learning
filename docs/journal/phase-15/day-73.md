# Day 73 — 2026-09-27 · Phase 15 · Review day · 🏁 Tapos ang Phase 15

## Ano ang ginawa (review)
- **🔍 23 `.http`** (review script, malinis na DB): **23/23 ✅**. **Production** (read-only): 8/8.
  Hindi na inulit ang mga manual na PASTE-DITO: walang nagbago sa reset/verify mula sa huling pagsubok (Day 70).
- **🔍 43 diagram** na-render. **ER:** 6 na table (kasama ang `unknown_login_attempts`), 2 partial index, 15 audit action.
  **API contract** 17/17 · **mga link** ✅ · **mga bilang** (13 migration, 23 `.http`) ✅ · lahat ng `lib/` at `scripts/` ay nasa architecture at README.
- **Kalusugan:**
  - backend: 175 tests · tsc · lint · `npm audit` 0;
  - frontend: typecheck · lint · build · `npm audit` 0.

## Mga nakitang luma, at inayos (lahat sa diagram 04, ang pinakamaraming nabago sa Phase 13–15)
| Luma | Ngayon |
|---|---|
| "Ang ORAS ay susukatin sa Day 72" | nasukat na: ±1 ms (tingnan ang timing table) |
| "Tatlong alam na kahinaan, bawat isa ay **may nakaplanong araw**" | "…at kung kailan naayos": naayos na ang tatlo |
| "Iisang mensahe, iisang status (**401**)" | + mula Day 71, pati ang **423** at ang `Retry-After` |
| "Butas pa rin: ang register" (reference lang ang binanggit) | + pareho ang desisyon dito (Day 71) |

Nahuli ang una sa grep ("susukatin sa Day 72"), at ang iba ay sa **pagbasa nang buo** ng seksyon (aral ng Day 70).
Ang pangalawa ay hindi mali sa bawat linya. **Ang pamagat** ang luma.

## 🏁 Buod ng Phase 15 (tag `checkpoint-phase-15`)
| Day | Ginawa | Nahanap |
|---|---|---|
| 71 | bilang para sa email na walang account (`unknown_login_attempts`, hash lang) | **ang lockout ng Day 63 ang gumawa ng butas**: 6 na mali → alam kung sino ang may account |
| 72 | `npm run timing:login` · sinukat ulit ang oras | ±1 ms · walang dummy → 56 ms (kaya nakikita ng pagsukat) |
| 73 | review | 4 na lumang pangungusap |

**Natitira (alam, isinulat):** register → 409 (kailangan ng email-first signup, isang desisyon sa UX).

> ✍️ Sinulat ng AI sa hiling ko: **walang checkpoint question** ang Phase 15 sa roadmap. Kung mayroon, ito siguro: *"Paano nabubunyag kung sino ang may account,
> kahit pareho ang mensahe?"* **Sagot:** sa tatlong paraan. (1) **Status** (401 vs 423: ang lockout mismo ang nagbunyag, Day 71). (2) **Oras** (kapag
> walang argon2 ang walang account: 56 ms na pagkakaiba, Day 72). (3) **Ibang endpoint** (register 409, hindi pa naayos). Kailangang pareho ang **lahat ng nakikita
> ng attacker**: status, body, headers at oras, sa **lahat** ng endpoint.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| Register 409 → email-first signup? | Ang huling butas ng enumeration | **desisyon ko** |
| Retention: `unknown_login_attempts`, `audit_logs`, tokens, `trusted_devices` | Lumalaki nang walang hangganan | Phase 18, Day 90 |
| Commit ang `.http` review script sa repo? | Nasa scratchpad lang ng AI (mawawala kapag nag-restart) | kung gusto ko |
| `UNIQUE (lower(email))` · sabay na change-password · D-021 · durable email queue · `tokenVersion` · `kid` | mula sa naunang backlog | kapag kailangan |
| I-verify ang admin email ko sa production | Hindi pa verified | ako |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano nangyaring ang lockout (isang depensa) ang gumawa ng butas?**
  S: Nagdagdag ito ng bagong sagot (423) na para lang sa totoong account. Bawat bagong sagot o bagong daan sa code ay dapat itanong:
  "pareho ba ito para sa may account at wala?"
- **T: Bakit ang pamagat ang luma, hindi ang laman?**
  S: Nang maayos ang bawat kahinaan, ina-update ko ang linya nito (nilalagyan ng ~~guhit~~), pero hindi ang pamagat sa itaas ("may nakaplanong araw").
  Kapag nag-a-update, basahin din ang nakapaligid, hindi lang ang linyang binago.

## Susunod
- **Phase 16 — Malinis na architecture** (Day 74–76): hatiin ang `routes/auth.ts` sa **controllers** (HTTP lang) at **services** (logic, walang Express).
  Pumapasa dapat ang lahat ng test pagkatapos ng **bawat** hakbang.

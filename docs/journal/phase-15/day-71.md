# Day 71 — 2026-09-27 · Phase 15 · Pareho ang sagot (user enumeration)

## Ang problema
Ang **user enumeration** ay ang kakayahang malaman kung **may account ang isang email**. Ang listahang iyon ang unang hakbang ng attacker:
iyon lang ang huhulaan ng password, o padadalhan ng pekeng "i-reset ang password mo" (phishing).

Pagsusuri bago ang Day 71:
| Endpoint | May account | Walang account | Nabubunyag? |
|---|---|---|---|
| login (maling password) | 401 ×5 → **423** + Retry-After | **laging 401** | ❌ **oo**, 6 na mali lang |
| forgot-password | 202, parehong mensahe | 202, parehong mensahe | ✅ hindi (mula Day 59) |
| register | **409** | 201 | ❌ oo (alam, hindi inayos, tingnan sa ibaba) |

Nakakatawa (at nakakatakot): **ang lockout ng Day 63 ang lumikha ng butas.** Bago nito, pareho ang 401 para sa lahat.

## Ang ayos: bilang din para sa email na walang account
- **Bagong table `unknown_login_attempts`** (migration 0012). **SHA-256 lang ng email** ang naka-save, hindi ang mga email na sinubukan ng attacker
  (na puwedeng listahan ng mga email ng ibang tao).
- **Pangatlong uri ng bilang** sa `lib/loginLockout.ts` (`unknown_email`). Parehong reserve-then-verify ng Day 67, at **isang atomic na upsert**:
  gumawa ng row (subok #1), o +1 kung hindi naka-lock. Naka-lock → walang row na bumalik → 423.
- **Resulta:** ang email na walang account ay 401 ×5 → **423 + Retry-After**, **eksaktong pareho** ng totoong account.
- Ang Day 63 test na **"an email with no account never returns 423"** ay naglalarawan ng mismong butas, kaya pinalitan.

## Kumpara sa reference
- **Pareho:** `unknown_login_attempts`, hash lang, atomic upsert, 401 ×5 → 423.
- **Mas mahigpit dito:** sa reference, **hindi binubura ang expired na `locked_until`** sa upsert (naiiwan ang lumang petsa). Iyon mismo ang
  regression na nahuli ng test natin noong Day 67. Dito, `NULL` ito, at may test (bumagsak nang sadyang alisin).
- **Pareho ring iniwan:** register → 409. Sa reference, pinili ng tao ang "Pragmatic" (hindi email-first signup).

## ⚠️ Ang natitirang butas: register → 409
Ang tanging tunay na ayos ay **email-first signup**: laging "tingnan ang email mo", at gagawin lang ang account pagkatapos buksan ang link.
Pagbabago iyon ng UX (hindi agad makakapag-login pagka-register). Hindi ito kasama sa roadmap ng Day 71, kaya **iniwan at isinulat**
(sa `23-user-enumeration.http` #9 at dito). Nililimitahan ito ng register rate limit (10 bawat 15 min bawat IP). **Desisyon ko ito sa hinaharap.**

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Mga bagong test BAGO ang ayos | ✅ bumagsak: magkaiba ang 6 na sagot · walang table · ang lumang test |
| Pagkatapos · buong suite | ✅ 175 |
| Sabay: 20 maling password sa email na walang account | ✅ 5 × 401, 15 × 423 (atomic) |
| Sadyang sira A: walang `lockedUntil: null` sa upsert (ang ugali ng reference) | ✅ bumagsak ang expiry test |
| Sadyang sira B: hindi binibilang ang walang account | ✅ bumagsak ang 4 na test |
| 23 `.http` (review script, may 23 na) | ✅ 23/23 |
| Production: 6 maling password sa email na **walang account** (walang email na ipinadala; 6 < 10 sa IP limit) | ✅ 401 ×5 → 423 + `retry-after: 900`, **pareho ng totoong account noong Day 63** · hash lang sa table · 13 migration · binura ang row |

## Mga pagkakamali ko ngayon (nahuli)
1. **Ang expiry test ay binago ang LAHAT ng row** sa table (may 11 naka-lock mula sa ibang test), kaya bumagsak ito kahit tama ang code.
   Tiningnan ko muna ang table bago sisihin ang code: 12 row, 11 naka-lock. Ayos: sa hash lang ng email na iyon.
2. **Magkaparehong email sa dalawang `.http`:** ang 21 #4 at ang unang bersyon ng 23 ay parehong `walang-ganitong-account@…`. Sa review (nauuna ang 21),
   mauuna nang isa ang 423 ng 23. Nahuli bago patakbuhin. Iba na ang email sa 23. Tinatanggihan na rin ng review script ang maruming `unknown_login_attempts`.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit "naka-lock" ang email na walang account? Wala namang ila-lock.**
  S: Para pareho ang sagot. Kung laging 401 ang walang account pero 423 ang totoong account, ang 423 mismo ang nagsasabing "may account dito".
  Walang nawawala sa kahit sino: walang makakapag-login sa email na walang account.
- **T: Bakit hash lang ng email ang naka-save?**
  S: Ang sinusubukan ng attacker ay puwedeng listahan ng mga email ng ibang tao. Hindi natin kailangan ang mga iyon, kaya bilang lang at hash.
  At kung ma-leak ang database, walang listahan ng mga email na lalabas.
- **T: Lalaki ba nang walang katapusan ang table?**
  S: Oo, bawat bagong email na sinubukan ay isang row. Nililimitahan ng IP rate limit, at may `last_attempt_at` para sa paglilinis (retention, Phase 18).
- **T: Tapos na ba ang enumeration?**
  S: Hindi pa. (1) Register 409. (2) Ang ORAS ng sagot: iba ba ang tagal kapag may account? Iyon ang Day 72.

## Susunod
- **Day 72 — Pareho ang oras:** sukatin ang tagal ng sagot para sa may account at wala (dummy hash, at ngayon, parehong may database write).

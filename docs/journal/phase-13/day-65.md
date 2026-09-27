# Day 65 — 2026-09-27 · Phase 13 · Review day · 🏁 Tapos ang Phase 13

## Ano ang ginawa (review)
- **🔍 Lahat ng 22 `.http`**, bawat isa sa bagong dev server, gamit ang **review script**: ikinukumpara nito ang **bawat status** sa listahan ng inaasahan
  (baseline mula sa Day 62, + 21 at 22). **22/22 ✅.**
  - **Sinubukan muna kung nakakahuli ang script:** binigyan ito ng maling inaasahan para sa `01-health` → ❌ at exit 1.
    Kung hindi ito nakakahuli, walang halaga ang 22 ✅ (aral ng reference: "tests that pass for the wrong reason").
  - Manual na mga hakbang na naapektuhan ng bagong login:
    - rate limit: `10 × 401 → 429`;
    - "magnanakaw" ng refresh token (16 #2b, lampas 10s): `204 → 401 → 401` + audit `refresh_reuse`.
  - `prod/01-production.http`: 8/8.
- **🔍 40 diagram** na-render. Ang **ER** ay tugma sa `schema.ts`: 5 table, lahat ng column, 15 audit action.
- **🔍 API contract:** 17/17 na endpoint. **Mga link:** walang sira. **Mga bilang** (migrations 0000–0010, `.http` 01–22): tugma lahat.
- **Kalusugan:**
  - backend: 159 tests · tsc · lint · `npm audit` 0;
  - frontend: typecheck · lint · build · `npm audit` 0.

## Mga nakitang luma, at inayos
| File | Luma | Ngayon |
|---|---|---|
| `21-lockout.http` | "kayang i-lock ng kahit sino" bilang kasalukuyang kahinaan | ✅ naayos sa Day 64 (para sa dating browser) · bagong browser → reset |
| `07-api-contract.md` | 423 = "naka-lock ang **account**" · walang `scope` sa audit | ang bilang na ginamit (account **o device**) · `scope` sa metadata |
| `06-architecture.md` | "Ngayon — Phase 12" · walang Phase 13 row | Phase 13, sinuri Day 65 · + row |

## 🏁 Buod ng Phase 13 (tag `checkpoint-phase-13`)
| Day | Ginawa |
|---|---|
| 63 | per-account lockout: 5 mali → 15 minuto, 423 + `Retry-After` kahit tama ang password · sinukat ang race (20 sabay → hindi na-lock) |
| 64 | device cookies (OWASP): hindi na ako mala-lock ng iba sa dati kong browser · change/reset password: bawiin ang tiwala · reset = labasan |
| 65 | review |

### ✅ Checkpoint: *Paano naaabuso ng attacker ang lockout, at paano ito naayos?*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

- **Ang atake (lockout DoS):** ang lockout ay depensa laban sa paghula ng password: 5 mali, 15 minutong lock. Pero hindi kailangan ng attacker
  na hulaan ang password ko para abusuhin ito. Kailangan lang niya ang **email ko**. Magpapadala siya ng 5 maling password bawat 15 minuto,
  at **hindi na ako makakapasok kailanman**. Hindi niya nakuha ang account, pero napigilan niya ako. Ang depensa mismo ang naging sandata.
- **Bakit hindi sapat na alisin ang lockout?** Babalik ang orihinal na problema: ang attacker na may maraming IP ay may libu-libong hula bawat 15 minuto.
- **Ang ayos (device cookies, OWASP):**
  - Ang browser na **nakapag-login na nang tama** ay may `device_token` cookie.
  - Ang maling password mula roon ay binibilang sa **sariling bilang ng device na iyon**.
  - Ang attacker ay walang cookie para sa account ko (hindi niya alam ang password, kaya hindi pa siya nakapag-login nang tama),
    kaya napupunta siya sa **bilang ng account**, na pinaghahatian ng lahat ng walang cookie.
  - **Resulta:** nala-lock pa rin ang attacker pagkatapos ng 5, pero **ang dati kong browser ay hindi apektado**.
- **Mga detalye na mahalaga:**
  - Ang cookie ay para sa **eksaktong account**. Hindi magagamit ng attacker ang cookie mula sa sarili niyang account.
  - **Hindi ito login.** Kailangan pa rin ang password.
  - Change/reset password: binabawi ang tiwala ng lahat ng device, kasama ang nanakaw na laptop.
- **Ang natitirang butas at ang labasan:** sa **bagong** device, naka-lock pa rin ako (walang cookie). Ang labasan ay ang **reset password**:
  patunay ito na akin ang email, kaya tinatanggal nito ang lock at pinagkakatiwalaan ang device na iyon.
- **Ang hindi pa naaayos:** kapag **sabay-sabay** ang mga hula, hindi gumagana ang bilang (sinukat: 20 sabay → hindi na-lock). Iyon ang Phase 14.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| **Race sa lockout** (dalawang bilang) | Sinukat noong Day 63: 20 sabay na hula → lahat nasuri, hindi na-lock | **Phase 14 — susunod (Day 66–67)** |
| Ang 423 ay nagsasabing may account; walang bilang para sa email na walang account | Enumeration | Phase 15 |
| Passkey login (sa hinaharap) → magbigay ba ng device trust? | Hindi pa ginagawa sa reference | Phase 19 |
| I-verify ang admin email ko sa production | Hindi pa verified | ako, kahit kailan |
| D-021 · durable email queue · `tokenVersion` · `kid` · cursor pagination | mula sa Day 62 | kapag kailangan |
| Retention (`audit_logs`, tokens, **`trusted_devices`**) | Lumalaki; nililinis lang ang expired na device ng user kapag may bagong device siya | Phase 18, Day 90 |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit sinubukan pang sirain ang review script?**
  S: Ang script na laging ✅ ay mukhang maganda, pero baka hindi pala ito nagkukumpara. Kapag nakita kong nag-❌ ito sa sadyang mali,
  saka ko lang mapagkakatiwalaan ang 22 ✅. Parehong ideya ng pagsira sa code para patunayang nahuhuli ng test.
- **T: Paano kung nakawin ng attacker ang device cookie ko mismo?**
  S: Makakakuha lang siya ng sariling bilang ng device ko (5 hula), at kailangan pa rin niya ang password. Kapag pinalitan ko ang password, mawawalan ng bisa ang cookie.
- **T: Ano ang pinakamahalagang natutunan sa Phase 13?**
  S: Na ang bawat depensa ay puwedeng abusuhin. Kailangang itanong hindi lang "napipigilan ba nito ang attacker?"
  kundi "paano ito magagamit **laban sa totoong user**?"

## Susunod
- **Phase 14 — Tama kahit sabay-sabay** (Day 66): test na nagpapadala ng 20 sabay na request, para mahuli ang race sa lockout.

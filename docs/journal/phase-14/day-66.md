# Day 66 — 2026-09-27 · Phase 14 · Race conditions (TOCTOU)

## Ang aral
Gumagana ang lahat kapag **isang request** lang. Nasisira kapag **20 ang sabay**. Ang mga test ko hanggang Day 65 ay **sunod-sunod**
(request → sagot → susunod), kaya hindi nila kailanman naabot ang puwang sa pagitan ng "suriin" at "gawin".
Ito ang pinakamahalagang aral ng reference: mukhang "10/10" ito bago nahuli ang mga race.

## Ano ang ginawa
- **`routes/concurrency.test.ts`**: pinapaputok nang **sabay** ang parehong request (`Promise.all`, 20 beses) sa **iisang server**.
  Aral ng reference: ang `request(app)` ay gumagawa ng bagong server bawat request, at nagbigay iyon ng `ECONNRESET` sa mabagal na CI.
- **Nahuli ang bug sa lockout** (ang sadyang iniwan noong Day 63), sa **dalawang** bilang:

  | Bilang | Nasuring hula | 423 | Naitalang bilang | Na-lock? |
  |---|---|---|---|---|
  | account | 20 / 20 | 0 | 2 | ❌ |
  | device (Day 64) | 20 / 20 | 0 | 1 | ❌ |

  Dapat: 5 lang ang masuri, at naka-lock pagkatapos.
- **Mga ligtas na (patunay, hindi ayos):**
  - register ng parehong email nang 20 beses → 1 × 201, 19 × 409, isang row;
  - verify-email link na binuksan nang 20 beses → 1 × 204, 19 × 400.
  - (May test na rin para sa refresh rotation (Day 52) at sa reset link (Day 59).)
- **📊 Diagram 20:** timeline ng race. Makikita kung paano nakabasa ang lahat ng "0", at kung paano natabunan ng bawat isa ang sinulat ng iba.
- **Tests: 163** (4 bago). **Walang binago sa app code ngayon.** Sa Day 67 ang ayos.

## Isang desisyon sa disenyo ng test: hindi `it.fails`
Una kong naisip ang `it.fails` ("inaasahang bumagsak"). Pero **pumapasa ang `it.fails` sa KAHIT ANONG error**: kapag bumagsak ang register,
kapag nag-ECONNRESET, o kapag may typo. Iyon mismo ang "test na pumapasa sa maling dahilan" (aral ng reference).
Kaya **tahasang assertion ng bug** ang ginamit: `expect(nasuri).toBeGreaterThan(5)` at "hindi naka-lock". Ang bug LANG ang makakapagpapasa rito.
Sa Day 67, babagsak ang mga test na ito, at babaligtarin ko ang assertion.

## Paano napatunayan (na tama ang mga test mismo)
| Sinubukan | Resulta |
|---|---|
| 5 takbo sa normal na CPU · 3 takbo sa **iisang core** (`taskset -c 0`, parang mabagal na CI) | ✅ laging pareho, walang ECONNRESET |
| **Walang race:** ginawang sunod-sunod ang 20 request | ✅ bumagsak ang dalawang BUG test: *"expected 5 to be greater than 5"* — kaya race lang ang nagpapapasa |
| Sinira ang register (ang 23505 ay hindi na 409) | ✅ bumagsak |
| Sinira ang claim (walang `used_at IS NULL`) | ✅ bumagsak |
| Buong suite · tsc · lint | ✅ 163 |

## Kumpara sa reference
- **Pareho:** `Promise.all`, iisang server, "eksaktong isa ang nanalo" para sa single-use.
- **Iba:** ang reference ay sumulat ng test **pagkatapos** ng ayos. Dito, **bago**, at sinusukat ang bug, para makita ko munang bumagsak.
  Hindi pa kailangan dito ang WebAuthn challenge test (wala pang passkeys).

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang TOCTOU?**
  S: *Time-of-check to time-of-use.* Sinuri ko ("hindi pa naka-lock, 0 ang bilang"), tapos ginamit ko ang nasuri ("isulat ang 1"). Pero sa pagitan,
  nagbago na ang totoong estado dahil sa ibang request. Luma na ang impormasyong ginamit ko.
- **T: Bakit napakalaki ng puwang dito?**
  S: Dahil sa `argon2.verify` (~50ms) sa gitna ng SELECT at UPDATE. Natatapos ang lahat ng 20 SELECT bago pa matapos ang unang argon2.
- **T: Bakit hindi ito makita sa `.http`?**
  S: Isa-isa ang pagpapadala ng REST Client. Kailangan ng code (`Promise.all`) para sabay ang pagdating.
- **T: Kung laging pumapasa ang test habang may bug, paano ko malalaman na naayos na?**
  S: Babagsak ito. Iyon ang senyales para baligtarin ang assertion ("≤ 5, naka-lock"). Hindi puwedeng makalimutan, dahil pula ang CI hangga't hindi binabaligtad.

## Susunod
- **Day 67 — Atomic SQL:** ilipat ang "+1" at ang "naka-lock ba?" sa iisang `UPDATE … WHERE … RETURNING`, at gawin ito BAGO ang argon2
  (reserve-then-verify, gaya ng reference).

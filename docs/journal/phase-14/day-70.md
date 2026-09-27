# Day 70 — 2026-09-27 · Phase 14 · Review day · 🏁 Tapos ang Phase 14

## Ano ang ginawa (review)
- **🔍 22 `.http`** (review script, bagong server bawat isa, malinis na DB): **22/22 ✅**.
- **Manual na PASTE-DITO** (nagbago ang paggawa ng link noong Day 69):
  - 19 reset: `202 202` → **ang UNANG link ay 400** (napalitan ng pangalawa) → pangalawang link `204` → ulit `400` → login gamit ang bago `200`;
  - 20 verify: `200 202 204 400 409`.
- **`prod/01-production.http`:** 8/8.
- **🔍 43 diagram** na-render. **ER:** 5 table, lahat ng column, 15 audit action, at **ngayon pati ang 2 partial UNIQUE index** (idinagdag sa check).
- **🔍 API contract** 17/17 · **mga link** ✅ · **mga bilang** (12 migration, 22 `.http`) ✅.
- **Kalusugan:**
  - backend: 170 tests · tsc · lint · `npm audit` 0;
  - frontend: typecheck · lint · build · `npm audit` 0.

## Mga nakitang luma, at inayos
Hindi ito nahuli ng mga grep ko. Nahuli dahil **binasa ko nang buo** ang mga seksyong isinulat noong **may bug pa**.

| File | Luma | Ngayon |
|---|---|---|
| diagram 20 | "pumapasa ito habang may bug" (kasalukuyang panahunan) | nakaraan: Day 66 → bumagsak noong Day 67 |
| diagram 20 | "**Sa production ngayon:** ang IP rate limit pa rin ang humaharang…" | bago ang Day 67 · ngayon: 5 bawat account (sinukat: 8 sabay → 5 × 401, 3 × 423) |
| diagram 20 | "ligtas na: mga link sa email" | ang PAGGAMIT ay ligtas; ang PAGGAWA ("isa lang ang aktibo") ay hindi, at nahuli noong Day 69 |
| diagram 18 | "bawiin ang lumang link · INSERT token" | upsert (Day 69) |
| `06-architecture.md` | "Ngayon — Phase 13", walang Phase 14 row | Phase 14, sinuri Day 70 · + row |

**Aral:** ang dokumentong isinulat habang may bug ay luma na **sa mismong araw na naayos ang bug**. Kaya sa bawat ayos, hanapin ang mga pangungusap na
"ngayon", "pa rin", "hindi pa", hindi lang ang mga numero.

## 🏁 Buod ng Phase 14 (tag `checkpoint-phase-14`)
| Day | Ginawa | Nahuling bug |
|---|---|---|
| 66 | race tests (20 sabay, iisang server) · tahasang sinukat ang bug | lockout: 20/20 nasuri, hindi na-lock (account at device) |
| 67 | reserve-then-verify (`lib/loginLockout.ts`) | naayos: 5 × 401, 15 × 423, 1 audit |
| 68 | transactions · side effects pagkatapos ng commit | **login:** 500 pero may cookie at naka-login |
| 69 | partial UNIQUE indexes · upsert | **"isang aktibong link":** 20 sabay → 18 aktibo · family: tinanggap ang pangalawa |
| 70 | review | 5 lumang teksto |

**Tatlong totoong bug** ang nahuli sa Phase 14. Lahat ay pumapasa sa mga dating test, dahil sunod-sunod ang mga test na iyon o hindi pumapalya sa gitna.

### ✅ Checkpoint: *Bakit hindi sapat ang "hanapin muna ang user, tapos i-update"?*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

- **Dahil may puwang sa pagitan ng "hanapin" at "i-update".** Sa puwang na iyon, puwedeng magbago ang totoong estado dahil sa ibang request.
  Ang binasa ko ay luma na pagdating ng oras na ginamit ko ito (**TOCTOU**: time-of-check to time-of-use).
- **Nakita ko ito sa sarili kong code (Day 66):** binasa ang bilang ng maling password ("0, hindi naka-lock"), `argon2` (~50ms), tapos isinulat ang "1".
  20 sabay na hula: lahat ay nakabasa ng "0" bago pa may nakapagsulat, kaya **20 ang nasuri at hindi na-lock**. Pinalaki ng mabagal na argon2 ang puwang.
- **Hindi ito nakikita sa isang request o sa sunod-sunod na test.** Kailangan ng sabay (`Promise.all`) para maabot ang puwang.
- **Ang ayos: ang database ang magpasya, sa ISANG statement.**
  - Ilagay ang kondisyon sa `WHERE` at gamitin ang `RETURNING`: `UPDATE … SET n = n + 1 WHERE hindi naka-lock RETURNING n` (Day 67).
    Isa-isang ina-update ng Postgres ang row, kaya bawat request ay may sariling numero.
  - Gawin ito **BAGO** ang mabagal na hakbang (reserve-then-verify).
  - Kapag maraming pagsulat na dapat magkasama: **transaction**, at ang cookies, email at audit ay **pagkatapos ng commit** (Day 68).
  - Para sa "isa lang dapat": **UNIQUE constraint** (partial kung "isang aktibo") bilang **huling bantay**. Tumatanggi ang database kahit mali ang code (Day 69).
- **Sa madaling salita:** huwag magtiwala sa nabasa mo kung may ibang puwedeng sumulat bago ka. Ipasa ang kondisyon sa database, sa mismong pagsulat.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| Ang 423 ay nagsasabing may account · walang bilang para sa email na walang account · isang UPDATE na dagdag sa totoong account (oras) | Enumeration | **Phase 15 — susunod** |
| `UNIQUE (lower(email))` | Ang Zod ang nagla-lowercase; ang index ay magiging huling bantay kung may code na makalimot | kapag may bagong daan ng pagsulat ng email |
| Sabay na change-password (dalawang tab, parehong lumang password) | Malamang na parehong papasa ang reauthentication at ang huli ang mananalo (**pangangatwiran, hindi pa nasusubok**). Parehong totoong user, kaya mababa ang panganib | kapag kailangan |
| I-verify ang admin email ko sa production | Hindi pa verified | ako |
| D-021 · durable email queue · `tokenVersion` · `kid` · cursor pagination · retention | mula sa naunang backlog | kapag kailangan / Phase 18 |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano ko malalaman kung may TOCTOU ang code ko?**
  S: Hanapin ang pattern na "basahin → magpasya → isulat" na HINDI iisang statement o transaction na may lock. Lalo na kapag may mabagal na hakbang sa gitna
  (argon2, network, email). Tapos subukan gamit ang `Promise.all`.
- **T: Bakit laging may transaction ang reference sa lahat ng bagay?**
  S: Hindi sa lahat. Iisang statement ay atomic na (hal. ang register). Kailangan lang ang transaction kapag **dalawa o higit pa** ang pagsulat na dapat magkasama.
- **T: Ano ang pinakamahalagang natutunan sa Phase 14?**
  S: Na ang "pumapasa ang lahat ng test" ay walang ibig sabihin kung hindi sinusubok ng mga test ang tamang sitwasyon. Tatlong bug ang nakatago sa likod ng berdeng CI.

## Susunod
- **Phase 15 — Huwag ibunyag kung sino ang may account** (Day 71): pareho ang sagot (at ang oras) para sa email na may account at wala.

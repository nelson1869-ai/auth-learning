# Day 64 — 2026-09-27 · Phase 13 · Device cookies laban sa lockout DoS

## Ang problema (galing sa Day 63)
Kahit sino na alam ang email ko ay kayang i-lock ang account ko: 5 maling password bawat 15 minuto, walang katapusan.
Tinatawag itong **lockout DoS**: ang depensa mismo ang naging atake. Hindi niya makukuha ang account ko, pero hindi rin ako makakapasok.

## Ang ayos: device cookies (OWASP)
- **Tamang login → `device_token` cookie.** `Path=/api/auth/login` (ang login lang ang tumatanggap), HttpOnly, 180 araw.
  SHA-256 lang ang naka-save sa bagong table na **`trusted_devices`** (migration `0010`).
- **Dalawang uri ng bilang:**
  - may valid na device cookie **para sa account na ito** → **sariling bilang ng device**;
  - wala (bagong browser, attacker, pekeng cookie, o cookie ng ibang account) → **ang bilang ng account**, na pinaghahatian ng lahat ng iyon.
- **Resulta:** nala-lock pa rin ang attacker pagkatapos ng 5. **Ang browser na lagi kong ginagamit ay hindi apektado.**
- **Hindi ito login.** Kailangan pa rin ang password. Pinipili lang ng cookie kung aling bilang ang gagamitin.
- **Change password:** binabawi ang tiwala ng LAHAT ng device (hal. ang nanakaw na laptop, na may cookie pa), at pinagkakatiwalaan ang browser na ito.
- **Reset password = ang labasan:** kapag naka-lock ako sa BAGONG device, magre-reset ako. Tinatanggal nito ang lock ng account,
  binabawi ang tiwala ng lahat ng device, at pinagkakatiwalaan ang browser na nag-reset.
- **Hindi binubura ng logout ang device cookie.** Hindi ito session; ang ibig sabihin lang nito ay "ito ang dati kong browser".
- **Frontend:** walang binago. Kusang itinatago at ipinapadala ng browser ang cookie.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | 7 bago (`device-cookies.test.ts`) · buong suite | ✅ 159 |
| Sadyang sinira | (A) laging bilang ng account · (B) hindi sinusuri ang `user_id` ng cookie · (C) hindi binabawi ng change-password · (D) hindi tinatanggal ng reset ang lock | ✅ bumagsak ang 3, 1, 1 at 1 test |
| Dev | `22-device-cookies.http` sa bagong server | ✅ 201 · 200 (may cookie) · 401 ×5 (attacker) · 423 (attacker, tamang password) · **200 (ako)** · 423 (pekeng cookie) |
| Dev | 05, 16, 18, 19, 21 ulit (nagbago ang Set-Cookie) + reset gamit ang totoong token | ✅ pareho ang status · may `device_token` ang reset |
| Browser | unang login → logout → 5 mali mula sa curl → login ulit sa parehong browser · bagong browser | ✅ Profile · "Account temporarily locked" · cookie: `/api/auth/login`, HttpOnly, Lax, 180 araw |
| DB | `trusted_devices` | ✅ 64-character na hash lang |

## Nahuling pagkakamali ko (Day 63)
Hindi ko na-update noong Day 63 ang "migrations 0000–0008" sa diagram 00 at ang ".http 01–20" sa `06-architecture.md`.
Inayos na ngayon (0000–0010, 01–22). Paalala sa sarili: sa bawat bagong migration o `.http`, hanapin ang **lahat** ng lugar na may bilang
(`grep -rn "0000–00" docs`), hindi lang ang mga naaalala ko.
Nang gawin ko ang grep na iyon, may isa pang nakita: **`backend/README.md` ay "01–07 .http" pa** (22 na). Hindi rin ito nahuli ng Day 62 review,
dahil ang hinanap ko noon ay mga sirang path at link, hindi mga bilang. Inayos na.

## Kumpara sa reference
- **Pareho:** `device_token`, `Path=/api/auth/login`, 180 araw, hash lang, sariling bilang, cookie para sa EKSAKTONG account,
  pagbawi sa change/reset, reset ang labasan, paglilinis ng mga expired na device ng user sa bawat bagong device.
- **Iba:** walang auto-login pagka-register dito, kaya sa unang tamang login ibinibigay ang tiwala (sa reference, pagka-register).
- **Pareho pa ring may race** ang dalawang bilang (basahin → +1 sa JS → isulat). Iyon ang Day 66–67.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nanakaw ang device cookie ko, makakapasok ba ang magnanakaw?**
  S: Hindi. Hindi ito login, kailangan pa rin ang password ko. Ang makukuha lang niya ay ang **sariling bilang** ng device ko:
  5 hula bago ma-lock ang "device" na iyon. At kapag pinalitan ko ang password, mawawalan ng bisa ang cookie.
- **T: Bakit kailangang para sa EKSAKTONG account ang cookie?**
  S: Kung hindi, ang attacker na may sariling account ay mag-login muna sa account niya para makakuha ng cookie, tapos gagamitin iyon
  laban sa account ko, para hindi siya mahulog sa bilang ng account ko. May test para dito.
- **T: Paano kung bago ang phone ko at naka-lock ang account?**
  S: Naka-lock ako roon hanggang 15 minuto, dahil walang cookie ang bagong phone. Ang labasan: "Nakalimutan ang password?" → reset.
  Ang reset ay patunay na akin ang email, kaya tinatanggal nito ang lock at pinagkakatiwalaan ang phone na iyon.
- **T: Bakit `Path=/api/auth/login`?**
  S: Para ang login lang ang tumanggap ng cookie. Mas kaunting daan, mas kaunting pagkakataong ma-log o manakaw (katulad ng refresh token sa `/api/auth`).

## Susunod
- **Day 65 — Review day** at ang checkpoint ng Phase 13: *Paano naaabuso ng attacker ang lockout, at paano ito naayos?*

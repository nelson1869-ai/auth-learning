# Day 60 — 2026-09-27 · Phase 12 · Email verification (soft)

## Ang desisyon ko: **soft** (D-026)
Makakapag-login pa rin ang hindi pa verified, may paalala lang (sa frontend, Day 61). **Hard** sana ang "bawal mag-login hangga't hindi verified",
pero magla-lock iyon ng mga dating account (pati ang admin ko, na hindi pa verified) at ng mga account na may pekeng email.

## Ano ang ginawa
- **`users.email_verified_at`** (migration `0008`). NULL = hindi pa.
- **Pagka-register:** email na **"Confirm your auth-learning email address"** na may `…/verify-email#token=…` (24 oras, isang beses lang).
- **`POST /api/auth/verify-email`** `{ token }`: **hindi kailangang naka-login**, para mabuksan ang link sa phone kahit sa PC nag-register.
  Nasa claim mismo ang `purpose`, kaya **ang reset token ay hindi magagamit pang-verify** (may test).
- **`POST /api/auth/resend-verification`** (naka-login, 5/15 min): bagong link, at ang luma ay mawawalan ng bisa. 409 kung verified na.
- **`/me`** → may `emailVerified: true/false` na.
- **Tests: 146** (9 bago). Bumagsak din ang test ng Day 49 (eksaktong mga field ng `/me`), gaya ng dapat. Inayos para isama ang bagong field.

## Isang bagong patakaran: mga test account sa production
Mula ngayon, **bawat register ay nagpapadala ng totoong email**. Ang mga test account na `@example.com` ay magba-bounce, at masisira ang reputasyon
ng domain na inayos ko noong Day 58–59. Ayon sa docs ng Resend, ang **`delivered+<label>@resend.dev`** ay para sa pagsubok, "without damaging your domain reputation".
Kaya ito na ang ginagamit ng AI sa production.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang `purpose` sa claim · walang email pagka-register | ✅ bumagsak |
| Dev | `20-verify-email.http` + token mula sa terminal | ✅ 201 200 200 400 400 202 · verify 204 · ulit 400 · verified sa DB |
| Production | `delivered+…@resend.dev`: register → login → `/me` → pekeng token → resend | ✅ 201 · 200 (soft) · false · 400 · 202 · 2 email ang naipadala · binura |

## Kumpara sa reference
- Pareho: iisang table ng token para sa reset at verification, single-use, email pagka-register.
- **Iba:** `#fragment`, isang aktibong link lang, `purpose` sa atomic claim, resend na may rate limit, at totoong email (stub ang sa reference).

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang silbi ng verification kung makakapag-login pa rin ang hindi verified?**
  S: Nalalaman natin kung aling account ang may totoong email. Sa hinaharap, magagamit iyon: hal. verified lang ang makakatanggap ng reset email
  o makakagawa ng mahahalagang bagay. At hindi ito nagla-lock ng kahit sino ngayon.
- **T: Bakit hindi kailangang naka-login para mag-verify?**
  S: Madalas binubuksan ang email sa phone, pero sa PC nag-register. Ang token mismo ang patunay (random, isang beses lang, 24 oras), kaya hindi na kailangan ng login.
- **T: Bakit 24 oras dito pero 1 oras sa reset?**
  S: Kayang palitan ng reset link ang password, kaya malaki ang panganib kapag nanakaw. Ang verification link ay nagmamarka lang ng "totoo ang email", kaya maliit ang panganib, at mas maginhawa ang mas mahaba.

## Susunod
- Day 61 — mga page sa frontend: forgot password, reset password, verify email, at ang paalalang "i-verify ang email mo" sa Profile.
  (Ang admin account ko ay hindi pa verified. Doon ko ito ive-verify.)

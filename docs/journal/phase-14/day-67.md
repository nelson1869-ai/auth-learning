# Day 67 — 2026-09-27 · Phase 14 · Atomic SQL (naayos ang race ng lockout)

## Ang problema (nahuli noong Day 66)
20 sabay na maling password → **20 ang nasuri**, bilang = 1–2, **hindi na-lock**. Sa account at sa device. Ang dahilan: basahin ang bilang →
`argon2.verify` (~50ms) → +1 sa JavaScript → isulat. Natapos ang lahat ng pagbasa bago pa may nakapagsulat.

## Ang ayos: reserve-then-verify (`lib/loginLockout.ts`)
1. **Reserve, BAGO ang argon2, sa ISANG statement:**
   `UPDATE … SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ? AND (hindi naka-lock) RETURNING failed_login_attempts`
   - Naka-lock ng Postgres ang row habang ina-update, kaya ang 20 sabay na request ay nakakakuha ng **kanya-kanyang numero**: 1, 2, 3 … 20.
   - Walang row na bumalik → naka-lock na → 423.
2. **Numero > 5** → 423 agad, **walang argon2**. Sinisiguro ring naka-lock (kung sakaling pumalya ang request na dapat mag-lock).
3. **Numero 1–5** → `argon2.verify`. Kapag mali at ika-5 → i-lock.
   Ang `UPDATE … WHERE hindi pa naka-lock RETURNING` ay nagsasabi kung **ITONG** request ang nag-lock, kaya **isang beses lang ang audit**.
4. **Tama** → 0 ulit ang bilang na ginamit. Laging may ire-reset, dahil laging may na-reserve.
- Mas simple na rin ang route: ang `lib/loginLockout.ts` ang may apat na function (`reserveAttempt`, `lockCounter`, `resetCounter`, `lockedUntilOf`), walang `req`.

## Resulta
| | Nasuring hula | 423 | Na-lock? | `account_locked` |
|---|---|---|---|---|
| Day 66 (bug), account | 20 | 0 | ❌ | — |
| **Day 67**, account | **5** | **15** | ✅ | **1** |
| **Day 67**, device | **5** | **15** | ✅ (device lang; ang ibang browser ay makakapag-login pa rin) | — |

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Ang Day 66 BUG tests, pagkatapos ng ayos | ✅ **bumagsak gaya ng inaasahan**: *"expected 5 to be greater than 5"*. Binaligtad → eksaktong 5 × 401, 15 × 423, 1 audit |
| May nahuling regression ang **Day 63 test**: naiiwan ang lumang (expired) `locked_until` | ✅ inayos sa code: ang reserve ay nagse-set ng `locked_until = NULL` (malinis na data) |
| Sinira: walang "lampas 5 → 423" | ✅ bumagsak ang 2 test |
| Sinira: nagla-lock kahit naka-lock na (walang "hindi pa naka-lock") | ✅ bumagsak ang "isang audit" |
| 3 takbo + 2 takbo sa iisang core | ✅ stable |
| Lahat ng 22 `.http` (review script, bagong server bawat isa) | ✅ 22/22 — pareho ang ugali ng sunod-sunod na login |
| Buong suite · tsc · lint | ✅ 163 |
| Production (`delivered+…@resend.dev`): **8** sabay na maling password — hindi 20, para hindi maabot ang IP rate limit (10) at hindi ma-block ang login ko mula sa parehong IP | ✅ 5 × 401 · 3 × 423 · naka-lock · 1 `account_locked` (noong may bug: 8 × 401) · binura ang account |

## Kumpara sa reference
- **Pareho:** reserve-then-verify, "numero > 5 → walang argon2", `lock()` na nagsasabi kung ito ang nag-lock (isang audit), reset sa tamang login.
- **Iba:** dito, dumaan muna sa **nasukat na bug → test na bumagsak → ayos → test na binaligtad**. Ang reference ay may bug nang ilang araw bago nahuli.
- Ang reference ay may pangatlong bilang para sa email na **walang account** (anti-enumeration). Iyon ang Phase 15 dito.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit hindi sapat na gawing `failed + 1` sa SQL pero pagkatapos pa rin ng argon2?**
  S: Hindi na mawawala ang bilang, pero ang lock check ay nangyayari pa rin BAGO ang argon2, sa lumang pagbasa. Lahat ng 20 ay nakalampas na sa check
  bago pa may nakapag-+1, kaya 20 pa rin ang dadaan sa argon2. Ang susi ay **kunin ang numero BAGO ang mabagal na hakbang**.
- **T: Bakit nadadagdagan ang bilang kahit TAMA ang password?**
  S: Hindi pa natin alam kung tama bago ang argon2, at kailangan ang numero bago iyon. Kapag tama, ibinabalik sa 0 agad. Maliit na kapalit.
- **T: Ano ang ibig sabihin ng "naka-lock ng Postgres ang row"?**
  S: Kapag may nag-a-UPDATE ng isang row, naghihintay ang ibang UPDATE sa parehong row hanggang matapos ito. Kaya isa-isa silang nagdadagdag,
  at bawat isa ay nakakakita ng pinakabagong bilang. Hindi ko kailangang gumawa ng sariling lock sa JavaScript.
- **T: Ano ang tuntunin para sa susunod kong code?**
  S: Huwag "SELECT muna, tapos UPDATE" para sa anumang binibilang o isang beses lang magagamit. Ilagay ang kondisyon sa `WHERE`, at `RETURNING`
  para malaman kung ako ang nanalo.

## Susunod
- **Day 68 — Transactions:** change/reset password na lahat o wala, at side effects (email, cookies) PAGKATAPOS ng commit.
  (Marami na ang nagawa noong Day 55 at 59. Susuriin kung may kulang pa.)

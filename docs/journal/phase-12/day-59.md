# Day 59 — 2026-09-27 · Phase 12 · Password reset

## Ano ang ginawa
- **`verification_tokens` table** (migration `0007`): SHA-256 lang ang naka-save, may `purpose` (reset ngayon, verification sa Day 60),
  `expires_at` (1 oras), `used_at` (isang beses lang).
- **`POST /api/auth/forgot-password`** → **laging 202 at parehong mensahe**, may account man o wala.
  - **Sumasagot muna**, saka hinahanap ang account at nagpapadala ng email (`lib/background.ts`). Pareho ang tagal: **1.8ms vs 1.7ms**.
  - Isang aktibong link lang: pinapawalang-bisa ng bagong request ang luma.
  - Rate limit: 5 bawat 15 minuto bawat IP (bawat request ay puwedeng magpadala ng email).
  - **Link: `…/reset-password#token=…`**: nasa **#fragment** ang token, kaya hindi ito napupunta sa kahit anong server.
- **`POST /api/auth/reset-password`** → mabilis na suri muna (walang argon2 para sa pekeng token), tapos isang **transaction**:
  gamitin ang token (atomic) + bagong password + **i-logout ang lahat ng session**.
- **Tests: 137** (9 bago).

## 🎯 Ang checkpoint ng Phase 12: natanggap ko ang totoong reset email sa INBOX ko
- Nag-register ako sa production gamit ang `nelson1869ai@gmail.com`, humiling ang AI ng reset link, at **nasa Inbox ito, hindi Spam**.
- Kumpara sa Day 58 (Spam): pinindot ko ang "Not spam", malinaw na transactional ang laman, at PASS pa rin ang SPF, DKIM at DMARC.
- Ang pagbukas ng link at paglagay ng bagong password ay sa **Day 61** (reset page sa frontend).

## Iba pang ginawa ngayong araw
- **Bagong admin:** `nelson1869ai@gmail.com`, sa production (#23) at sa dev (#148). Binura ang mga lumang admin (`nelson1869_prod@gmail.com`,
  `nelson_dev@1869.com`) **pagkatapos lang matiyak na admin na ang bago**. Nanatili ang audit logs ng binurang admin (actor → null).
- Naayos ang `14-pagination.http` at `15-audit-logs.http` (bagong admin email).

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | check-then-act na claim · walang pagbawi ng lumang link · 404 sa walang account · `?token=` · walang pag-logout | ✅ bumagsak lahat (race: 3/3) |
| Dev | timing ×20 (may account / wala) | ✅ 1.8ms vs 1.7ms |
| Dev | buong daloy: token mula sa terminal log → reset → ulit → login | ✅ 204 · 400 · bago ✓ luma ✗ · walang email sa walang account |
| Production | walang account · pekeng token | ✅ 202 (walang naipadalang email) · 400 |
| Production | reset email sa `nelson1869ai@gmail.com` | ✅ **Inbox** |

## Kumpara sa reference
- Pareho: single-use na token (hash, atomic claim), parehong sagot, background na email, i-logout ang lahat.
- **Iba:** `#token=` (fragment) sa halip na `?token=`; isang aktibong link lang; pre-check laban sa CPU abuse; **totoong email** (stub ang sa reference).

## Mga tanong ko pa / hindi pa malinaw

**Sariling tanong ko:** *"Paano kung hindi Gmail ang email ng bagong nag-register?"*
Gumagana ang kahit anong email provider (Yahoo, Outlook, email ng kumpanya). May sariling spam filter lang ang bawat isa.
Ang **pekeng email** (walang totoong inbox) ang problema: magba-bounce ang email (nakakasira ng reputasyon ng domain), at puwedeng
i-register ng iba ang email ko. **Ang solusyon: Day 60, email verification.**

**Sariling tanong ko:** *"Masisira ba ang roadmap kapag idinagdag iyon?"*
Hindi, dahil nasa roadmap na ito (Day 60). Isang desisyon lang: **soft** (makakapag-login pa, may paalala) o **hard** (bawal mag-login hangga't hindi verified).
Ang hard ay magla-lock ng mga dating account na hindi pa verified.

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit laging "If an account exists…" at hindi "Walang ganitong account"?**
  S: Kapag sinabi ng server na wala, malalaman ng attacker kung sino ang may account (user enumeration, Day 15). Pati ang tagal ng sagot ay dapat pareho.
- **T: Bakit nasa `#` ang token at hindi sa `?token=`?**
  S: Hindi kailanman ipinapadala ng browser ang bahagi pagkatapos ng `#` sa server. Kaya hindi ito lalabas sa logs ng Cloudflare Pages, sa Referer
  kapag may link sa ibang site, o sa analytics. Babasahin ito ng JavaScript ng reset page (Day 61).
- **T: Bakit i-logout ang lahat pagkatapos ng reset?**
  S: Kadalasang nagre-reset ang tao dahil nakalimutan o nanakaw ang password. Kung may nakapasok gamit ang lumang password, dapat maputol din ang session niya.

## Susunod
- Day 60 — email verification (soft o hard — ako ang pipili).

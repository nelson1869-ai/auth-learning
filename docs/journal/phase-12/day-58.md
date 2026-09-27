# Day 58 — 2026-09-27 · Phase 12 · Totoong email provider (Resend)

## Ano ang ginawa ko (Resend at Cloudflare)
- Pinili ko ang **Resend** (D-025). Gumawa ako ng account at idinagdag ang domain na `nelson1869.com` (region **Tokyo**).
- **DNS records sa Cloudflare** (6 na lahat ngayon):

| Type | Name | Para saan |
|---|---|---|
| TXT | `resend._domainkey` | **DKIM**: public key na sumusuri sa pirma ng bawat email |
| CNAME | `send`, `rsend` | **SPF / return-path**: kung aling server ang puwedeng magpadala para sa domain ko |
| TXT | `_dmarc` | **DMARC** `p=none`: ang patakaran kapag pumalya ang SPF o DKIM (bantayan muna) |

- **Mga pagkakamali ko (at paano nahuli):**
  - Nakalimutan ko ang `send` CNAME. Nahuli ito ng AI gamit ang DNS lookup.
  - Nang idagdag ko, naka-**Proxied** (orange cloud) ito, kaya mga IP ng Cloudflare ang lumalabas. Nahuli ito dahil `A` record ang
    ibinabalik sa halip na CNAME. Inayos ko sa **DNS only**.
- **Verified** ang domain. Nawala rin ang babala ng Cloudflare na "could be spoofed".
- **API key: "Sending access" lang**, para sa `nelson1869.com`. Ako mismo ang naglagay nito sa `.env.production`; hindi ko ipinakita sa chat.

## Ano ang ginawa ng AI (code)
- **`lib/email.ts`**: `sendEmail()` → **Resend** (production, `fetch` lang, may timeout) o **log lang** (dev at tests).
  Walang totoong email mula sa tests.
- **Fail-fast:** ayaw mag-start ng production kapag walang `RESEND_API_KEY`.
- **`npm run email:test -- <email>`**: script lang, hindi endpoint, dahil ang endpoint ay kayang gamitin para mag-spam.
- **Tests: 128** (7 bago).

## Ang resulta: deliverability
| | Resulta |
|---|---|
| Resend → Emails | **delivered** |
| Gmail "Show original" | **SPF PASS · DKIM PASS (d=nelson1869.com) · DMARC PASS** ✅ |
| Saan napunta | **Spam** ❌, sa dalawang email (pati ang maayos na transactional na laman) |

- Ang unang dahilan ayon sa Gmail: *"similar to messages that were identified as spam"*. Ang unang test ay may "test", emoji, at "Spam/SPF/DKIM" sa laman.
- Pero kahit maayos na ang laman, **Spam pa rin**: **bagong domain na walang reputasyon**. Kailangan ng **warm-up** (regular na email,
  binubuksan, "Not spam"). **Hindi ito maaayos ng code.** Tama ang teknikal na bahagi.
- Pinindot ko ang **"Report not spam"**. Babantayan natin sa Day 59 kung umaayos.

## Ang pinakanatutunan
- **Tatlong bantay laban sa pekeng email:** SPF (sino ang puwedeng magpadala), DKIM (pirma — parehong ideya ng RS256 noong Day 56), DMARC (patakaran).
- **"Delivered" ≠ "nasa Inbox".** Tinanggap ng Gmail, pero Spam ang pinagpasyahan nito.
- **Least privilege sa lahat:** "Sending access" na key, walang tracking, walang receiving.
- **Kapag DNS only ang kailangan, i-click ang orange cloud.** Default ng Cloudflare ang Proxied para sa CNAME.

## Mga tanong ko pa / hindi pa malinaw

**Sariling tanong ko:** *"Saan pupunta ang email? Anong account?"* Sa kahit anong email address na nabubuksan ko. Ang Resend ang
"kartero" (galing sa `no-reply@nelson1869.com`), kaya walang bagong account na kailangan para tumanggap. Sa totoong app,
sa email na ginamit ng user sa pag-register.

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung PASS lahat, bakit Spam pa rin?**
  S: Pinapatunayan ng authentication na **sa akin nga galing** ang email. Ang reputasyon naman ang nagsasabi kung **gusto ito ng mga tao**. Bagong domain,
  walang kasaysayan, kaya maingat ang Gmail. Umaayos ito habang may totoong email na natatanggap at binubuksan.
- **T: Bakit script at hindi endpoint ang test email?**
  S: Ang endpoint na "magpadala ng email sa kahit sino" ay gagamitin ng mga spammer, at masisira ang reputasyon ng domain ko.
  Ang script ay kailangan ng access sa server o sa `.env.production`.
- **T: Bakit "Sending access" lang ang API key?**
  S: Kung nanakaw, pagpapadala lang ang kaya nito, hindi ang pagbura ng domain o paggawa ng bagong key. Least privilege, tulad ng Cloudflare (isang repo lang) at Neon.

## Susunod
- Day 59 — password reset: single-use na token (hash, may expiry), "kung may account, may email na", at ang totoong reset email sa inbox ko.

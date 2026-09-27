# Day 55 — 2026-09-27 · Phase 11 · Change password

## Ano ang ginawa
- **`POST /api/auth/change-password`** `{ currentPassword, newPassword }`:
  - **reauthentication:** kailangan ang kasalukuyang password, kahit naka-login;
  - maling kasalukuyang password → **400** (`fields.currentPassword`) + audit `password_change_failed` · **rate limit** 10 palpak / 15 min;
  - bagong password: parehong patakaran ng register, at dapat iba sa kasalukuyan;
  - **isang transaction (lahat o wala):** bagong password + **bawiin ang LAHAT ng session** + bagong session para sa device na ito;
  - cookies at audit **pagkatapos** ng commit lang.
- **Frontend `/change-password`**: form na may error sa ilalim ng bawat field. May link mula sa Profile at sa "Mga device ko".
- **Tests: 109** (7 bago), kasama ang **rollback test**: pinapalya ang huling hakbang, at sinusuring walang nagbago.

## Bakit 400 at hindi 401 sa maling password
Ang 401 ay "hindi ka naka-login". Kapag 401, magre-refresh at uulitin ng `apiFetch` ng frontend (Day 51) ang request,
kaya **dalawang beses mabibilang** ang bawat maling hula sa rate limit. Naka-login ka naman; mali lang ang input, kaya 400.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang transaction · walang revoke-all · walang pagsuri sa kasalukuyang password | ✅ bumagsak ang bawat isa |
| Dev, browser (390px) | maling password → tama; dalawang device | ✅ "Incorrect password" sa field · tuloy ang phone · laptop → `/login` · luma ✗, bago ✓ · 0 React warning |
| Dev | `18-change-password.http` | ✅ 201 200 400 400 204 200 401 200 401 |
| Production, browser | parehong pagsubok, test account (binura pagkatapos) | ✅ pareho · 0 CSP violation · audit: `password_change_failed`, `password_changed` |

## Ang mga naging problema ngayong araw (hindi sa code)
- **Nag-restart ang PC/WSL.** Namatay ang dev Postgres (57 test ang "bumagsak" dahil sa `ECONNREFUSED`), at nabura ang scratchpad ng AI,
  pati ang `.http` runner. Binuhay ang Postgres, at isinulat ulit ang runner. **Sinubukan muna ang runner sa mga file na alam ang resulta**
  bago ito pinagkatiwalaan. Nahuli rito na kailangan ng `13-admin-rbac.http` ang account na `login-demo`.
- **Hindi makapag-push sa SSH:** walang laman ang ssh-agent pagkatapos ng restart (may passphrase ang key ko).
  Ginamit ang HTTPS URL at ang `gh` login, nang hindi binabago ang remote.

## Kumpara sa reference
- Pareho: reauthentication, hash bago ang transaction, bawiin ang lahat ng session sa transaction, audit pagkatapos.
- **Iba:** may rate limit sa maling kasalukuyang password, at audit ng palpak na pagsubok.
- **Wala pa sa atin:** `tokenVersion` (sa reference, agad na hindi na gumagana ang access token ng ibang device).
  Sa atin, ≤ 15 minuto pa. Nasa backlog.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit kailangan ang kasalukuyang password kung naka-login na ako?**
  S: Dahil puwedeng hindi ako ang gumagamit ng session (naiwang bukas na laptop, nakaw na cookie). Ang pagpalit ng password ang
  pinakamabilis na paraan para maagaw ang account, kaya kailangang patunayan ulit.
- **T: Bakit i-hash muna bago ang transaction?**
  S: Ang argon2 ay ~50ms na CPU. Kung nasa loob ito ng transaction, hawak ang koneksyon at ang mga lock habang naghihintay,
  kaya bumabagal ang ibang request. I-hash muna, tapos mabilis na isulat.
- **T: Paano kung nakalimutan ko ang password (hindi ako naka-login)?**
  S: Iyan ang **password reset sa email** (Phase 12), dahil kailangan ng ibang paraan para patunayang ikaw iyon.

## Susunod
- Day 56 — RS256 at JWT claims (`iss`, `aud`): private key ang pumipirma, public key ang sumusuri.

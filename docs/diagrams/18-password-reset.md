# 18 — Password reset

> 📅 Day 59 · Phase 12 (Email)
> **Code:** `backend/src/services/auth/password.service.ts` (`requestPasswordReset`, `resetPassword`, Day 76) · `controllers/auth.controller.ts` (sumasagot muna, cookie) · `lib/verificationTokens.ts` ·
> `lib/background.ts` · `lib/email.ts` (`passwordResetEmail`)
> **Frontend (Day 61):** `/forgot-password` · `/reset-password` — diagram 07
> **Subukan:** `backend/http/19-password-reset.http` · test: `backend/src/routes/password-reset.test.ts`

## Ang buong daloy

```mermaid
sequenceDiagram
    participant U as 👤 User (nakalimutan ang password)
    participant A as API
    participant D as Database
    participant R as Resend → 📧 Inbox
    U->>A: POST /forgot-password { email }
    A-->>U: 202 "If an account exists…" — AGAD, parehong sagot kahit walang account
    Note over A: sa background (pagkatapos sumagot) — kaya pareho ang tagal
    A->>D: may account ba? → audit: password_reset_requested
    A->>D: upsert ng token (SHA-256, 1 oras) — pinapalitan ang aktibong link, kaya hindi na gagana ang luma<br/>(Day 69: ISANG statement + partial UNIQUE index — isa lang ang aktibo kahit sabay)
    A->>R: "Reset your auth-learning password" · …/reset-password#token=XYZ
    R-->>U: email (ang token ay nasa #fragment — hindi napupunta sa kahit anong server)
    U->>A: POST /reset-password { token: XYZ, newPassword }
    A->>D: mabilis na suri (walang argon2 para sa pekeng token)
    Note over A: argon2.hash(bago) — BAGO ang transaction
    rect rgba(80,140,220,0.12)
    Note over A,D: 🔒 TRANSACTION — lahat o wala
    A->>D: 1. claim ang token (UPDATE … WHERE used_at IS NULL … RETURNING — atomic)
    A->>D: 2. bagong password · Day 64: tanggalin ang lock ng account
    A->>D: 3. i-logout ang LAHAT (bawiin ang refresh tokens)
    A->>D: 4. Day 64: bawiin ang tiwala ng lahat ng device · bagong trusted device para rito
    Note over A,D: pumalya ang kahit anong hakbang → ROLLBACK → 500, walang cookie,<br/>at HINDI nasayang ang link (magagamit ulit) — transactions.test.ts (Day 68)
    end
    Note over A: PAGKATAPOS ng commit lang: Set-Cookie device_token + audit: password_reset
    A-->>U: 204 → mag-login gamit ang bagong password
```

## Mga dapat pansinin

- **Parehong sagot, parehong tagal.** Kung sasabihin ng server na "walang ganitong account", malalaman ng attacker kung sino ang may account
  (user enumeration, Day 15). Kaya sumasagot muna, at saka gumagawa sa background. Sinukat: 1.8ms vs 1.7ms.
- **Single-use:** ang claim ay isang `UPDATE … WHERE used_at IS NULL AND expires_at > now() RETURNING`. Kapag sabay ang dalawang paggamit
  ng parehong link, isa lang ang mananalo (may test).
- **Isang aktibong link lang:** ang bagong request ay nagpapawalang-bisa sa luma, kaya ang pinakabagong email lang ang gagana.
- **`#token=` hindi `?token=`:** hindi ipinapadala ng browser ang fragment sa server, kaya hindi ito lalabas sa logs ng Cloudflare Pages,
  sa Referer, o sa analytics.
- **Lahat ng session ay nala-logout.** Kung may nakapasok gamit ang lumang password, tapos na siya.
- **Walang auto-login:** pagkatapos ng reset, mag-login gamit ang bagong password.
- **Kapalit (background sa memory):** kapag namatay ang server habang nagpapadala, mawawala ang email. Sa hinaharap: isang tunay na queue.

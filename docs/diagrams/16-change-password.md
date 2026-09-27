# 16 — Change password (reauthentication + i-logout ang lahat)

> 📅 Day 55 · Phase 11 (Mas ligtas na sessions)
> **Code:** `backend/src/routes/auth.ts` (`/auth/change-password`) · `backend/src/lib/session.ts` (`revokeAllSessions`) ·
> `frontend/src/pages/ChangePasswordPage.tsx`
> **Subukan:** `backend/http/18-change-password.http` · test: `change-password.test.ts`, `change-password-rollback.test.ts`

```mermaid
flowchart TD
    Req(["POST /api/auth/change-password<br/>{ currentPassword, newPassword }"]) --> Auth{"requireAuth"}
    Auth -->|"hindi naka-login"| R401["401"]
    Auth -->|"oo"| Lim{"changePasswordLimiter<br/>≥ 10 palpak / 15 min?"}
    Lim -->|"oo"| R429["429"]
    Lim -->|"hindi"| Zod{"Zod: bago 8–128,<br/>at iba sa kasalukuyan?"}
    Zod -->|"hindi"| R400a["400 · fields.newPassword"]
    Zod -->|"oo"| Re{"REAUTHENTICATION<br/>argon2.verify(kasalukuyang password)"}
    Re -->|"mali"| R400b["400 · fields.currentPassword<br/>+ audit: password_change_failed<br/>(400, hindi 401 — hindi ito 'hindi naka-login')"]
    Re -->|"tama"| Hash["argon2.hash(bago) — BAGO ang transaction<br/>(mabagal; huwag hawakan ang lock habang naghihintay)"]
    Hash --> Tx["TRANSACTION — lahat o wala:<br/>1. UPDATE users.password_hash<br/>2. bawiin ang LAHAT ng refresh token (reason: password_change)<br/>3. bagong refresh token para sa device na ito"]
    Tx -->|"pumalya sa gitna"| Roll["ROLLBACK → 500<br/>luma pa rin ang password · walang na-logout"]
    Tx -->|"commit"| Ok["PAGKATAPOS ng commit lang:<br/>bagong cookies + audit: password_changed<br/>204"]
```

## Mga dapat pansinin

- **Reauthentication:** kailangan ang kasalukuyang password, kahit naka-login na. Kung may nakanakaw ng session (hal. naiwang
  bukas na laptop), hindi niya mapapalitan ang password at hindi niya maaagaw ang account.
- **"High-risk event":** pagkatapos palitan ang password, lahat ng session ay maaaring galing sa magnanakaw, kaya **lahat ay binabawi**.
  Pagkatapos, bagong session para sa device na nagpalit.
- **Transaction:** kung hiwalay ang mga hakbang at pumalya sa gitna, puwedeng maiwan ang pinakamasamang estado: bagong password,
  pero buhay pa ang session ng magnanakaw. May test na pumapalya sa huling hakbang at sinusuring **walang nagbago**.
- **Mga cookie at audit PAGKATAPOS ng commit:** kung nag-rollback, walang dapat maipadala.
- **Natitirang limitasyon:** ang access token (JWT) ng ibang device ay gagana pa nang ≤ 15 minuto (Day 53). Ang reference ay may `tokenVersion`
  para rito; nasa backlog natin ito.

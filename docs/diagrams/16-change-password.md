# 16 — Change password (reauthentication + i-logout ang lahat)

> 📅 Day 55 · Phase 11 (Mas ligtas na sessions)
> **Code:** `backend/src/services/auth/password.service.ts` (`changePassword`, Day 75) · `controllers/auth.controller.ts` (HTTP) · `backend/src/lib/session.ts` (`revokeAllSessions`) ·
> `frontend/src/pages/ChangePasswordPage.tsx`
> **Subukan:** `backend/http/18-change-password.http` · test: `change-password.test.ts`, `change-password-rollback.test.ts`

```mermaid
flowchart TD
    Req(["POST /api/auth/change-password<br/>{ currentPassword, newPassword }"]) --> Auth{"requireAuth"}
    Auth -->|"hindi naka-login"| R401["401"]
    Auth -->|"oo"| Lim{"changePasswordLimiter<br/>≥ 10 palpak / 15 min?"}
    Lim -->|"oo"| R429["429"]
    Lim -->|"hindi"| Zod
    subgraph CTRL["🌐 CONTROLLER — controllers/auth.controller.ts: changePassword (HTTP lang, Day 75)"]
        Zod{"parseOr400: bago 8–128,<br/>at iba sa kasalukuyan?"}
        Zod -->|"hindi"| R400a["400 · fields.newPassword"]
        R400b["400 · fields.currentPassword<br/>(400, hindi 401 — hindi ito 'hindi naka-login')"]
        Ok["Set-Cookie token · refresh_token · device_token → 204"]
    end
    Zod -->|"oo · { ...input, userId, device }<br/>(server-derived sa HULI)"| Re
    subgraph SVC["⚙️ SERVICE — services/auth/password.service.ts: changePassword (walang Express)"]
        Re{"REAUTHENTICATION<br/>argon2.verify(kasalukuyang password)"}
        Re -->|"mali → audit: password_change_failed"| WP["wrong_password"]
        Re -->|"tama"| Hash["argon2.hash(bago) — BAGO ang transaction<br/>(mabagal; huwag hawakan ang lock habang naghihintay)"]
        Hash --> T1
        subgraph TX["🔒 TRANSACTION — lahat o wala (db.transaction)"]
            T1["1. UPDATE users.password_hash"] --> T2["2. bawiin ang LAHAT ng refresh token<br/>(reason: password_change)"]
            T2 --> T3["3. Day 64: bawiin ang tiwala ng LAHAT ng device"]
            T3 --> T4["4. bagong refresh token para sa device na ito"]
            T4 --> T5["5. bagong trusted device para rito"]
        end
        T5 -->|"commit"| Aud["audit: password_changed<br/>→ changed (mga token)"]
    end
    WP --> R400b
    Aud -->|"PAGKATAPOS ng commit lang"| Ok
    TX -.->|"pumalya ang kahit anong hakbang"| Roll["ROLLBACK → 500 · WALANG cookie<br/>luma pa rin ang password · walang na-logout ·<br/>hindi nabawi ang tiwala ng mga device<br/>(change-password-rollback.test.ts · transactions.test.ts)"]
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

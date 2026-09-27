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

## Mass assignment: apat na depensa (Day 77)

> **Subukan:** `backend/http/24-mass-assignment.http` · test: `backend/src/routes/mass-assignment.test.ts`

```mermaid
flowchart LR
    Body(["body mula sa attacker<br/>{ currentPassword, newPassword,<br/>userId: 7 ← ang biktima }"]) --> D1["1 · parseOr400 (Zod)<br/>tinatanggal ang userId<br/>(wala sa schema)"]
    D1 --> D2["2 · controller<br/>{ ...input, userId: req.userId }<br/>ang galing sa SERVER ang nasa huli"]
    D2 --> D3["3 · service<br/>tahasang kinukuha ang bawat field<br/>(hindi ipinapasa ang buong input sa DB)"]
    D3 --> D4["4 · reauthentication<br/>kailangan ang password ng MAY-ARI"]
    D4 --> OK["✅ ang password lang ng attacker<br/>ang napalitan"]
```

| Sinira (pansubok, Day 77) | Ligtas pa ba? |
|---|---|
| 1 lang (raw na body mula sa `parseOr400`) | ✅ oo: ang spread (2) at ang service (3) pa rin ang nagbabantay. Bumagsak lang ang unit test ng `parseOr400` |
| 2 lang (baligtad ang spread) | ✅ oo: tinatanggal ni Zod (1) ang `userId` |
| 1 + 2 | ❌ **napalitan ang password ng biktima**, pero sa test lang (parehong password). Kapag iba ang password ng biktima: **400 "Incorrect password"** (4) |
| 1 + 3 (register: `values({ ...input })`) | ❌ **naging admin** ang attacker |
| 1 + 2 (login: device mula sa body) | ❌ ang IP sa "Mga device ko" ay galing sa attacker |

**Aral:** walang iisang depensa na sapat kapag nagkamali ang code. Kaya may ilang layer: kailangang magkamali ang **dalawa** bago magtagumpay ang atake.

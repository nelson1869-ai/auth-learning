# 14 — Refresh token rotation at reuse detection

> 📅 Day 52 · Phase 11 (Mas ligtas na sessions)
> **Code:** `backend/src/lib/session.ts` (`rotateRefreshToken`) · `backend/src/routes/auth.ts` (`/auth/refresh`)
> **Subukan:** `backend/http/16-refresh-tokens.http` · test: `backend/src/routes/rotation.test.ts`

## Normal: bawat refresh ay may BAGONG refresh token

```mermaid
sequenceDiagram
    participant U as 👤 Tunay na user
    participant A as API
    participant D as refresh_tokens
    U->>A: POST /refresh · refresh_token = T1
    A->>D: UPDATE … SET revoked_at, reason='rotated' WHERE hash=T1 AND revoked_at IS NULL RETURNING
    Note over A,D: ISANG atomic na statement, kasama ang INSERT ng T2 sa iisang TRANSACTION
    A->>D: INSERT T2 (parehong family_id)
    A-->>U: 204 · token = bagong JWT · refresh_token = T2
    U->>A: (pagkalipas ng 15 min) POST /refresh · T2
    A-->>U: 204 · T3 … (tuloy-tuloy)
```

## Nakaw: ginamit ulit ang lumang token → bawiin ang BUONG family

```mermaid
sequenceDiagram
    participant U as 👤 Tunay na user
    participant M as 😈 Magnanakaw (may kopya ng T1)
    participant A as API
    participant D as refresh_tokens
    U->>A: POST /refresh · T1
    A-->>U: 204 · T2
    Note over M: lampas 10 segundo
    M->>A: POST /refresh · T1 (luma, "rotated" na)
    A->>D: UPDATE … SET reason='reuse' WHERE family_id = F AND revoked_at IS NULL
    A-->>M: 401 · + log WARN · + audit: refresh_reuse
    U->>A: POST /refresh · T2
    A-->>U: 401 — binawi rin (hindi alam kung sino ang magnanakaw) → login ulit
    Note over U,D: Parehong nawalan ng session · ang tunay na user ay makakapag-login ulit, ang magnanakaw ay hindi
```

## Ang desisyon sa bawat `POST /api/auth/refresh`

```mermaid
flowchart TD
    Req(["POST /api/auth/refresh<br/>Cookie: refresh_token"]) --> Claim{"I-claim sa transaction:<br/>hindi binawi AT hindi expired?"}
    Claim -->|"oo (nanalo)"| Rot["rotated → 204<br/>bagong access token + BAGONG refresh token"]
    Claim -->|"hindi"| Row{"Ano ang row?"}
    Row -->|"wala · expired · binawi dahil sa logout o nakaw"| Inv["401 · binubura ang mga cookie"]
    Row -->|"rotated KANINA LANG (< 10s)<br/>at buhay pa ang family"| Grace["grace → 204<br/>access token LANG<br/>(sabay na refresh, hal. 2 tab)"]
    Row -->|"rotated lampas 10s"| Reuse["reused → bawiin ang BUONG family<br/>401 + WARN + audit: refresh_reuse"]
```

## Mga dapat pansinin

- **Bakit ang buong family?** Kapag ginamit ang lumang token, dalawang tao ang may hawak nito, at hindi alam ng server
  kung sino ang tunay. Ang tanging ligtas: patayin ang session ng pareho. Ang tunay na user ay makakapag-login ulit; ang magnanakaw, hindi.
- **Family lang, hindi lahat ng session ng user.** Ang ibang login (hal. ang laptop kapag ang phone ang nanakaw) ay hindi ginagalaw.
- **Reuse interval (10s):** walang ganito ang reference ("no refresh grace window"). Kapalit: may 10 segundong palugit
  ang magnanakaw na access token lang ang makukuha, walang bagong refresh token.
- **Race condition na nahuli ng test (Day 52):** kung hiwalay ang claim at ang INSERT ng bagong token, nakikita ng mga
  sabay na request na "walang aktibong token sa family" → itinuturing na nakaw → na-logout ang user. Inayos: iisang transaction.

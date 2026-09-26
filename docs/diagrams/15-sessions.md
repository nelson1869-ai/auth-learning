# 15 — Mga device ko (sessions) at IDOR

> 📅 Day 54 · Phase 11 (Mas ligtas na sessions)
> **Code:** `backend/src/lib/session.ts` (`listSessions`, `revokeSession`) · `backend/src/routes/auth.ts` ·
> `frontend/src/pages/SessionsPage.tsx`
> **Subukan:** `backend/http/17-sessions.http` · test: `backend/src/routes/sessions.test.ts`

## Isang session = isang login = isang family

```mermaid
flowchart LR
    subgraph U["user #7"]
        P["📱 Safari sa iPhone<br/>family A · ito ang device mo"]
        L["💻 Chrome sa Windows<br/>family B"]
    end
    P -->|"login 9:00 · refresh 9:15 · 9:30 …"| A1[("family A<br/>token 1 (rotated) → token 2 (rotated) → token 3 ✅ aktibo<br/>since = token 1 · huling gamit = token 3")]
    L --> B1[("family B<br/>token 1 ✅ aktibo")]
```

## DELETE /api/auth/sessions/:id — at ang IDOR

```mermaid
flowchart TD
    Req(["DELETE /api/auth/sessions/:id"]) --> Auth{"requireAuth<br/>naka-login?"}
    Auth -->|"hindi"| R401["401"]
    Auth -->|"oo → req.userId"| Uuid{"UUID ba ang :id?<br/>(z.uuid)"}
    Uuid -->|"hindi"| R404a["404 Not found<br/>(hindi na tinatanong ang DB —<br/>kung hindi, error ng Postgres → 500)"]
    Uuid -->|"oo"| Upd["UPDATE refresh_tokens SET revoked, reason='logout'<br/>WHERE family_id = :id<br/>AND user_id = req.userId ← 🔐 ang bantay laban sa IDOR<br/>AND revoked_at IS NULL"]
    Upd -->|"0 rows<br/>(wala, o sa IBANG user)"| R404b["404 Not found<br/>PAREHONG sagot — hindi nalalaman kung totoo ang id"]
    Upd -->|"≥ 1 row"| Ok["204 + audit: session_revoked<br/>(+ burahin ang cookies kung ito ang device ko)"]
```

## Mga dapat pansinin

- **IDOR = Insecure Direct Object Reference.** Ang id ay galing sa URL, kaya kayang palitan ng kahit sino. Hindi sapat na
  "naka-login ka". Dapat **sa iyo** ang bagay. Kaya nasa `WHERE` mismo ang `user_id = req.userId`, hindi sa hiwalay na check.
- **404, hindi 403.** Ang 403 ay nagsasabing "totoo ang id, pero hindi sa iyo", na impormasyon para sa attacker.
- **Hindi agad nala-logout ang device.** Binabawi ang refresh token, pero ang access token (JWT) nito ay gagana pa nang ≤ 15 minuto
  (Day 53: stateless).
- **Hula lang ang pangalan ng device** ("Safari sa iPhone"), mula sa User-Agent na kayang pekein. Para sa pagkilala lang ito, hindi security.

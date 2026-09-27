# 17 — Ang buhay ng isang session (Phase 11 sa isang tingin)

> 📅 Day 57 · Phase 11 review (buod ng Day 51–56)
> **Code:** `backend/src/lib/session.ts` · `backend/src/lib/jwt.ts` · `services/auth/session.service.ts` + `controllers/auth.controller.ts` (Day 75) · `frontend/src/api/auth.ts` (`apiFetch`)
> **Subukan:** `backend/http/16`–`18` · detalye: diagram 14 (rotation), 15 (mga device), 16 (change password)

## Isang refresh token: mula sa login hanggang sa katapusan

Bawat hilera sa `refresh_tokens` ay may isa sa mga estadong ito (`revoked_at`, `revoke_reason`, `expires_at`):

```mermaid
stateDiagram-v2
    [*] --> Aktibo: login · o rotation (bagong token, parehong family)
    Aktibo --> Rotated: POST /refresh (Day 52)<br/>may bagong token sa family
    Rotated --> Rotated: ginamit ulit sa loob ng 10s<br/>(sabay na refresh, 2 tab) → access token lang
    Rotated --> Reuse: ginamit ulit LAMPAS 10s<br/>= NAKAW → binawi ang BUONG family
    Aktibo --> Reuse: kasama sa family na binawi
    Aktibo --> Logout: POST /logout (Day 53)<br/>o "Mga device ko" → Logout (Day 54)
    Aktibo --> PasswordChange: pinalitan ang password (Day 55)<br/>LAHAT ng family ng user
    Aktibo --> Expired: 7 araw na walang refresh
    Rotated --> [*]
    Reuse --> [*]: 401 + WARN + audit refresh_reuse
    Logout --> [*]: 401 (hindi itinuturing na nakaw)
    PasswordChange --> [*]: 401
    Expired --> [*]: 401
```

## Ang dalawang token sa bawat request

```mermaid
sequenceDiagram
    participant F as 🌐 Frontend (apiFetch)
    participant A as API
    participant D as refresh_tokens
    F->>A: GET /api/... · Cookie: token (JWT, RS256, 15 min)
    Note over A: jwt.verify gamit ang PUBLIC key · iss · aud — walang database (stateless)
    A-->>F: 200 — o 401 kapag expired ang access token
    F->>A: POST /api/auth/refresh · Cookie: refresh_token (7 araw, Path=/api/auth) — ISA lang kahit sabay ang 401
    A->>D: claim + bagong token (transaction)
    A-->>F: 204 · bagong token + bagong refresh_token
    F->>A: inuulit ang orihinal na request → 200
```

## Mga dapat pansinin

- **Stateless ang access token, stateful ang refresh token.** Mabilis ang access token dahil walang database, pero hindi ito mababawi,
  kaya 15 minuto lang. Ang refresh token ay nasa database, kaya kayang bawiin (logout, device, password, nakaw).
- **Bakit ang buong family kapag nakaw?** Ang rotation ay nangangahulugang isang beses lang magagamit ang bawat token. Kapag ginamit nang dalawang beses,
  siguradong may kopya ang ibang tao, at hindi alam ng server kung sino ang tunay, kaya ang ligtas ay patayin ang buong login.
- **Hindi ginagalaw ang ibang family.** Ang isang device na nanakawan ay hindi nagla-logout ng ibang device. Pinalitan ng password lang ang lahat.
- **Napatunayan (Day 56):** kahit palitan ang buong paraan ng pagpirma (HS256 → RS256), hindi kailangang mag-login ulit,
  dahil ang refresh token ang nagbibigay ng bagong access token.

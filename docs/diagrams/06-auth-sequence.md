# 06 — Buong auth flow (sequence)

> 📅 Day 18 · Phase 4 (Register at login) · in-update sa Day 48 (audit log), Day 49 (`role`), Day 51 (refresh token), Day 52 (rotation), Day 53 (totoong logout) at Day 56 (RS256)
>
> **Code:** `backend/src/routes/auth.ts` · `backend/src/middleware/requireAuth.ts`
> **Subukan:** `04-register.http` → `05-login.http` → `06-me.http` → `07-logout.http`

**Sequence diagram** = sino ang nakikipag-usap kanino, at sa anong pagkakasunod —
basahin mula taas pababa. (Ang flowchart ay para sa mga desisyon sa loob ng isang
request; ito ay para sa buong kuwento, request pagkatapos ng request.)

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 User
    participant B as 🌐 Browser / REST Client<br/>(may cookie jar)
    participant S as ⚙️ Express<br/>routes/auth.ts
    participant D as 🗄️ Postgres<br/>users · audit_logs

    rect rgba(128,128,128,0.08)
    Note over U,D: REGISTER — Day 13–14
    U->>B: email, password
    B->>S: POST /api/auth/register { email, password }
    S->>S: Zod (lowercase email) → argon2.hash (~50ms)
    S->>D: INSERT ... RETURNING id, email, name
    D-->>S: bagong row (o 23505 → 409)
    S->>D: INSERT audit_logs (register) — Day 48
    S-->>B: 201 { user } — walang hash, walang cookie
    end

    rect rgba(128,128,128,0.08)
    Note over U,D: LOGIN — Day 15–16
    B->>S: POST /api/auth/login { email, password }
    S->>D: SELECT ... WHERE email = ?
    D-->>S: user (o wala → DUMMY_HASH, parehong ~50ms)
    S->>S: argon2.verify → jwt.sign({ sub: id }, PRIVATE key, RS256, 15m, iss, aud)
    S->>D: INSERT refresh_tokens (SHA-256 ng random na token, 7 araw) — Day 51
    S->>D: INSERT audit_logs (login · o login_failed kapag mali) — Day 48
    S-->>B: 200 { user } + Set-Cookie: token=eyJ... (15 min) · refresh_token=... (7 araw, Path=/api/auth) · HttpOnly · SameSite=Lax
    B->>B: itinatago ang cookie (hindi mababasa ng JavaScript)
    end

    rect rgba(128,128,128,0.08)
    Note over U,D: ME — Day 17 (bawat protektadong request)
    B->>S: GET /api/auth/me — Cookie: token=eyJ... (kusang ipinadala)
    S->>S: requireAuth: jwt.verify gamit ang PUBLIC key (pirma + exp + iss + aud, RS256 lang) → req.userId
    S->>D: SELECT id, email, name, role WHERE id = ?
    D-->>S: user
    S-->>B: 200 { user } (401 kung walang/mali/expired ang token)
    end

    rect rgba(128,128,128,0.08)
    Note over U,D: REFRESH — Day 51 (kapag expired na ang 15-minutong access token)
    B->>S: GET /api/... — Cookie: token=<expired>
    S-->>B: 401
    B->>S: POST /api/auth/refresh — Cookie: refresh_token=... (isang beses lang kahit sabay ang maraming 401)
    S->>D: UPDATE … SET revoked_at, reason='rotated' WHERE token_hash = sha256(...) AND aktibo · + INSERT bagong token (transaction)
    S-->>B: 204 + Set-Cookie: token=<bagong JWT, 15 min> · refresh_token=<BAGO> (Day 52 — tingnan ang diagram 14)
    B->>S: inuulit ang orihinal na request → 200
    end

    rect rgba(128,128,128,0.08)
    Note over U,D: LOGOUT — Day 18
    B->>S: POST /api/auth/logout
    S->>D: UPDATE refresh_tokens SET revoked_at, reason='logout' WHERE family = (family ng token) — Day 53
    S->>D: INSERT audit_logs (logout · sino = mula sa access o refresh token) — Day 48
    S-->>B: 204 + Set-Cookie: token= at refresh_token= · Expires=1970 (burahin ang dalawa, Day 51)
    B->>B: binura ang cookie
    B->>S: GET /api/auth/me — walang cookie
    S-->>B: 401 Not authenticated
    end
```

## Mga dapat pansinin

- **Isang beses lang ipinapadala ang password** — sa login. Pagkatapos, ang cookie
  na ang nagpapakilala sa iyo sa bawat request.
- **Hindi nagtatanong ang server sa database kung "naka-login" ka** — sinusuri lang
  nito ang pirma ng token (stateless). Mabilis, pero may kapalit ⬇️
- **⚠️ Limitasyon:** sa browser lang nabubura ang cookie sa logout. Ang token na
  nakopya bago mag-logout ay valid pa hanggang mag-expire (sinubukan, Day 18: 200).
  Lulutasin ng refresh tokens sa database — Phase 11 (Day 51–52), D-012.

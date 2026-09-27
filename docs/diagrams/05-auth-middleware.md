# 05 — Auth middleware (`requireAuth`)

> 📅 Day 17 · Phase 4 (Register at login) · in-update sa Day 48 (`userIdFromToken`), Day 49 (`role` sa `/me`) at Day 56 (RS256, `lib/jwt.ts`)
>
> **Code:** `backend/src/middleware/requireAuth.ts` · `backend/src/controllers/auth.controller.ts` (`me`) · `services/auth/session.service.ts` (`getMe`, Day 75)
> **Subukan:** `backend/http/06-me.http`

## Paano sinusuri ang bawat protektadong request

```mermaid
flowchart TD
    Req(["GET /api/auth/me<br/>Cookie: token=eyJ... (kusang ipinadala ng browser)"]) --> CP["cookieParser()<br/>→ req.cookies.token"]
    CP --> MW{"requireAuth<br/>may token ba?"}
    MW -->|"wala"| U1["401 Not authenticated"]
    MW -->|"mayroon"| V{"jwt.verify(token, PUBLIC key,<br/>{ algorithms: ['RS256'], issuer, audience })<br/>lib/jwt.ts (Day 56)"}
    V -->|"binago · expired · sira · alg=none ·<br/>HS256 · ibang key · maling iss/aud"| U2["401 Not authenticated<br/>(iisang sagot — hindi sinasabi kung bakit)"]
    V -->|"tama ang pirma at hindi expired"| Set["req.userId = Number(payload.sub)<br/>next() → tuloy sa route<br/>(userIdFromAccessToken sa lib/jwt.ts — ginagamit din ng logout)"]
    Set --> Route["route: SELECT id, email, name, role<br/>FROM users WHERE id = req.userId"]
    Route --> Found{"May user pa ba?"}
    Found -->|"wala na (nabura)"| U3["401 Not authenticated"]
    Found -->|"oo"| OK["✅ 200 { user: { id, email, name, role } }<br/>role mula Day 49 (para sa Admin link)"]
```

## Mga dapat pansinin

- **Middleware = `(req, res, next)`.** `next()` → tuloy sa route; walang `next()` →
  hanggang dito lang (dapat may sagot, kung hindi nakabitin ang request — Day 06).
- **Isang beses isinulat, gamit ng marami:** `router.get('/auth/me', requireAuth, ...)`.
  Sa Day 18 (logout) at Phase 10 (admin) — idadagdag lang ang `requireAuth`.
- **Import sa itaas!** Ginagamit ang `requireAuth` habang nilo-load ang file
  (`router.get(...)`), kaya kapag nakalimutan ang import, hindi na nagsisimula ang
  BUONG server (`ReferenceError` — nangyari sa Day 17).
- **Sinubukan (Day 17), lahat 401:** walang cookie, binagong `sub`, sirang token,
  expired, `alg: none`, ibang secret, at nabura na ang user.
- **Galing sa database ang user**, hindi sa token — kaya laging bago ang data, at
  nahuhuli ang user na nabura na kahit may valid pang token.
- **401 vs 403:** 401 = "hindi kita kilala" (authentication — ngayon).
  403 = "kilala kita, pero bawal ka rito" (authorization — Phase 10, admin).

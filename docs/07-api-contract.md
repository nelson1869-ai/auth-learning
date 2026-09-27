# 07 — API Contract (ang kasunduan ng frontend at backend)

> 📅 Sinimulan sa Day 13 · Phase 4 · in-update sa Day 14 (validation) Day 15 (login), Day 16 (JWT cookie), Day 17 (me) at Day 18 (logout) · **I-update tuwing may bago o nagbagong endpoint.**
>
> **API contract** = ang listahan ng bawat endpoint: ano ang ipapadala, ano ang
> babalik, at anong status code. Sa totoong team, ito ang binabasa ng frontend
> developer para hindi na kailangang basahin ang backend code. Kapag hindi tugma
> ang contract sa code, **mali ang isa sa kanila** — ayusin agad.
>
> Base URL — dev: `http://localhost:3000` · **production: `https://api.nelson1869.com`** · Lahat ng body ay JSON
> (`Content-Type: application/json`).
>
> **CORS (Day 22):** pinapayagan lang ang `CLIENT_URL` (dev: `http://localhost:5173`, production: `https://nelson1869.com`),
> may `credentials: true`. Sa frontend: `fetch(..., { credentials: 'include' })` —
> kung wala ito, hindi maipapadala o maitatago ang cookie na `token`.

## Buod

| Method | Path | Para saan | Auth | `.http` |
|---|---|---|---|---|
| GET | `/api/health` | Buhay ba ang server? | — | `01-health.http` |
| POST | `/api/echo` | Pang-aral: ibinabalik ang body | — | `02-echo.http` |
| GET | `/api/users/count` | Ilang user ang mayroon | — | `03-users-count.http` |
| POST | `/api/auth/register` | Gumawa ng account | — | `04-register.http` |
| POST | `/api/auth/login` | Patunayan kung sino ka | — | `05-login.http` |
| GET | `/api/auth/me` | Sino ang naka-login | 🍪 cookie `token` | `06-me.http` |
| POST | `/api/auth/logout` | Burahin ang mga cookie | — | `07-logout.http` |
| POST | `/api/auth/refresh` | Bagong access token (Day 51) | 🍪 cookie `refresh_token` | `16-refresh-tokens.http` |
| GET | `/api/auth/sessions` | Mga naka-login kong device (Day 54) | 🍪 cookie `token` | `17-sessions.http` |
| DELETE | `/api/auth/sessions/:id` | I-logout ang isang device (Day 54) | 🍪 cookie `token` | `17-sessions.http` |
| POST | `/api/auth/change-password` | Palitan ang password (Day 55) | 🍪 cookie `token` | `18-change-password.http` |
| POST | `/api/auth/forgot-password` | Humingi ng reset link sa email (Day 59) | — | `19-password-reset.http` |
| POST | `/api/auth/reset-password` | Bagong password gamit ang link (Day 59) | — (ang token) | `19-password-reset.http` |
| POST | `/api/auth/verify-email` | I-verify ang email gamit ang link (Day 60) | — (ang token) | `20-verify-email.http` |
| POST | `/api/auth/resend-verification` | Bagong verification link (Day 60) | 🍪 cookie `token` | `20-verify-email.http` |
| GET | `/api/admin/users?page=&limit=` | Listahan ng users, isang page (admin) | 🍪 cookie + **role `admin`** | `13-admin-rbac.http` · `14-pagination.http` |
| GET | `/api/admin/audit-logs?page=&limit=` | Audit log, pinakabago muna (admin) | 🍪 cookie + **role `admin`** | `15-audit-logs.http` |

---

## `GET /api/health`
**Response 200**
```json
{ "status": "ok", "time": "2026-09-25T10:00:00.000Z" }
```

## `POST /api/echo`
**Request:** kahit anong JSON · **Response 200:** `{ "received": <ang body> }`
(Walang `Content-Type: application/json` → `{}`; sirang JSON → 400.)

## `GET /api/users/count`
**Response 200:** `{ "count": 3 }` · **500** `{ "error": "Internal server error", "requestId": "..." }` kapag hindi maabot ang database (pagkalipas ng 5 segundo).
Bilang lang — hindi kailanman ang listahan ng users.

## `POST /api/auth/register`
**Request**
```json
{ "email": "ana@example.com", "password": "password123", "name": "Ana" }
```
| Field | Required | Patakaran (Zod — `validations/auth.ts`) |
|---|---|---|
| `email` | ✅ | string, tamang email · **tina-trim at ginagawang lowercase** bago i-save · natatangi (UNIQUE) |
| `password` | ✅ | string, 8–128 characters · hindi sine-save — hash lang (argon2id) |
| `name` | — | string, 1–100 characters pagkatapos i-trim · `null` kung wala |
| *(iba pa)* | — | **binabalewala** (hal. `role`) |

**Responses**

| Status | Kailan | Body |
|---|---|---|
| **201** | Nagawa ang account | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana" } }` |
| **400** | Mali ang input (lahat ng mali, sabay) | `{ "error": "Invalid input", "fields": { "email": ["Invalid email address"], "password": ["Too small: expected string to have >=8 characters"] } }` |
| **409** | May account na ang email (kahit ibang titik: `Ana@` = `ana@`) | `{ "error": "Email already registered" }` |

**Hindi kailanman ibinabalik:** `password`, `password_hash`.

## `POST /api/auth/login`
**Request**
```json
{ "email": "ana@example.com", "password": "password123" }
```
| Field | Required | Patakaran (Zod — `loginSchema`) |
|---|---|---|
| `email` | ✅ | string, tamang email · tina-trim at ginagawang lowercase |
| `password` | ✅ | string, 1–128 characters (hindi 8 — para makapag-login pa rin ang lumang account kapag binago ang patakaran) |

**Responses**

| Status | Kailan | Body |
|---|---|---|
| **200** | Tama ang email at password — **may `Set-Cookie: token`** | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana" } }` |
| **400** | Mali ang hugis ng input | `{ "error": "Invalid input", "fields": { ... } }` |
| **401** | Maling password **o** walang account — **iisang sagot, parehong tagal** | `{ "error": "Invalid email or password" }` |
| **423** | Day 63: naka-lock ang account (5 sunod-sunod na maling password → 15 minuto) — **kahit tama ang password** · header `Retry-After: <segundo>` · walang cookie | `{ "error": "Account temporarily locked. Please try again later." }` |
| **429** | Day 43: 10 palpak na login bawat IP bawat 15 minuto | `{ "error": "Too many attempts. Please try again later." }` |

**Mga cookie (sa 200 lang, Day 51):**
- `token=<JWT>; Max-Age=900; Path=/; HttpOnly; SameSite=Lax` — **access token, 15 minuto**. Payload: `{ "sub": "<user id>", "iat", "exp", "iss": "auth-learning-api", "aud": "auth-learning-web" }`, **RS256** (Day 56; dati HS256).
- `refresh_token=<random>; Max-Age=604800; Path=/api/auth; HttpOnly; SameSite=Lax` — **refresh token, 7 araw**. SHA-256 hash lang ang nasa database (`refresh_tokens`).

- `device_token=<random>; Max-Age=15552000; Path=/api/auth/login; HttpOnly; SameSite=Lax` — **Day 64, 180 araw**, kapag WALA pang valid na
  device cookie ang browser para sa account na ito. Hindi login: pinipili lang kung aling lockout counter ang gagamitin. SHA-256 lang sa `trusted_devices`.

(+ `Secure` kapag `NODE_ENV=production`.) Hindi mababasa ng JavaScript ang mga ito — kusang ipinapadala ng browser.

## `GET /api/auth/me`
**Auth:** kailangan ang cookie na `token` (mula sa login). Walang body.

| Status | Kailan | Body |
|---|---|---|
| **200** | Tama ang token at may user pa | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana", "role": "user" } }` — `role` mula Day 49, galing sa database (hindi sa token) · **`emailVerified`** (true/false) mula Day 60 |
| **401** | Walang cookie, binago/sira/expired ang token, o nabura na ang user — **iisang sagot** | `{ "error": "Not authenticated" }` |

## `POST /api/auth/logout`
**Auth:** hindi kailangan (laging gumagana). Walang body.

| Status | Kailan | Body / Headers |
|---|---|---|
| **204** | Palagi — may cookie man o wala | walang body · binubura ang **dalawang** cookie: `token` (Path=/) at `refresh_token` (Path=/api/auth), `Expires=Thu, 01 Jan 1970` |

⚠️ Sa browser lang nabubura ang mga cookie — ang access token na nakopya bago mag-logout ay valid pa hanggang
mag-expire (≤ 15 minuto — hindi ito naka-save, kaya hindi mababawi).

**Day 53 — totoong logout:** binabawi ang refresh token (at ang buong family nito — ang login na ito, sa device na ito)
sa database (`revoke_reason = 'logout'`). Ang kinopyang refresh token → `401`. Hindi ginagalaw ang ibang device.
Hindi ito itinuturing na nakaw (walang `refresh_reuse`). Ang "sino" sa audit ay mula sa access token, o sa refresh token kung expired na ang access token.

## `POST /api/auth/refresh` (Day 51)
**Auth:** ang cookie na `refresh_token` (Path=/api/auth). Walang body. Tinatawag ng frontend kapag 401 ang isang request.

| Status | Kailan | Body / Headers |
|---|---|---|
| **204** | Aktibo ang refresh token | walang body · `Set-Cookie: token=<bagong JWT>; Max-Age=900` **at** `refresh_token=<BAGONG token>` (rotation, Day 52) — hindi na gagana ang luma |
| **204** | Ang token ay na-rotate **kanina lang** (< 10s) — sabay na refresh, hal. 2 tab | `Set-Cookie: token=<bagong JWT>` lang (walang bagong refresh token) |
| **401** | Walang cookie, pekeng token, binawi, expired, o nabura ang user | `{ "error": "Not authenticated" }` + binubura ang dalawang cookie |
| **401** | **Ginamit ulit ang lumang token** (lampas 10s) — posibleng nakaw | pareho, **at binabawi ang buong family** (pati ang bagong token) + audit `refresh_reuse` |

## `GET /api/auth/sessions` (Day 54)
**Auth:** cookie `token`. Walang body.

| Status | Kailan | Body |
|---|---|---|
| **200** | Naka-login | `{ "sessions": [ { "id": "<uuid ng family>", "userAgent": "…", "ip": "…", "since": "…", "lastUsedAt": "…", "current": true } ] }` — pinakabagong gamit muna · walang token o hash |
| **401** | Hindi naka-login | `{ "error": "Not authenticated" }` |

## `DELETE /api/auth/sessions/:id` (Day 54)
**Auth:** cookie `token`. Walang body. 🔐 Naka-scope sa naka-login na user (IDOR).

| Status | Kailan | Body |
|---|---|---|
| **204** | Session ko, at aktibo | walang body · binubura rin ang cookies kung ito ang device na nagtatanong · audit `session_revoked` |
| **404** | Walang ganito, **session ng ibang user**, o hindi UUID ang `:id` — **iisang sagot** | `{ "error": "Not found" }` |
| **401** | Hindi naka-login | `{ "error": "Not authenticated" }` |

## `POST /api/auth/change-password` (Day 55)
**Auth:** cookie `token`. **Body:** `{ "currentPassword": "…", "newPassword": "…" }` (bago: 8–128, iba sa kasalukuyan).
Rate limit: 10 palpak bawat 15 minuto.

| Status | Kailan | Body / Headers |
|---|---|---|
| **204** | Napalitan | walang body · **bagong** `token`, `refresh_token` at `device_token` (Day 64) (tuloy ka rito) · binawi ang LAHAT ng ibang session at ang tiwala ng lahat ng ibang device · audit `password_changed` |
| **400** | Maling kasalukuyang password | `{ "error": "Invalid input", "fields": { "currentPassword": ["Incorrect password"] } }` · audit `password_change_failed` |
| **400** | Mali ang bagong password (maikli, pareho sa kasalukuyan) | `{ "error": "Invalid input", "fields": { "newPassword": [ … ] } }` |
| **401** | Hindi naka-login | `{ "error": "Not authenticated" }` |
| **429** | ≥ 10 palpak sa 15 minuto | `{ "error": "Too many attempts. Please try again later." }` |

## `POST /api/auth/forgot-password` (Day 59)
**Body:** `{ "email": "…" }`. Rate limit: 5 bawat 15 minuto bawat IP.

| Status | Kailan | Body |
|---|---|---|
| **202** | **Palagi** (kahit walang account) — parehong sagot at tagal | `{ "message": "If an account exists for that email, a reset link has been sent." }` |
| **400** | Hindi email | `{ "error": "Invalid input", "fields": { "email": [ … ] } }` |

Kung may account: email na may `<CLIENT_URL>/reset-password#token=…` (1 oras, isang beses lang; pinapawalang-bisa ang mas lumang link).

## `POST /api/auth/reset-password` (Day 59)
**Body:** `{ "token": "…", "newPassword": "…" }` (8–128).

| Status | Kailan | Body |
|---|---|---|
| **204** | Napalitan — **na-logout ang LAHAT ng session** · Day 64: tinanggal ang lock ng account, binawi ang tiwala ng lahat ng device, `Set-Cookie: device_token` para sa browser na ito · audit `password_reset` | walang body (walang auto-login) |
| **400** | Wala, nagamit na, expired, o pekeng token — **iisang mensahe** | `{ "error": "This reset link is invalid or has expired" }` |
| **400** | Mali ang bagong password | `{ "error": "Invalid input", "fields": { "newPassword": [ … ] } }` |

## `POST /api/auth/verify-email` (Day 60)
**Body:** `{ "token": "…" }` — mula sa link sa email pagka-register (`…/verify-email#token=…`, 24 oras). Hindi kailangang naka-login.

| Status | Kailan | Body |
|---|---|---|
| **204** | Na-verify · audit `email_verified` | walang body |
| **400** | Wala, nagamit na, expired, pekeng token, o token ng ibang layunin (hal. reset) — **iisang mensahe** | `{ "error": "This verification link is invalid or has expired" }` |

## `POST /api/auth/resend-verification` (Day 60)
**Auth:** cookie `token`. Rate limit: 5 bawat 15 minuto bawat IP.

| Status | Kailan | Body |
|---|---|---|
| **202** | Hindi pa verified — bagong link (ang luma ay hindi na gagana) | `{ "message": "A new verification link has been sent." }` |
| **409** | Verified na — walang email | `{ "error": "Email is already verified" }` |
| **401** | Hindi naka-login | `{ "error": "Not authenticated" }` |

## `GET /api/admin/users`
**Auth:** cookie `token` **at** role `admin` (Day 46). Binabasa ang role sa database sa bawat request,
kaya agad tumatalab ang pagbabago ng role. Walang body.

**Query (Day 47):** `page` (1–1,000,000, default 1) · `limit` (1–100, default 20). Pinakabago muna (`id` pababa).

| Status | Kailan | Body |
|---|---|---|
| **200** | Admin | `{ "users": [ { "id": 7, "email": "…", "name": "…", "role": "admin", "createdAt": "…" } ], "page": 1, "limit": 20, "total": 42, "totalPages": 3 }` · lampas sa huling page = `"users": []` · **walang** `password_hash` |
| **400** | Maling `page`/`limit` (hal. `limit=101`, `page=abc`) | `{ "error": "Invalid input", "fields": { "limit": ["Too big: …"] } }` |
| **401** | Walang login, sirang token, o nabura ang account — kahit sa `/api/admin/<kahit-ano>` | `{ "error": "Not authenticated" }` |
| **403** | Naka-login pero hindi admin | `{ "error": "Forbidden" }` — hindi sinasabi kung anong role ang kailangan |

## `GET /api/admin/audit-logs`
**Auth:** cookie `token` **at** role `admin` (Day 48). **Query:** `page`, `limit` — pareho ng `/api/admin/users`.

| Status | Kailan | Body |
|---|---|---|
| **200** | Admin | `{ "logs": [ { "id": 45, "action": "login_failed", "actorId": null, "actorEmail": null, "targetId": 7, "ip": "…", "userAgent": "…", "metadata": { "email": "…" }, "createdAt": "…" } ], "page": 1, "limit": 20, "total": 45, "totalPages": 3 }` |
| **400 · 401 · 403** | Pareho ng `/api/admin/users` | |

**Mga `action`:** `register` · `login` · `login_failed` · `logout` · `access_denied` (403 sa admin) · `admin_list_users` · `admin_list_audit_logs`.
Itinatala rin ang pagtingin mismo sa audit log. 🔐 Walang password, token o cookie sa kahit anong row.

## Audit log ng mga auth endpoint (Day 48)
Walang pagbabago sa sagot ng mga endpoint. Sa likod, may row sa `audit_logs` ang bawat isa:

| Endpoint | `action` | Sino (`actorId`) · kanino (`targetId`) · `metadata` |
|---|---|---|
| `POST /api/auth/register` (201) | `register` | ang bagong user · siya rin |
| `POST /api/auth/login` (200) | `login` | ang user · siya rin |
| `POST /api/auth/login` (401) | `login_failed` | `null` · ang account kung mayroon · `{ email }` — **hindi** ang password |
| `POST /api/auth/login` (423, Day 63) | `login_failed` · `account_locked` (isang beses, sa ika-5 mali) | `null` · ang account · `{ email, reason: 'locked' }` · `{ email, attempts }` |
| `POST /api/auth/logout` | `logout` | mula sa token kung valid pa, kung hindi `null` |
| `/api/admin/*` (403) | `access_denied` | ang user · — · `{ path }` |
| `POST /api/auth/refresh` (nakaw, Day 52) | `refresh_reuse` | `null` · ang may-ari ng token · — |
| `DELETE /api/auth/sessions/:id` (Day 54) | `session_revoked` | ang user · siya rin · `{ session }` |
| `POST /api/auth/change-password` (Day 55) | `password_changed` · `password_change_failed` | ang user · siya rin · — |
| `POST /api/auth/forgot-password` (Day 59) | `password_reset_requested` | `null` · ang account kung mayroon · `{ email }` |
| `POST /api/auth/reset-password` (Day 59) | `password_reset` | ang user · siya rin · — |
| `POST /api/auth/verify-email` (Day 60) | `email_verified` | ang user · siya rin · — |

Tingnan: `GET /api/admin/audit-logs` at `backend/http/15-audit-logs.http`.

## Caching (Day 36b)
Lahat ng `/api/auth/*` ay may **`Cache-Control: no-store`** — hindi kailanman itatago ng
browser o ng CDN (sa production: `cf-cache-status: DYNAMIC`).

## Security headers (Day 39)
**Lahat** ng sagot ng API (kasama ang 401, 404, 429) ay dumadaan sa `helmet()`:
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
`Content-Security-Policy`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`.
**Walang** `X-Powered-By`. Subukan: `backend/http/09-security-headers.http`.

## Request ID (Day 42)
**Lahat** ng sagot ay may **`X-Request-Id`** (UUID, bago bawat request). Kapag may problema, ibigay
ang ID na ito — pareho ito ng `requestId` sa logs. Binabalewala ang `X-Request-Id` na ipinadala ng client.
Subukan: `backend/http/10-logging.http`.

## Mga error na pareho sa LAHAT ng endpoint (Day 41)
Laging JSON. Hindi kailanman may stack trace, SQL, o file path sa sagot.

| Status | Kailan | Body |
|---|---|---|
| **400** | Sirang JSON sa body | `{ "error": "Invalid JSON" }` |
| **403** | POST/PUT/DELETE mula sa browser na **hindi** ang frontend (CSRF, Day 44) | `{ "error": "Forbidden" }` |
| **404** | Walang ganitong route | `{ "error": "Not found" }` |
| **413** | Body na lampas 100kb | `{ "error": "Payload Too Large" }` |
| **500** | Bug, o hindi maabot ang database | `{ "error": "Internal server error", "requestId": "..." }` — ibigay ang `requestId` para mahanap ang detalye sa logs |

Subukan: `backend/http/11-errors.http`.


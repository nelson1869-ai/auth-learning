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
| POST | `/api/auth/logout` | Burahin ang cookie | — | `07-logout.http` |

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
**Response 200:** `{ "count": 3 }` · **500** kapag hindi maabot ang database.
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

**Cookie (sa 200 lang):** `token=<JWT>; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax`
(+ `Secure` kapag `NODE_ENV=production`). Payload ng JWT: `{ "sub": "<user id>", "iat", "exp" }`,
HS256, 1 oras. Hindi ito mababasa ng JavaScript sa frontend — kusang ipinapadala ng browser.

## `GET /api/auth/me`
**Auth:** kailangan ang cookie na `token` (mula sa login). Walang body.

| Status | Kailan | Body |
|---|---|---|
| **200** | Tama ang token at may user pa | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana" } }` |
| **401** | Walang cookie, binago/sira/expired ang token, o nabura na ang user — **iisang sagot** | `{ "error": "Not authenticated" }` |

## `POST /api/auth/logout`
**Auth:** hindi kailangan (laging gumagana). Walang body.

| Status | Kailan | Body / Headers |
|---|---|---|
| **204** | Palagi — may cookie man o wala | walang body · `Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax` |

⚠️ Sa browser lang nabubura ang cookie — ang token na nakopya bago mag-logout ay
valid pa hanggang mag-expire (1 oras). Phase 11: refresh tokens sa database.

## Caching (Day 36b)
Lahat ng `/api/auth/*` ay may **`Cache-Control: no-store`** — hindi kailanman itatago ng
browser o ng CDN (sa production: `cf-cache-status: DYNAMIC`).


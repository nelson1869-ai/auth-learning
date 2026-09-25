# 07 — API Contract (ang kasunduan ng frontend at backend)

> 📅 Sinimulan sa Day 13 · Phase 4 · in-update sa Day 14 (validation) at Day 15 (login) · **I-update tuwing may bago o nagbagong endpoint.**
>
> **API contract** = ang listahan ng bawat endpoint: ano ang ipapadala, ano ang
> babalik, at anong status code. Sa totoong team, ito ang binabasa ng frontend
> developer para hindi na kailangang basahin ang backend code. Kapag hindi tugma
> ang contract sa code, **mali ang isa sa kanila** — ayusin agad.
>
> Base URL (dev): `http://localhost:3000` · Lahat ng body ay JSON
> (`Content-Type: application/json`).

## Buod

| Method | Path | Para saan | Auth | `.http` |
|---|---|---|---|---|
| GET | `/api/health` | Buhay ba ang server? | — | `01-health.http` |
| POST | `/api/echo` | Pang-aral: ibinabalik ang body | — | `02-echo.http` |
| GET | `/api/users/count` | Ilang user ang mayroon | — | `03-users-count.http` |
| POST | `/api/auth/register` | Gumawa ng account | — | `04-register.http` |
| POST | `/api/auth/login` | Patunayan kung sino ka | — | `05-login.http` |

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
| Field | Required | Patakaran (Zod — `validations/auth.js`) |
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
| **200** | Tama ang email at password | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana" } }` |
| **400** | Mali ang hugis ng input | `{ "error": "Invalid input", "fields": { ... } }` |
| **401** | Maling password **o** walang account — **iisang sagot, parehong tagal** | `{ "error": "Invalid email or password" }` |

⏳ Wala pang cookie o token — idadagdag sa Day 16.

# 07 — API Contract (ang kasunduan ng frontend at backend)

> 📅 Sinimulan sa Day 13 · Phase 4 · **I-update tuwing may bago o nagbagong endpoint.**
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
| Field | Required | Tala |
|---|---|---|
| `email` | ✅ | Natatangi (UNIQUE sa database) |
| `password` | ✅ | Hindi sine-save — hash lang (argon2id) |
| `name` | — | `null` kung wala |

**Responses**

| Status | Kailan | Body |
|---|---|---|
| **201** | Nagawa ang account | `{ "user": { "id": 1, "email": "ana@example.com", "name": "Ana" } }` |
| **409** | May account na ang email | `{ "error": "Email already registered" }` |
| **500** ⚠️ | Walang `email` o `password` (kasalukuyang butas) | HTML na error — **magiging 400 sa Day 14** |

**Hindi kailanman ibinabalik:** `password`, `password_hash`.

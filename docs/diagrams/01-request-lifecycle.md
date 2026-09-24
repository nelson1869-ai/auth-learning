# 01 — Request Lifecycle (ang buhay ng isang request)

> 📅 Day 04 · Phase 2 (Unang API) — ia-update sa Day 06 (POST at request body)
>
> **Code:** `backend/src/index.js` · **Subukan:** `backend/http/01-health.http`

## Paano sinasagot ng server ang isang request

```mermaid
flowchart TD
    Start(["Client: browser, curl, o REST Client"]) -->|"HTTP request<br/>hal. GET /api/health"| Listen["app.listen(3000)<br/>backend/src/index.js<br/>(naghihintay sa port 3000)"]
    Listen --> Match{"May route ba na tugma sa<br/>METHOD + PATH?"}
    Match -->|"oo: GET /api/health"| Handler["Ang route function<br/>(req, res) => res.json({ status: 'ok' })"]
    Handler --> OK["200 OK<br/>Content-Type: application/json<br/>{ status: 'ok' }"]
    Match -->|"wala<br/>(hal. GET /api/wala, o POST /api/health)"| NotFound["404 Not Found<br/>HTML na 'Cannot GET ...'<br/>(default ng Express)"]
    OK --> Done(["Client: natanggap ang sagot"])
    NotFound --> Done
```

## Mga dapat pansinin

- **Ang route ay METHOD + PATH.** Kahit tama ang path (`/api/health`), 404 ang
  `POST` dahil walang `app.post('/api/health')` sa code.
- **Default na 404 ng Express ay HTML**, hindi JSON — aayusin natin sa Phase 9
  (error handling), para JSON na ang lahat ng sagot ng API.
- **Laging may sagot** — kahit walang tugmang route, sumasagot pa rin ang
  server (404). Hindi ito nag-a-"ignore".

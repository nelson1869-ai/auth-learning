# 07 — Frontend ↔ backend

> 📅 Day 21 · Phase 5 (Login page) · in-update sa Day 22 (fetch + CORS)
>
> **Code:** `frontend/src/pages/LoginPage.jsx` · `frontend/src/api/auth.js` · `backend/src/index.js` (cors)
> **Subukan:** sa browser (F12 → Network) · `backend/http/05-login.http` #6–#7 (preflight)

## Paano gumagana ang login form (state → re-render)

```mermaid
flowchart TD
    Type(["⌨️ Nag-type ang user sa email"]) --> OnChange["onChange={(e) => setEmail(e.target.value)}"]
    OnChange --> SetState["setEmail('nelson@exam')<br/>binabago ang STATE"]
    SetState --> Render["React: nire-render ulit ang LoginPage<br/>(tinatawag ulit ang function)"]
    Render --> UI["UI: value={email} sa input<br/>at 'Tina-type mo: nelson@exam'"]
    UI -.->|"susunod na tipa"| Type

    Submit(["🖱️ Pindot Login / Enter"]) --> Req{"required: may laman<br/>ang email at password?"}
    Req -->|"wala"| Block["Browser ang humarang<br/>'Please fill out this field.'"]
    Req -->|"mayroon"| Handle["handleSubmit(e)<br/>e.preventDefault() — walang page reload"]
    Handle --> Fetch["api/auth.js: login(email, password)<br/>→ tingnan ang sequence sa ibaba (Day 22)"]
```

## Mga dapat pansinin

- **`setX(...)`, hindi `x = ...`.** Ang `setX` lang ang nagsasabi sa React na may
  nagbago at kailangang mag-render ulit.
- **Controlled input:** galing sa state ang `value` ng input — ang state ang
  "katotohanan", hindi ang input.
- **`e.preventDefault()`:** kung wala ito, nire-reload ng browser ang buong page
  (lumang paraan ng HTML form) at nawawala ang lahat ng state.
- **Hindi ipinapakita ang password** kahit saan sa page (sinubukan).

## Pagtawag sa backend: fetch + CORS (Day 22)

```mermaid
sequenceDiagram
    autonumber
    participant B as 🌐 Browser<br/>(page mula sa localhost:5173)
    participant S as ⚙️ Backend<br/>localhost:3000

    Note over B: login() sa api/auth.js<br/>fetch(POST, JSON, credentials: 'include')
    Note over B: Ibang origin (port 3000 ≠ 5173) + JSON<br/>→ magtanong muna (preflight)
    B->>S: OPTIONS /api/auth/login<br/>Origin: http://localhost:5173
    S-->>B: 204 · Allow-Origin: http://localhost:5173 · Allow-Credentials: true
    Note over B: Tugma ang origin ko? Oo → tuloy
    B->>S: POST /api/auth/login { email, password }
    S-->>B: 200 { user } + Set-Cookie: token (HttpOnly · SameSite=Lax)
    Note over B: Itinago ang cookie para sa localhost:3000<br/>→ React: setUser → "✅ Naka-login"

    rect rgba(220,80,80,0.08)
    Note over B,S: ❌ BAGO ang cors() (o mula sa pekeng site)
    B->>S: OPTIONS /api/auth/login<br/>Origin: http://127.0.0.1:5199
    S-->>B: walang Allow-Origin — o ibang origin ang nakasulat
    Note over B: HINARANG — hindi na ipinadala ang POST<br/>fetch → "Failed to fetch"
    end
```

- **Ang browser ang humaharang, hindi ang server.** Kaya gumagana ang REST
  Client/curl kahit walang CORS — walang browser na nagpoprotekta roon.
- **`credentials` sa dalawang lugar:** `credentials: 'include'` sa fetch (ipadala
  at tanggapin ang cookie) + `credentials: true` sa `cors()` (payagan ito ng server).
  Kulang ang isa → walang cookie.
- **Isang tiyak na origin** mula sa `.env` (`CLIENT_URL`), hindi `*` — hindi rin ito
  papayagan ng browser kapag may cookie.
- **`app.use(cors(...))` bago ang lahat ng router** — para masagot ang `OPTIONS`.
- **`fetch` ay hindi nagtatapon ng error sa 401** — kaya tinitingnan ang `res.ok`.
  Nagtatapon lang ito kapag walang sagot (network o CORS) → "Failed to fetch".
- Sinubukan (Day 22): bago ang cors → "Failed to fetch"; pagkatapos → 200 +
  cookie `token` (HttpOnly, Lax); maling password → "Invalid email or password";
  pekeng site (127.0.0.1:5199) → hinarang.

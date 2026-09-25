# 07 — Frontend ↔ backend

> 📅 Day 21 · Phase 5 (Login page) · in-update sa Day 22 (fetch + CORS) Day 23 (React 19 `useActionState`) at Day 24 (React Router, protektadong page)
>
> **Code:** `frontend/src/App.jsx` (routes) · `frontend/src/pages/*.jsx` · `frontend/src/api/auth.js` · `backend/src/index.js` (cors)
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

## Register gamit ang React 19 `useActionState` (Day 23)

```mermaid
flowchart TD
    Sub(["🖱️ Pindot Register<br/>&lt;form action={formAction}&gt;"]) --> Pend["React: isPending = true<br/>button disabled · 'Nagre-register…'"]
    Pend --> Act["registerAction(prevState, formData)<br/>formData.get('email') · ('password') · ('name') || undefined"]
    Act --> Api["api/auth.js: register() → fetch POST /api/auth/register"]
    Api --> Res{"Sagot ng backend"}
    Res -->|"201"| Ok["return { user }"]
    Res -->|"409"| E409["throw → return { error: 'Email already registered',<br/>email, name }"]
    Res -->|"400 (Zod)"| E400["throw → return { error: 'Invalid input',<br/>fields: { password: [...] }, email, name }"]
    Ok --> New["BAGONG state = ang ibinalik<br/>isPending = false · re-render"]
    E409 --> New
    E400 --> New
    New --> Reset["React 19: binubura ang form (kahit may error!)"]
    Reset --> DV["defaultValue={state.email} / {state.name}<br/>→ bumabalik ang tinype · password: sinadyang walang laman"]
```

- **Ikumpara sa login (Day 21–22):** 4 na `useState`, `onChange` sa bawat input,
  `preventDefault`, at sariling error state → **1 `useActionState`**, walang
  `onChange`, walang `preventDefault`, at kusang `isPending`.
- **⚠️ Binubura ng React 19 ang form pagkatapos ng submit, kahit may error**
  (sinubukan) — kaya ibinabalik ang `email`/`name` sa state at `defaultValue`.
- **`formData.get('name') || undefined`** — ang walang laman na input ay `""`,
  na tatanggihan ni Zod (`min(1)`).
- Sinubukan sa browser (Day 23): 201 ✅ · 409 na nandoon pa ang email ✅ ·
  400 na may mensahe sa ilalim ng password ✅ · "Nagre-register…" + disabled ✅.

## Mga page at protektadong `/profile` (Day 24)

```mermaid
flowchart TD
    URL(["URL sa browser"]) --> R{"React Router<br/>App.jsx — &lt;Routes&gt;"}
    R -->|"/login"| L["LoginPage"]
    R -->|"/register"| G["RegisterPage"]
    R -->|"/profile"| P["ProfilePage<br/>'Loading…'"]
    R -->|"kahit ano (* )"| N["&lt;Navigate to='/profile' /&gt;"] --> P
    L -->|"login OK → navigate('/profile')"| P
    G -->|"'Mag-login na' → &lt;Link to='/login'&gt;"| L
    P --> Eff["useEffect → getMe()<br/>GET /api/auth/me + cookie<br/>(×2 sa dev — StrictMode)"]
    Eff -->|"200 { user }"| Show["'Hello, &lt;name&gt;!' + Logout button"]
    Eff -->|"401 → null"| Back["navigate('/login', { replace: true })"] --> L
    Show -->|"Logout → POST /api/auth/logout<br/>(binubura ang cookie)"| L
```

- **SPA:** iisang page — pinapalitan ng React Router ang component nang walang
  reload. `<Link>`, hindi `<a href>` (nire-reload ng `<a>` ang lahat).
- **`react-router`, hindi `react-router-dom`** — pinagsama na mula v7 (8.4 ang gamit).
- **🔐 UX lang ang redirect sa frontend.** Ang tunay na proteksyon ay ang
  `requireAuth` ng backend — kahit alisin ang redirect, 401 pa rin ang `/me`, kaya
  walang data na maipapakita.
- **Refresh ng `/profile`:** naka-login pa rin — nasa cookie ang session, hindi sa
  React state.
- Sinubukan (Day 24, totoong browser): /profile nang hindi naka-login → /login ·
  register → "Mag-login na" → login → /profile "Hello, Flow Test!" · refresh →
  naka-login pa rin · logout → /login, wala nang cookie · /profile at /abc → /login ·
  3 full page load lang sa buong flow (goto, reload, goto).

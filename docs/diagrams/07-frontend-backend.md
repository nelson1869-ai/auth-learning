# 07 — Frontend ↔ backend

> 📅 Day 21 · Phase 5 (Login page) · **Bahagi 1: form state** — dadagdagan sa Day 22
> ng pagtawag sa backend (fetch + CORS)
>
> **Code:** `frontend/src/pages/LoginPage.jsx` · `frontend/src/App.jsx`

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
    Handle --> SetSub["setSubmitted({ email })"]
    SetSub --> Render2["re-render → 'Na-submit: nelson@example.com'"]
    Handle -.->|"⏳ Day 22"| Fetch["fetch('/api/auth/login') → backend"]
```

## Mga dapat pansinin

- **`setX(...)`, hindi `x = ...`.** Ang `setX` lang ang nagsasabi sa React na may
  nagbago at kailangang mag-render ulit.
- **Controlled input:** galing sa state ang `value` ng input — ang state ang
  "katotohanan", hindi ang input.
- **`e.preventDefault()`:** kung wala ito, nire-reload ng browser ang buong page
  (lumang paraan ng HTML form) at nawawala ang lahat ng state.
- **Walang request sa Network tab** kapag nag-submit (sinubukan, Day 21) — wala
  pang `fetch`. Iyan ang Day 22.
- **Hindi ipinapakita ang password** kahit saan sa page (sinubukan).

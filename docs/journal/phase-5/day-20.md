# Day 20 — 2026-09-25 · Phase 5 · unang araw bilang Frontend Developer

## Ano ang ginawa ko
- `npm create vite@latest frontend -- --template react` → Vite 8 + React 19, `npm install`, `npm run dev` → http://localhost:5173
- `App.jsx`: ang una kong component — `<h1>auth-learning</h1>` at `Hello, {name}!`
- Code review ng AI: ibinalik ang README ko (napalitan ng README ng Vite), binura ang demo (`App.css`, `assets/`, ang ~100 linyang demo CSS), simpleng `index.css`, `<title>auth-learning</title>`, at ginawa ang `pages/`, `components/`, `api/` (may `.gitkeep`)
- Sinuri: `npm run lint` (Oxlint) walang babala, `npm run build` pumasa, at screenshot sa totoong browser

## Ano ang natutunan ko (sa sarili kong salita)
- **Component** = function na nagbabalik ng UI. **JSX** = HTML-like sa loob ng JavaScript: `className`, `{ }` para sa JavaScript, isang parent lang.
- **Vite** = dev server ng frontend; **HMR** — nagbabago ang page pagka-save, walang refresh.
- **Dalawang server na:** frontend :5173, backend :3000 → CORS sa Day 22.
- **Oxlint vs ESLint** — Oxlint (kasama na sa template, 50–100× mas mabilis, nahuhuli ang hooks bugs). Ginamit din sa backend sa Day 27.
- Sa Network tab: **12 request** sa isang refresh (sa development, hiwa-hiwalay na file ang bawat module — sa `npm run build`, pinagsasama-sama).

## Mga problema at paano ko nalutas
- **Napalitan ng README ng Vite ang README ko** — naibalik gamit ang `git restore frontend/README.md` (naka-commit kasi ito). Aral: kaya mahalagang naka-commit ang lahat bago mag-eksperimento.
- Hindi nagawa ang paglilinis ng demo at ang mga folder — ginawa ng AI.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 21: Login form gamit ang `useState` at `onSubmit`

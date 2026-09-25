# Day 24 — 2026-09-25 · Phase 5 · huling araw

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko): `npm install react-router` (8.4), `getMe()` at `logout()` sa `api/auth.js`, `ProfilePage.jsx` (useEffect → /me, redirect kung 401, Logout button), `navigate('/profile')` pagkatapos ng login, "Mag-login na" link sa register, at ang router sa `App.jsx`
- Sinubukan muna ng AI ang React Router 8 sa hiwalay na project (pareho pa rin ang simpleng paraan)

## Ano ang natutunan ko (sa sarili kong salita)
- **SPA** = iisang page; pinapalitan ng React Router ang ipinapakita nang walang reload.
- **`<Routes>` / `<Route path element>`** · **`<Link>`** (hindi `<a href>`) · **`useNavigate()`** · **`<Navigate replace />`**
- **`react-router-dom` → `react-router`** (pinagsama mula v7).
- **`useEffect`** = code pagkatapos mag-render (hal. tanungin ang `/me`). Dalawang beses sa dev dahil sa StrictMode.
- **🔐 UX lang ang redirect sa frontend** — ang backend (`requireAuth`) ang tunay na bantay.
- **Nasa cookie ang session**, kaya naka-login pa rin pagkatapos ng refresh.

## Resulta (totoong browser, buong flow)
/profile (hindi naka-login) → /login · register → "Mag-login na" → login → /profile "Hello, Flow Test!" · refresh → naka-login pa rin · logout → /login, walang cookie · /profile, /abc → /login · 3 full page load lang.

## Mga problema at paano ko nalutas
- Ginawa ko na ang branch bago ko hiniling sa AI — pumalya ang `git checkout -b` ng AI (may branch na), kaya tumakbo sa maling folder ang ibang command (walang nasira). Aral para sa AI: suriin muna ang branch bago gumawa.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Checkpoint Phase 5 — tanong
*Ano ang CORS at bakit ito umiiral?* — sagutin sa sariling salita (tingnan ang Day 22 at `07-frontend-backend.md`).

## Susunod
- ✅ Tag `checkpoint-phase-5` → Phase 6: Tests at CI

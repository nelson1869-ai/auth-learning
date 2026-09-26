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
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nire-redirect ng frontend ang hindi naka-login, ligtas na ba ang `/profile`?**
  S: Hindi. UX lang iyon; kayang lampasan. Ang tunay na bantay ay ang `requireAuth` sa backend: walang data na ibibigay ang `/me` kung walang valid na token. Pareho ang aral sa admin page (Day 49).
- **T: Bakit dalawang beses tumatakbo ang `useEffect` sa dev?**
  S: Sinasadya ng StrictMode sa development para mahuli ang mga bug (hal. effect na hindi naglilinis). Sa production build, isang beses lang.
- **T: Bakit naka-login pa rin pagkatapos ng refresh?**
  S: Nasa httpOnly cookie ang session, hindi sa React state. Pagka-load, tinatanong ng Profile page ang `/me`, at ipinapadala ng browser ang cookie.

## Checkpoint Phase 5 — tanong
*Ano ang CORS at bakit ito umiiral?* — sagutin sa sariling salita (tingnan ang Day 22 at `07-frontend-backend.md`).

## Susunod
- ✅ Tag `checkpoint-phase-5` → Phase 6: Tests at CI

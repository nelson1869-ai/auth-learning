# Frontend

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng frontend developer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 5.

Ito ang nakikita at kinikilik ko sa browser: ang login form, mga button, at mga mensahe. Ipinapasa nito ang ginawa ko sa backend.

---

## Ang role

Ang **frontend** ang lahat ng nakikita at hinahawakan ng user sa browser:
pages, forms, buttons, mga mensahe ng error. Kapag nag-click ang user ng
"Login", ang frontend ang nagpapadala ng request sa backend at nagpapakita
ng resulta.

## Mga responsibilidad
- Pages at forms — register, login, profile
- Pagtawag sa backend API at pagpapakita ng sagot
- Malinaw na mensahe sa user (hal. "Mali ang password")
- Magandang karanasan sa user (UX) — at sa lahat ng screen size

## Tools
React 19 · Vite 8 · React Router 8 · fetch · plain CSS · JavaScript (→ TypeScript sa Phase 7)
— tingnan ang [tech stack](../docs/02-tech-stack.md) at ang [D-013](../docs/04-decisions.md)
("basics muna, modern pagkatapos").

## Ano ang lalaman ng folder na ito (plano)
```
frontend/
├── src/
│   ├── main.tsx        ← simula ng app (StrictMode)
│   ├── App.tsx         ← aling page ang ipapakita (React Router)
│   ├── pages/          ← Login, Register, Profile
│   ├── components/     ← maliliit na pirasong ginagamit ng marami
│   ├── api/            ← LAHAT ng fetch sa backend — iisang lugar
│   └── index.css       ← plain CSS
├── index.html
├── vite.config.js
└── package.json
```

## Production (Day 36b) — https://nelson1869.com
- **Cloudflare Pages** project `auth-learning`: root `frontend`, `npm run build`, output `dist`;
  kusang build + deploy sa **bawat merge sa `main`** (preview deploy sa bawat PR)
- **Build variables** (Pages → Settings): `VITE_API_URL=https://api.nelson1869.com/api`, `NODE_VERSION=24`.
  Hindi secret — makikita ng kahit sino sa JS. Kung wala ang `VITE_API_URL`, tumatanggi ang app.
- **`public/_headers`**: `/assets/*` → 1 taon (`immutable`, may hash ang pangalan);
  `index.html` → `no-cache` (makikita agad ang bagong deploy)
- **Security headers (Day 39)**, nasa `public/_headers` din: **CSP** (`script-src 'self'` —
  hindi tatakbo ang script na naipasok ng attacker), `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`. Diagram: `docs/diagrams/10-security-headers.md`
  - ⚠️ **Whitelist ang CSP.** Kapag nagdagdag ng script, font o API mula sa **ibang domain**,
    idagdag ang **eksaktong host** sa CSP — kung hindi, tahimik itong haharangin
    (nangyari sa Cloudflare Web Analytics, PR #53). Huwag gumamit ng `'unsafe-inline'`.
  - Subukan sa preview **at** sa production domain (DevTools → Console: walang "violates")
- Sa `npm run dev`, `http://localhost:3000/api` pa rin (walang kailangang `.env`)

## ❌ Hindi dapat nasa loob ng frontend
- **Secrets o API keys** — lahat ng nasa frontend ay nakikita ng kahit sino (View Source)
- **Mga patakarang pang-security bilang tanging depensa** (hal. "itago ang admin button") — dapat ding suriin sa backend, dahil kayang lampasan ang frontend
- **Direktang koneksyon sa database** — laging dumaan sa backend API
- **Token sa `localStorage`** — mababasa ito ng masamang script (XSS); gagamit tayo ng httpOnly cookie

## Unang gawain
**Phase 5** ✅ — Login, Register at protektadong Profile page, kausap ang backend
(Day 20–24). Susunod para sa frontend: Phase 10 (admin page).
Tingnan ang [roadmap](../docs/03-roadmap.md).

**Mga command** (sa `frontend/`): `npm run dev` (http://localhost:5173) ·
`npm run lint` (Oxlint) · `npm run build`

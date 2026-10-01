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
React 19 · Vite 8 · React Router 8 · fetch · plain CSS · TypeScript (mula Phase 7) · `@simplewebauthn/browser` (passkeys, Day 95)
— tingnan ang [tech stack](../docs/02-tech-stack.md) at ang [D-013](../docs/04-decisions.md)
("basics muna, modern pagkatapos").

## Ano ang lalaman ng folder na ito (plano)
```
frontend/
├── src/
│   ├── main.tsx        ← simula ng app (StrictMode)
│   ├── App.tsx         ← aling page ang ipapakita (React Router)
│   ├── pages/          ← Login (+ passkey, Day 97), Register, Profile, Admin (Day 49 — admin lang ang may data; backend ang bantay), Sessions (Day 54),
│   │                     ChangePassword (Day 55), ForgotPassword · ResetPassword · VerifyEmail (Day 61 — mula sa mga link sa email), Passkeys (Day 95)
│   ├── hooks/          ← useHashToken (Day 61): token mula sa #fragment, tinatanggal agad sa address bar
│   ├── components/     ← maliliit na pirasong ginagamit ng marami
│   ├── api/            ← LAHAT ng fetch sa backend — iisang lugar. Day 98b: `send` (15s na timeout, "Hindi maabot ang server")
│   │                     at `readJson` ("May problema sa server" kapag hindi JSON) · openapi.generated.ts: ang mga type mula sa OpenAPI spec
│   │                     (Day 78 — GINAWA ng `npm run openapi` sa backend/; huwag i-edit)
│   └── index.css       ← plain CSS
├── index.html
├── vite.config.ts      ← port 5173 + strictPort (Day 98b): pumapalya kapag okupado, hindi lumilipat sa 5174
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
- **5173 lang** (Day 98b): ang backend ay tumatanggap lang ng `CLIENT_URL=http://localhost:5173` (CORS, CSRF, origin ng passkey).
  Kapag `Error: Port 5173 is already in use`: may ibang project na gumagamit nito — patayin muna iyon

## ❌ Hindi dapat nasa loob ng frontend
- **Secrets o API keys** — lahat ng nasa frontend ay nakikita ng kahit sino (View Source)
- **Mga patakarang pang-security bilang tanging depensa** (hal. "itago ang admin button") — dapat ding suriin sa backend, dahil kayang lampasan ang frontend
- **Direktang koneksyon sa database** — laging dumaan sa backend API
- **Token sa `localStorage`** — mababasa ito ng masamang script (XSS); gagamit tayo ng httpOnly cookie

## Unang gawain
**Phase 5** ✅ — Login, Register at protektadong Profile page, kausap ang backend
(Day 20–24). Sumunod: admin page (Day 49), mga device ko (Day 54), change password (Day 55),
forgot/reset password at verify email (Day 61), passkeys (Day 95–98), frontend hardening (Day 98b).
Tingnan ang [roadmap](../docs/03-roadmap.md).

**Mga command** (sa `frontend/`): `npm run dev` (http://localhost:5173) ·
`npm run lint` (Oxlint + knip — Day 79: walang unused na file, export o dependency; mga pagbubukod sa `knip.jsonc`, may dahilan) · `npm run build`

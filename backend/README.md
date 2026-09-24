# Backend

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng backend developer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 4 — tingnan kung nagbago ang pagkakaintindi mo.



---

## Ang role

Ang **backend** ang "utak" sa likod ng app. Tumatanggap ito ng **request** mula sa
frontend (hal. "i-login mo ako"), nagpapasya (tama ba ang password?), kumakausap
sa database, at nagbabalik ng **response** (hal. "ok, naka-login ka na").

Hindi ito nakikita ng user — pero dito nangyayari ang karamihan ng security.

## Mga responsibilidad
- API endpoints (routes) — hal. `POST /api/auth/login`
- Business rules — hal. "dapat may `@` ang email", "hindi puwedeng doble ang email"
- Security — password hashing, sino ang puwedeng gumawa ng ano
- Tests — patunay na gumagana ang lahat

## Tools
Node.js · Express · JavaScript (→ TypeScript sa Phase 7) · Zod · argon2 · jsonwebtoken · Vitest
— tingnan ang [tech stack](../docs/02-tech-stack.md).

## Ano ang lalaman ng folder na ito (plano)
```
backend/
├── src/
│   ├── index.js        ← pinapatakbo ang server
│   ├── routes/         ← mga URL: /api/auth/login, atbp.
│   └── ...             ← madadagdagan habang natututo
├── http/               ← .http files para subukan ang API
└── package.json        ← listahan ng tools (dependencies)
```

## ❌ Hindi dapat nasa loob ng backend
- **Plain text na password** — laging hashed (argon2) bago i-save
- **Secrets sa code** (hal. `const JWT_SECRET = "abc123"`) — sa `.env` lang
- **HTML o disenyo ng page** — trabaho iyan ng frontend
- **Tiwala sa data mula sa user** — laging i-validate (Zod) bago gamitin
- **Mensahe ng error na nagbubunyag ng loob** (hal. "column users.email does not exist") — generic na mensahe lang sa user

## Unang gawain
**Phase 2** — "Hello World" API. Tingnan ang [roadmap](../docs/03-roadmap.md).

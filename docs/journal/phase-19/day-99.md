# Day 99 — 2026-10-01 · Phase 19 · E2E test (Playwright)

> "go" ang sabi ko; ang AI ang sumulat, sumubok at nagpaliwanag dito.

## 🎯 Layunin
Gawing **permanente** ang pagsubok sa browser. Hanggang ngayon, nasa `/tmp` ng AI ang mga browser test — at nabura nga ang mga iyon nang mag-restart ang PC noong Day 97.

## 💡 Konsepto: kailan kailangan ng E2E sa halip na API test
Ang 267 Vitest ng backend ay sumusubok sa **API**: tamang status, tamang body, tamang laman ng database. Pero may mga bagay na **sa browser lang** nangyayari:
- ang `navigator.credentials` mismo: ang browser ang naglalagay ng origin, nagtatago ng private key, at tumatanggi sa passkey na mayroon na;
- CORS, mga cookie sa pagitan ng dalawang port, at ang `Origin` na ipinapadala ng browser (CSRF);
- ang nakikita ng user: mensahe, redirect, ang Profile kapag patay ang backend.

Ang **E2E (end-to-end)** ay ang buong system: React + Express + Postgres, sa totoong Chromium. Mas mabagal at mas maraming puwedeng magkamali, kaya **kaunti at mahalaga** lang.

## Ano ang ginawa (D-039)
- **`@playwright/test` 1.63** sa `frontend/` · `npm run e2e`.
- **`playwright.config.ts`:** pinapatakbo ang backend (`PORT=3100`, test DB, `NODE_ENV=test`) at Vite (`5199`). Sariling mga port, kaya hindi bumabangga sa dev server mo o sa ibang project.
- **8 test** sa `frontend/e2e/`:

| File | Sinusubok |
|---|---|
| `auth.spec.ts` | register → login → profile → logout · maling password · `autocomplete` |
| `passkeys.spec.ts` | **virtual authenticator**: dagdag (maling password muna) · parehong device ulit (tumatanggi ang browser) · login na walang email at may email · "huling gamit" · **decoy** · binurang passkey |
| `server-problems.spec.ts` | ang 2 bug ng Day 98b: patay na backend → mensahe + "Subukan ulit" · HTML na 502 → malinaw na mensahe |

- **`e2e:cleanup`** (backend): binubura ang `e2e-…@example.com` pagkatapos. **Tumatanggi kapag hindi `*_test` ang database** — sinubukan sa dev DB: exit 1.
- **Backend:** `PORT` mula sa env (default 3000).
- **CI:** bagong job na `e2e`; hinihintay ito ng `image` — walang deploy kapag sira ang flow sa browser.

## Mga sinukat
- **8/8 sa ~15 segundo** (lokal), kasama ang pag-start ng dalawang server.
- **Sadyang sinira ang code, 6 na beses**, nahuli lahat:

| Sinira | Nahuli ng |
|---|---|
| Inalis ang `.catch` ng Profile (ang bug ng Day 98b) | patay na backend |
| `readJson` na tumatawag sa sarili (ang sarili kong bug ng Day 98b) | register/login · maling password |
| Login na walang `readJson` | HTML na 502 |
| Walang `excludeCredentials` sa backend | parehong device ulit |
| Walang `autocomplete` sa password | autocomplete |
| Maling origin na inaasahan ng backend | dagdag ng passkey (2 test) |

## 🐛 Nahuli sa unang takbo
**Ang `page.route('**/api/**')` ko ay humarang din sa mga file ng frontend mismo** (`http://localhost:5199/src/api/auth.ts`), kaya hindi nagbukas ang page.
Inayos: ang backend lang (`http://localhost:3100/api/**`). Natagalan ang unang takbo (5.4 minuto) dahil hinintay ng dalawang test ang buong timeout bago pumalya.

## 🐛 Nahuli ng CI (hindi ng PC ko)
Sa unang takbo sa CI: **8/8 ang pumasa**, pero **pumalya ang paglilinis** pagkatapos: `CLIENT_URL: expected string, received undefined`.
Sa PC, galing ang `CLIENT_URL` sa `backend/.env.test`; sa CI, walang `.env.test`. Ibinibigay na ito ng `global-teardown.ts` mismo.
Ito mismo ang dahilan kung bakit may CI: ang "gumagana sa PC ko" ay umaasa sa mga file na wala sa ibang makina.

## Ang hindi pa sakop
- **Admin page, sessions, change/reset password, verify email** — walang E2E (sakop ng Vitest sa API).
- **Virtual authenticator pa rin**, hindi totoong phone.
- Ang decoy test ay umaasa sa kilos ng Chromium (kinakansela kapag walang tugmang passkey).
- May `ExperimentalWarning` (ML-DSA-44) sa log ng backend mula sa library ng passkey — hindi error, lumalabas din sa production.

## 🔍 Checklist
- [ ] Pinatakbo ko ang `cd frontend && npm run e2e` at nakita ang 8 ✓.
- [ ] Kaya kong ipaliwanag kung bakit hindi sapat ang Vitest para sa passkey sa browser.
- [ ] Kaya kong ipaliwanag kung bakit 3100 at 5199 ang mga port, hindi 3000 at 5173.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang virtual authenticator?**
  S: Isang "device" sa loob ng Chromium (sa pamamagitan ng DevTools Protocol). Totoong key pair at totoong pirma, pero walang fingerprint reader: laging pumapayag. Ang browser ang gumagawa ng lahat ng iba — kaya totoo ang origin, ang `excludeCredentials`, at ang dialog.
- **T: Bakit `retries: 0`?**
  S: Kapag "subukan ulit hanggang pumasa", natatago ang paminsan-minsang bug (hal. race condition). Mas mabuting makita ang pula at alamin kung bakit.
- **T: Bakit hinihintay ng image ang E2E?**
  S: Ang image ang ide-deploy. Kapag pumasa ang Vitest pero sira ang login sa browser, ayaw kong umabot iyon sa production.

## Susunod
- **Day 100 — 🎓 Final review:** ang buong paglalakbay, ang mga README ("Sa sarili kong salita"), at ang paghahambing sa reference.

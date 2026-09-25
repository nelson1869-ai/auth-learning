# Day 21 — 2026-09-25 · Phase 5

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko): `src/pages/LoginPage.jsx` — email at password na controlled inputs, `handleSubmit` na may `e.preventDefault()`, "Tina-type mo" at "Na-submit"; ikinabit sa `App.jsx`; kaunting CSS; binura ang `pages/.gitkeep`
- Sinubukan sa totoong browser (Playwright): walang laman → hinarang ng `required`; live na "Tina-type mo"; Enter → "Na-submit", walang reload, 0 request; hindi lumalabas ang password sa page

## Ano ang natutunan ko (sa sarili kong salita)
- **State** = naaalala ng component; `setX` → re-render. Huwag `x = ...`.
- **Controlled input** = `value={email}` + `onChange={(e) => setEmail(e.target.value)}` — ang state ang katotohanan.
- **`e.preventDefault()`** = walang page reload (kung wala, mawawala ang state).
- **`required`** = ang browser mismo ang humaharang sa walang laman — pero hindi ito proteksyon; nasa backend (Zod) pa rin ang tunay na validation.
- **`pages/`** = isang buong screen; `App.jsx` ang pumipili kung alin ang ipapakita.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 22: `fetch` sa backend + CORS (makikita muna ang error sa DevTools)

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
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit `setEmail(...)` at hindi `email = ...`?**
  S: Hindi alam ng React na nagbago ang variable kapag direktang binago. Ang `setEmail` ang nagsasabi sa React na i-render ulit ang component.
- **T: Bakit kailangan ng `e.preventDefault()`?**
  S: Ang default ng HTML form ay i-reload ang buong page kapag nag-submit. Mawawala ang lahat ng state. Kaya pinipigilan natin ito at tayo ang nagpapadala gamit ang `fetch`.
- **T: Ligtas bang nasa state ang password habang nagta-type?**
  S: Oo, nasa memory lang ito ng page at hindi ipinapakita. Ang mahalaga: hindi ito isinusulat sa `localStorage` o sa log, at HTTPS ang daan papunta sa server.

## Susunod
- Day 22: `fetch` sa backend + CORS (makikita muna ang error sa DevTools)

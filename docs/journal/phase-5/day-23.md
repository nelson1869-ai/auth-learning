# Day 23 — 2026-09-25 · Phase 5

## Ano ang ginawa ko
- Isinulat ng AI (sa kahilingan ko): `register()` sa `api/auth.js` (dala ang `fields` ng 400), `RegisterPage.jsx` gamit ang React 19 `useActionState`, ikinabit sa `App.jsx`, CSS para sa `<small>` na error
- Sinubukan muna ng AI ang `useActionState` sa hiwalay na project bago ituro (nahuli ang pagbura ng form)
- Pinalitan ng AI ang `npm run dev` ng **nodemon** (D-014)

## Ano ang natutunan ko (sa sarili kong salita)
- **`useActionState(action, {})` → `[state, formAction, isPending]`** — ang ibinabalik ng action ang bagong state; kusang `isPending`.
- **`<form action={formAction}>`** — walang `preventDefault`, walang `useState` bawat input: `formData.get('email')` gamit ang `name`.
- **Binubura ng React 19 ang form kahit may error** → ibalik ang `email`/`name` sa state + `defaultValue`. Ang password ay sinadyang hindi.
- **Ang walang laman na input ay `""`** → `|| undefined`, kung hindi 400 mula kay Zod.
- **`disabled={isPending}`** — hindi madodoble ang submit.
- Login (Day 21–22): 4 na `useState` · Register (Day 23): 1 `useActionState`.

## Resulta (totoong browser)
| Kaso | Makikita |
|---|---|
| Bagong account | "Nagre-register…" (disabled) → "✅ Nagawa ang account" |
| Parehong email, malaking titik | "❌ Email already registered" — nandoon pa ang email, walang laman ang password |
| Password na `short` | "Too small: expected string to have >=8 characters" sa ilalim ng password — nandoon pa ang name |
| Walang name | hindi ipinadala ang `name` |

## Mga problema at paano ko nalutas
- **CORS error sa register kahit may `cors()` na sa code.** Ang tumatakbong server ay nag-restart sa gitna ng `git checkout main` (bago ang pull) — walang `cors()` ang code noon — tapos **namatay ang watcher** (hindi na nag-restart kahit may totoong edit). Kalahati lang pala ang naayos ng `--watch-path` ng Day 18.
- Sinubukan sa scratch git repo: `node --watch-path` → namatay pagkatapos ng unang checkout; **nodemon** → buhay sa 4 na checkout + edit. Lumipat sa nodemon (D-014), at sinubukan sa backend mismo: edit, `.env`, at checkout → lahat nag-restart nang tama.
- **Aral:** subukan ang ayos sa TOTOONG sitwasyon — ang Day 18 test ay `mv` lang, hindi `git checkout`.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 24: React Router — `/login`, `/register`, `/profile` (protektado), logout

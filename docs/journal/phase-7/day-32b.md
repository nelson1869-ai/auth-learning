# Day 32b — 2026-09-26 · Phase 7 · frontend → TypeScript (idinagdag)

## Bakit may Day 32b
Napansin ko na `.js` pa rin ang `frontend/src/api/auth.js`. Sinabi ng tech stack na TypeScript din ang frontend sa Phase 7, pero backend lang ang nasa roadmap — butas sa plano. Hinintay muna ang `checkpoint-phase-7` tag.

## Ano ang ginawa (AI, sa kahilingan ko — "go")
- Sinuri muna: ang `react-ts` template ng Vite (TS 6) → sinubukan ang TS 7 sa `tsc -b` — gumagana
- `typescript@7`, `tsconfig.json` + `tsconfig.app.json` (browser) + `tsconfig.node.json` (`vite.config.ts`), `npm run typecheck` = `tsc -b`, idinagdag sa CI
- `auth.js` → `auth.ts` (`User`, `FieldErrors`, `ApiError`, `errorMessage`); lahat ng `.jsx` → `.tsx`
- **D-019**: ang `User` type ay kopya ng sagot ng backend

## Ano ang nahuli ng TypeScript (17 error nang pinalitan lang ang pangalan)
| Saan | Error |
|---|---|
| `ProfilePage` | `user.name` sa type na **`never`** — hindi alam ang hugis ng user → `useState<User \| null>` |
| `main.tsx` | `document.getElementById('root')` ay puwedeng `null` |
| `auth.ts` | walang type ang mga parameter; `err.fields` wala sa `Error` → `ApiError` |
| `LoginPage`/`RegisterPage` | `err` ay `unknown`; `e` walang type → `FormEvent<HTMLFormElement>` |
| `RegisterPage` | `formData.get()` ay `string \| File \| null`; `useActionState` na may `{}` na hindi tugma → `RegisterState` |

## Resulta
`tsc -b` 0 error · lint · build · **totoong browser**: /profile → /login, maikling password → mensahe sa ilalim ng input, register ✅, maling password ❌, login → "Hello, TS Flow!", logout → /login.

## Ano ang natutunan ko (sa sarili kong salita)
- **`useState<User | null>(null)`** — sabihin kung anong hugis ang laman, kung hindi `never` ang akala.
- **`null` sa DOM** — ang `getElementById` ay puwedeng walang makita.
- **Kopya ang types sa pagitan ng frontend at backend** — kapag binago ang backend, walang babala sa frontend (hanggang Phase 16).

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- ✅ Tag `checkpoint-phase-7` (ako ang gagawa) → Phase 8: Totoong deploy 🌐

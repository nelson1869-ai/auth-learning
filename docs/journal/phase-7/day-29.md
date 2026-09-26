# Day 29 — 2026-09-26 · Phase 7

## Ano ang ginawa (AI, sa kahilingan ko — "ikaw na")
- Sinubukan muna sa scratch: TypeScript 7.0.2, `node src/index.ts` sa Node 24, Vitest sa `.ts`
- `npm install -D typescript @types/node @types/express @types/cookie-parser @types/cors @types/jsonwebtoken @types/pg @types/supertest`
- `backend/tsconfig.json` (strict, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowJs`)
- `npm run typecheck` (= `tsc`), idinagdag sa CI; `.ts` sa binabantayan ng nodemon
- **Unang file:** `routes/health.js` → `routes/health.ts` na may `type HealthResponse`
- **D-018:** walang build step — si Node ang nagpapatakbo ng TypeScript

## Ano ang nahuli ng TypeScript (sinadyang sirain)
| Mali | Error |
|---|---|
| `status: 'okay'` | `Type '"okay"' is not assignable to type '"ok"'` |
| walang `time` | `Property 'time' is missing ... but required in type 'HealthResponse'` |
| `res.jsn(body)` | `Property 'jsn' does not exist ... Did you mean 'json'?` |

Lahat ng ito ay tatakbo pa rin sa JavaScript — at makikita lang ang mali kapag may tumawag sa endpoint.

## Ano ang natutunan ko (sa sarili kong salita)
- **Type** = ang "hugis" ng data. `'ok'` (literal) ay mas mahigpit kaysa `string`.
- **`tsc` = tagasuri, hindi tagapagpatakbo** (`noEmit`). Si Node 24 ang nagpapatakbo ng `.ts` — kaya hindi sinusuri ang types habang tumatakbo; kaya may `typecheck` sa CI.
- **`_req`** — underscore = sinadyang hindi ginagamit.
- Puwedeng magkasama ang `.js` at `.ts` habang naglilipat (`allowJs`).

## Resulta
- `npm run typecheck` malinis · `npm test` 10 passed · `/api/health` → 200 mula sa `health.ts` (dev server)

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung si Node ang nagpapatakbo ng TypeScript, bakit kailangan pa ng `tsc`?**
  S: Tinatanggal lang ni Node ang types (type stripping), hindi sinusuri. Kaya tatakbo pa rin ang code na may maling type. Ang `tsc` (`npm run typecheck`, at sa CI) ang tagasuri.
- **T: Kailangan ko bang lagyan ng type ang lahat?**
  S: Hindi. Kaya ng TypeScript na hulaan ang karamihan (inference). Lagyan lang ang mga parameter, ang mga hugis ng data (hal. `User`), at kapag hindi nito kayang hulaan (hal. `useState<User | null>`).
- **T: Ano ang `erasableSyntaxOnly`?**
  S: Pinapayagan lang ang TypeScript syntax na kayang tanggalin ni Node nang hindi binabago ang code (walang `enum`, walang `namespace` na may code). Kaya gumagana ang "walang build step" (D-018).

## Susunod
- Day 30–32: ilipat ang natitirang files — db, validations (`z.infer`), middleware, routes, tests

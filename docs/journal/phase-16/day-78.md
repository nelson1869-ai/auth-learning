# Day 78 — 2026-09-27 · Phase 16 · API documentation (OpenAPI + Swagger UI + frontend types)

## Ang problema
- Ang `docs/07-api-contract.md` ay isinusulat nang kamay, kaya puwede itong maging luma nang walang nakakapansin.
- Ang mga type ng frontend (`User`, `Session`, `AdminUser`…) ay **kopya** ng sagot ng backend (D-019). Kapag nagbago ang backend, sa browser pa lang lalabas ang mali.

## Ano ang ginawa
1. **OpenAPI 3.1 mula sa Zod** (`backend/src/openapi/document.ts`): `z.toJSONSchema` (built-in sa Zod 4) para sa mga schema. Ang mga path, status at paglalarawan lang ang nakasulat nang kamay.
   **Mga response schema** (`validations/responses.ts`, `z.strictObject`), na wala pa noon.
2. **`GET /api/openapi.json`** at **`/api/docs`** (Swagger UI, `swagger-ui-express`). **Redocly: "Your API description is valid."**
   Idinagdag ang `security: []` sa mga pampublikong endpoint at ang `operationId`, ayon sa Redocly.
3. **Sariling generator ng TypeScript** (`openapi/typescript.ts`, ~70 linya). **`npm run openapi`** → `backend/openapi.json` + `frontend/src/api/openapi.generated.ts` (parehong naka-commit).
4. **Frontend:** ang mga type ay galing na sa spec. **D-019 ay nalutas.**
5. **Mga bantay** (`openapi.test.ts`, 7 test): drift ng dalawang file, bawat route ay nasa spec, ang totoong mga sagot ay tugma sa schema, at ang generator mismo.

## Isang hadlang, at ang desisyon (D-027)
Ang `openapi-typescript` (ang karaniwang tool) ay **kailangan ng TypeScript 5**, pero TypeScript 7 ang project.
- **`--legacy-peer-deps`**: malamang masira (iba ang compiler API ng TS 7).
- **`npx` na may TS 5 sa bawat build**: nagda-download ng mga package na walang lockfile sa CI at Pages, isang supply-chain risk.
- **Pinili:** maliit na sariling generator, na **pumapalya sa hindi kilalang keyword** (may test). Walang pagbabago sa CI workflow o sa Pages.

## 🐛 Ang nahuli ng generated types
Ang `login()` at `register()` sa frontend ay naka-type na **`User`** (may `role` at `emailVerified`). Pero ang ibinabalik ng backend ay **`{ id, email, name }` lang**.
Nang palitan ang mga kopya, agad itong itinuro ng `tsc` sa `RegisterPage` (inimbak ang sagot ng register bilang `User`).
Hindi ito nagdulot ng bug, dahil walang gumamit ng `role` pagkatapos ng login, pero iyon mismo ang panganib na nakasulat sa D-019. Ngayon, `PublicUser` na ang type.

## Paano napatunayan (bawat bantay ay sinira)
| Sinira | Nahuli ng |
|---|---|
| binago ang schema (`name` max 100 → 101), hindi ni-regenerate | ❌ drift test ng `openapi.json` |
| bagong route na walang docs | ❌ route test |
| `passwordHash` sa sagot ng `/me` | ❌ contract test (strict) |
| in-edit nang kamay ang `openapi.generated.ts` | ❌ drift test ng mga type |
| inalis ang `emailVerified` sa backend + `npm run openapi` | ❌ **frontend `tsc`**: `ProfilePage.tsx:59`, kung saan ito ginagamit |

| Iba pang pagsubok | Resulta |
|---|---|
| Swagger UI sa headless na browser | ✅ 200, 17 operation, 0 error sa console. **Hindi na kinailangang luwagan ang CSP** (hindi tulad ng reference) |
| Frontend sa dev: register → profile → sessions | ✅ 0 JS error |
| Buong suite (backend) · frontend typecheck · lint · build | ✅ 186 · ✅ |
| 25 `.http` (review script) | ✅ 25/25 |
| Production | ✅ `/api/openapi.json`: 3.1.0, 17 path, 21 schema, **eksaktong kapareho ng naka-commit na file** · Swagger UI sa totoong browser: 17 operation · frontend: login 200 → `/me` 200 → Profile |

**Dalawang bagay sa production check:**
- **Isang maling "hindi naka-login"** sa unang takbo ng script ko: 2.5 segundo lang ang hinintay nito, mas mabagal ang production. Sa pangalawang takbo (4 na segundo at may network log):
  200 login, 200 `/me`, Profile. **Ang script ang mali, hindi ang app.**
- **Hinarang ng CSP ang Cloudflare Web Analytics beacon** sa `/api/docs` (kusang isinisingit ng Cloudflare sa mga HTML page na binubuksan sa browser; wala ito sa curl).
  **Sinadyang iniwang nakaharang:** walang dahilan para i-track ang mga bumibisita sa docs ng API, at ang tanging epekto ay isang error sa console.
  Para mawala ang error: alisin ang `api.nelson1869.com` sa Web Analytics sa Cloudflare dashboard (gawain ni Nelson, kung gusto).

## Kumpara sa reference
- **Pareho:** OpenAPI mula sa Zod schemas, Swagger UI sa `/api-docs` (dito: `/api/docs`), at isang test ng spec.
- **Iba:** `z.toJSONSchema` sa halip na `zod-to-openapi`; may **response schemas at contract test** (sinusuri ang totoong sagot); may **mga type ng frontend** (walang frontend ang reference);
  at walang pagluluwag ng CSP.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang OpenAPI?**
  S: Isang standard na format (JSON) para ilarawan ang isang API: bawat URL, ang body na tinatanggap, at ang mga posibleng sagot. Dahil standard, may mga tool na gumagamit nito:
  Swagger UI (page na mababasa at masusubukan), mga generator ng type o client, at mga validator.
- **T: Bakit may test pa kung ginagawa naman ng code ang docs?**
  S: Ginagawa ng code ang spec, pero **naka-commit** ang `openapi.json` at ang mga type ng frontend. Kapag binago ko ang schema at nakalimutan ang `npm run openapi`, luma na ang naka-commit.
  At ang mga path (status, paglalarawan) ay nakasulat nang kamay, kaya kailangan ng test na nagsusuri sa totoong mga route at sagot.
- **T: Bakit strict ang mga response schema?**
  S: Para mahuli kapag may lumabas na field na hindi dapat. Sa pagsubok, ang `passwordHash` na tumagas sa `/me` ay agad nahuli, kahit walang sumulat ng test para rito mismo.
- **T: Ano ang gagawin ko kapag nagdagdag ako ng endpoint?**
  S: (1) Zod schema ng input at sagot, (2) isang entry sa `paths` ng `document.ts`, (3) `npm run openapi`, (4) i-commit ang dalawang file. Kapag nakalimutan ang alinman, babagsak ang test.

## Susunod
- **Day 79 — Walang naiwang unused code:** knip (unused files, exports, dependencies), at ang checkpoint ng Phase 16.

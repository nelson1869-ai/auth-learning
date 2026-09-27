# Day 79 — 2026-09-27 · Phase 16 · Walang naiwang unused code (knip) · 🏁 Tapos ang Phase 16

## Bakit
Ang patay na code (export na walang gumagamit, lumang type, file na hindi na kailangan) ay **nakakalito**: iisipin ng susunod na magbabasa na mahalaga ito,
at aalagaan niya nang walang dahilan. Ang `noUnusedLocals` ng TypeScript (Phase 7) ay para lang sa loob ng isang file. Hindi nito nakikita ang **export** na walang gumagamit sa ibang file.

## Ano ang ginawa
- **knip@6** sa backend at frontend. Walang TypeScript peer ang v6, kaya ayos ito sa TS 7 (ang v5 ay hindi, sabi ng reference).
- **Bahagi na ng `npm run lint`**, kaya tumatakbo ito sa CI **nang hindi binabago ang workflow** (walang `workflow` scope ang token).
- **Ang unang takbo, at ang ginawa sa bawat natuklasan:**

  | Natuklasan | Ginawa |
  |---|---|
  | 8 `export` na sa sariling file lang ginagamit (cookie options ×3, `writeAudit`, `LOCKOUT_MS`, `clientKey`, `listAuditLogs`, `API_URL`) | inalis ang `export` |
  | 4 na type na walang gumagamit (`User` at `TrustedDevice` sa schema, `RegisterInput`/`LoginInput` sa validations na **doble** ng nasa services) | binura |
  | `drizzle.config.ts`: error sa pagkarga (walang `DATABASE_URL`) | ang config ay sinadyang tumatanggi (fail-fast) → pinatay ang drizzle plugin ng knip, ginawang entry ang config |
  | `playground/01-hash.js` · `pino-pretty` · 16 na type sa `openapi.generated.ts` | **sinadya** → pagbubukod sa `knip.jsonc`, may dahilan ang bawat isa (practice file · ginagamit bilang string · buong set na ginawa ng code) |

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Nagdagdag ng unused export · unused file · unused dependency | ✅ nahuli ang bawat isa, `npm run lint` → **exit 1** |
| Buong suite · tsc · build · `npm run openapi` (walang nagbago sa spec) | ✅ 186 |
| Maikling review ng phase: 25 `.http` · 47 diagram | ✅ 25/25 · 47/47 |

## 🏁 Buod ng Phase 16 (tag `checkpoint-phase-16`)
| Day | Ginawa | Nahuli sa daan |
|---|---|---|
| 74 | pundasyon (`auditFor`, `controllers/http.ts`) + register + login | bug sa test isolation (Day 71) · nawalang arrow sa diagram 03 |
| 75 | me, refresh, logout, sessions, change-password | mga lumang header mula Day 74 |
| 76 | reset, verify, admin, users count · `routes/auth.ts` 470 → 63 linya | "audit(req)" sa loob ng mga node ng diagram · lumang listahan ng pages |
| 77 | mass-assignment: 4 na depensa, sinira nang isa-isa at magkasama | maling claim ko tungkol sa test ng reference |
| 78 | OpenAPI + Swagger UI + frontend types (D-027) | **`login()`/`register()` ay mali ang type sa frontend** |
| 79 | knip | 12 unused na export/type |

### ✅ Checkpoint: *Ano ang dapat at HINDI dapat nasa loob ng isang controller?*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong sagutin ulit nang hindi tumitingin.

**Ang controller ay ang "tagasalin" sa pagitan ng HTTP at ng logic.** Ito lang ang nakakaalam ng `req` at `res`.

**DAPAT nasa controller:**
1. **Basahin at suriin ang input:** `parseOr400(schema, req.body, res)` → 400 kung mali. Ang **nalinis** na data lang ang ipinapasa (Day 77: mass assignment).
2. **Kunin ang mga galing sa server:** `req.userId` (mula sa `requireAuth`), `deviceOf(req)`, ang device cookie, `auditFor(req)`, at idagdag **sa huli** ng spread.
3. **Tawagin ang service** at **isalin ang resulta** sa HTTP: `invalid` → 401, `locked` → 423 + `Retry-After`, `ok` → 200.
4. **Cookies**, pagkatapos lang bumalik ang service (kapag nai-commit na ang lahat, Day 68).
5. **Kung KAILAN sasagot:** hal. forgot-password, sumasagot muna ng 202, saka ang lahat sa background (Day 59).

**HINDI dapat nasa controller:**
1. **SQL o database** (`db`, drizzle), dahil logic iyon ng service. May grep check noong Day 76: walang controller na nag-i-import ng `db`.
2. **argon2 o anumang patakaran ng negosyo:** ang lockout, "isang aktibong link", at kung sino ang puwedeng gumawa ng ano.
3. **`req.body` na basta ipinapasa sa service** (mass assignment).
4. **Mga desisyong kailangang subukan nang walang Express.** Kapag nasa controller ang logic, kailangan ng buong HTTP request para masubukan ito.

**Bakit mahalaga?** Nang nasa route pa ang lahat (Day 68), nag-set ang login ng cookie **bago** ang pagsulat sa database, kaya "nabigo" ang login pero naka-login ka.
Ngayon, walang `res` ang service, kaya **hindi na posible** ang ganoong pagkakamali.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| Register 409 → email-first signup? | Ang huling butas ng enumeration | desisyon ko |
| Isama sa repo ang `.http` review script? | Nasa scratchpad lang ng AI | kung gusto ko |
| Alisin ang `api.nelson1869.com` sa Cloudflare Web Analytics | Isang error sa console ng `/api/docs` (hinarang ng CSP) | kung gusto ko |
| Retention (`unknown_login_attempts`, `audit_logs`, tokens, `trusted_devices`) | Lumalaki nang walang hangganan | Phase 18, Day 90 |
| I-verify ang admin email ko sa production | Hindi pa verified | ako |
| D-021 · durable email queue · `tokenVersion` · `kid` · cursor pagination · `UNIQUE (lower(email))` | mula sa naunang backlog | kapag kailangan |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang pagkakaiba ng knip at ng `noUnusedLocals`?**
  S: Ang `noUnusedLocals` ay sa loob ng isang file lang (variable na hindi ginagamit). Ang knip ay tumitingin sa **buong project**: export na walang nag-i-import, file na walang gumagamit,
  at dependency sa `package.json` na walang import.
- **T: Bakit may mga pagbubukod pa?**
  S: May mga bagay na hindi nakikita ng knip: ang `pino-pretty` ay ginagamit bilang string, hindi import. At may mga sinadya: ang practice file, at ang buong set ng generated types.
  Kaya bawat pagbubukod ay may nakasulat na dahilan. Kapag walang dahilan, alisin ang code, huwag magdagdag ng pagbubukod.
- **T: Bakit sa `npm run lint` at hindi hiwalay na hakbang sa CI?**
  S: Walang `workflow` scope ang token para baguhin ang CI file. At ayos lang ito: iisang command para sa lahat ng "suriin ang code nang hindi pinapatakbo".

## Susunod
- **Phase 17 — Observability.**

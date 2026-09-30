# Day 93 — 2026-09-30 · Phase 18 · Review day (hindi pa tapos ang Phase 18: naiwan ang Neon drill)

## Ang review
| Tanong ng roadmap | Paano sinuri | Resulta |
|---|---|---|
| Tugma pa ba ang LAHAT ng `.http` sa code? | Pinatakbo ang bawat request ng 37 file sa dev server (review script) | ✅ **32 file ang buong napatakbo** · ⚠️ **1 mali, itinama** (`08-rate-limit.http`) · ⏭️ 3 file ang bahagya lang (4 na request ang hindi napatakbo) at 2 file ang hindi napatakbo (tingnan sa ibaba) |
| | Bawat URL ng app sa 38 file (kasama ang `prod/`), ikinumpara sa OpenAPI spec | ✅ 177 request · ang 9 na wala sa spec ay **sinadya** (6 na 404 demo + docs endpoints + `/metrics`) — pareho ng Day 86 |
| | `prod/01-production.http` (read-only) sa totoong production | ✅ 8/8 |
| Tugma pa ba ang mga diagram? | Rebuild + render ng bawat isa sa headless Chromium | ✅ **57/57** na-render (27 file) |
| | Bawat file path na binabanggit ng mga diagram, `.http`, README, `06`, `07`, `02` at `AGENTS.md` | ✅ 557 banggit · walang totoong nawawala (ang 10 "wala" ay `.ts` na `.tsx` pala sa regex ko, placeholder, o ang reference project) |
| Tugma pa ba ang folder structure sa `06-architecture.md`? | Bawat source file sa `backend/src` at `frontend/src`, at bawat folder | ⚠️ **2 kulang, inayos:** ang buong `database/` (mula Day 91) at `http/ 01–36` → `01–37` |
| Buong suite · tsc · lint · build | backend at frontend | ✅ 232 tests · ✅ · ✅ · ✅ |
| Production | `ready` · 6 container · Prometheus target `up` · 6 rule `inactive` | ✅ lahat · naka-deploy: `9211cdd` (ang sumunod na mga commit sa `main` ay docs lang) |
| 🗄️ Neon restore drill | — | ❌ **hindi nagawa**: wala pa ang `database/backups/.env.staging` |

## ⚠️ Ang nahuli: mali ang `08-rate-limit.http` #1 mula pa noong Day 71
Nakasulat: "1–10: `401`, ika-11: `429`". Ang totoo (mula sa malinis na simula, 11 na maling login sa email na walang account):

`401 401 401 401 401 423 423 423 423 423 429`

Mula **Day 71**, pati ang email na walang account ay nalo-lock pagkatapos ng 5 (para hindi ibunyag ng `423` kung sino ang may account). Binibilang pa rin ng rate limiter ang `423`, kaya `429` pa rin ang ika-11.
**Lumampas ito sa review ng Day 86 at sa mismong pag-update ng file noong Day 92** (at malamang sa iba pang review mula Day 71; hindi ko sinuri isa-isa). Bakit? Isang beses lang ipinapadala ng review script ang bawat request, pero ang sabi ng file ay "i-send nang 11 beses". Ngayon, ipinadala ko ito nang 11 beses nang mano-mano dahil napansin kong `200` ang #2 (dapat `429`).
Itinama ang file. **Aral:** ang "pumasa" ng script ay hindi nangangahulugang nasubukan ang buong sinasabi ng file.

## Ang hindi napatakbo (tapat na listahan)
| Ano | Bakit | Gaano kalaki ang butas |
|---|---|---|
| `35-backup-drill.http` (2 request) | Kailangan ng staging container sa port 3098 (`KEEP_STAGING=1 restore-drill.sh`); hindi ko ito pinatakbo ngayon | Napatakbo noong Day 91 |
| `36-load-balancing.http` (4 request) | Kailangan ng lab (Caddy sa 8088); hindi tumatakbo | Napatakbo noong Day 91b at Day 92 |
| `29-alerts.http` #7–#8 (gumawa at magbura ng silence) | **Sinadya:** nagpapatahimik ito ng alert sa **production** Alertmanager. Ang 6 na GET ay pumasa | Napatakbo noong Day 84 |
| `19-password-reset.http` #3 at `20-verify-email.http` #4 (token mula sa email) | Ang link ay nasa terminal ng `npm run dev` ko, na hindi nababasa ng AI | May Vitest tests ang dalawa (`password-reset.test.ts`, `verify-email.test.ts`) |

**Hindi sila "pasado": hindi sila napatakbo.** Tugma ang lahat ng URL nila sa spec.

### ✅ Napatakbo na ulit ang `.http` 14 at 15
Nilaktawan ang mga ito noong Day 86 (kailangan ang password ng dev admin ko). Ngayon: gumawa ang AI ng **pansamantalang dev admin** (`review-admin-…@example.com`, `npm run db:set-role`), pinatakbo ang dalawang file gamit iyon (14/14 request, tugma), tapos binura.
Hindi na kailangan ang password ko para sa review.

### Mga hakbang na "i-paste" na ginawa nang mano-mano
- `07-logout.http`: access token na kinopya bago mag-logout → `/me` **200** (ang alam na limitasyon, hanggang 15 minuto) · refresh token na kinopya → **401** ✅
- `17-sessions.http` #4: binura ang ibang session gamit ang totoong id → **204** ✅

## Mga naayos ngayong araw
- **`backend/http/08-rate-limit.http`**: ang tamang pagkakasunod (`401 ×5 → 423 ×5 → 429`), at kung paano ulitin (kailangang burahin din ang `unknown_login_attempts`).
- **`docs/06-architecture.md`**: idinagdag ang `database/` (backups, systemd, sql-practice) · `01–37` na ang `.http`.

## Ang ginalaw sa dev ko habang nagre-review
- Pinatakbo sa **tumatakbo kong dev server** (hindi sariwang server bawat file: okupado ang port 3000). Sa halip, `redis-cli flushall` bago ang bawat file, dahil nasa Redis na ang bilang ng rate limiter.
- **19 na demo user** ang nagawa at binura (lahat `@example.com`). 1 user ulit ang natira: ako.
- **3 maling login sa dev admin account ko** (mula sa unang takbo ng 14 at 15, bago ginawa ang pansamantalang admin). Ibinalik ang bilang sa 0. Hindi ako na-lock.
- Binura ang lahat ng `unknown_login_attempts` sa dev (51 row bago ang review).
- **Walang ginalaw sa production** maliban sa pagbasa (8 request ng `prod/01`, `ready`, Prometheus).

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| **Neon restore drill** | D-033: hindi opsyonal. Ito ang pumipigil sa pagsasara ng Phase 18 | ako: gawin ang staging branch + `.env.staging` (sa WSL), tapos "go" |
| **Isama sa repo ang `.http` review script** | **Tatlong beses na itong isinulat** (nabura nang dalawang beses, at session-only ang scratchpad). Ngayon, 127 linya | desisyon ko — rekomendasyon ng AI: oo, sa `backend/scripts/` |
| Turuan ang script na sundin ang "i-send nang N beses" | Iyan ang dahilan kung bakit lumampas ang mali sa `08` | kasama ng nasa itaas |
| Bantay mula sa labas ng PC (uptime monitor) | mula sa Day 86; hindi pa nagagawa | desisyon ko |
| Sariwang server bawat `.http` file sa review | Ngayon ay iisang server + `flushall`; hindi nito nire-reset ang estado sa database | kasama ng script |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit hindi pa sarado ang Phase 18 kung halos lahat ay ✅?**
  S: Dahil ang backup na hindi pa nasusubukang i-restore **papunta sa Neon** ay pangako lang. Nasukat ang restore sa lokal na container (0.7s), pero ang totoong sakuna ay sa Neon: ibang network, ibang laki, at kailangang palitan ang `DATABASE_URL`. Hindi ko alam ang totoong RTO hangga't hindi ito ginagawa.
- **T: Paano lumampas sa mga naunang review ang mali sa `08`?**
  S: Ang script ay tumitingin kung ang status ay **isa sa mga binanggit** sa file. Ang `401` ay binanggit, at `401` ang unang sagot, kaya "pasado". Hindi nito alam na dapat 11 beses. Ang check na masyadong maluwag ay nagbibigay ng maling kumpiyansa.
- **T: Bakit hindi pinatakbo ang paggawa ng silence sa Alertmanager?**
  S: Dahil production iyon: habang may silence, hindi ako makakatanggap ng alert. Maliit ang panganib (binubura agad), pero walang dahilan para galawin ang production sa isang review ng dokumento.

## Susunod
- **Neon restore drill** → saka isasara ang Phase 18.
- **Phase 19 — Passkeys** (Day 94–100). Day 94: paano gumagana ang WebAuthn (konsepto muna, bago ang code).

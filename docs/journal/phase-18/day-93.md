# Day 93 — 2026-09-30 · Phase 18 · Review day · 🏁 Tapos ang Phase 18 (pagkatapos ng Neon drill, sa parehong araw)

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
| 🗄️ Neon restore drill | `restore-drill-neon.sh` sa staging branch | ✅ **restore 9.4–9.9s · 18.9–20.1s hanggang tama ulit ang app** — pagkatapos ng dalawang pagpalya (tingnan ang "Ang Neon drill" sa ibaba). *Unang isinulat dito: ❌ hindi nagawa, wala pa ang `.env.staging`.* |

## ⚠️ Ang nahuli: mali ang `08-rate-limit.http` #1 mula pa noong Day 71
Nakasulat: "1–10: `401`, ika-11: `429`". Ang totoo (mula sa malinis na simula, 11 na maling login sa email na walang account):

`401 401 401 401 401 423 423 423 423 423 429`

Mula **Day 71**, pati ang email na walang account ay nalo-lock pagkatapos ng 5 (para hindi ibunyag ng `423` kung sino ang may account). Binibilang pa rin ng rate limiter ang `423`, kaya `429` pa rin ang ika-11.
**Lumampas ito sa review ng Day 86 at sa mismong pag-update ng file noong Day 92** (at malamang sa iba pang review mula Day 71; hindi ko sinuri isa-isa). Bakit? Isang beses lang ipinapadala ng review script ang bawat request, pero ang sabi ng file ay "i-send nang 11 beses". Ngayon, ipinadala ko ito nang 11 beses nang mano-mano dahil napansin kong `200` ang #2 (dapat `429`).
Itinama ang file. **Aral:** ang "pumasa" ng script ay hindi nangangahulugang nasubukan ang buong sinasabi ng file.

## 🗄️ Ang Neon drill (ginawa pagkatapos ng review, parehong araw)
Ako ang gumawa ng staging branch sa Neon console (`staging`, mula sa `production`, walang expiry) at nag-save ng connection string sa
`database/backups/.env.staging` gamit ang `read -rsp` (hindi lumabas sa screen o sa chat). Sinuri ng AI ang file nang yes/no lang: Neon endpoint, iba sa production.

| Takbo | Resulta |
|---|---|
| 1 | ❌ `psql: weak sslmode "require" may not be used with sslrootcert=system`. **At sinabi ng script na "💥 Sinira ang staging" kahit hindi man lang ito nakakonekta** |
| 2 (`verify-full`) | ✅ restore 9.0s, ✅ tugma ang bilang ng row — pero ❌ **ang app: `500`**, `relation "users" does not exist` |
| 3 (direktang endpoint) | ✅ restore **9.9s** · app `{"count":1}` · **20.1s** mula sa sira hanggang tama |
| 4 (ulit) | ✅ restore **9.4s** · **18.9s** |

### 🐛 1: ang script na nagsabing "sinira" nang walang sinira
Ang hakbang ng pagbura ay `… | grep -v NOTICE || true`. Nilulunok ng `|| true` ang error ng `psql`, kaya tumuloy ang script at nag-print ng "💥 Sinira".
Hindi ito mapanganib dito (pumalya rin ang sumunod na hakbang), pero **mali ang sinabi ng script**. Inayos: humihinto na at sinasabi kung bakit. Sinubukan sa pagbabalik ng `require`: exit 1, tamang mensahe.
Ang `sslmode=require` ay ang **default ng Neon console**. Pinalitan ng AI ng `verify-full` sa `.env.staging` (iyon lang ang binago sa file).

### 🐛 2: ang totoong natuklasan — huwag mag-restore sa POOLED na URL
Ang kinopya ko sa Neon console ay ang **pooled** na URL (`ep-…-pooler`); iyon ang default. Tama ang restore at tugma ang bilang ng row, pero ang app ay `500` sa bawat query.

**Bakit:** ang dump ay nagsisimula sa `SELECT pg_catalog.set_config('search_path', '', false);` (linya 16 ng SQL nito). Normal iyon sa isang sariling koneksyon.
Pero ang pooler (PgBouncer, transaction mode) ay **nagpapahiram ng iisang koneksyon sa maraming client**, at hindi nito nire-reset ang setting na iyon.
Kaya ang app, na nagtatanong ng `users` (walang `public.`), ay nakakuha ng koneksyong walang `search_path`: "walang ganyang table".

| Sinuri | Pooled | Direkta |
|---|---|---|
| `show search_path` | *(walang laman)* | `"$user", public` |
| `select count(*) from users` | ❌ error | ✅ 1 |
| Mahigit 6 na minuto pagkatapos | sira pa rin | — |

**Bakit hindi ito nakita ng mga bantay:** schema-qualified ang pagbilang ng row ng script (`public.users`), at `SELECT 1` lang ang `/health/ready` (nahuli na noong Day 91: "200 pa rin ang ready kahit walang table").
**Ang ibig sabihin sa totoong sakuna:** kung ni-restore ko ang production gamit ang pooled na URL, **buo ang data pero patay ang app**, at sasabihin ng lahat ng check na ayos.
**Ligtas ba ang production ngayon?** Oo: direkta ang `DATABASE_URL` sa `.env.production` (sinuri nang yes/no), kaya ang mga backup at ang app ay hindi dumadaan sa pooler.
**Ayos:** inaalis na ng script ang `-pooler` para sa lahat ng hakbang, at nakasulat sa D-033: **direktang endpoint lagi**.
**Paano linisin ang pooler** *(unang isinulat: "hindi pa alam")*: mga 25 minuto pagkatapos, kusa na itong bumalik sa normal (hindi ko alam ang eksaktong dahilan; malamang ang pagtulog ng compute). At nang sadyang sirain ulit, isang `set_config('search_path', '"$user", public', false)` sa pooled na URL ang nagbalik nito agad. Isang beses lang sinubukan.

### ✅ Ang ayos sa `/health/ready`, sinubukan laban sa TOTOONG kaso (deploy `229a2f1`)
Pinalitan ang `SELECT 1` ng `select 1 from users limit 1` (PR #163). Pagkatapos ng deploy, sadyang ginawa ulit ng AI ang sira sa **staging**: ang unang statement ng dump, sa pooled na URL. Tapos ang bagong production image laban doon:

| | Dati (`SELECT 1`) | Ngayon |
|---|---|---|
| `/api/users/count` | 500 | 500 |
| `/api/health/ready` | **200 "ready"** | **503 "not_ready"** (3 sa 3) |

Production pagkatapos ng deploy: `ready` 200, `{"count":1}`. Ang `deploy.sh` ay tumitingin sa `/ready`, kaya **pumapalya na ang deploy** kapag hindi makita ng app ang mga table nito.

### Ang RTO, tapat
~20 segundo ay **sa drill**: handa na ang script, ang backup at ang staging branch, at 28KB lang ang dump (1 user). Sa totoong sakuna, idagdag ang: pagpansin na may sira,
pagpapasya, pagpalit ng `DATABASE_URL`, at isang deploy. Minuto iyon, hindi segundo. At lalaki ang oras ng restore kasabay ng data.

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
| ~~Neon restore drill~~ | ✅ tapos (tingnan sa itaas) | — |
| ~~`/health/ready` na tumitingin sa totoong table~~ | ✅ tapos, parehong araw ("proceed … what is recommended" ang sabi ko): `select 1 from users limit 1`. Test sa totoong database (pinalitan ang pangalan ng table → 503); pumalya ang test nang ibalik ang `SELECT 1` | — |
| Paano linisin ang pooler ng Neon pagkatapos ng maling restore | Hindi pa alam; ngayon: "i-restart ang compute" | kapag kailangan |
| **Isama sa repo ang `.http` review script** | **Tatlong beses na itong isinulat** (nabura nang dalawang beses, at session-only ang scratchpad). Ngayon, 127 linya | desisyon ko — rekomendasyon ng AI: oo, sa `backend/scripts/` |
| Turuan ang script na sundin ang "i-send nang N beses" | Iyan ang dahilan kung bakit lumampas ang mali sa `08` | kasama ng nasa itaas |
| Bantay mula sa labas ng PC (uptime monitor) | mula sa Day 86; hindi pa nagagawa | desisyon ko |
| Sariwang server bawat `.http` file sa review | Ngayon ay iisang server + `flushall`; hindi nito nire-reset ang estado sa database | kasama ng script |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit hindi isinara ang Phase 18 hangga't walang Neon drill, kung halos lahat ay ✅ na?**
  S: Dahil ang backup na hindi pa nasusubukang i-restore **papunta sa Neon** ay pangako lang. At tama ang paghihintay: ang unang totoong takbo ay pumalya nang dalawang beses,
  at ang pangalawa ay isang bagay na hindi makikita sa lokal na container (walang pooler doon). Kung sa totoong sakuna ko ito unang nalaman, buo sana ang data pero patay ang app.
- **T: Ano ang connection pooler, at bakit ito ang nagdulot ng problema?**
  S: Mahal magbukas ng koneksyon sa Postgres, kaya ang pooler ay may ilang bukas na koneksyon na ipinapahiram sa maraming client. Mabilis, pero ang **mga setting ng session**
  (tulad ng `search_path`) ay naiiwan sa koneksyon para sa susunod na manghihiram. Ang `pg_restore` at `pg_dump` ay mga tool na nagbabago ng session, kaya dapat direkta sila.
- **T: Paano lumampas sa mga naunang review ang mali sa `08`?**
  S: Ang script ay tumitingin kung ang status ay **isa sa mga binanggit** sa file. Ang `401` ay binanggit, at `401` ang unang sagot, kaya "pasado". Hindi nito alam na dapat 11 beses. Ang check na masyadong maluwag ay nagbibigay ng maling kumpiyansa.
- **T: Bakit hindi pinatakbo ang paggawa ng silence sa Alertmanager?**
  S: Dahil production iyon: habang may silence, hindi ako makakatanggap ng alert. Maliit ang panganib (binubura agad), pero walang dahilan para galawin ang production sa isang review ng dokumento.

## 🏁 Buod ng Phase 18 — Production maturity (tag `checkpoint-phase-18`)
| Day | Ginawa | Nahuli sa daan |
|---|---|---|
| 87 | gitleaks, `npm audit`, Dependabot, secret scanning | naka-off pala ang lahat ng proteksyon ng GitHub |
| 88 | Grype sa CI, multi-stage image (332MB → 283MB) | ang dating `rm -rf npm` ay hindi nagpaliit |
| 89 | attestation, sinusuring migrations | tahimik na nilalaktawan ng drizzle ang migration na mas luma ang timestamp |
| 90 | retention, oras-oras, advisory lock | — |
| 91 | sariling `pg_dump` + lokal na restore drill | 6 na oras lang ang backup ng Neon · pooled na URL ng production na muntik lumusot sa bantay |
| 91b | load balancing lab | 20 sa halip na 10 ang limit sa 2 backend |
| 92 | rate limiter sa Redis | 2 bug sa `rate-limit-redis` |
| 92b | server cache sa Redis | luma ang bilang kapag walang invalidation |
| 93 | review + Neon drill | mali ang `08-rate-limit.http` mula Day 71 · **restore sa pooled na URL = patay ang app** |

## Susunod
- **Phase 19 — Passkeys** (Day 94–100). Day 94: paano gumagana ang WebAuthn (konsepto muna, bago ang code).

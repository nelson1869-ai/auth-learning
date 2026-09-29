# Day 86 — 2026-09-29 · Phase 17 · Review day · 🏁 Tapos ang Phase 17

## Ang review
| Tanong ng roadmap | Paano sinuri | Resulta |
|---|---|---|
| Tugma pa ba ang LAHAT ng `.http` sa code? | Pinatakbo ang bawat file sa bagong server (review script) | ✅ **28/28** · ⏭️ 14 at 15 nilaktawan (tingnan sa ibaba) |
| | **Bago:** bawat URL sa lahat ng 30 file, ikinumpara sa OpenAPI spec (na sinusuri ng tests laban sa totoong mga route) | ✅ 167 request · ang 9 na wala sa spec ay **sinadya** (6 na 404 demo + ang docs endpoints) · kasama ang 14 at 15 |
| Tugma pa ba ang mga diagram? | Rebuild + render ng bawat isa sa browser | ✅ **50/50** |
| | **Bago:** bawat file path na binabanggit ng docs, `.http` at diagram, sinuri kung umiiral | ✅ 157 path · ang 12 "wala" ay range (`0000–0012`), placeholder ng susunod na phase (`NN-passkeys.http`), o **kasaysayan** (`index.js` ng Day 04) |
| Tugma pa ba ang folder structure sa `06-architecture.md`? | Bawat file sa `backend/src` at `frontend/src`, hinanap sa doc | ✅ lahat ng source file sa backend · **2 kulang, inayos:** `frontend/src/api/openapi.generated.ts` (Day 78) at `backend/playground/` (nasa lumang tree, wala sa bago) |
| Buong suite · tsc · lint (backend at frontend) | | ✅ 198 tests · ✅ · ✅ |
| Production | ready · mga container · Prometheus target · 5 rule · promtool | ✅ lahat |

### ⏭️ Bakit nilaktawan ang `.http` 14 at 15
Kailangan nila ang password ng dev admin ko. Nabura ang file nito sa scratchpad ng AI nang ma-restart ang PC (Day 85), at hindi ko dapat i-paste ang password sa chat.
Hindi sila "pasado": **hindi sila napatakbo**. Pero bahagyang nasuri sila: tugma ang lahat ng URL nila sa spec, at may Vitest tests ang pagination at audit logs.
Kapag gusto kong maisama ulit: isusulat ko ang password sa isang file (hindi sa chat).

### Mga naayos ngayong araw
- **Pamagat ng roadmap:** may mga espasyo sa unahan ng `# 03 — Roadmap` (aksidente ko), kaya naging code block. Ibinalik.
- **Dev database:** nilinis ang mga demo account ng naunang review (17 + 17, may `@example.com` na bantay), at ang `unknown_login_attempts`.

## 🏁 Buod ng Phase 17 — Observability (tag `checkpoint-phase-17`)
| Day | Ginawa | Nahuli sa daan |
|---|---|---|
| 80 | `/health/live` vs `/health/ready` · HEALTHCHECK = live (para makatulog ang Neon) · readiness sa deploy | walang log kapag timeout ang readiness |
| 81 | OpenTelemetry metrics → `/metrics` (hiwalay na port, route template) | pinabagsak ng okupadong metrics port ang buong app · muntik ko nang basahin ang metrics ng IBANG app |
| 82–83 | Prometheus + Grafana, provisioned na dashboard, 127.0.0.1 lang | "No data" sa halip na 0% · **hindi nakikita ang unang audit event pagkatapos ng restart** (counter na nagsisimula sa 1) |
| 84 | 5 alert rule + promtool tests · Alertmanager → Resend → email · walang secret sa Git | muntik kong mapagkamalan ang RESOLVED ng test alert · kulang na `.env` → pati ang backend ay hindi ma-deploy (pre-flight) |
| 85 | Graceful shutdown (PID 1: SIGTERM ay hindi pinapansin → SIGKILL, exit 137) | walang silbing `closeIdleConnections()` · **mali kong hula na "+10s downtime"**, itinama ng sukat sa production · **40 oras na down ang PC, walang alert** |
| 86 | Review | 2 kulang sa architecture doc |

**Ang pattern ng phase na ito:** halos bawat araw, may **hula akong mali** na nahuli lang dahil **sinukat** ko o **sinira ko nang sadya** ang code.
Hindi ang code ang pinakamahalagang natutunan, kundi ang ugaling "patunayan muna bago sabihing gumagana".

### ✅ Checkpoint: *Nakatanggap ka ng alert email nang sadyang patayin ang app.*

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"), sa salitang parang ako.
> Babasahin ko ito, at susubukan kong ipaliwanag ulit nang hindi tumitingin.

**Oo.** Noong 2026-09-28, sinadyang pinatay ng AI ang backend sa production (nang may pahintulot ko), at dumating sa **inbox** ng Gmail ko:
- **"[FIRING:1] AppDown"** (00:10), mga 2 minuto pagkatapos mamatay ang app;
- **"[RESOLVED] AppDown"** (00:15), pagkatapos itong buhayin ulit.

**Ang buong landas ng email na iyon, at kung bakit bawat hakbang ay naroon:**
1. **Ang app** ay may `/metrics` sa hiwalay na port (Day 81), hindi publiko.
2. **Prometheus** ang kumukuha nito bawat 15s. Kapag hindi makuha: `up == 0`.
3. **Ang rule na `AppDown`** (`up == 0` nang **1 minuto**). Ang `for: 1m` ay para hindi ako ma-email sa bawat saglit na blip, hal. habang nagde-deploy. May test para rito.
4. **Alertmanager**: naghihintay ng 30s (`group_wait`) para pagsamahin ang sabay-sabay na alert, tapos nagpapadala sa **Resend SMTP**.
   Ang password ay nasa tmpfs lang, hindi sa Git at hindi sa disk.
5. **Kapag naayos**, RESOLVED na email pagkalipas ng `group_interval` (5m).

**Ang hindi nito kaya (at bakit mahalaga):** kapag patay ang **buong PC**, patay din ang Prometheus at Alertmanager, kaya walang email.
Hindi ito hula lang: nangyari ito nang dalawang beses ngayong linggo (mga 21 at 19 na oras na down, walang alert). Kaya ang susunod na mahalagang hakbang ay isang bantay na nasa **labas** ng PC.

## 📋 Backlog (na-update)
| Ano | Bakit | Kailan |
|---|---|---|
| **Bantay mula sa labas ng PC** (uptime monitor sa `/api/health`) | **40 oras na down ngayong linggo, walang alert** | ⬆️ **pinakamataas** — Phase 18 o mas maaga, desisyon ko |
| Isama sa repo ang `.http` review script | Dalawang beses nang nabura nang ma-restart ang PC | desisyon ko |
| Password ng dev admin sa isang file (para sa `.http` 14 at 15) | Hindi napatakbo sa review na ito | ako |
| Hiwalay na Resend key para sa alerts ("Sending access" lang) | Ang key ng app ang gamit ngayon | ako |
| Burahin ang 4 na Grafana plugin (Day 82) | Na-download bago pinatay ang preinstall | ako, opsyonal |
| Zero-downtime deploy (dalawang instance) | 3.8s na 502 sa bawat deploy | kapag kailangan |
| Register 409 → email-first signup? | Ang huling butas ng enumeration | desisyon ko |
| Alisin ang `api.nelson1869.com` sa Cloudflare Web Analytics · i-verify ang admin email ko | mula sa naunang backlog | ako |
| Retention (`unknown_login_attempts`, `audit_logs`, tokens, `trusted_devices`) | Lumalaki nang walang hangganan | Phase 18, Day 90 |
| D-021 · durable email queue · `tokenVersion` · `kid` · cursor pagination · `UNIQUE (lower(email))` | mula sa naunang backlog | kapag kailangan |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit may static check pa kung pinapatakbo naman ang mga `.http`?**
  S: Dahil hindi lahat ay napapatakbo (14 at 15 ngayon). Ang static check ay mura at sumasaklaw sa **lahat**: kapag may route na pinalitan ng pangalan,
  mahuhuli ito kahit sa file na hindi napatakbo. Ang dalawa ay magkadagdag, hindi magkapalit.
- **T: Bakit hindi ko binura ang mga "luma" na path sa roadmap, tulad ng `index.js`?**
  S: Dahil kasaysayan sila: noong Day 04, JavaScript pa talaga. Ang roadmap at ang journal ay tala ng nangyari. Ang dapat laging tugma sa code ngayon
  ay ang architecture doc, ang mga diagram, ang mga README at ang mga `.http`.
- **T: Ano ang pinakamahalagang natutunan ko sa Phase 17?**
  S: Na ang monitoring ay may sariling mga butas: nakikita lang nito ang kaya nitong makita. Ang dashboard ay kailangang tingnan; ang alert ay tumatawag.
  Pero ang alert na nasa parehong PC ng app ay hindi tatawag kapag patay ang PC. Kailangang itanong palagi: "ano ang HINDI nito makikita?"

## Susunod
- **Phase 18 — Production maturity** (Day 87–93). Day 87: supply-chain security (Dependabot, `npm audit` sa CI, gitleaks).

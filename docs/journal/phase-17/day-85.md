# Day 85 — 2026-09-29 · Phase 17 · Graceful shutdown

## Ang tanong ng araw
Sa bawat deploy, pinapatay ang lumang container. Ano ang nangyayari sa request na tumatakbo pa sa sandaling iyon (hal. isang login, o isang pagpapalit ng password)?
At sa email ng forgot-password na nasa background pa (Day 59)?

## Sinukat muna (bago magsulat ng code)
Pinatakbo ko nang lokal ang **eksaktong image na naka-deploy**, tapos `docker stop`:

| | Resulta |
|---|---|
| `docker stop` | **14.6 segundo** |
| exit code | **137** = pinatay ng **SIGKILL** |
| log ng pagsasara | wala |

**Bakit:** sa loob ng container, ang `node` ay **PID 1**. Ang PID 1 ay hindi awtomatikong namamatay sa SIGTERM: kapag **walang handler**, hindi nito pinapansin ang signal.
Kaya naghihintay ang Docker ng 10 segundo, at saka SIGKILL. Sa bawat deploy: **+10s na downtime**, **napuputol ang mga request**, at **nawawala ang mga email na nasa background**.

## Ano ang ginawa
- **`lib/shutdown.ts`** — ang pagkakasunod, kapag SIGTERM (deploy, `docker stop`) o SIGINT (Ctrl+C):
  1. `server.close()`: hinto sa **bagong** koneksyon, at hintayin ang mga request na **tumatakbo pa**
  2. `drainBackground()`: tapusin ang trabaho sa background
  3. isara ang metrics server
  4. `closeDb()`: isara ang database pool, **HULI** (kailangan pa ito ng background)
  5. **deadline na 8s**: ang ayaw matapos ay pinuputol, exit 1. Mas maikli ito sa `stop_grace_period: 10s` ng compose, para **ang app ang magpasya** (at may log), hindi ang SIGKILL ng Docker.
- Tumatakbo ang bawat hakbang **kahit pumalya ang nauna** (dapat pa ring isara ang database).
- **Pangalawang signal** (hal. Ctrl+C ulit) → exit 1 agad, hindi na naghihintay.
- Walang `process.exit` sa `shutdown.ts`: ibinabalik ang exit code, para masubukan ito sa Vitest. Ang `index.ts` ang tumatawag ng `process.exit`.
- **`nodemon --signal SIGTERM`**: sa dev, ang bawat restart ay dumadaan din sa parehong landas.

## Ang resulta (parehong image, lokal)
| | Bago | Ngayon |
|---|---|---|
| `docker stop` | 14.6s | **1.3s** (≈1ms ang app mismo; ang iba ay ang Docker) |
| exit code | 137 (SIGKILL) | **0** |
| request na mabagal ang body (2s) habang pinapatay | napuputol | **200**, buo ang sagot · 2.5s ang stop |
| bagong request habang nagsasara | — | tinatanggihan |

## 🐛 Dalawang pagkakamali ko, parehong nahuli ng pagsubok
1. **Ang test ko ay umasang "ECONNREFUSED" para sa bagong koneksyon, pero minsan "ECONNRESET" ang dumarating.** Hindi ito bug sa code:
   kaagad pagkatapos ng `close()`, puwede pang tanggapin ng kernel ang koneksyon bago tuluyang magsara ang port, tapos ni-reset ito.
   Pinatunayan ko sa hiwalay na script: 1 sa 3 REFUSED, 2 sa 3 RESET, at **laging 200 ang in-flight**. Pareho ang ibig sabihin ng dalawa: hindi pinagsilbihan.
   Mukhang naputol din ang in-flight ("socket hang up"), pero ang `afterEach` ko pala ang pumutol dito, **pagkatapos** pumalya ang test.
2. **Walang silbi ang isang linya ko.** Isa-isa kong sinira ang code: nahuli ng mga test ang 3 sa 4. Ang ika-4, ang pag-alis ng `closeIdleConnections()`, ay **hindi nahuli**.
   Hindi mahina ang test: mula Node 19, **kusa nang isinasara ng `server.close()` ang mga idle na keep-alive na koneksyon**. Inalis ko ang linya.
   Ang test ang nagbabantay na totoo pa rin ito (hal. kapag nagpalit ng Node version).

## ⚠️ Hindi pa ito zero-downtime
Iisa lang ang backend. Habang pinapalitan ng `deploy.sh` ang container, walang sumasagot, at 502 ang ibinibigay ng cloudflared.
Ang nagawa: **walang napuputol** na request o email, at **mas maikli ang puwang** (hindi na 10s ng paghihintay sa SIGKILL).
Ang tunay na zero-downtime ay nangangailangan ng dalawang instance (luma at bago nang sabay, tapos ilipat ang traffic). Nasa backlog, hindi pa kailangan sa laki ng app natin.

## 🔥 Natuklasan habang ginagawa: 40 oras na down, walang alert
Na-restart ang PC ko habang ginagawa ang araw na ito. Sa data ng Prometheus, may **dalawang puwang**:
- 09-27 16:38 → 09-28 13:26 UTC (**20.8 oras**)
- 09-28 15:44 → 09-29 10:55 UTC (**19.2 oras**)

Patay ang buong PC, kaya **down din ang `api.nelson1869.com`**, at **walang dumating na alert**, dahil kasamang patay ang Prometheus at Alertmanager.
Iyan mismo ang babala sa journal ng Day 84. Ngayon, may totoong ebidensiya na: ito ang **pinaka-karaniwang** dahilan ng pagka-down ng app natin.
**Tumaas sa backlog:** isang bantay sa **labas** ng PC (hal. isang libreng uptime monitor sa `https://api.nelson1869.com/api/health`).

Pagkatapos ng restart:
- ✅ Kusang bumalik ang buong production stack (`restart: unless-stopped`).
- ❌ Ang **dev** Postgres ay hindi bumalik (walang restart policy ang dev compose). Kinailangan ang `docker compose up -d`.
- ❌ **Nabura ang scratchpad ng AI**, kasama ang `.http` review script, ang diagram render check, at ang file ng dev admin password.
  Ginawa ko ulit ang mga script mula sa conversation, pero ang password ay hindi, kaya nilalaktawan ng review ang `14-pagination` at `15-audit-logs` hangga't wala ito.
  **Mas malakas na argumento na ito para isama sa repo ang review script** (desisyon ko pa rin).
- ✍️ Sarili kong pagkakamali: gumamit ako ng `pkill -f` para patayin ang nodemon, at pinatay nito ang sarili kong shell (nakasulat na ito sa gotchas ng reference). Walang nasira. Sa port o PID lang dapat pumatay.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 4 na test (`lib/shutdown.test.ts`, totoong `http.Server`) | ✅ 3 beses na pinatakbo, 4/4 |
| Sadyang sira: walang deadline · cleanup bago ang mga request · humihinto sa unang pumalyang hakbang | ✅ bumagsak ang tamang test sa bawat isa |
| Sadyang sira: walang `closeIdleConnections()` | ⚠️ pumasa, kaya inalis ang linya (tingnan sa itaas) |
| Dev server: SIGTERM habang may mabagal na request + forgot-password | ✅ 200 · bagong request tinanggihan · exit 0 · 2.01s · tamang ayos ng log |
| Dev server: dalawang Ctrl+C | ✅ exit 1 sa 0.37s, "Second signal" sa log |
| nodemon restart | ✅ "Shutting down gracefully" → "Shutdown complete" → "Server running" |
| Container (lokal na build) | ✅ 1.3s, exit 0 · may in-flight: 200, 2.5s |
| Buong suite · tsc · lint (oxlint + knip) | ✅ 198 · ✅ · ✅ |
| `.http` 30 (at 26, 29) | ✅ · ⚠️ hindi napatakbo ang buong review: may 17 demo account pa sa dev DB, at wala ang password ng admin |
| 50 diagram | ✅ 50/50 |

## Kumpara sa reference
- **Pareho:** `server.close()`, deadline, drain ng background bago isara ang database, bantay sa pangalawang signal.
- **Iba:** hiwalay na function na may **4 na test** gamit ang totoong server (walang test ang reference), deadline na mas maikli sa `stop_grace_period` na **tahasang** nakasulat,
  tumutuloy ang cleanup kahit may pumalya, walang `closeIdleConnections()` (walang silbi sa Node 19+), at ang pangalawang signal ay **lumalabas agad** (ang sa reference ay hindi pinapansin).
  Wala ring emergency shutdown sa `uncaughtException` (ang reference ay mayroon): kapag may hindi inaasahang error, mas ligtas na mamatay agad at hayaang i-restart ng Docker.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang SIGTERM at SIGINT?**
  S: Mga "signal", mga mensahe ng operating system sa isang process. Ang **SIGTERM** ay "pakiusap, tapusin mo na" (ipinapadala ng `docker stop`).
  Ang **SIGINT** ay ang Ctrl+C. Ang **SIGKILL** ay hindi na pakiusap: patay agad, walang pagkakataong maglinis, at hindi ito mahaharang.
- **T: Bakit hindi pinansin ng app ang SIGTERM noon?**
  S: Dahil ang app ay PID 1 sa loob ng container. Sa labas ng Docker, ang SIGTERM na walang handler ay pumapatay sa process. Pero ang PID 1 ay espesyal:
  hindi ito namamatay sa signal na walang handler. Kaya "hindi pinansin", at SIGKILL ang dumating pagkalipas ng 10s.
- **T: Bakit 8 segundo ang deadline, at hindi 10?**
  S: Para matapos ang app **bago** mag-SIGKILL ang Docker sa 10s. Kapag ang app ang pumutol, may log ("timed out") at malinis na naisara ang database.
  Kapag ang SIGKILL, walang bakas.
- **T: Bakit huli ang database?**
  S: Dahil ginagamit pa ito ng mga naunang hakbang: ang mga request na tinatapos, at ang forgot-password sa background (hinahanap nito ang account).
  Kung isasara muna ang database, papalya ang mga iyon.
- **T: Ano ang zero-downtime deploy, at bakit wala pa tayo roon?**
  S: Ang bagong bersyon ay tumatakbo na **bago** patayin ang luma, kaya laging may sumasagot. Kailangan nito ng dalawang instance at isang bagay na naglilipat ng traffic.
  Sa atin, iisa ang container, kaya may ilang segundong walang sumasagot sa bawat deploy.

## Susunod
- **Day 86 — Review day** + checkpoint ng Phase 17 (kumpirmahin ko na nasa inbox ko ang alert email).

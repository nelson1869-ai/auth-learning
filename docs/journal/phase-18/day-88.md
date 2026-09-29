# Day 88 — 2026-09-29 · Phase 18 · Container scanning (Grype) at mas maliit na image

## Ang tanong ng araw
Noong Day 87, sinuri ang **npm packages**. Pero ang Docker image ay may kasama pang buong **operating system** (Alpine): shell, mga library, package manager.
May butas ba sila? At kailangan ba talaga natin ang lahat ng iyon?

## Sinukat muna (ang image na naka-deploy, `0642c15`)
| | Resulta |
|---|---|
| Laki | **332MB** (`node` binary 125MB · `node_modules` 72MB · ang iba ay base image) |
| Grype | **1 High** (zlib) + **3 Medium** (busybox, busybox-binsh, ssl_client) — lahat sa Alpine packages, **walang ayos pa** |
| npm packages | 0 butas |
| Ang dating "alisin ang npm" (`rm -rf` sa sariling `RUN`) | **24.6kB na layer, hindi lumiit ang image** |
| Iba pang nasa base na hindi kailangan | yarn (`/opt`), C headers (6.6MB), **apk** (package manager) |

### Bakit hindi lumiit sa `rm -rf`?
Ang Docker image ay patong-patong na **layer**. Ang pagbura sa isang bagong layer ay **nagtatago** lang ng file: nasa ibabang layer (ang base image) pa rin ito.
Hindi na ito nakikita ng scanner (kaya nawala ang mga CVE ng npm noon), pero kasama pa rin sa laki at sa dina-download.
**Ang tanging paraan para talagang mawala:** huwag itong kopyahin, gamit ang **multi-stage build**.

## Ano ang ginawa (D-030)
1. **Multi-stage Dockerfile:**
   - stage `deps` (`node:24-alpine3.24`): `npm ci --omit=dev` lang;
   - runtime (`alpine:3.24`): ang `node` binary + `node_modules` + code.
   - Sinuri gamit ang `ldd`: **musl, libstdc++ at libgcc lang** ang kailangan ng `node`. Naka-embed dito ang OpenSSL at zlib, kaya hindi kailangan ang sa system.
   - Sa **parehong layer**, inalis ng `apk` ang **sarili nito** at ang mga library na siya lang ang gumagamit: libapk, ssl_client, libssl3, libcrypto3, **zlib**.
   - **Iniwan ang busybox** (shell): kailangan ng HEALTHCHECK at ng `docker exec … sh` sa pag-debug.
2. **Grype sa CI** (job `image`, **bago** ang push sa GHCR): pumapalya sa **High/Critical**. Naka-pin sa digest (parehong dahilan ng gitleaks, D-029).
3. **Dependabot:** iisang PR para sa dalawang `FROM`. **Dapat pareho ang Alpine version nila**, dahil ang `node` binary ay binuo para sa libstdc++ ng version na iyon.

## Resulta
| | Dati | Ngayon |
|---|---|---|
| Laki | 332MB | **283MB** |
| Grype | 1 High + 3 Medium | **2 Medium** (iisang CVE ng busybox) |
| Mga package ng Alpine | 18 | **11** |
| Grype gate (`--fail-on high`) | **exit 2 (papalya)** | exit 0 |

**Ang natitirang Medium (CVE-2025-60876):** tungkol sa **`wget`** ng busybox (tumatanggap ng CR/LF sa URL). **Hindi kailanman pinapatakbo ng app natin ang `wget`.**
Tinanggap nang tahasan (D-030), at makikita pa rin ito sa bawat scan.

## Paano napatunayan na GUMAGANA pa (hindi lang mas maliit)
Bagong base ito, kaya sinubukan ang bawat bagay na umaasa sa system:

| Sinubukan | Resulta |
|---|---|
| `node src/db/migrate.ts` (gaya ng `deploy.sh`) | ✅ "Migrations applied" |
| `/api/health/live` · `/ready` | ✅ 200 · ready |
| **argon2** (native module, binuo sa IBANG stage): register → login → maling password | ✅ 201 · 200 · 401 |
| HEALTHCHECK | ✅ healthy |
| Graceful shutdown (Day 85) | ✅ `docker stop` 1.3s, exit 0 |
| **HTTPS palabas** (wala na ang OpenSSL at CA ng system) | ✅ sumagot ang Resend (401 dahil pekeng key ang ginamit ko — patunay na gumana ang TLS) |
| **TLS papunta sa Neon** (`sslmode=verify-full`) — lokal, gamit ang production env, `/ready` lang | ✅ ready, 0 error |
| Nakikita pa ba ng scanner ang `node`? (kinopya nang manu-mano, wala sa apk) | ✅ syft: `node 24.21.0 (binary)`. Mahuhuli pa rin ang mga CVE ng Node mismo |
| `.http` 32 | ✅ 3/3 |

**Isang maling alarma sa pagsubok:** may isang ERROR sa log ng bagong image. Inimbestigahan: `Background task failed · Resend 401 · API key is invalid`.
Ang **pekeng Resend key** na ginamit ko sa lokal na pagsubok ang dahilan (sa email ng register), hindi ang image.

## 🐛 Isang lumang claim na nahuli
Sinasabi ng `backend/README.md` na "walang migrations sa image" sa `.dockerignore`. **Mali mula pa Day 37:** kinokopya ang `drizzle/`, at kailangan ito ng `deploy.sh`. Itinama.

## Iba't ibang pinagkukunan ng butas (`.http` 32)
Nang tanungin ang **OSV** tungkol sa zlib ng lumang image: **walang laman**. Pero nakakita ang Grype ng High doon.
Ang dahilan: **wala pang ayos ang Alpine**, kaya wala pa ito sa database ng Alpine. Nahanap ito ng Grype sa **NVD**.
Aral: iba-iba ang database, at ang scanner na tumitingin sa marami ay mas maaasahan.

## Production (deploy `00c85d2`)
| Sinuri | Resulta |
|---|---|
| CI: Grype sa image job (log) | ✅ tumakbo talaga — 2 Medium (busybox), pareho ng lokal · ~80s (dina-download ang database ng CVE) |
| `deploy.sh` | ✅ migrate · ready (Neon, TLS) · Live · step 7 |
| Ang pinalitang container | ✅ **exit 0**: ang unang deploy na may graceful shutdown na ang luma (Day 85) |
| Ang bagong container | ✅ healthy · 283MB · UID 1000 · walang `/sbin/apk` · 0 ERROR sa log |
| Puwang habang nagde-deploy | 2.5s (dati 3.8s) |
| Mga pampublikong URL (curl) | ✅ health 200 · http → 301 · `/me` 401 · frontend 200 · CORS preflight 204 |
| **argon2 sa production** nang hindi gumagawa ng account | ✅ login ng email na walang account → **401**. Dumadaan pa rin ito sa `argon2.verify` (dummy hash, Day 71), kaya gumagana ang native module |

**Dalawang maling alarma, parehong inimbestigahan:**
1. **403 "error code: 1010"** sa lahat ng request ng `prod/01-production.http` gamit ang review script ko.
   Galing ito sa **Cloudflare** (Browser Integrity Check), na humaharang sa user agent ng Python (`Python-urllib`). Hindi ito nakarating sa app.
   Sa `curl`, pareho ang lahat ng inaasahan. (Sa VS Code REST Client, hindi ito problema.)
2. **Mabagal ang login sa production (600–1075ms).** Pero kahit ang `/api/health` na walang database ay 0.35–1.4s, kaya ang **network** ang mabagal sa sandaling iyon.
   Para patas: pinatakbo nang lokal ang **luma at bagong image**, parehong PC at database, 8 login bawat isa → **~110ms pareho**. Walang epekto sa bilis ang bagong image.

## Kumpara sa reference
- **Pareho:** multi-stage, Grype sa CI (binary na sinuri ang checksum ang sa reference; dito, image na naka-pin sa digest), inalis ang npm/npx/corepack.
- **Iba:** ang runtime ay malinis na **Alpine na walang package manager** (ang sa reference ay ang node image pa rin, kaya may apk at yarn pa),
  inalis ang OpenSSL/zlib ng system, at sinuri na nakikita pa ng scanner ang `node` binary.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang CVE?**
  S: Isang numero para sa isang kilalang butas sa software (hal. CVE-2025-60876). May **severity** (Low hanggang Critical) ayon sa kung gaano kalala.
  Ang **EPSS** sa output ng Grype ay ang tantiyang posibilidad na gamitin ito sa totoong atake (hal. 0.3%).
- **T: Bakit mas ligtas ang mas kaunting laman ng image?**
  S: Ang bawat package ay puwedeng may butas, at ang bawat tool (shell, package manager) ay puwedeng gamitin ng attacker na nakapasok.
  Kapag walang `apk`, hindi siya makakapag-install ng bagong tool. Ang hindi nandoon ay hindi mapagsasamantalahan.
- **T: Bakit hindi na lang alisin pati ang shell (busybox)?**
  S: Puwede (distroless), pero masisira ang HEALTHCHECK at ang `docker exec … sh` na ginagamit ko sa pag-debug, at kailangang baguhin ang deploy.
  Ang natitirang butas ng busybox ay nasa `wget`, na hindi ginagamit ng app. Sa ngayon, mas malaki ang pakinabang ng shell kaysa sa panganib. Sadyang trade-off.
- **T: Paano kung may bagong High na walang ayos?**
  S: Pupula ang CI, at hindi mapu-push ang image. Tatlong pagpipilian: alisin ang package kung hindi kailangan (gaya ng zlib ngayon), maghintay ng ayos,
  o tanggapin nang tahasan (nakasulat kung bakit). Ang hindi dapat gawin: patayin ang gate.

## Susunod
- **Day 89 — Ligtas na CD:** i-deploy lang ang eksaktong commit na pumasa sa CI, at i-verify ang migrations bago mag-restart.

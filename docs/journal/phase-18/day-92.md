# Day 92 — 2026-09-30 · Phase 18 · Distributed rate limiting (Redis)

## Ang problema (sinukat noong Day 91b)
Sa 2 backend sa likod ng load balancer, **20** maling login ang nakakalusot bago ang 429, hindi 10. Nasa **memory ng bawat process** ang bilang.
Nare-reset din ito sa bawat restart o deploy.

## Ano ang ginawa (D-035)
- **`REDIS_URL` (opsyonal).** Kapag mayroon: nasa **Redis** ang bilang ng bawat limiter, may sariling prefix (`rl:login:<ip>`, `rl:register:<ip>`…).
  Kapag wala: memory, gaya ng dati (dev, tests, iisang kopya).
- **Fail-open:** kapag patay ang Redis, **pinapasok** ang request. Hindi bumabagsak ang login kasama ng Redis; nasa database pa rin ang account lockout (Day 63).
  - `passOnStoreError` sa limiter;
  - `enableOfflineQueue: false` sa Redis client: pumapalya **agad** ang command. Kapag wala ito, **5 segundong nakabitin** ang bawat request (nakita nang sadya kong sirain).
- **Nakikita kapag patay:** iisang ERROR sa log bawat pagkawala, gauge na **`auth_redis_up`** (1/0), at alert na **`RedisDown`** pagkalipas ng 5 minuto.
  Gauge ito, hindi bilang ng error: kapag walang traffic, walang error kahit patay ang Redis.
- **Redis sa dev** (`127.0.0.1:6380`), **sa CI** (service, para sa mga test), **sa lab**, at **sa production** (desisyon ko: walang port sa labas, walang persistence, 64M).
- Isinasara ang Redis sa graceful shutdown; sinasabi ng log pagka-start kung `memory` o `redis` ang store.

## 🐛 Dalawang bug sa kilos ng `rate-limit-redis` (parehong nahuli ng pagsubok, hindi ng pagbabasa)
1. **Kapag patay ang Redis pagka-start ng app, HINDI na kailanman bumabalik ang limit**, kahit bumalik na ang Redis.
   Nilo-load ng library ang Lua script nito sa simula, at nire-reload lang kapag `NOSCRIPT` ang error. Kapag pumalya ang unang load, ang naka-save na
   script ID ay isang pumalyang promise **magpakailanman**. Test: `401, 401, 401, 401` — walang 429. Sa totoo: pagka-reboot ng PC, kung mauna ang backend sa Redis,
   **tahimik na walang rate limit hanggang sa susunod na restart**.
2. **Sa BAWAT normal na startup, hindi nabibilang ang unang request.** Kumokonekta pa lang ang Redis kapag ginawa ang limiter, kaya pumapalya rin ang unang load.
   Nakita ko ito sa `MONITOR` ng Redis: walang header ang unang request; `r=9`, `r=8` ang sumunod.

**Ayos (`ResilientRedisStore`, isang maliit na subclass):** i-load ulit ang mga script sa bawat `ready` ng Redis (startup at pagbalik) at pagkatapos ng bawat pagpalya;
tahimik na `init()` (dati: 5 stack trace sa console sa bawat startup).

## 🐛 Mga nahuli ko sa sarili ko
- **Akala ko sira ang limit sa totoong server (11 maling login, walang 429).** Hindi: 10 lang ang nabilang dahil sa bug #2, at "10 ang pinapayagan".
  Kulang ng isa ang pagsubok ko. Pero ang paghahanap ng dahilan ang nagpakita ng bug #2.
- **Mali ang isang test ko:** tinawag ko ang `connect()` sa client na kusa nang kumokonekta. Ang test ang mali, hindi ang code.
- **Sariling Redis client ng test ang ginamit ko sa una**, hindi ang `createRedis()` ng app. Kaya walang test na papalya kapag binago ang config sa `lib/redis.ts`. Inayos.
- **Isang flaky na pagpalya na HINDI ko natukoy:** sa isang buong takbo, 1 test ang pumalya. Pinatakbo ko ulit para basahin ang detalye, at pumasa na, kaya
  **nawala ang log ng pagpalya**. 4 na buong takbo at 10 takbo ng limiter test pagkatapos: lahat pasado. **Aral: i-save ang output ng mismong takbong pumalya.**
  Mula noon, sa file na isinusulat ang bawat buong takbo.
- **Isang lumang ayos sa `index.ts` (Day 90):** isiningit ko ang retention sa pagitan ng comment ng metrics at ng code nito. Inayos.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 10 test ng limiter sa **totoong Redis**, gamit ang `createRedis()` ng app | ✅ 3 beses, 10/10 |
| Sadyang sira: karaniwang `RedisStore` · `passOnStoreError: false` · `enableOfflineQueue: true` · iisang prefix · walang store · walang `ready` hook | ✅ bumagsak ang tamang test sa bawat isa (ang offline queue: 5s na nakabitin) |
| Totoong dev server: 11 maling login · patay ang Redis · buhay ulit | ✅ 10×401 → 429 · 401 (fail-open, ~106ms) · 10×401 → 429 |
| `auth_redis_up` sa `/metrics` | ✅ 1 → 0 → 1 |
| promtool: `RedisDown` (5m, at 1m na blip) — sinira ang `for:` | ✅ SUCCESS · bumagsak nang alisin |
| **Lab (2 backend + Caddy), parehong pagsubok ng Day 91b** | ✅ **10** bago ang 429 (dati 20), salitan ang backend |
| Lab: patay ang Redis → buhay ulit | ✅ fail-open sa dalawang backend (isang `redis_down` bawat isa) → 10 ulit |
| Buong suite · tsc · lint | ✅ 221 · ✅ · ✅ |

## Ang hindi inayos ng Redis
- **Habang patay ang Redis, kahit ang IP na naka-block na ay pinapasok.** Iyan ang kapalit ng fail-open. Tinanggap, may alert.
- **Sa lab, ang IP na nakikita ng app ay ang sa Caddy pa rin**, kaya iisang bilang ang lahat ng user. Hindi ito problema ng store; kailangan ng pinagkakatiwalaang `X-Forwarded-For` (backlog).
- **Ingay sa console:** habang patay ang Redis, nagpi-print ang `express-rate-limit` ng stack trace bawat request (hindi JSON, hindi mapapatay).

## Production (deploy `83d3702`)
| Sinuri | Resulta |
|---|---|
| CI | ✅ **221 tests**, kasama ang mga Redis test (tumakbo talaga, sa Redis service ng CI) |
| `deploy.sh` | ✅ attestation · 💾 backup bago mag-migrate · migrations 13/13 · **nagawa ang `redis`** bago ang backend · Live |
| Redis container | ✅ walang port sa labas (`6379/tcp` sa loob lang ng Docker network) |
| Backend | ✅ `rateLimitStore: "redis"` · 0 ERROR |
| Prometheus (pagkatapos i-restart para mabasa ang bagong rule) | ✅ `RedisDown`: inactive · `auth_redis_up` = 1 |
| 2 maling login mula sa internet | ✅ `r=9`, tapos `r=8` — **nabilang ang UNANG request** (ang ayos sa bug #2) · sa Redis: `rl:login:<ip>` = 2, TTL 896s |
| Paglilinis | ✅ binura ang key (walang naiwang bilang sa IP ko) |

Hindi ko sinubukan ang buong 11 maling login sa production: mabo-block ang sarili kong IP nang 15 minuto, at napatunayan na iyon sa lab gamit ang parehong code.

**Na-restart ulit ang PC habang ginagawa ito** (ikatlong beses): kusang bumalik ang production; **tumakbo ang backup timer pagka-boot** (`Persistent=true`, Day 91);
hindi bumalik ang dev Postgres at dev Redis (walang restart policy ang dev); at nabura ulit ang scratchpad ng AI (mga review script).

## Kumpara sa reference
- **Pareho:** `ioredis` + `rate-limit-redis`.
- **Iba:** **totoong Redis sa tests** (ang reference ay lumalaktaw sa Redis kapag `NODE_ENV=test`, kaya 33% lang ang coverage ng `redis.ts` nito);
  ang ayos sa dalawang bug ng store; opsyonal ang `REDIS_URL`; gauge at alert; at napatunayan sa dalawang totoong instance (lab).

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang Redis?**
  S: Isang database na nasa memory: napakabilis, at simple ang laman (susi → halaga, na may expiry). Bagay ito sa mga bilang na panandalian, gaya ng
  "ilang maling login mula sa IP na ito sa huling 15 minuto". Lahat ng kopya ng app ay tumitingin sa iisang Redis, kaya iisa ang bilang.
- **T: Bakit fail-open? Hindi ba mas ligtas ang fail-closed?**
  S: Mas ligtas laban sa panghuhula, pero kapag namatay ang Redis, mamamatay ang login ng **lahat**. Ang rate limiter ay isa lang sa mga depensa:
  nasa database pa rin ang account lockout. Pinili ang "tuloy ang serbisyo, may alert" kaysa sa "patay ang login".
- **T: Bakit Lua script ang gamit ng library?**
  S: Para **atomic** ang "dagdagan ang bilang at itakda ang expiry": iisang hakbang sa loob ng Redis. Kung dalawang magkahiwalay na command,
  puwedeng magsingit ang ibang request sa pagitan (parehong aral ng Phase 14).
- **T: Bakit may Redis na sa production kung iisa lang ang backend?**
  S: Hindi na nare-reset ang bilang sa bawat deploy, at handa na kapag naging dalawa ang backend. Ang kapalit ay isa pang container na babantayan, kaya may alert.

## Susunod
- **Day 92b — Server cache gamit ang Redis:** i-cache ang `/api/users/count` na may TTL, at burahin ang cache kapag may bagong register.

# Day 92b — 2026-09-30 · Phase 18 · Server cache gamit ang Redis

## Ang tanong ng araw (idinagdag ko sa roadmap)
May Redis na mula Day 92 para sa rate limiter. Paano ito ginagamit bilang **cache**, at ano ang puwedeng magkamali?

## Ano ang cache-aside
1. Tanungin muna ang Redis.
2. Kapag wala (**MISS**): kunin sa database, tapos itabi sa Redis na may **TTL** (oras bago kusang mabura).
3. Kapag mayroon (**HIT**): isagot agad. Hindi na tinatanong ang database.
4. Kapag nagbago ang data: **burahin** ang naka-cache (cache invalidation).

## Ano ang ginawa (D-036)
- **`lib/cache.ts`** (bago): `getOrLoad(key, ttl, load)` at `invalidate(key)`. Walang bagong library; `ioredis` na ng Day 92.
- **`services/users.service.ts`**: ang `countUsers()` ay dumadaan na sa cache. Susi: `cache:users:count`, TTL **60s**.
- **`services/auth/registration.service.ts`**: pagkatapos ng `INSERT`, binubura ang naka-cache na bilang.
- **`controllers/users.controller.ts`**: header na **`X-Cache: HIT | MISS | BYPASS`**, para makita kung saan galing ang sagot.
- **`lib/metrics.ts`**: `auth_cache_lookups_total{result="hit|miss|error"}`.
- **Kapag walang `REDIS_URL`** (default sa dev, at sa tests ng app): walang cache, `BYPASS`.
- **Kapag patay ang Redis**: diretso sa database (fail-open, gaya ng rate limiter). Hindi pumapalya ang request o ang register.

## Bakit `/api/users/count` ang pinili
Pareho ang sagot para sa **lahat** ng user, madalas basahin, at nagbabago lang kapag may bagong register. Iyan ang tatlong tanda ng bagay na puwedeng i-cache.

## 🔐 Ang hindi puwedeng i-cache
Ang `/api/auth/me` at lahat ng personal na data. **Iisa ang susi ng cache para sa lahat.** Kapag inilagay doon ang profile, ang unang nagtanong ang makikita ng lahat ng susunod.
Kung kailangan balang araw: kasama ang user id sa susi (`cache:user:42:profile`), at buburahin kapag nagbago ang data o nag-logout.
**Sinuri:** nag-login, tinawag ang `/me` nang dalawang beses, tapos `redis-cli --scan --pattern 'cache:*'` → `cache:users:count` lang. Ang `/me` ay `Cache-Control: no-store` at walang `X-Cache`.

## Ang mga sinukat (dev server + totoong Redis)
| Pagsubok | Resulta |
|---|---|
| Unang `GET /api/users/count` | `X-Cache: MISS` · sa Redis: `"1"`, TTL 60 |
| Pangalawa | `X-Cache: HIT` |
| Register (201), tapos bilang | susi: wala na (`exists` = 0) → `MISS`, **tama agad ang bilang (+1)** → `HIT` |
| `INSERT` nang diretso sa database (walang pagbura) | ⚠️ 3 na sa database, **2 pa rin ang sagot** (`HIT`), 46s pa bago mag-expire |
| Redis na pinatay (`docker stop`) | `200`, `X-Cache: BYPASS`, ~3ms · **isang** ERROR sa log |
| Redis na ibinalik | `MISS`, tapos `HIT` · "Redis is back" sa log |
| HIT vs MISS, 300 request bawat isa | **HIT 1.44ms** · **MISS 3.12ms** (median) · p95: 2.0ms vs 4.1ms |
| Pinakaunang MISS pagka-start ng server | ~500ms (binubuksan pa ang koneksyon sa database) |

### Tapat na basa sa mga numero
Mga 2× na mas mabilis ang HIT, pero **1.7ms lang ang natipid**. Sa dev, nasa iisang PC ang database at kakaunti ang users, kaya mabilis na ang `count(*)`.
Hindi ito ang klase ng endpoint na "kailangan" ng cache. Ang halaga ngayong araw ay ang **pattern** at ang mga panganib nito. Sa production, mas malayo ang database (Neon, Singapore): susukatin pagkatapos ng deploy.

## Ano ang mangyayari kung walang invalidation
Nakita sa pagsubok: luma ang sagot hanggang maubos ang TTL. Kaya dalawa ang bantay:
- **Pagbura sa register:** tama agad sa karaniwang kaso.
- **TTL:** kapag may nakalimutang pagbura, o pumalya ito (patay ang Redis sa sandaling iyon), may hangganan ang pagiging luma: 60 segundo.

Kapag pagbura lang at walang TTL, ang isang nakalimutang `invalidate` ay luma **magpakailanman**. Kaya may test na sumusuri na may expiry ang bawat susi.

## Ang hindi inaayos nito
- **May natitirang race:** kapag nagsabay ang isang GET (MISS) at isang register, puwedeng maitabi ang **lumang** bilang pagkatapos ng pagbura. Hanggang 60s lang. Hindi ko ito sinubukang i-reproduce; nakasulat ito bilang alam na limitasyon (diagram 26).
- **Ang pagbabagong hindi dumadaan sa `registerUser`** (SQL, script) ay hindi nagbubura ng cache.
- **Walang panel sa Grafana** para sa hit rate. May metric na; ang panel ay puwedeng idagdag kapag may cache na talagang mahalaga.

## Paano napatunayan
- **11 bagong test** (`lib/cache.test.ts`, totoong Redis): MISS → HIT, may TTL, nag-e-expire, invalidation, dalawang kopya ng app na iisa ang cache, patay na Redis, walang Redis, hindi itinatabi ang error, register na nagbubura, email-taken na hindi nagbubura, `X-Cache` sa totoong endpoint.
- **Sadyang sinira ang code, 6 na beses** (pagkatapos i-commit), at nahuli lahat:

| Sinira | Nahuli ng |
|---|---|
| Inalis ang pagbura sa register | "a new registration invalidates the cached count" |
| Inalis ang `EX` (walang TTL) | "always stores WITH an expiry" + "loads again after the TTL" |
| Nagta-throw kapag patay ang Redis | "fails OPEN and fast" |
| `invalidate` na nagta-throw | "fails OPEN and fast" |
| Pagbura kahit `email_taken` | "a rejected registration leaves the cache alone" |
| Maling susi sa pagbura (walang `cache:`) | 3 test |

- Buong suite: **232 test, pumasa** · `tsc` · lint (kasama ang knip).
- `backend/http/37-cache.http`: lahat ng 7 request ay pinatakbo sa sariwang server; tugma ang status, header at body.

## Kumpara sa reference
May Redis ang reference para sa rate limiting, pero walang server cache ng data. Bago ito.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang pagkakaiba nito sa cache ng Day 36b?**
  S: Iyon ay sa **browser at CDN** (`Cache-Control`): ang kopya ay nasa labas ng server. Ito ay sa **server**: ang app mismo ang nagtatabi sa Redis para hindi na tanungin ang database.
  Magkaiba ang layunin, pero pareho ang patakaran: huwag i-cache ang personal na data.
- **T: Bakit 60 segundo?**
  S: Ito ang pinakamatagal na puwedeng maging luma ang bilang kapag may pumalya. Mas mahaba: mas maraming HIT, pero mas matagal na mali. Para sa bilang ng users, walang masasaktan sa 60 segundo.
- **T: Bakit hindi na lang i-update ang naka-cache (+1) sa halip na burahin?**
  S: Mas madaling magkamali. Kapag dalawang register ang nagsabay, puwedeng mali ang resulta. Ang pagbura ay laging ligtas: ang susunod na magtanong ang kukuha ng totoong bilang sa database.
- **T: Ano ang mangyayari kapag napuno ang Redis?**
  S: Sa production, 48MB ang limit at `volatile-ttl` ang patakaran: ang mga susing pinakamalapit nang mag-expire ang unang aalisin. Ang cache (60s) ang mauuna bago ang bilang ng rate limiter (15 minuto). Tama iyon: mas mahalaga ang rate limiter.
- **T: Bakit BYPASS ang sagot sa dev ko?**
  S: Walang `REDIS_URL` sa `backend/.env`. Idagdag ang `REDIS_URL=redis://127.0.0.1:6380` para makita ang MISS at HIT (`37-cache.http`).

## Susunod
- **Day 93 — Review day:** tugma pa ba ang lahat ng `.http` at diagram sa code, ang folder structure, at ang naiwang **Neon restore drill**.

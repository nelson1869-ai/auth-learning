# 26 — Server cache (cache-aside): bilang ng users sa Redis

> 📅 Day 92b · Phase 18 (Production maturity) · **Desisyon:** D-036
> **Code:** `backend/src/lib/cache.ts` · `services/users.service.ts` · `services/auth/registration.service.ts` · `controllers/users.controller.ts`
> **Subukan:** `backend/http/37-cache.http` · test: `backend/src/lib/cache.test.ts` (totoong Redis)

## Pagbasa: `GET /api/users/count`

```mermaid
flowchart TD
    Req(["GET /api/users/count"]) --> Svc["users.service.ts: countUsers()<br/>cache.getOrLoad('users:count', 60s, load)"]
    Svc --> Has{"May REDIS_URL?"}
    Has -->|"wala"| DbB["database: select count(*)"]
    DbB --> Bypass["200 · X-Cache: BYPASS"]
    Has -->|"mayroon"| Get["Redis: GET cache:users:count"]
    Get -->|"pumalya (patay ang Redis)<br/>agad, hindi nakabitin"| Err["metric: result=error<br/>fail-open (D-035, D-036)"]
    Err --> DbB
    Get -->|"may laman"| Hit["200 · X-Cache: HIT<br/>HINDI tinanong ang database"]
    Get -->|"wala (nil)"| Db["database: select count(*)"]
    Db --> Set["Redis: SET cache:users:count N EX 60<br/>SET at TTL sa iisang command"]
    Set --> Miss["200 · X-Cache: MISS"]
    Db -->|"pumalya ang database"| E500["500 — WALANG itinabi<br/>susubok ulit ang susunod na request"]
```

- **Cache-aside:** ang app ang nagpapasya. Redis muna; kapag wala, database, tapos itabi.
- **Laging may TTL (60s).** Ang susi na walang expiry ay mananatiling luma magpakailanman kapag may nakalimutang pagbura.
- **Sinukat (dev, 300 request bawat isa):** HIT 1.4ms · MISS 3.1ms (median). Ang pinakaunang MISS pagka-start ay ~500ms (binubuksan pa ang koneksyon sa database).

## Pagsulat: cache invalidation sa register

```mermaid
sequenceDiagram
    participant C as Client
    participant A as App
    participant D as Postgres
    participant R as Redis
    Note over R: cache:users:count = 2 (TTL 60s)
    C->>A: POST /api/auth/register
    A->>D: INSERT INTO users
    D-->>A: ok (3 na ang users)
    A->>R: DEL cache:users:count
    Note over A,R: kapag pumalya ang DEL: hindi pumapalya ang register.<br/>Luma ang bilang hanggang maubos ang TTL (60s).
    A-->>C: 201 Created
    C->>A: GET /api/users/count
    A->>R: GET cache:users:count
    R-->>A: nil
    A->>D: select count(*)
    D-->>A: 3
    A->>R: SET cache:users:count 3 EX 60
    A-->>C: 200 { count: 3 } · X-Cache: MISS
```

## Ang hindi inaayos ng pagbura (kaya may TTL)

```mermaid
sequenceDiagram
    participant G as Request A (GET count)
    participant P as Request B (register)
    participant D as Postgres
    participant R as Redis
    G->>R: GET → nil (MISS)
    G->>D: select count(*) → 2
    P->>D: INSERT (3 na)
    P->>R: DEL cache:users:count
    G->>R: SET cache:users:count 2 EX 60
    Note over R: LUMA (2) — dumating ang SET pagkatapos ng DEL.<br/>Kusang mawawala pagkalipas ng 60s.
```

Bihira ito (kailangang magsabay ang dalawang request sa loob ng ilang millisecond), at maliit ang pinsala: mali ng isa ang bilang nang hanggang 60 segundo.
Hindi ito sinubukang i-reproduce; **alam na limitasyon** ito ng cache-aside.

## 🔐 Ano ang puwede at HINDI puwedeng i-cache dito

| Data | Naka-cache? | Bakit |
|---|---|---|
| `GET /api/users/count` | ✅ `cache:users:count` | Pareho para sa lahat, bihirang magbago |
| `GET /api/auth/me`, sessions, audit logs | ❌ | Personal. Iisa ang susi para sa lahat → makikita ni B ang data ni A |
| Kung kailangan balang araw | susi na may user id: `cache:user:42:profile` | At burahin kapag nagbago ang data o nag-logout |

Tatlong magkakaibang cache sa project: **browser/CDN** (`Cache-Control`, Day 36b — `no-store` sa `/api/auth/*`), **server cache** (ito), at ang **bilang ng rate limiter** (`rl:*`, Day 92 — parehong Redis, ibang susi).

# 03 — Register flow (at password hashing)

> 📅 Day 12 · Phase 4 (Register at login) · in-update sa Day 13 (`POST /api/auth/register`)
>
> **Code:** `backend/src/routes/auth.js` · `backend/playground/01-hash.js` (practice)
> **Subukan:** `backend/http/04-register.http` · **Library:** `argon2` (Argon2id)

## `POST /api/auth/register` (Day 13)

```mermaid
flowchart TD
    Req(["POST /api/auth/register<br/>{ email, password, name? }"]) --> JSON["express.json()<br/>→ req.body"]
    JSON --> Hash["argon2.hash(password)<br/>~50ms · routes/auth.js"]
    Hash -->|"walang password"| E500a["❌ 500 — TypeError mula sa argon2<br/>⏳ Day 14: 400 (validation)"]
    Hash --> Insert["db.insert(users).values({ email, name, passwordHash })<br/>.returning({ id, email, name })<br/>INSERT agad — walang SELECT muna"]
    Insert --> DB{"Postgres: pumasa ba<br/>sa constraints?"}
    DB -->|"oo"| C201["✅ 201 Created<br/>{ user: { id, email, name } }<br/>walang password_hash"]
    DB -->|"doble ang email<br/>UNIQUE → err.cause.code = '23505'"| C409["409 Conflict<br/>{ error: 'Email already registered' }"]
    DB -->|"walang email<br/>NOT NULL"| E500b["❌ 500 — 🔐 lumalabas pa ang hash sa error<br/>⏳ Day 14: 400 (validation)"]
```

- **Bakit INSERT agad?** Kung `SELECT` muna ("may ganitong email ba?"), puwedeng
  sabay na pumasa ang dalawang request at parehong mag-INSERT. Ang `UNIQUE` ng
  database lang ang tunay na bantay. Sinubukan: 5 sabay → isang 201, apat na 409.
- **`err.cause?.code`, hindi `err.code`:** binabalot ni Drizzle (0.45) ang error ng
  Postgres sa `DrizzleQueryError`. Sa lumang tutorial, `err.code` — `undefined` na iyon.
- **⚠️ Mga butas pa:** walang email/password → 500; `Nelson@` at `nelson@` ay
  magkaibang account. Lahat ay aayusin ng validation sa Day 14.

## Ano ang naka-save: hash, hindi password (Day 12)

```mermaid
flowchart TD
    subgraph REG["📝 Register — isang beses"]
        P1["Password na tinype<br/>'password123'"] --> Salt["+ random na SALT<br/>(iba sa bawat hash)"]
        Salt --> H["argon2.hash()<br/>~50ms, 64 MB memory — sinadyang mabagal"]
        H --> Store[("users.password_hash<br/>$argon2id$v=19$m=65536,p=4,t=3$SALT$HASH")]
    end
    subgraph LOGIN["🔑 Login — bawat pag-login"]
        P2["Password na tinype"] --> V["argon2.verify(hash, tinype)<br/>binabasa ang SALT at settings MULA sa hash,<br/>hina-hash ulit ang tinype, ikinukumpara"]
        Store -.->|"kinukuha ang naka-save na hash"| V
        V -->|"tugma"| T["true → tuloy ang login"]
        V -->|"hindi tugma"| F["false → 401"]
    end
```

## Basahin ang hash

```
$argon2id $v=19 $m=65536,p=4,t=3 $vbi+qlULs0ApkwXFys08pQ $TVJFbEcsFLwWdkOEKdYH...
 algorithm version  settings       salt (random)          ang hash mismo
```
`m=65536` = 64 MB na memory · `p=4` = 4 na thread · `t=3` = 3 ikot. **Kasama sa
hash ang salt at settings** — kaya iisang column lang ang kailangan.

## Mga dapat pansinin

- **One-way:** walang paraan para ibalik ang hash sa password — kahit tayo.
  Kaya ang "forgot password" ay laging *reset*, hindi *ipadala ang luma*.
- **Magkaibang hash, parehong password** (dahil sa salt) — walang silbi ang
  pre-computed na listahan ng hash, at hindi makikita kung sino ang may parehong password.
- **Mabagal, sinadya** (~50ms sa PC na ito, Day 12): hindi ramdam ng user, pero
  1 bilyong hula × 50ms ≈ 1.6 taon sa isang CPU core — para sa isang user lang.

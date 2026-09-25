# 03 — Register flow (at password hashing)

> 📅 Day 12 · Phase 4 (Register at login) · in-update sa Day 13 (`POST /api/auth/register`) at Day 14 (validation)
>
> **Code:** `backend/src/routes/auth.js` · `backend/src/validations/auth.js` · `backend/playground/01-hash.js` (practice)
> **Subukan:** `backend/http/04-register.http` · **Library:** `argon2` (Argon2id)

## `POST /api/auth/register`

```mermaid
flowchart TD
    Req(["POST /api/auth/register<br/>{ email, password, name? }"]) --> JSON["express.json()<br/>→ req.body"]
    JSON --> Zod{"Zod: registerSchema.safeParse(req.body)<br/>validations/auth.js"}
    Zod -->|"mali ang input<br/>(walang field, hindi email,<br/>password &lt;8 o &gt;128)"| C400["400 Bad Request<br/>{ error: 'Invalid input',<br/>fields: { email: [...], password: [...] } }"]
    Zod -->|"tama → result.data<br/>email: trim + lowercase<br/>ibang field (hal. role): tinanggal"| Hash["argon2.hash(password)<br/>~50ms"]
    Hash --> Insert["db.insert(users).values({ email, name, passwordHash })<br/>.returning({ id, email, name })<br/>INSERT agad — walang SELECT muna"]
    Insert --> DB{"Postgres: UNIQUE email?"}
    DB -->|"oo"| C201["✅ 201 Created<br/>{ user: { id, email, name } }<br/>walang password_hash"]
    DB -->|"doble<br/>err.cause.code = '23505'"| C409["409 Conflict<br/>{ error: 'Email already registered' }"]
```

- **Zod muna, bago ang lahat.** Hindi na umaabot sa argon2 o sa database ang
  maling input — kaya wala nang 500, at hindi na lumalabas ang hash sa error (Day 13).
- **`result.data`, hindi `req.body`:** ang nalinis na data lang ang ginagamit.
  Nawawala ang mga dagdag na field (depensa laban sa mass assignment).
- **Lowercase ang email:** `Nelson@X.com` at `nelson@x.com` ay iisang account na → 409.
- **Bakit INSERT agad?** Ang `UNIQUE` ng database pa rin ang huling bantay kapag
  sabay ang mga request. Sinubukan (Day 14): 5 sabay → isang 201, apat na 409.
- **Bakit may `NOT NULL`/`UNIQUE` pa kung may Zod?** Ang Zod ay para sa magandang
  sagot (400); ang database ay para sa katotohanan — kahit may bug ang code, o
  may ibang code na sumulat sa database.

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

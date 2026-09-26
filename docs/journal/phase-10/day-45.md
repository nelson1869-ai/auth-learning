# Day 45 — 2026-09-27 · Phase 10 · Roles sa database

## Ano ang ginawa
- **`role` column** sa `users`: **enum** sa Postgres (`user_role`: `user` | `admin`), `NOT NULL DEFAULT 'user'`.
  - Migration `0002_add_user_role.sql`: ang lahat ng account na mayroon na, kasama ang user #1 sa production, ay naging `user`.
  - **Ang database mismo ang tumatanggi** sa ibang value. Sinubukan ko ang `'superadmin'` → `invalid input value for enum`.
- **`db/set-role.ts`** sa halip na seed na may password (D-023):
  - `npm run db:set-role -- ikaw@example.com admin` (dev);
  - sa production: `docker run ... node src/db/set-role.ts <email> admin` (tingnan ang `devops/README.md`).
  - Account na naka-register na lang ang ginagawang admin, at walang password sa code.
- **Mass assignment:** kahit may `"role": "admin"` sa register body, `user` pa rin ang nagagawa. May test ito.
- **Tests: 42** (5 bago).

## Kumpara sa reference
- Pareho: enum + default `user` + migration.
- **Iba — walang `superadmin`.** Dalawa lang ang kailangan natin ngayon. Kapag kailangan na ng pangatlo, bagong migration.
- **Iba — walang seed na `admin@example.com` / `adminpassword123`.** Public ang repo natin, kaya magiging admin
  na alam ng lahat ang password kapag napatakbo iyon sa production.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Dev + test DB | migration | ✅ 3 migrations · ang dating account ay `user` |
| Dev DB | `insert ... role = 'superadmin'` | ✅ tinanggihan ng Postgres |
| Tests | sinadyang ginawang `.values({ ...req.body, ... })` ang register | ✅ bumagsak ang mass-assignment test |
| Tests | tinanggal ang lowercase sa script | ✅ bumagsak ang test (`IKAW@` ≠ `ikaw@`) |
| Dev, CLI | admin · ulit · walang account · maling role · walang args · balik sa user | ✅ lahat tama (exit 0/1) |
| Production | deploy + migration | ✅ 3 migrations = journal · ang account ko: `user` |
| Production | `set-role` sa email na walang account | ✅ tumakbo sa image, walang binago |

## Ang pinakanatutunan
- **Enum:** ang database ang huling bantay, hindi lang ang code.
- **Ang role ay hindi kailanman galing sa request.** Galing ito sa database, at script lang ang nagbabago nito.
- **Seed na may password + public repo = butas.** Mas ligtas ang i-promote ang account na mayroon na.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 46 — `requireRole('admin')`: 401 (sino ka?) vs **403** (bawal sa iyo).

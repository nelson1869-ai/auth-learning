# Database

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng database engineer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 3.

Dito nakatago ang data, gaya ng email at ang na-hash na password ng bawat user. Siya rin ang nag-iingat na hindi mawala o madoble ang data.

---

## Ang role

Ang **database engineer** ang nagdidisenyo at nag-aalaga kung **paano itinatago
ang data**: anong mga table, anong mga column, paano sila magkaugnay, paano
mabilis mahanap ang data, at — pinakamahalaga — **paano hindi ito mawawala**.

## Mga responsibilidad
- Schema — ang disenyo ng mga table (hal. `users`: id, email, password_hash)
- Migrations — ligtas na pagbabago ng tables habang may data na
- Query performance — bakit mabagal ang isang query, at mga index
- **Backups at recovery** — kapag nasira ang server, maibabalik ba ang data?
- Data integrity — hal. walang dalawang user na may parehong email

## Tools
PostgreSQL · Docker · SQL · Drizzle ORM · Neon (Phase 8 — Singapore, Postgres 17) — tingnan ang [tech stack](../docs/02-tech-stack.md).

## Ano ang lalaman ng folder na ito (plano)
```
database/
├── sql-practice/       ← mga SQL na isinulat mo habang natututo
├── migrations/         ← mga pagbabago ng schema, sunod-sunod
└── backups/            ← mga script at dokumentasyon ng backup
```
> Tapat na paalala: sa totoong trabaho, madalas nasa loob ng `backend/` ang
> schema at migrations. Hiwalay natin sila rito para matutunan ang role.

## Ngayon: ano na ang totoong mayroon (in-update Day 48)
| | |
|---|---|
| **Tables** | `users` (may `role`: enum `user` \| `admin`, Day 45) · `audit_logs` (Day 48) · `refresh_tokens` (Day 51) — tingnan ang [ER diagram](../docs/diagrams/02-er-diagram.md) |
| **Schema at migrations** | `backend/src/db/schema.ts` → `backend/drizzle/0000`–`0006` (nasa backend, hindi dito — tingnan ang paalala sa itaas) |
| **Mga database** | dev `auth_learning` at test `auth_learning_test` (Docker, `localhost:5435`) · production: **Neon** (Singapore, `verify-full`) |
| **Backup** | Neon restore — sinubukan ang drill noong Day 35 (ilagay ang oras nang tahasan; 6 na oras sa Free plan) |
| **Mga script** | `npm run db:migrate` · `db:migrate:test` · `db:studio` · **`db:set-role -- <email> admin`** (Day 45, D-023) |
| **Mga patakaran sa database mismo** | `UNIQUE` email · `NOT NULL` · enum ng role · `audit_logs.actor_id ON DELETE SET NULL` (hindi nawawala ang kasaysayan) |
| **Nasa `sql-practice/`** | `01-crud.sql` (Day 08) · `02-constraints.sql` (Day 09) |

## ❌ Hindi dapat nasa loob ng database
- **Plain text na password** — hash lang ang itinatago
- **Pagbabago ng table nang manual sa production** — laging dumaan sa migration, para maulit at masubaybayan
- **Data na walang constraint** — hal. `email` na puwedeng doble; dapat `UNIQUE`
- **Database na walang backup** — "hindi pa nangyayari" ay hindi plano

## Unang gawain
**Phase 3** — Postgres sa Docker at ang unang table. Tingnan ang [roadmap](../docs/03-roadmap.md).

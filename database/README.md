# Database

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng database engineer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 3.

Dito nakatago ang data, gaya ng email at ang na-hash na password ng bawat user. Siya rin ang nag-iingat na hindi mawala o madoble ang data.

**Day 100** — *✍️ draft ng AI (Day 100), mula sa journal. Hindi ito ang sarili kong salita: isulat ko ulit dito, tapos burahin ang draft. Ang nasa itaas ay ang isinulat ko noong Day 01 — huwag burahin, para maikumpara.*

> Ang nag-iingat sa data at ang HULING BANTAY: UNIQUE, foreign keys, transactions, at atomic na mga query ang pumipigil sa mali kahit makalimot ang code. Hash lang ang naka-save (password, tokens), may retention para hindi itago ang hindi na kailangan, at may backup na nasubukang i-restore — sa tamang URL (hindi sa pooled).

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

## Ang laman ng folder na ito
```
database/
├── sql-practice/       ← mga SQL na isinulat mo habang natututo
└── backups/            ← Day 91: backup.sh · restore-drill.sh (lokal) · restore-drill-neon.sh · systemd/ (araw-araw na timer)
```
> Ang migrations ay nasa `backend/drizzle/` (tingnan ang paalala sa ibaba) — hindi na natuloy ang planong `database/migrations/`.
> Tapat na paalala: sa totoong trabaho, madalas nasa loob ng `backend/` ang
> schema at migrations. Hiwalay natin sila rito para matutunan ang role.

## Ngayon: ano na ang totoong mayroon (in-update Day 91)
| | |
|---|---|
| **Tables** | `users` (may `role`: enum `user` \| `admin`, Day 45) · `audit_logs` (Day 48) · `refresh_tokens` (Day 51) · `verification_tokens` (Day 59) · `trusted_devices` (Day 64) · `unknown_login_attempts` (Day 71) — tingnan ang [ER diagram](../docs/diagrams/02-er-diagram.md) |
| **Schema at migrations** | `backend/src/db/schema.ts` → `backend/drizzle/0000`–`0012` (nasa backend, hindi dito — tingnan ang paalala sa itaas) |
| **Mga database** | dev `auth_learning` at test `auth_learning_test` (Docker, `localhost:5435`) · production: **Neon** (Singapore, `verify-full`) |
| **Backup** | (1) Neon point-in-time restore — 6 na oras (Free plan), sinubukan Day 35 · (2) **sariling `pg_dump` sa PC** (Day 91): bago mag-migrate sa bawat deploy, araw-araw sa 03:00 (systemd timer), 14 ang itinatago — `~/backups/auth-learning` (600, hindi sa repo) |
| **Restore drill** | `database/backups/restore-drill.sh` — staging container, sinisira, nire-restore, inoorasan (lokal: 0.7s). Neon drill: `restore-drill-neon.sh` (tumatanggi kapag production ang target) — Day 93: restore 9.4–9.9s, ~20s hanggang tama ulit ang app. **Laging sa direktang endpoint, hindi sa `-pooler`** (D-033) |
| **Data retention** | oras-oras (Day 90, D-032) — tingnan ang `docs/diagrams/24-retention.md` |
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

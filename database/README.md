# Database

## ✍️ Sa sarili kong salita (ikaw ang susulat nito)

> Ano ang ginagawa ng database engineer? Isulat mo rito, 1–3 pangungusap.
> Babalikan natin ito pagkatapos ng Phase 3.



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
PostgreSQL · Docker · SQL · Drizzle ORM · Neon/Supabase (Phase 8) — tingnan ang [tech stack](../docs/02-tech-stack.md).

## Ano ang lalaman ng folder na ito (plano)
```
database/
├── sql-practice/       ← mga SQL na isinulat mo habang natututo
├── migrations/         ← mga pagbabago ng schema, sunod-sunod
└── backups/            ← mga script at dokumentasyon ng backup
```
> Tapat na paalala: sa totoong trabaho, madalas nasa loob ng `backend/` ang
> schema at migrations. Hiwalay natin sila rito para matutunan ang role.

## ❌ Hindi dapat nasa loob ng database
- **Plain text na password** — hash lang ang itinatago
- **Pagbabago ng table nang manual sa production** — laging dumaan sa migration, para maulit at masubaybayan
- **Data na walang constraint** — hal. `email` na puwedeng doble; dapat `UNIQUE`
- **Database na walang backup** — "hindi pa nangyayari" ay hindi plano

## Unang gawain
**Phase 3** — Postgres sa Docker at ang unang table. Tingnan ang [roadmap](../docs/03-roadmap.md).

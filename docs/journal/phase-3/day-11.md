# Day 11 — 2026-09-24 · Phase 3

## Ano ang ginawa ko
- `backend/drizzle.config.js` — kung nasaan ang schema, saan ilalagay ang migrations, at ang DATABASE_URL
- Mga script: `db:generate`, `db:migrate`, `db:studio`
- `npm run db:generate` → `drizzle/0000_living_doctor_spectrum.sql` + `drizzle/meta/`
- `DROP TABLE users` (ang ginawa ng kamay noong Day 09), tapos `npm run db:migrate` → ang table ay gawa na ng migration
- Binuksan ang Drizzle Studio (`npm run db:studio`)

## Ano ang natutunan ko (sa sarili kong salita)
- **Migration** = SQL file na naka-commit sa Git, isang pagbabago sa database bawat file, nakanumero at pinapatakbo nang sunod-sunod.
- **`generate`** = `schema.js` → SQL file (hindi pa ginagalaw ang database). **`migrate`** = pinapatakbo ang mga hindi pa napapatakbo.
- **`drizzle.__drizzle_migrations`** = listahan ng napatakbo na. Kaya ang pangalawang `migrate` ay walang ginagawa at walang error (**idempotent**).
- **`schema.js` na ang source of truth** — hindi na binabago ang table gamit ang kamay sa psql.
- Halos pareho ang SQL ni Drizzle sa isinulat ko noong Day 09; may pangalan lang ang UNIQUE (`users_email_unique`).
- **Kusang binabasa ng `drizzle-kit` ang `.env`** — hindi kailangan ng `--env-file` (kailangan pa rin sa `node`).

## Mga problema at paano ko nalutas
- Parang walang nangyari sa `npm run db:migrate` — walang "applied successfully". Binubura pala ng spinner ni drizzle-kit ang sariling linya sa ilang terminal. Ang database ang patunay: may `users`, may 1 row sa `__drizzle_migrations`.
- Sa pagitan ng `DROP TABLE` at `migrate`, **500 ang `/api/users/count`** (walang table). Normal habang nasa gitna ng pagbabago — at dahilan kung bakit sa production, migrate MUNA bago i-restart ang app.

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano kung may mali sa migration na napatakbo na?**
  S: Huwag baguhin ang lumang migration file. Gumawa ng BAGONG migration na nag-aayos. Ang mga napatakbo na ay nakatala sa `__drizzle_migrations`, kaya hindi na sila tatakbo ulit.
- **T: Bakit kailangang basahin ang SQL bago `migrate`?**
  S: Puwedeng magkamali ang tool, halimbawa DROP sa halip na RENAME, na nagbubura ng data. Sa Day 45, binasa ko ang `0002_add_user_role.sql` bago patakbuhin.
- **T: Ano ang pagkakasunod sa production?**
  S: Migrate MUNA, saka i-restart ang app. Ganito ang ginagawa ng `deploy.sh` (Day 37): kung mauuna ang bagong code, hahanapin nito ang column na wala pa.

## Susunod
- ✅ Checkpoint Phase 3 (`checkpoint-phase-3`)
- Phase 4, Day 12: Password hashing (argon2)

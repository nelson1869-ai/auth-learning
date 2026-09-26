# Day 08 — 2026-09-24 · Phase 3

## Ano ang ginawa ko
- Kumonekta sa Postgres gamit ang `psql -h localhost -p 5435 -U auth -d auth_learning`
- Gumawa ng `users` table (`id SERIAL PRIMARY KEY`, `email`, `name`) — walang constraints pa, sinadya
- Sinubukan ang CRUD: `INSERT`, `SELECT`, `UPDATE ... WHERE`, `DELETE ... WHERE`
- Dalawang eksperimento (tingnan sa ibaba)
- Mga command naka-save sa `database/sql-practice/01-crud.sql` (isinulat ng AI sa kahilingan ko, sinubukan sa hiwalay na test database)

## Ano ang natutunan ko (sa sarili kong salita)
- **Table** = spreadsheet · **column** = header · **row** = isang record
- **CRUD** = `INSERT` / `SELECT` / `UPDATE` / `DELETE`
- **Laging may `WHERE`** ang `UPDATE` at `DELETE` — kung wala, LAHAT ng row ang tatamaan
- **Eksperimento A:** pagkatapos burahin si id 1, ang bagong user ay **id 2**. Hindi nire-reuse ng `SERIAL` ang nabura — normal ang "butas".
- **Eksperimento B:** **pumayag** ang database sa dalawang `ana@example.com`. Walang patakaran pa ang table, kaya tinatanggap ang kahit ano (pati walang email).

## Mga command na natutunan ko
- `psql -h localhost -p 5435 -U auth -d auth_learning` — kumonekta
- `\dt` (tables) · `\d users` (hugis ng table) · `\q` (lumabas)
- Kailangan ng `;` sa dulo ng SQL — kung wala, naghihintay lang ang psql

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano kung makalimutan ko ang `WHERE` sa `DELETE`?**
  S: Mabubura ang LAHAT ng row. Kaya: `SELECT` muna gamit ang parehong `WHERE`, tingnan ang bilang, saka `DELETE`. (Ganito rin ang ginagawa natin sa test accounts: eksaktong email lang.)
- **T: Bakit hindi nire-reuse ang id na nabura?**
  S: Mas ligtas: kapag may lumang link o log na tumutukoy sa id 1, hindi ito mapupunta sa ibang tao. Normal ang mga "butas" sa bilang.
- **T: Bakit pumayag ang database sa dobleng email?**
  S: Walang patakaran (constraint) pa ang table noon. Ang database ay tumatanggap ng kahit ano hangga't walang `UNIQUE` / `NOT NULL`. Inayos sa Day 09.

## Susunod
- Day 09: Constraints — `UNIQUE`, `NOT NULL`, para ayusin ang doble at walang-laman na email

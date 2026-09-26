# Day 47 — 2026-09-27 · Phase 10 · Pagination

## Ano ang ginawa
- **`validations/pagination.ts`** — `page` (1–1,000,000, default 1) at `limit` (1–100, default 20). Galing sa URL,
  kaya text ang mga ito at ginagawang numero (`z.coerce`). Kapag mali, 400 na may `fields`.
- **`listUsers`** sa `routes/admin.ts`:
  - `ORDER BY id DESC`, laging iisang ayos;
  - `OFFSET (page-1)*limit` at `LIMIT limit`;
  - `total` at `totalPages`.
  - Ang page na lampas sa huli ay `users: []`, hindi error.
- **Tests: 64** (16 bago). Tumatakbo ang pagination test sa **`REPEATABLE READ` transaction na nire-rollback**:
  sabay-sabay ang mga test file sa iisang database, kaya kapag may nag-register sa pagitan ng page 1 at page 2,
  uusog ang mga page at magiging flaky ang test.

## Ang pagkakamali (ng AI), at paano nahuli
- Ang hinala: ang `?page=1e20` ay magiging 500 dahil lampas sa bigint ng Postgres ang OFFSET. Totoo iyon sa SQL mismo
  (`bigint out of range`), kaya nilagyan ng max ang `page`, at nasabing may ganitong bug ang reference.
- **Pero nang tanggalin ang max para patunayan ang test, PUMASA pa rin ito.** Ang dahilan: ang `.int()` ng Zod 4 ay
  "safe integer" lang (≤ 9,007,199,254,740,991), kaya tinatanggihan na ang `1e20`. Ang pinakamalaking posibleng OFFSET
  (~9×10¹⁷) ay kasya sa bigint (sinubukan sa Postgres: 0.08ms, walang error).
- **Itinama:** walang ganitong bug ang reference. Ang max ng `page` ay para lang sa bilis ng malalim na OFFSET.
  Ang test ay `1000001` na (bumabagsak kapag walang max). Ang `1e20` ay nakatala bilang "si Zod ang tumatanggi".
- **Aral:** kaya sinisira ang code bago magtiwala sa test. Kung hindi, may test sanang pumapasa sa maling dahilan.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | `offset(page * limit)` (off by one) | ✅ bumagsak (may nalaktawan) |
| Tests | walang `ORDER BY` | ✅ bumagsak |
| Tests | walang max ang `page` | ✅ bumagsak (pagkatapos itama ang test) |
| Test DB | naiwan ba ang mga user mula sa rollback? | ✅ 0 |
| Dev | page 1/2/3 na limit 1 · `limit=101` · `page=abc` · `page=1000001` | ✅ 99 → 67 → [] · 400 ×3 na may malinaw na mensahe |
| Dev | `14-pagination.http` (8 requests) | ✅ tugma |
| Production | test admin: page 1 at 2 na limit 2 · `limit=101` → binura | ✅ 2 + 1 user · 400 |

## Kumpara sa reference
- Pareho: `page`/`limit`, max 100 ang limit, `Promise.all` para sa listahan at bilang.
- **Iba:** may max ang `page` sa atin (para sa bilis). Pinakabago muna sa atin (`desc`), samantalang pinakaluma muna sa reference (`asc`).

## Ang pinakanatutunan
- **Laging may limit ang listahan.** Kung wala, kayang pabagalin ng isang request ang buong server.
- **Laging may `ORDER BY` na natatangi.** Kung wala, puwedeng magpalit ang ayos sa pagitan ng mga page.
- **Kahinaan ng offset pagination:** kapag may bagong row habang nagpapalipat-lipat ng page, uusog ang laman.
  Ang ayos sa hinaharap ay "cursor" (keyset) pagination: `WHERE id < huling_id`.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit 200 na walang laman ang page na lampas sa huli, at hindi 404?**
  S: Tama ang tanong ("page 999"), wala lang laman. Karaniwan ito sa mga API, at mas madali para sa frontend:
  "walang laman" = tapos na ang listahan.
- **T: Bakit hindi ibigay ang lahat at hayaang ang frontend ang maghati?**
  S: Kapag 100,000 ang user, dadalhin ang lahat sa network at sa browser bawat pagbukas. Mabagal para sa lahat,
  at kayang abusuhin. Ang database ang pinakamabilis maghati.
- **T: Ano ang `REPEATABLE READ`?**
  S: Isang isolation level ng transaction: sa unang basa, "kinukunan ng litrato" ang database, at iyon lang ang nakikita hanggang
  matapos ang transaction (maliban sa sarili nitong mga pagbabago). Kaya hindi nakakaapekto ang ibang test na sabay na tumatakbo.

## Susunod
- Day 48 — audit log: sino, ano, kailan, saan (login, logout, admin actions).

# Day 46 — 2026-09-27 · Phase 10 · Authorization: 401 vs 403

## Ano ang ginawa
- **`middleware/requireRole.ts`** — pagkatapos ng `requireAuth`. Ang role ay binabasa sa **database** sa bawat admin request:
  - walang account (nabura) → **401**;
  - hindi admin → **403** `{ "error": "Forbidden" }` + log na `event: "forbidden"` (may `userId` at `requestId`).
- **`routes/admin.ts`** — `router.use('/admin', requireAuth, requireRole('admin'))`: isang bantay para sa LAHAT ng `/api/admin/*`.
  - `GET /api/admin/users` → hanggang 20 user, pinakabago muna (id, email, name, role, createdAt). Walang `password_hash`.
- **Tests: 48** (6 bago).
- **Dev admin:** `nelson_dev@1869.com` (ginawa sa hiling ko, bago ang Day 46).

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | inalis ang `requireRole` | ✅ 3 test ang bumagsak |
| Tests | ginaya ang "luma" na role (naka-cache, parang nasa JWT) | ✅ bumagsak ang "role change immediately" |
| Dev | walang login · admin ko (`nelson_dev`) · normal na user | ✅ 401 · 200 · 403 + log |
| Dev | `13-admin-rbac.http` bilang user, tapos pagkatapos ng `set-role admin` | ✅ 403 → 200 |
| Production | test account: user → `set-role admin` → parehong cookie → binura | ✅ 401 · 403 · **200** · walang password · nasa log ang 403 |

## Kumpara sa reference
- Pareho: `requireRole` pagkatapos ng `requireAuth`, 401 vs 403, isang router para sa admin.
- **Iba — role mula sa database, hindi sa JWT.** Sa reference, nakabaon ang role sa token, kaya kailangang mag-login ulit para tumalab
  ang bagong role (nakasulat ito bilang gotcha sa AGENTS.md nila). Kalaunan, nagdagdag sila ng `tokenVersion` para ayusin ito.
- **Iba — hindi sinasabi ng 403 kung anong role ang kailangan.**

## Ang pinakanatutunan
- **Authentication = sino ka (401). Authorization = ano ang pinapayagan sa iyo (403).** Laging authentication muna.
- **Ang data sa token ay "snapshot".** Tama ito noong ginawa ang token, pero puwedeng luma na ngayon. Para sa mahalagang desisyon (admin), tingnan ang database.
- **Isang bantay para sa buong grupo ng routes** — mas ligtas kaysa lagyan ang bawat route, dahil hindi ito makakalimutan.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Hindi ba mabagal kung tumitingin sa database sa bawat admin request?**
  S: Isang maliit na query ito (isang row, by primary key), mga 1ms. Sa admin routes lang, at kakaunti ang admin. Sulit ito kapalit ng agarang pagtanggal ng access.
- **T: Bakit 401 at hindi 404 ang `/api/admin/wala-ganito` kapag walang login?**
  S: Nauuna ang bantay bago pa hanapin ang route. Hindi malalaman ng estranghero kung anong admin routes ang mayroon. Kapag naka-login na at admin, saka lang lalabas ang 404.
- **T: Kung itatago ko ang admin menu sa frontend, sapat na ba?**
  S: Hindi. UX lang iyon; kayang tawagin ang API nang direkta gamit ang curl. Ang `requireRole` sa backend ang tunay na bantay. Ito ang aral ng Day 49.

## Susunod
- Day 47 — pagination: `?page=&limit=` na may maximum, at 400 kapag sobra.

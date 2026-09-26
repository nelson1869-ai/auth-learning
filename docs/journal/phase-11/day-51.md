# Day 51 — 2026-09-27 · Phase 11 · Refresh tokens

## Ano ang ginawa
- **Dalawang token na ngayon:**
  - **access token** (cookie `token`): JWT, **15 minuto** (dati 1 oras), hindi naka-save;
  - **refresh token** (cookie `refresh_token`): 32 random bytes, **7 araw**, `Path=/api/auth`.
    **SHA-256 hash lang** ang nasa bagong table na `refresh_tokens` (migration `0004`).
- **`POST /api/auth/refresh`** → 204 + bagong access token, o 401 at binubura ang dalawang cookie.
- **Logout:** binubura na ang dalawang cookie. (Ang pag-revoke sa database ay Day 53.)
- **`lib/session.ts`:** walang `req`/`res`, ayon sa review finding ng Day 50.
- **Frontend `apiFetch`:** kapag 401, **isang** refresh (single-flight), tapos uulitin ang request.
- **Tests: 83** (8 bago).

## Bakit single-flight (ang panganib na nabasa ko sa reference)
Sabay na humihingi ng dalawang listahan ang Admin page. Kapag expired ang access token, sabay silang mag-401.
Kung pareho silang magre-refresh gamit ang iisang refresh token, sa Day 52 (reuse detection) ay ituturing na
**nakaw** ang pangalawa, at mala-logout ako nang walang dahilan. Nakasulat ito sa AGENTS.md ng reference:
*"no refresh grace window (matters once a frontend exists)"*. Mayroon na tayong frontend, kaya inayos na ngayon.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | raw token sa DB · walang pagsuri sa `revoked_at` · `clearCookie` na walang `path` | ✅ bumagsak ang bawat isa |
| Dev, browser | binura ang `token` cookie → Admin page | ✅ 4 na 401 → **1** refresh → 200 lahat |
| Dev | `16-refresh-tokens.http` · `05` · `07` (bagong server bawat isa) | ✅ tugma |
| Production, browser | pansamantalang admin: login → binura ang `token` → Admin → logout | ✅ `Secure`+`HttpOnly`, refresh path `/api/auth` · 2×401 → 1 refresh → 200 · 0 CSP violation |
| Production DB | 5 migrations · binura ang test user | ✅ walang naulilang refresh token (CASCADE) |

## Kumpara sa reference
- Pareho: 15 min + 7 araw, SHA-256 hash, `family_id`, `Path=/api/auth`, CASCADE.
- **Iba:** single-flight refresh sa frontend (walang frontend ang reference, kaya hindi nila ito kinailangan).
- **Iba:** ang `refresh` natin ay hindi pa nagro-rotate. Day 52 iyon, para makita ko kung bakit kailangan.

## Ang pinakanatutunan
- **Bakit dalawang token:** ang madalas gamitin (access) ay maikli at hindi kailangan ng database; ang mahaba (refresh)
  ay nasa database, kaya kayang bawiin.
- **SHA-256 sa token, argon2 sa password:** hindi hinuhulaan ang random na 256-bit na token, kaya hindi kailangang mabagal.
- **Kailangan ng `path` sa `clearCookie`:** kung iba ang path, hindi mabubura ang cookie (nahuli ng test).

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nanakaw ang refresh token, ano ang magagawa ng attacker?**
  S: Makakakuha siya ng bagong access token hanggang 7 araw. Kaya: `HttpOnly` (hindi mababasa ng JavaScript),
  `Path=/api/auth` (bihirang maipadala), at sa Day 52, rotation + reuse detection (mahuhuli kapag ginamit ng dalawang tao).
- **T: Bakit hindi na lang gawing 7 araw ang access token?**
  S: Walang paraan para bawiin ang JWT bago mag-expire, dahil hindi ito naka-save. Kapag nanakaw, 7 araw itong magagamit.
  Kapag 15 minuto, maikli ang pinsala, at ang refresh token (na kayang bawiin) ang nagpapanatili ng session.
- **T: Bakit may dalawang `/api/auth/me` sa dev pero isang refresh lang?**
  S: StrictMode ang nagpapatakbo ng effect nang dalawang beses. Parehong nag-401, pero iisang refresh ang pinaghintayan
  ng dalawa (single-flight).

## Susunod
- Day 52 — rotation at reuse detection: bagong refresh token bawat gamit; ang paggamit ulit ng luma = nakaw → bawiin ang buong family.

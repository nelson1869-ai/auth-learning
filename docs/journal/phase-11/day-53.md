# Day 53 — 2026-09-27 · Phase 11 · Totoong logout

## Ano ang ginawa
- **Logout = bawiin ang session sa DATABASE**, hindi lang burahin ang cookie. `revokeFamilyOf(raw)`: isang atomic na `UPDATE`
  na may subquery. Binabawi ang lahat ng aktibong token sa **family** ng token (ang login na ito, sa device na ito),
  na may `revoke_reason = 'logout'`.
- **Hindi ginagalaw ang ibang device ko.**
- **Hindi itinuturing na nakaw** ang paggamit ng token na binawi dahil sa logout: 401 lang, walang `refresh_reuse`.
- **Audit:** ang "sino" ay mula sa access token, o mula sa refresh token kung expired na ang access token.
- **Tests: 94** (6 bago).

## Stateful vs stateless na logout (ang aral ng araw)
| | Access token (JWT) | Refresh token |
|---|---|---|
| Naka-save sa server? | ❌ hindi (stateless) | ✅ oo (stateful) |
| Mababawi sa logout? | ❌ hindi — valid hanggang mag-expire | ✅ oo — Day 53 |
| Kaya… | **maikli: 15 minuto** | mahaba: 7 araw, pero kayang bawiin |

Kaya dalawang token: mabilis ang access token dahil walang database, at ang refresh token ang nagbibigay ng kontrol.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang revoke sa logout · binabawi ang LAHAT ng session · ang logout token ay itinuturing na nakaw | ✅ bumagsak ang bawat isa |
| Dev, curl | kinopyang refresh token → logout → gamitin ang kopya | ✅ **401** (dati 204) · `logout` sa DB · audit na may "sino" |
| Production, curl | dalawang login (phone, laptop) → logout sa phone | ✅ phone: 401 · **laptop: 204** · audit `logout`, walang `refresh_reuse` |

## Kumpara sa reference
- Pareho: binabawi ang refresh token sa database sa logout.
- **Iba:** ang reference ay binabawi ang **isang token** (`revokeRefreshToken`). Tayo: ang **buong family**, pati ang
  lumang "rotated" na nasa reuse interval pa. Sa reference, walang reuse interval kaya hindi nila ito kailangan.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung may nakakopya ng access token ko, ano ang magagawa ko pagkatapos mag-logout?**
  S: Wala: hindi ito mababawi, pero 15 minuto lang ang natitirang buhay nito. Kung kailangang agarang bawiin (hal. bangko),
  may "denylist" na sinusuri sa bawat request, pero kapalit nito ang database sa bawat request, na siyang iniiwasan ng JWT.
- **T: Bakit ang buong family at hindi lang ang token sa cookie?**
  S: Dahil sa reuse interval (Day 52): ang lumang "rotated" na token ay may 10 segundong palugit pa. Kung ang cookie token lang ang bawiin,
  puwede pang makakuha ng access token ang lumang kopya sa loob ng 10 segundo. Sa buong family, sarado lahat.
- **T: Paano kung gusto kong i-logout ang LAHAT ng device ko?**
  S: Iyan ang Day 54 (listahan ng devices, logout bawat isa) at Day 55 (sa pagpalit ng password, binabawi ang lahat).

## Susunod
- Day 54 — "Mga device ko": listahan ng naka-login na sessions, at logout bawat isa (may IDOR protection).

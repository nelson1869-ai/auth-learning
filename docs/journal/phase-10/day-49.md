# Day 49 — 2026-09-27 · Phase 10 · Admin page (frontend)

## Ano ang ginawa
- **Backend:** ang `/api/auth/me` ay may `role` na (galing sa database, gaya ng `requireRole`). May test ito.
- **Frontend:**
  - `api/admin.ts`: `getAdminUsers(page)` at `getAuditLogs(page)`, 10 bawat page. Ang `ApiError` ay may `status` na (401 vs 403).
  - **`pages/AdminPage.tsx`**: table ng users at table ng audit log, bawat isa may **Prev / Next**.
    - 401 → `/login`;
    - 403 → "⛔ 403 — admin lang ang puwede rito";
    - **walang sariling "admin check"**: ang backend ang nagpapasya.
  - **`ProfilePage`**: ang link na "🛠️ Admin page" ay lumalabas lang kapag `role === 'admin'`.
  - `.table-wrap`: sa phone, ang table ang nag-i-scroll pagilid, hindi ang buong page.
- **Oxlint:** nagbabala ito na kulang ang dependency ng `useEffect`. **Inayos ang ugat** (pure na `whatToDo(err)`), hindi pinatahimik.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | `/me` role bago/pagkatapos ng `set-role`, walang `password_hash` | ✅ (75 lahat) |
| Dev, browser (390px) | admin (`nelson_dev`) | ✅ may link · 2 table · Next → "Page 2 of 6" · 0 JS error |
| Dev, browser | normal na user · tinype ang `/admin` | ✅ walang link · ⛔ 403 |
| Dev, browser | walang login → `/admin` | ✅ → `/login` |
| Production, browser | pansamantalang admin at user (binura pagkatapos) | ✅ admin: 2 table, **0 CSP violation**, 0 JS error · user: walang link, ⛔ 403 |

## Ang pinakanatutunan
- **Ang pagtago sa frontend ay UX, hindi security.** Kayang i-type ng kahit sino ang `/admin`, o baguhin ang JavaScript sa DevTools.
  Ang proteksyon ay nasa backend (`requireRole`), kaya walang data na nakukuha ang hindi admin.
- **Hayaan ang backend ang magpasya.** Walang sariling kopya ng patakaran ang page (walang "if admin"), kaya hindi ito
  magkakaiba sa backend.
- **Race condition sa frontend:** kapag mabilis ang pindot ng Next, puwedeng mauna ang bagong sagot at mahuli ang luma.
  Kaya may `ignore` sa `useEffect`.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung may role na sa `/me`, bakit hindi na lang doon tingnan ng AdminPage kung admin ako?**
  S: Kaya naman, pero magiging dalawang lugar ang patakaran (frontend at backend), na puwedeng magkaiba. Sa ngayon, ang sagot ng
  `/api/admin/*` mismo (200/403) ang ginagamit. Ang role sa `/me` ay para lang sa pagpapakita ng link.
- **T: Bakit dalawang beses tinatawag ang API pagbukas ng Admin page sa dev?**
  S: StrictMode ng React sa development: pinapatakbo nito nang dalawang beses ang `useEffect` para mahuli ang mga bug.
  Kaya puwedeng dalawang `admin_list_*` na row sa audit log sa dev. Sa production build, isang beses lang.
- **T: Paano kung may libo-libong audit row?**
  S: 10 lang bawat page (pagination, Day 47), kaya mabilis pa rin. Sa hinaharap: filter (hal. action o email), cursor pagination,
  at retention para hindi lumaki nang walang hangganan.

## Susunod
- Day 50 — Review day: balikan ang Phase 9–10, suriin kung tugma pa ang lahat ng `.http` at diagram sa code, at ang checkpoint question.

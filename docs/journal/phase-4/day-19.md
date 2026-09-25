# Day 19 — 2026-09-25 · Phase 4 · Review day

## Ano ang ginawa (QA pass ng AI)
- **Pinatakbo ang BAWAT request sa lahat ng 7 `.http` file** laban sa kasalukuyang code (may script na sumusunod sa cookie jar at `{{...}}` variables ng REST Client).
- **Nahuling bug sa docs:** sa `05-login.http`, nawala ang mismong request ng #1 (tamang login) noong in-update ang mga comment sa Day 16 — walang "Send Request" ang #1. Naibalik.
- **Architecture:** in-update ang Phase 4 tree sa `06-architecture.md` para tugma sa totoong folders (kasama ang `drizzle/`, `http/`, `playground/`, `users.js`, `echo.js`).
- **Diagrams:** ang "Ngayon" sa `00-architecture.md` ay nasa Day 10 pa (walang auth) → in-update sa Day 19; idinagdag ang auth routes sa `01-request-lifecycle.md`.

## Resulta ng pagsusuri
| `.http` | Tugma sa code? |
|---|---|
| 01-health · 02-echo · 03-users-count | ✅ |
| 04-register (10 request) | ✅ |
| 05-login | ✅ pagkatapos ibalik ang #1 |
| 06-me · 07-logout | ✅ (ang "PASTE-DITO" ay manual) |

## Ano ang natutunan (review)
- **Ang docs ay puwedeng masira nang tahimik** — walang error, pero nawawala ang request. Kaya may review day: patakbuhin ang LAHAT, hindi lang basahin.
- Ang buong Phase 4: hash (argon2) → register (201/409) → validation (400, lowercase) → login (401, pareho ang oras) → JWT sa httpOnly cookie → requireAuth → me → logout.

## Mga tanong ko pa / hindi pa malinaw
- (Nelson: isulat dito — at sagutin ang mga tanong ng checkpoint sa ibaba.)

## Checkpoint Phase 4 — answer key (isinulat ng AI sa kahilingan ko)

> ⚠️ Hindi ito ang sarili kong sagot — ito ang "tamang sagot" na isinulat ng AI.
> Basahin, at kung may hindi malinaw, isulat sa "Mga tanong ko pa" sa itaas.

1. **Bakit hash at hindi encryption?** Ang encryption ay maibabalik kung may key —
   kapag ninakaw ang database AT ang key, makikita ang lahat ng password. Ang hash
   ay one-way: kahit tayo, hindi na maibabalik. Sa login, hina-hash ulit ang tinype
   at ikinukumpara (`argon2.verify`). (Day 12)
2. **Bakit iisang mensahe at parehong oras ang 401?** Para hindi malaman ng attacker
   kung may account ang isang email (user enumeration). Pareho ang mensahe, at dahil
   sa `DUMMY_HASH`, pareho rin ang tagal (sinukat: 52.3ms vs 52.3ms). Kung wala ito,
   ~1ms ang sagot kapag walang account — kita agad. (Day 15)
3. **Bakit httpOnly cookie at hindi localStorage?** Ang localStorage ay nababasa ng
   JavaScript — kapag may XSS (injected na script), mananakaw ang token. Ang
   httpOnly cookie ay hindi nababasa ng JavaScript, at kusang ipinapadala ng
   browser. (Day 16)
4. **Ano ang `requireAuth` at `next()`?** Middleware na dinadaanan bago ang route:
   binabasa ang cookie, `jwt.verify` (pirma + expiry, HS256 lang), at inilalagay ang
   `req.userId`. `next()` = pasado, tuloy sa route; kung walang `next()`, 401 na
   ang sagot at hindi na aabot sa route. (Day 17)
5. **Ano ang HINDI kaya ng logout?** Sa browser lang nabubura ang cookie. Ang token
   na nakopya bago mag-logout ay valid pa hanggang mag-expire (1 oras) — sinubukan:
   200. Hindi ito alam ng server dahil stateless ang JWT. Aayusin sa Phase 11
   (Day 51–52): refresh tokens sa database na nare-revoke. (Day 18, D-012)

## Susunod
- ✅ Tag `checkpoint-phase-4` → Phase 5: Login page (Frontend, React + Vite)

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

## Checkpoint Phase 4 — sagutin sa sariling salita
1. Bakit hash at hindi encryption ang password?
2. Bakit iisang mensahe at parehong oras ang 401 ng maling password at walang account?
3. Bakit nasa httpOnly cookie ang JWT at hindi sa localStorage?
4. Ano ang ginagawa ng `requireAuth` at ng `next()`?
5. Ano ang HINDI kaya ng logout natin ngayon, at kailan ito aayusin?

## Susunod
- ✅ Tag `checkpoint-phase-4` → Phase 5: Login page (Frontend, React + Vite)

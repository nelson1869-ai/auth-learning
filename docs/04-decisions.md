# 04 — Decisions Log

> Sa totoong team, isinusulat ang bawat mahalagang desisyon: **ano** ang pinili,
> **anong mga opsyon** ang tinimbang, at **bakit**. Makalipas ang ilang buwan,
> ito ang sagot sa tanong na "bakit ganito natin ito ginawa?"
> (Sa industriya, tinatawag itong **ADR — Architecture Decision Record**.)
>
> **Consequences** = ang kapalit ng desisyon. Walang desisyong libre: bawat
> pinili ay may nakukuha AT may isinusuko. Kapag isinulat mo ito, hindi ka
> magugulat mamaya.

## D-001 · Hiwalay na repo mula sa reference project
- **Petsa:** 2026-09-24
- **Mga opsyon:** bagong hiwalay na repo · bagong folder sa loob ng reference project
- **Pinili:** bagong hiwalay na repo
- **Bakit:** malinis ang simula at sariling Git history, at hindi magagalaw ang reference.
- **Consequences:** kailangang magpalipat-lipat ng folder/window para tumingin sa
  reference. Kapalit nito, hindi kailanman masisira ng eksperimento mo ang reference.

## D-002 · JavaScript muna, TypeScript mamaya
- **Petsa:** 2026-09-24
- **Mga opsyon:** JavaScript muna · TypeScript agad
- **Pinili:** JavaScript muna; TypeScript sa Phase 7
- **Bakit:** isang bagay lang ang pag-aaralan sa simula (kung paano gumagana ang
  backend). Sa Phase 7, makikita mismo kung anong mga pagkakamali ang nahuhuli
  ng TypeScript.
- **Consequences:** sa Phase 2–6, hindi mahuhuli ng editor ang ilang pagkakamali
  (hal. maling pangalan ng field) — lalabas lang ito kapag pinatakbo ang code.
  Kailangan ng isang "migration" phase (Phase 7). Iba ang itsura ng code natin
  kaysa sa reference (TypeScript) hanggang doon.

## D-003 · React + Vite para sa frontend
- **Petsa:** 2026-09-24
- **Mga opsyon:** React + Vite · plain HTML/JS · Next.js
- **Pinili:** React + Vite
- **Bakit:** pinakaginagamit sa trabaho, at malinaw ang hiwalay na frontend at
  backend (sa Next.js, puwedeng maghalo ang dalawa at malito kung alin ang alin).
- **Consequences:** dalawang hiwalay na server habang nagde-develop (frontend at
  backend), kaya kailangang ayusin ang **CORS** (Phase 5) — isang bagong konsepto
  na itinatago ng Next.js. Mabuti ito para matuto, pero dagdag na hakbang.

## D-004 · Folder ayon sa role
- **Petsa:** 2026-09-24
- **Pinili:** `frontend/`, `backend/`, `database/`, `devops/`
- **Bakit:** para matutunan ang trabaho ng bawat posisyon.
- **Tapat na paalala:** sa totoong trabaho, hindi laging hiwalay ang mga ito
  (hal. madalas nasa loob ng backend ang database schema). Para sa pag-aaral
  ang hatiang ito.
- **Consequences:** kailangang ituro ng backend kung nasaan ang mga migration sa
  `database/` — dagdag na configuration na wala sa karaniwang project.

## D-005 · Paraan ng pag-aaral
- **Petsa:** 2026-09-24
- **Pinili:** ipinapaliwanag ng guide (Claude) ang konsepto at nagpapakita ng
  maliit na code; **ikaw ang nagta-type**; saka nire-review.
- **Bakit:** ang code na tinype at inintindi mo mismo ang tunay na natututunan.
- **Consequences:** mas mabagal kaysa kung ang guide ang gagawa ng lahat. Mas
  kaunting features bawat linggo — pero bawat isa ay talagang naiintindihan mo.

## D-006 · Pinagsama ang ilang bahagi ng "team workflow" prompt (mula sa ChatGPT)
- **Petsa:** 2026-09-24
- **Context:** may detalyadong prompt na nagmumungkahi ng 8 roles, `apps/` +
  `packages/` na structure, 9-section na sagot sa bawat hakbang, at 16-item
  security checklist sa bawat feature.
- **Mga opsyon:** gamitin ito nang buo · huwag gamitin · kunin lang ang
  mga bahaging bagay sa beginner
- **Pinili:** kunin lang ang bahaging bagay:
  1. Security Engineer, QA Engineer at Architect bilang "sombrero" (walang folder)
  2. "Consequences" sa bawat desisyon (itong seksyon mismo)
  3. "Hindi dapat nasa loob" sa bawat role folder
  4. Maikling format ng bawat lesson (tingnan ang [how we work](05-how-we-work.md))
- **Bakit hindi buo:** ang `apps/` + `packages/` ay pang-monorepo (maraming app,
  malaking team) — over-engineering para sa isang app. Ang 9-section na sagot at
  16-item checklist sa bawat maliit na hakbang ay makakalunod sa isang beginner.
- **Consequences:** ang security ay tuturuan nang **paunti-unti** (ligtas na
  basics sa MVP, tapos isa-isang upgrade sa Phase 9+), hindi lahat mula sa
  unang araw. Kaya sa MVP, may mga kilalang kahinaan na sinasadya muna — at
  nakalista ang mga ito sa roadmap para hindi makalimutan.

## D-007 · Diagrams: iisang source (`.md`) + isang viewer — ⚠️ *PINALITAN ng D-009*
- **Petsa:** 2026-09-24
- **Context:** gustong mabuksan ang mga diagram sa Chrome, parang HTML.
- **Mga opsyon:** tig-iisang `.html` file bawat diagram · mermaid sa `.md` +
  isang `viewer.html` na nagre-render ng kahit anong `.md`
- **Pinili:** `.md` + isang `viewer.html`
- **Bakit:** kung may `.md` AT `.html` ang bawat diagram, dalawang kopya ang
  kailangang i-update — at kalaunan, magkakaiba sila. Isang source lang = laging tugma.
  Nire-render din ng GitHub ang `.md` nang kusa.
- **Consequences:** kailangan ng internet ang viewer (kinukuha ang mermaid
  library mula sa CDN). Kailangang pumili ng file sa viewer sa halip na
  diretsong i-double-click ang diagram.

## D-008 · Learning journal ayon sa phase at araw
- **Petsa:** 2026-09-24
- **Pinili:** `docs/journal/phase-N/day-NN.md` — isinusulat ni Nelson, isang file bawat araw
- **Bakit:** ang pagsusulat sa sariling salita ang nagpapatibay ng natutunan, at
  ang "Mga tanong ko pa" ang nagsasabi sa guide kung ano ang ipapaliwanag ulit.
- **Consequences:** dagdag na ~5 minuto bawat araw. Walang space sa pangalan
  (`day-01`, hindi `day 1`) para gumana sa terminal at para tama ang pagkakasunod.

## D-009 · Diagrams: generated na site na may navigator (pinalitan ang D-007)
- **Petsa:** 2026-09-24
- **Context:** sa D-007, kailangang pumili ng file sa bawat pagbukas ng viewer —
  mabagal at nakakainis. Gusto ng navigator: i-click, lalabas agad ang diagram.
  Pero kapag binuksan ang `.html` bilang file, hindi pinapayagan ng browser na
  basahin ang ibang file sa folder (security).
- **Mga opsyon:** maliit na local web server (kailangang patakbuhin tuwing titingin) ·
  script na isinasama ang lahat ng diagram sa loob ng isang `index.html`
- **Pinili:** `docs/diagrams/build.mjs` → gumagawa ng `index.html` mula sa lahat
  ng `*.md` at sa `template.html`
- **Bakit:** i-double-click lang ang `index.html` — walang server. Ang `.md` pa rin
  ang tanging source; ang `index.html` ay generated kaya naka-`.gitignore`.
- **Consequences:** kailangang patakbuhin ulit ang build pagkatapos magbago ng
  diagram (kung hindi, luma ang makikita sa `index.html`). Pagkatapos ng
  `git clone`, wala pang `index.html` hangga't hindi pinapatakbo ang build.
  Kailangan pa rin ng internet (mermaid mula sa CDN).
- **Aral:** ganito ang totoong ADR — hindi binubura ang lumang desisyon,
  minamarkahan lang na "pinalitan", para makita ang kasaysayan ng pag-iisip.

## D-010 · `node --env-file` sa halip na `dotenv`
- **Petsa:** 2026-09-24
- **Context:** kailangang basahin ang `.env` (Day 10). Sa karamihan ng tutorial,
  `dotenv` package ang gamit.
- **Mga opsyon:** `dotenv` · built-in na `node --env-file=.env` (mula Node 20.6)
- **Pinili:** `node --env-file=.env`
- **Bakit:** built-in na — isang dependency na hindi na kailangan. Unang halimbawa
  ng "LUMANG PARAAN → KASALUKUYANG PARAAN".
- **Consequences:** makikita mo pa rin ang `dotenv` sa mga lumang tutorial at sa
  reference project — alam mo na ngayon kung bakit iba ang atin.

## D-011 · ESLint sa Phase 6 — ⚠️ *BINAGO sa Day 27: Oxlint na (tingnan sa ibaba)*
- **Petsa:** 2026-09-24
- **Context:** walang TypeScript hanggang Phase 7, kaya hindi nahuhuli ng editor
  ang ilang pagkakamali (hal. variable na hindi ginagamit, maling pangalan).
- **Mga opsyon:** walang linter · ESLint agad sa Day 03 · ESLint sa Phase 6 kasama ng CI
- **Pinili:** ESLint sa Day 27, kasama ng CI
- **Bakit:** sa Day 03, dagdag na bagay lang ito na pag-aaralan habang natututo
  pa ng basics. Sa Phase 6, may tests at CI na — doon may kabuluhan ang
  "automatic na pagsuri bago i-merge".
- **Consequences:** sa Phase 2–5, ikaw at ang code review ang humuhuli ng mga
  ganitong pagkakamali. Hindi ito ginamit ng reference project (TypeScript +
  knip ang gamit doon) — dagdag natin ito dahil JavaScript muna tayo.

---

*Template para sa susunod na desisyon:*

```markdown
## D-00X · <maikling pamagat>
- **Petsa:**
- **Context:**      (bakit kailangang magdesisyon?)
- **Mga opsyon:**
- **Pinili:**
- **Bakit:**
- **Consequences:** (ano ang nakukuha, ano ang isinusuko?)
```

---

## D-012 · JWT: HS256 (isang secret) muna, RS256 mamaya

- **Petsa:** 2026-09-25 (Day 16)
- **Context:** kailangan ng pirma ang JWT. Dalawang paraan: **HS256** — iisang
  `JWT_SECRET` ang pumipirma at sumusuri; **RS256** — private key ang pumipirma,
  public key ang sumusuri (ang ginagamit ng reference project, item 5).
- **Desisyon:** HS256 muna, gamit ang random na 48-byte na `JWT_SECRET` sa `.env`,
  na may `expiresIn: '1h'`, sa `httpOnly` + `SameSite=Lax` cookie.
- **Bakit:** iisang backend lang ang gumagawa AT sumusuri ng token — walang ibang
  serbisyong kailangang mag-verify, kaya walang pakinabang pa ang public key.
  Isang konsepto sa isang araw.
- **Consequences:**
  - Ang sinumang may `JWT_SECRET` ay makakagawa ng token para sa kahit sinong
    user — kaya hindi ito kailanman naka-commit, at iba ang secret sa production.
  - Wala pang refresh token: pagkalipas ng 1 oras, login ulit (Phase 11, Day 51).
  - Walang paraan pang bawiin ang isang token bago mag-expire (logout = burahin
    lang ang cookie sa browser) — lulutasin ng refresh tokens sa database (Phase 11, Day 51–52).
  - Lilipat sa RS256 + `iss`/`aud` sa Phase 11 (Day 56), gaya ng reference project.

---

## D-013 · Frontend: "basics muna, modern pagkatapos"

- **Petsa:** 2026-09-25 (bago ang Phase 5)
- **Context:** walang frontend ang reference project — dito tayo mismo ang
  magpapasya. Versions noong araw na iyon: React 19.3, Vite 8.3, React Router 8.4,
  TanStack Query 5, Tailwind 4.
- **Desisyon (bawat bahagi):**

  | Bahagi | Pinili | Hindi muna (at kailan puwede) |
  |---|---|---|
  | Framework | React 19 + Vite 8 (D-003) | Next.js — itinatago ang CORS |
  | Language | JavaScript | TypeScript → Phase 7 |
  | Forms | `useState` + `onSubmit` (Day 21) → React 19 `useActionState` (Day 23) | react-hook-form — hindi kailangan sa 2 form |
  | API | `fetch` sa `src/api/`, `credentials: 'include'` | TanStack Query → pagkatapos ng MVP |
  | Pages | React Router 8 (simpleng mode) | — |
  | Styling | Plain CSS | Tailwind → Phase 10+ kung gusto |
  | Dev ↔ backend | CORS sa backend (`cors`, `credentials: true`) | Vite proxy — babanggitin, hindi gagamitin |
  | Linter | Oxlint (kasama na sa template ng Vite) | ESLint — pag-uusapan ulit sa Day 27 (D-011) |

- **Bakit:** sa bawat konsepto, pundasyon muna (na makikita sa bawat trabaho at
  tutorial), saka ang modernong paraan — para alam kung anong problema ang
  nilulutas nito. Ang TanStack Query at Tailwind ay mahusay, pero itinatago nila
  ang mismong gusto nating makita (ang request, ang cookie, ang CSS).
- **Consequences:**
  - Mas maraming code sa kamay (loading/error state sa bawat form) — sinadya, para
    makita kung bakit may `useActionState` at TanStack Query.
  - CORS muna, hindi proxy: makikita ang totoong CORS error sa DevTools, at iyon
    ang kailangan kapag magkaibang domain ang frontend at backend. Sa Phase 8,
    pag-iisipan ulit kung iisang domain (walang CORS).
  - **StrictMode:** sa development, dalawang beses tinatawag ang ilang code —
    makikita ang 2 request sa `/me`. Hindi bug.
  - **LUMANG PARAAN → KASALUKUYAN:** ang `create-vite` ngayon ay may Oxlint na
    (dati ESLint), at `--overwrite` ay BINUBURA ang laman ng folder — kaya
    ililipat muna palabas ang `frontend/README.md` sa Day 20.

---

## D-014 · `nodemon` para sa `npm run dev` (hindi na `node --watch`)

- **Petsa:** 2026-09-25 (Day 23)
- **Context:** paulit-ulit (Day 06, 14, 16, 17, 23) na lumang code ang tumatakbo
  pagkatapos ng `git checkout` / `git pull`. Sa Day 18, pinalitan ng
  `--watch-path=./src` — **kalahati lang ang naayos**: nahuhuli ang save at ang
  `.env`, pero sa Day 23, namatay pa rin ang watcher pagkatapos ng checkout (walang
  `cors()` ang tumatakbong code → CORS error sa register).
- **Sinubukan (scratch git repo, 4 na checkout + 1 edit):**
  `node --watch-path` → `main feat` (namatay pagkatapos ng unang checkout);
  `nodemon` → `main feat main feat main edit` (buhay sa lahat).
- **Pinili:** `nodemon` (devDependency) —
  `nodemon --watch src --watch .env --ext js,json,env --exec "node --env-file=.env src/index.js"`
- **Bakit:** matibay ang pagbabantay nito kahit pinapalitan ng git ang mga file.
  Ang `--env-file` ay built-in pa rin (D-010) — ang nodemon lang ang nagre-restart.
- **Consequences:** isang dagdag na dev dependency (hindi kasama sa production).
  Sinubukan sa backend: edit → restart; `CLIENT_URL` sa `.env` binago → restart
  at nabasa ang bago; `git checkout main` at pabalik → restart, tama ang code.
  **Aral:** ang "ayos" na hindi sinubukan sa totoong sitwasyon (git checkout) ay
  hindi pa ayos — ang Day 18 test ay pinalitan lang ang file (`mv`), hindi checkout.

---

## D-015 · Oxlint sa buong project (pinalitan ang ESLint ng D-011)

- **Petsa:** 2026-09-26 (Day 27)
- **Context:** sa D-011, ESLint ang plano sa Day 27. Pero sa Day 20, Oxlint na ang
  kasama ng template ng Vite (D-013), at sinubukan: nahuhuli nito ang mga
  mahalagang React bug (hooks sa loob ng `if`, kulang na dependency).
- **Pinili:** Oxlint sa `frontend/` (mula sa template) AT sa `backend/`
  (`npm run lint` = `oxlint src`), parehong tumatakbo sa CI.
- **Bakit:** iisang linter sa buong project; walang config na kailangang aralin;
  50–100× mas mabilis. Pareho ang pangalan ng mga rule sa ESLint, kaya madaling
  lumipat kung kailangan balang araw.
- **Consequences:** mas kaunti pa ang plugins kaysa sa ESLint. VS Code extension:
  `oxc.oxc-vscode` (hindi `dbaeumer.vscode-eslint`).

---

## D-016 · Gawing public ang repo (para gumana ang branch protection)

- **Petsa:** 2026-09-26 (Day 28)
- **Context:** sa GitHub Free, **hindi ipinapatupad** ang ruleset sa private repo
  ("won't be enforced on this private repository until you move to GitHub Team").
  Kung private, babala lang ang CI — puwede pa ring i-merge ang pula.
- **Mga opsyon:** public (libre, enforced) · private na walang enforcement ·
  magbayad (Pro/Team)
- **Pinili:** public — pinili ni Nelson.
- **Bago ginawang public — sinuri ang BUONG git history (105 commit):**
  gitleaks → 1 finding, maling alarma (`argon2.verify` sa journal ng Day 14);
  walang `.env`/`.env.test` na na-commit kailanman; `JWT_SECRET` → 0; Postgres
  password → 0 tunay na pagkakalantad (ang mga tugma ay galing sa `nelson1869`).
- **Consequences:**
  - Portfolio: makikita ng kahit sino ang code, commits, PRs, CI at docs.
  - **Lahat ng susunod na commit ay public** — laging `.env` sa `.gitignore`,
    `.env.example` na placeholder lang, at tingnan ang `git status` bago mag-commit.
  - 🔐 **Walang self-hosted runner sa public repo** (Day 37, CD): kahit sino ay
    puwedeng magbukas ng PR, at tatakbo ang workflow sa makina mo. Sa reference
    project, ginawang PRIVATE muna ang repo bago mag-self-hosted runner. Dito:
    GitHub-hosted runner lang, o deploy mula sa sariling makina nang manual/pull.
  - Rekomendasyon (hindi pa nagagawa): palitan ang Postgres password sa
    `devops/.env` — kapareho ng isa pang password ni Nelson (hindi ito nasa Git).


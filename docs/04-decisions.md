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
  - **Update (Day 51):** access token = 15 minuto + refresh token (7 araw, naka-hash sa DB); HS256 pa rin (RS256: Day 56).
  - **Update (Day 56):** RS256 na — tingnan ang D-024.
  - Walang paraan pang bawiin ang isang token bago mag-expire (logout = burahin
    lang ang cookie sa browser) — lulutasin ng refresh tokens sa database (Phase 11, Day 51–52).
  - **Update (Day 53):** ✅ nalutas — binabawi na sa database ang refresh token sa logout; ang access token ay ≤ 15 minuto na lang.
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

---

## D-017 · Public pa rin — at noreply email para sa mga bagong commit

- **Petsa:** 2026-09-26 (pagkatapos ng Day 28)
- **Context:** pagkatapos ng D-016, nakita na ang Gmail ni Nelson ay nasa lahat ng
  110 commit at nakikita habang public ang repo. Sandaling ginawang **private**,
  kaya bumalik ang babalang "won't be enforced" sa ruleset.
- **Mga opsyon:** private (walang enforcement, hindi nakikita ng AI ang CI) ·
  public (enforced, nakikita ang email sa lumang commits) · isulat ulit ang buong
  history para palitan ang email (delikado — force push, hindi inirerekomenda)
- **Pinili:** **public ulit** — pinili ni Nelson ("oo na public ko na"). Tanggap ang
  email sa lumang commits (karaniwang panganib: spam; walang secret na nalantad).
- **Consequences:**
  - Ipinapatupad ulit ang `main-protection` — nakumpirma ng AI sa API: `active`.
  - Nakikita ulit ng AI ang CI at PRs sa GitHub API.
  - **Rekomendasyon:** GitHub → Settings → Emails → "Keep my email addresses
    private", at `git config --global user.email "<noreply email>"` — para hindi na
    lumabas ang Gmail sa mga BAGONG commit.
  - **Aral:** hindi nakatatago ng email ang SSH key — authentication iyon (sino ang
    puwedeng mag-push). Ang email ay nakasulat sa loob ng bawat commit.

---

## D-018 · TypeScript nang walang build step (Node 24 type stripping)

- **Petsa:** 2026-09-26 (Day 29)
- **Context:** TypeScript sa Phase 7 (D-002). Ang reference ay `tsx watch` sa dev,
  `tsc` → `dist/` sa build, at `import './x.js'` kahit `.ts` ang file.
  Sinubukan (scratch): TypeScript **7.0.2**; `node src/index.ts` sa **Node 24** —
  tumakbo nang direkta; `tsc` nakahuli ng maling type; `enum` → hinarang ng `tsc`
  (`erasableSyntaxOnly`) at ng Node (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`); Vitest
  gumagana sa `.ts`.
- **Pinili:**
  - **Node mismo ang nagpapatakbo ng `.ts`** — walang `tsx`, walang `dist/`
  - **`tsc` = type-check lang** (`noEmit`) — `npm run typecheck`, at sa CI
  - `import './app.ts'` (`allowImportingTsExtensions`) — tugma sa totoong pangalan
  - `erasableSyntaxOnly` + `verbatimModuleSyntax` — mga syntax lang na kayang
    tanggalin ng Node; `import type` para sa mga type
  - Unti-unting paglipat: `allowJs` (magkasama ang `.js` at `.ts`), `checkJs: false`
- **Bakit:** **LUMANG PARAAN → KASALUKUYAN:** `ts-node`/`tsx`/`tsc → dist` → built-in
  sa Node. Mas kaunting tool; mas simple ang deploy (Phase 8: `node src/index.ts`).
- **Consequences:**
  - Bawal ang `enum`, `namespace`, at parameter properties — gumamit ng
    `type`/union (hal. `'ok' | 'error'`) at plain objects.
  - Hindi sinusuri ng Node ang types habang tumatakbo — **`npm run typecheck`
    (at CI) ang nagsusuri**. Kung laktawan iyon, tatakbo pa rin ang code kahit mali.
  - Iba sa reference — kapag kinokopya ang pattern mula roon, `.ts` ang extension
    ng import, hindi `.js`.

---

## D-019 · Frontend TypeScript: ang `User` type ay KOPYA ng sagot ng backend

- **Petsa:** 2026-09-26 (Day 32b)
- **Context:** sinabi ng tech stack na TypeScript din ang frontend sa Phase 7, pero
  backend lang ang nasa gawain ng roadmap — napansin ni Nelson na `.js` pa ang
  `frontend/src/api/auth.js`. Kapag pinalitan lang ang pangalan ng 6 na file →
  **17 error** (hal. `user.name` sa type na `never`, `document.getElementById`
  na puwedeng `null`, `err` na `unknown`, `FormData.get()` na `string | File | null`).
- **Pinili:**
  - TypeScript **7** (pareho sa backend) + ang tsconfig ng Vite template
    (`tsconfig.app.json` para sa browser, `tsconfig.node.json` para sa
    `vite.config.ts`); `npm run typecheck` = `tsc -b`, idinagdag sa CI
  - Si Vite ang gumagawa ng JavaScript; `tsc` = type-check lang (tugma sa D-018)
  - **`User`, `FieldErrors`, `ApiError` ay isinulat sa `frontend/src/api/auth.ts`**
- **Consequences:**
  - ⚠️ **Kopya** ang `User` type — kapag binago ng backend ang hugis ng sagot,
    walang error sa frontend; lalabas lang ang mali sa browser. Ang tunay na ayos
    ay iisang source ng types (shared package o OpenAPI → generated types) —
    Phase 16 (OpenAPI). Hanggang doon: kapag binago ang sagot ng backend, i-update
    ang `docs/07-api-contract.md` AT ang `User` type nang sabay.
  - **✅ Nalutas (Day 78, D-027):** ang mga type ay galing na sa OpenAPI spec (`frontend/src/api/openapi.generated.ts`).
    Sa paglipat, nahuli ang isang maling kopya: ang `login()` at `register()` ay naka-type na `User` (may `role`, `emailVerified`),
    pero `{ id, email, name }` lang ang ibinabalik ng backend.
  - Isang language na ang buong project.

---

## D-020 · Deploy: hybrid — Pages (frontend), PC + Tunnel (backend), Neon (DB)

- **Petsa:** 2026-09-26 (roadmap review bago ang Phase 8)
- **Context:** sa roadmap, ang Day 36 ay backend sa PC ni Nelson (Cloudflare Tunnel,
  gaya ng reference), pero ang Day 37 ay "walang self-hosted runner" (D-016: public
  ang repo). Ang self-hosted runner ang ginamit ng reference para mag-deploy sa PC —
  kaya salungat ang dalawa. Hindi rin nakasulat kung saan ang frontend.
- **Mga opsyon:** hybrid · lahat sa PC · lahat sa cloud (PaaS)
- **Pinili:** **hybrid** — pinili ni Nelson.
  - **Domain (Day 33):** `nelson1869.com` — Cloudflare Registrar, $10.46/taon (pareho sa
    renewal). `https://nelson1869.com` (frontend) at `https://api.nelson1869.com` (backend).
  - **Frontend → Cloudflare Pages:** static, libre, kusang deploy sa bawat merge — walang runner
  - **Backend → PC ni Nelson** sa Docker, sa likod ng **named Cloudflare Tunnel** (`api.<domain>`)
  - **Database → Neon** (managed, may backup)
  - **CD ng backend → pull-based:** GitHub-hosted Actions → Docker image → GHCR; ang
    PC ang kumukuha. Manual na `deploy.sh` muna.
- **Bakit:** walang code ng ibang tao na tatakbo sa PC (ligtas kahit public ang repo);
  matututunan pa rin ang Docker, tunnel, at CD; libre.
- **Consequences:**
  - **Kailangang bukas ang PC** para gumana ang API (ang frontend ay laging bukas).
  - `api.<domain>` at `<domain>` ay **same-site** → gumagana ang `SameSite=Lax` cookie;
    kailangan ang `Secure` (HTTPS) at `CLIENT_URL=https://<domain>` para sa CORS.
  - Kailangan ang `VITE_API_URL` sa frontend (build-time).

---

## D-021 · Bukas ang production habang ginagawa ang Phase 9

- **Petsa:** 2026-09-26 (pagkatapos ng MVP launch)
- **Context:** ang plano ay patayin ang backend pagkatapos ng Day 38 hanggang matapos ang
  hardening. Tinanong ni Nelson kung puwedeng iwanang bukas — at kung mabuti ba iyon sa pag-aaral.
- **Pinili:** **bukas** — pinili ni Nelson.
- **Bakit (pag-aaral):** totoong trapiko at bots (makikita kapag may logging na), totoong CD sa
  bawat feature, totoong pag-aayos ng problema sa production.
- **Mga kondisyon:**
  - Test accounts lang hanggang matapos ang Phase 9; huwag gamitin ang totoong password ng ibang site
  - **Kill switch:** `cd devops && docker compose -f docker-compose.prod.yml down`
  - I-deploy (`./devops/deploy.sh`) ang bawat natapos na Phase 9 feature
  - **Bagong pagkakasunod ng Phase 9:** helmet (39) → **logging (42)** → error handler (41) → CSRF (44);
    tapos na ang config (40, sa Phase 7) at rate limiting (43, bago ang launch). Logging muna para
    makita agad ang nangyayari sa production.


## D-022 · CSRF: Origin check, hindi double-submit token

- **Petsa:** 2026-09-27 (Day 44)
- **Context:** sinubukan muna ang totoong CSRF attack mula sa pekeng site (`127.0.0.1:8081`) sa
  naka-login na Chromium. **Nakarating** ang mga request sa server, pero walang epekto:
  - hindi ipinadala ng browser ang cookie (`SameSite=Lax`);
  - 400 ang pekeng "JSON" form (`text/plain`, hindi JSON);
  - hinarang ng CORS ang `fetch` na may JSON.

  **Ang butas:** para sa SameSite, "parehong site" ang lahat ng `*.nelson1869.com`. Kapag na-hack
  ang isang subdomain, maipapadala na ang cookie, halimbawa sa form na `/logout`.
- **Mga pagpipilian:**
  - (A) **Origin check** — tanggihan ang POST/PUT/DELETE kapag ang `Origin` ay hindi `CLIENT_URL`;
  - (B) double-submit token (`csrf-csrf`, katulad ng reference);
  - (C) pareho.
- **Pinili:** **A** — pinili ni Nelson (rekomendasyon).
- **Bakit:**
  - Sinasara nito ang butas, dahil ang `blog.nelson1869.com` ay ibang **origin** kahit parehong **site**.
  - Hindi ito kayang pekein ng JavaScript sa browser.
  - Walang babaguhin sa frontend at sa `.http` files.
  - Ang B ay halos walang dagdag na proteksyon sa JSON API na may SameSite + CORS, pero mas maraming bahagi: token endpoint, bagong secret, at frontend.
- **Detalye:**
  - Walang `Origin` at walang `Sec-Fetch-Site` → hindi browser (curl, REST Client) → pinapayagan, dahil walang biktimang may cookie.
  - `Origin: null` o `Sec-Fetch-Site: cross-site` → 403.
- **Kapalit:** kapag nagdagdag ng ibang frontend (hal. mobile web sa ibang domain), idagdag ito sa listahan.
  Kapag tumanggap ang API ng form (hindi JSON), balikan ang desisyong ito.

## D-023 · Ang unang admin: i-promote ang naka-register na account, hindi seed na may password

- **Petsa:** 2026-09-27 (Day 45)
- **Context:** ang seed ng reference ay gumagawa ng `admin@example.com` / `adminpassword123`, at nakasulat ito
  mismo sa code. **Public ang repo natin**, kaya kapag napatakbo ito sa production, may admin na alam ng
  lahat ang password.
- **Pinili:** `backend/src/db/set-role.ts <email> <user|admin>`. Ginagawa nitong admin ang account na
  **naka-register na**. Ang may-ari ang pumili ng password noong nag-register. Script lang ito, hindi endpoint,
  kaya kailangan ng access sa server o sa `.env.production` para patakbuhin.
- **Detalye:**
  - Walang ginagawang account ang script.
  - Ligtas itong ulitin (idempotent), at puwedeng ibalik sa `user`.
  - Hindi mahalaga ang laki ng titik ng email (lowercase ang naka-save).
- **Kapalit:** kailangang mag-register muna bago maging admin. Sa production, tatakbo ito sa pamamagitan ng
  `docker run`, gamit ang parehong image ng app.

## D-024 · RS256: isang env var (private key, base64), ang public key ay kinukuha mula rito

- **Petsa:** 2026-09-27 (Day 56)
- **Context:** HS256 (D-012): iisang `JWT_SECRET` ang pumipirma **at** sumusuri. Ang RS256: **private** key ang pumipirma,
  **public** key ang sumusuri. Mga file ang gamit ng reference (`JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`).
- **Pinili:**
  - **`JWT_PRIVATE_KEY`**: ang PEM, naka-base64 (isang linya), sa `.env`. Kasya ito sa `env_file` ng Docker at sa
    `docker run --env-file` ng migrate, walang dagdag na volume o file.
  - Ang **public key ay kinukuha mula sa private key** (`createPublicKey`), kaya hindi puwedeng magkamali ng pares.
  - Sinusuri ng `env.ts` pagka-start: PEM, RSA, ≥ 2048 bits. Kung mali, ayaw mag-start ng server (hindi ipinapakita ang laman).
  - `iss: auth-learning-api`, `aud: auth-learning-web`, na sinusuri sa verify.
  - Iba ang key ng dev, test at production. Ang CI ay gumagawa ng bagong key bawat run.
- **Rollback:** nandoon pa ang lumang `JWT_SECRET` sa `.env.production`, kailangan pa ito ng image bago ang Day 56.
  Hindi ito ginagamit ng bagong code (tinatanggal ni Zod ang hindi kilalang variable).
- **Epekto sa mga naka-login:** ang lumang HS256 access token → 401 → kusang refresh ng frontend (Day 51) → bagong RS256 token.
  **Walang kailangang mag-login ulit**, dahil nasa database ang refresh token at hindi ito JWT.
- **Kapalit:** walang "key rotation" pa (iisang key). Sa hinaharap: `kid` sa header at dalawang public key habang nagpapalit.

## D-025 · Email: Resend, "sending access" na key, walang tracking

- **Petsa:** 2026-09-27 (Day 58)
- **Context:** kailangan ng password reset at email verification (Phase 12) ang totoong email. Stub lang (log) ang reference.
- **Mga pagpipilian:** Resend · Brevo · Gmail SMTP (App Password).
- **Pinili:** **Resend**, pinili ni Nelson (rekomendasyon).
- **Bakit:**
  - HTTP API: `fetch` lang, walang bagong library.
  - Sariling domain (`no-reply@nelson1869.com`), kaya natutunan ang SPF, DKIM at DMARC. Libre hanggang 3,000/buwan.
  - Region Tokyo, pinakamalapit sa PH.
- **Mga setting:**
  - **API key: "Sending access" lang**, para sa `nelson1869.com` (least privilege). Nasa `.env.production`, at hindi kailanman ipinakita sa chat.
  - **Click at open tracking: off.** Pinapalitan ng click tracking ang mga link, at may secret na token ang reset link.
    (Hindi ma-off ang click tracking sa form ng pagdagdag; `text/plain` ang email natin, at susuriin ang link sa Day 59.)
  - **Receiving: off** (hindi tayo tumatanggap ng email).
  - DMARC `p=none` muna (bantayan), puwedeng gawing `quarantine` kapag matatag na.
- **Code:** `lib/email.ts`: Resend kapag may `RESEND_API_KEY`, kung wala ay log lang (dev at tests, walang totoong email mula sa tests).
  **Fail-fast:** ayaw mag-start ng production kapag walang key.
- **Natutunan (deliverability):** PASS ang SPF, DKIM at DMARC, pero **Spam** pa rin sa Gmail (dalawang email, pati ang maayos na
  transactional na laman). Bagong domain ito na walang reputasyon, kaya kailangan ng warm-up. Hindi ito maaayos ng code.

## D-026 · Email verification: "soft" (makakapag-login pa rin ang hindi pa verified)

- **Petsa:** 2026-09-27 (Day 60)
- **Context:** walang sumusuri kung totoo ang email sa register. Kaya puwedeng i-register ng iba ang email ko, at magba-bounce ang mga email
  sa pekeng address, na nakakasira sa reputasyon ng domain (Day 58).
- **Mga pagpipilian:**
  - **soft**: makakapag-login pa rin, may paalala at "ipadala ulit";
  - **hard**: bawal mag-login hangga't hindi verified.
- **Pinili:** **soft**, pinili ni Nelson (rekomendasyon).
- **Bakit:**
  - walang nasisira sa mga dating account na hindi pa verified (kasama ang admin);
  - hindi nala-lock ang mga account na may pekeng email;
  - puwedeng gawing mas mahigpit sa hinaharap (hal. verified lang ang makakagawa ng mahahalagang bagay).
- **Detalye:** `users.email_verified_at` (NULL = hindi pa). Token sa `verification_tokens` na may `purpose = email_verification`, 24 oras, `#fragment`,
  isang beses lang. `POST /verify-email` (walang login), `POST /resend-verification` (naka-login, 5/15 min). `emailVerified` sa `/me`.
- **Mga production test mula ngayon:** `delivered+<label>@resend.dev` sa halip na `@example.com`. Nagpapadala na ng email ang bawat register,
  at hindi nakakasira ng reputasyon ang mga test address ng Resend.

---

## D-027 · API docs: OpenAPI mula sa `z.toJSONSchema` + sariling generator ng TypeScript

- **Petsa:** 2026-09-27 (Day 78)
- **Context:** nakaplano ang "OpenAPI + Swagger UI mula sa Zod schemas" (tech stack), at ang mga type ng frontend mula sa spec (D-019). Hindi pa napipili ang mga library.
- **Mga pagpipilian para sa spec:**
  - `@asteasolutions/zod-to-openapi` (gamit ng reference): isa pang library, `.openapi()` sa bawat schema;
  - **`z.toJSONSchema()`, built-in na sa Zod 4**, at ang mga path ay isinusulat nang kamay.
- **Mga pagpipilian para sa mga type ng frontend:**
  - `openapi-typescript`: **kailangan ng TypeScript 5** (peer), pero TypeScript 7 ang project. Ang `--legacy-peer-deps` ay malamang masira (iba ang compiler API ng TS 7).
    Ang `npx` na may TS 5 sa bawat CI at Pages build ay nagda-download ng mga package na walang lockfile (supply-chain risk);
  - **maliit na sariling generator** (`backend/src/openapi/typescript.ts`, ~70 linya): sapat para sa mga hugis na ginagamit natin, at **pumapalya sa hindi kilalang keyword**.
- **Pinili:** `z.toJSONSchema` + sariling generator, at `swagger-ui-express` para sa UI (rekomendasyon ng AI; sinabi ni Nelson na "continue").
- **Bakit:** walang dagdag na library para sa schemas; walang pagbabago sa CI workflow o sa Pages build (naka-commit ang dalawang ginawang file,
  at backend test ang nagbabantay sa kanila); makikita kung ano talaga ang OpenAPI.
- **Consequences:**
  - `npm run openapi` (backend) ay sumusulat ng `backend/openapi.json` at `frontend/src/api/openapi.generated.ts`. **Kailangang patakbuhin ito** tuwing may binago sa schema o endpoint.
    Kapag nakalimutan, babagsak ang `openapi.test.ts`.
  - Hindi naisasalin ang `.refine()` at ang mga transform (trim, lowercase): nasa `description` na lang.
  - Kapag gumamit ng bagong JSON Schema keyword ang isang schema (hal. `oneOf`), kailangang dagdagan ang generator. Sasabihin ng error kung alin.
  - **Hindi na kailangang luwagan ang CSP** para sa Swagger UI (hindi tulad ng reference): ang `swagger-ui-express` v5 ay gumagamit ng hiwalay na script file.

---

## D-028 · Metrics: OpenTelemetry metrics SDK + sariling middleware (walang auto-instrumentation)

- **Petsa:** 2026-09-27 (Day 81)
- **Context:** "OpenTelemetry + `/metrics`" ang nasa roadmap. Ang reference ay gumagamit ng `NodeSDK` + `auto-instrumentations-node`.
- **Mga pagpipilian:**
  - **auto-instrumentation** (reference): daan-daang package, nagpa-patch ng mga module habang nilo-load (kaya kailangang ito ang unang import; may mga caveat sa ESM), at may traces sa console;
  - **metrics SDK + Prometheus exporter + isang maliit na middleware** na nagtatala ng `http.server.request.duration` (OTel semantic conventions).
- **Pinili:** ang pangalawa (rekomendasyon ng AI; "go" ni Nelson).
- **Bakit:** 6 na package lang; walang pag-patch ng module; malinaw kung saan galing ang bawat numero; OpenTelemetry pa rin (puwedeng lumipat sa OTLP exporter o magdagdag ng tracing sa hinaharap nang hindi binabago ang mga metric).
- **Consequences:**
  - Walang kusang metric para sa database o sa labas na HTTP calls (hal. Resend). Kung kailangan, idagdag nang tahasan.
  - `/metrics` sa hiwalay na port (`METRICS_PORT`, default 9464), hindi publiko (hindi dinadaanan ng tunnel).
  - Ang pagpalya ng metrics server ay hindi nagpapabagsak sa app.


## D-029 · Supply chain: gitleaks bilang image na naka-pin sa digest · npm audit sa dalawang antas · Dependabot na may cooldown

- **Petsa:** 2026-09-29 (Day 87)
- **Context:** "Dependabot, `npm audit` sa CI, secret scanning (gitleaks)" ang nasa roadmap. Nang sukatin: **public ang repo**, at naka-off ang
  secret scanning, push protection at Dependabot ng GitHub. May `npm audit --omit=dev --audit-level=high` na sa backend, pero wala sa frontend.
- **Mga pagpipilian (secret scanning sa CI):**
  - **`gitleaks/gitleaks-action`** (gaya ng reference): third-party action, naka-pin sa tag;
  - **gitleaks bilang Docker image na naka-pin sa `@sha256:` digest**, pinapatakbo nang direkta.
- **Pinili:** ang pangalawa (rekomendasyon ng AI; "go" ni Nelson).
- **Bakit:** ang tag ay puwedeng ilipat ng may-ari, o ng attacker na nakapasok sa account, sa ibang code. Ang digest ay hindi.
  Nangyari na ito: ang trivy-action tags (2026-03, aral ng reference). Walang dagdag na action na may access sa `GITHUB_TOKEN`.
  Sa parehong dahilan, ang `actions/checkout` at `actions/setup-node` ay naka-pin na sa commit SHA (ina-update ng Dependabot).
- **npm audit:** backend AT frontend (ang deps ng frontend ay napupunta sa browser ng user; ang vite ang gumagawa ng bundle).
  Production → `--audit-level=moderate`; lahat → `high`. Mas mahigpit ang production dahil iyon ang tumatakbo; ang `high` sa lahat ay para hindi
  mapula ang bawat PR dahil sa dev tool na hindi naman tumatakbo sa server.
  **Tinanggap:** GHSA-67mh-4wv8-2f99 (esbuild dev server, moderate) via drizzle-kit, dev lang. Ang "fix" ng npm ay downgrade sa drizzle-kit 0.18.
- **Dependabot:** lingguhan, may **cooldown na 7 araw** (hindi agad nagmumungkahi ng bagong labas na version, dahil ang mga malisyosong
  version ay kadalasang natutuklasan at inaalis sa loob ng ilang araw), mga minor/patch ay pinagsasama. Walang auto-merge.
- **GitHub settings (desisyon ni Nelson):** secret scanning + push protection **naka-on**; Dependabot alerts **naka-off**.
- **Consequences:**
  - Ang `.gitleaksignore` ay para lang sa **sinuring** false positive, may dahilan bawat isa. Kapag totoong secret: i-rotate, hindi ignore.
  - Ang Dependabot PRs ay dumadaan sa parehong CI; ako ang nagme-merge.
  - Ang audit ay para sa **kilalang** butas lang. Hindi nito nahuhuli ang bagong malisyosong package (kaya ang cooldown, lockfile, at `npm ci`).

## D-030 · Runtime image: multi-stage sa Alpine na walang package manager (hindi distroless)

- **Petsa:** 2026-09-29 (Day 88)
- **Context:** Ang image na naka-deploy: 332MB, Grype = 1 High (zlib) + 3 Medium, lahat sa Alpine packages at walang ayos pa.
  Ang dating `rm -rf` ng npm ay nasa sariling layer, kaya nagtatago lang ng file at hindi nagpapaliit ng image. May yarn, C headers at apk pa sa base.
- **Mga pagpipilian:**
  - **manatili** sa isang stage at tanggapin ang mga CVE;
  - **distroless** (`gcr.io/distroless/nodejs24`): walang shell. Pero Debian (glibc) ito, kaya iba ang build ng argon2; ang ENTRYPOINT ay `node` (masisira ang
    `docker run IMAGE node src/db/migrate.ts` ng deploy.sh); walang `docker exec sh` sa pag-debug; at kailangang palitan ang HEALTHCHECK;
  - **multi-stage sa Alpine:** `npm ci` sa node image, tapos malinis na `alpine` + `node` binary + `node_modules` + code, at inaalis ng apk ang sarili nito
    at ang mga library na siya lang ang gumagamit (libssl3, libcrypto3, zlib, ssl_client).
- **Pinili:** ang multi-stage sa Alpine (rekomendasyon ng AI; "go" ni Nelson).
- **Bakit:** nawala ang High at 2 sa 3 Medium, 332 → 283MB, at walang nagbago sa deploy, HEALTHCHECK o pag-debug.
  Sinuri gamit ang `ldd` na musl, libstdc++ at libgcc lang ang kailangan ng `node` (naka-embed ang OpenSSL at zlib nito).
- **Tinanggap:** CVE-2025-60876 (busybox, Medium): tungkol sa `wget` ng busybox, na hindi pinapatakbo ng app. Naiwan ang busybox dahil sa shell.
- **Consequences:**
  - **Parehong Alpine version sa dalawang FROM** (`node:24-alpine3.24` at `alpine:3.24`): binuo ang `node` para sa libstdc++ nito. Iisang Dependabot group.
  - Hindi na opisyal na node image ang runtime: kami na ang may-ari ng user `node` (UID 1000) at ng listahan ng aalisin. Nakikita pa rin ng scanner ang `node` binary.
  - Grype sa CI (`--fail-on high`, bago ang push): ang bagong High, kahit walang ayos, ay haharang sa deploy. Ang sagot ay alisin ang package kung hindi kailangan, o tanggapin nang tahasan.

## D-031 · Ligtas na CD: attestation + pagsusuri ng config sa working copy (hindi hiwalay na deploy clone)

- **Petsa:** 2026-09-29 (Day 89)
- **Context:** "Deploy lang ang eksaktong commit na pumasa sa CI; i-verify ang migrations bago mag-restart." Nang sukatin: galing sa CI ang image,
  pero ang compose/monitoring/cloudflared config ay galing sa working copy (anumang branch); ang tag ng image ay nababago; at ang `migrate()`
  ay tahimik na lumalaktaw ng migration na mas luma ang timestamp.
- **Mga pagpipilian (config):**
  - **hiwalay na deploy-only clone** (gaya ng reference, #18): laging nasa eksaktong SHA ang config. Pero kailangang ilipat doon ang mga
    gitignored na secret (`devops/.env`, `backend/.env.production`), na hindi puwedeng kopyahin ng AI;
  - **tumanggi kapag iba ang `devops/` sa commit** (`git diff <SHA> -- devops/`), sa parehong working copy.
- **Mga pagpipilian (image):** tag lang (dati) · label na `revision` (hindi patunay: kahit sino ay puwedeng maglagay) · **GitHub build-provenance attestation**.
- **Pinili:** ang pagsusuri ng `devops/` + attestation (rekomendasyon ng AI; "go" ni Nelson).
- **Bakit:** walang paglilipat ng secret, at pareho ang proteksyon sa karaniwang kaso (maling branch, hindi pa naka-commit na pagbabago).
  Ang attestation ay nilagdaan ng OIDC ng GitHub (Sigstore): walang key na iniimbak, libre sa public repo, at sinusuri ang workflow, ang ref,
  ang commit at ang uri ng runner — hindi lang ang pangalan.
- **Consequences:**
  - Hindi na puwedeng mag-deploy mula sa isang feature branch na may binagong `devops/`. Sadya ito.
  - **Rollback:** `ROLLBACK=1`, na nagpapahintulot din ng config na iba sa lumang commit (ang config NGAYON ang ginagamit) at ng database na mas bago.
  - Ang mga image bago ang Day 89 ay walang attestation: `ALLOW_UNATTESTED=1`, para lang sa rollback sa mga iyon.
  - Ang `migrate.ts` ay pumapalya na (exit 1) kapag may migration na hindi na-apply. Kapag nangyari: bigyan ang migration ng mas bagong
    timestamp (i-regenerate), huwag i-edit ang `__drizzle_migrations` nang kamay.

## D-032 · Data retention: oras-oras, sa loob ng app, may advisory lock; audit logs = 1 taon

- **Petsa:** 2026-09-29 (Day 90)
- **Context:** Walang binubura ang app. Nang sukatin ang production: 1 user, 8MB, 2 expired na verification token. Hindi pa ito problema sa laki,
  pero lumalaki nang walang hangganan ang `audit_logs` (may IP at user agent), `unknown_login_attempts` at mga token.
- **Mga pagpipilian:** hiwalay na cron/container · **sa loob ng app** (timer + `runInBackground`) · wala.
- **Pinili:** sa loob ng app, bawat oras, isang transaction na may `pg_try_advisory_xact_lock` (rekomendasyon ng AI; "go" ni Nelson).
  **Audit logs: 1 taon** (desisyon ni Nelson, mula sa 90 araw / 1 taon / 2 taon / huwag burahin).
- **Bakit:** walang dagdag na bahagi sa deploy; hinihintay ng graceful shutdown; ligtas sa maraming instance (lock); at nakikita sa log, Prometheus at Grafana.
- **Mga patakaran:** refresh_tokens = buong family kapag expired na ang lahat (reuse detection) · verification_tokens at trusted_devices = expired ·
  unknown_login_attempts = idle 30+ araw at hindi naka-lock · audit_logs = mahigit 1 taon.
- **Consequences:**
  - Ang imbestigasyon ng insidenteng mahigit 1 taon na ang nakalipas ay walang audit trail.
  - Tumatakbo lang kapag buhay ang app (at ang unang takbo ay 60s pagkatapos ng bawat restart).

## D-033 · Sariling backup (pg_dump) sa labas ng Neon: bago mag-migrate + araw-araw; regular na restore drill

- **Petsa:** 2026-09-29 (Day 91)
- **Context:** Ang tanging backup ay ang point-in-time restore ng Neon: **6 na oras** (Free plan), sa iisang account. Kapag napansin ang maling pagbura
  pagkalipas ng 6 na oras (hal. bug sa retention job ng Day 90), o nagkaproblema ang account, wala nang maibabalik.
- **Mga pagpipilian:** mag-upgrade ng Neon plan (mas mahabang history, pero parehong account at parehong provider) ·
  **sariling `pg_dump` sa PC** · parehong ito at isang kopya sa ibang lugar.
- **Pinili:** sariling `pg_dump` (rekomendasyon ng AI; "go" ni Nelson), sa tatlong sandali:
  **bago mag-migrate sa bawat deploy** (fatal kapag pumalya — `ALLOW_NO_BACKUP=1` para lumampas), **araw-araw** (systemd user timer + linger, pinayagan ni Nelson),
  at manual. 14 ang itinatago. May `.counts` at `.sha256` ang bawat isa para mapatunayan ang restore.
- **Bakit:** libre, hiwalay sa Neon, at ang backup bago mag-migrate ay RPO na 0 para sa pinakamapanganib na hakbang ng deploy.
- **Consequences:**
  - Nasa iisang PC ang mga dump (backlog: naka-encrypt na kopya sa ibang lugar).
  - Tumatakbo lang ang timer kapag buhay ang PC/WSL (`Persistent=true`: hahabol pagka-boot).
  - May personal na data ang mga dump: 700/600, hindi sa repo.
  - Ang restore drill ay **hindi opsyonal**: kasama sa review day. Ang RTO sa Neon ay susukatin sa isang staging branch.

- **Dagdag (Day 93, 2026-09-30) — unang totoong Neon drill:** restore 9.4–9.9s; 18.9–20.1s mula sa sira hanggang tama ulit ang sagot ng app (staging branch, 2 takbo).
  - **🔐 Mag-restore LAGI sa DIREKTANG endpoint, hindi sa `-pooler`.** Ang dump ay nagsisimula sa `set_config('search_path', '', false)`. Sa pooler (PgBouncer,
    transaction mode) naiiwan iyon sa pinagsasaluhang koneksyon: "relation \"users\" does not exist" ang app sa bawat query, kahit tama ang restore, tugma ang
    bilang ng row, at `ready` ang `/health/ready`. Nasukat: mahigit 6 na minuto pagkatapos, sira pa rin ang pooled endpoint ng staging.
    Direkta ang `DATABASE_URL` ng production, kaya hindi ito tinamaan ng mga backup — pero **pooled ang default na kinokopya sa Neon console**.
  - Ang `restore-drill-neon.sh` ay nag-aalis na ng `-pooler`, at humihinto na kapag pumalya ang pagbura (dati: "💥 Sinira" kahit hindi nakakonekta).
  - **Paano linisin ang pooler (nalaman sa parehong araw, sa staging):** (a) kusa itong bumalik sa loob ng ~25 minuto (hindi ko alam ang eksaktong dahilan — malamang ang pagtulog ng compute); (b) `select set_config('search_path', '"$user", public', false)` sa pamamagitan ng pooled na URL ay nagbalik nito agad. **Isang beses lang sinubukan, sa pooler na iisa ang koneksyon** — sa totoong sakuna, direktang URL pa rin ang tama.
  - *(Unang isinulat: "hindi pa alam".)* Sa totoong sakuna: direktang URL, at i-restart ang compute kung nagamit ang pooled.

## D-034 · Load balancing: lab muna, hindi pa production

- **Petsa:** 2026-09-29 (Day 91b)
- **Context:** Roadmap: "2 backend + Caddy; ⚠️ sa iisang PC — para sa konsepto". Ang tunay na pakinabang sa production ay deploy na walang puwang
  (3.8s ngayon, Day 85). Pero sa oras na maging dalawa ang backend, ang in-memory rate limiter ay nagiging dalawang bilang, at dodoble ang limit ng login.
- **Mga pagpipilian:** ilagay agad sa production · **hiwalay na lab** (`devops/lab/`, sariling compose project, sariling database sa memory, ang production image).
- **Pinili:** lab (rekomendasyon ng AI, ayon sa roadmap; "go" ni Nelson).
- **Bakit:** nasukat ang lahat ng konsepto (round robin, health checks, pagpatay sa isang backend, rate limiter) nang hindi pinahihina ang production.
  Ang production ay maaaring sumunod pagkatapos ng Day 92 (shared rate limiter).
- **Consequences / kung ilalagay sa production balang araw:**
  - Kailangan muna ang shared rate limiter (Day 92) at ang tamang IP ng user sa likod ng proxy (`X-Forwarded-For`/`CF-Connecting-IP`).
  - Kailangang i-scrape ng Prometheus ang BAWAT backend (hindi ang iisang `backend:9464`).
  - Kailangan ng rolling na deploy sa `deploy.sh` (isa-isa, hintaying healthy) para talagang walang puwang.
  - Ang retention job ay tatakbo sa bawat backend (ang advisory lock ay "hindi sabay", hindi "isang beses bawat oras") — walang pinsala.

## D-035 · Rate limiter sa Redis: fail-open, opsyonal, at nasa production

- **Petsa:** 2026-09-30 (Day 92)
- **Context:** Sinukat sa lab (Day 91b): sa 2 backend, 20 maling login ang nakakalusot sa halip na 10, dahil nasa memory ng bawat process ang bilang.
- **Mga pagpipilian (kapag PATAY ang Redis):**
  - **fail-closed:** 500/429 sa lahat ng login hanggang bumalik ang Redis — ang pagkamatay ng Redis ay pagkamatay ng login;
  - **fail-open:** papasukin ang request nang walang rate limit.
- **Pinili:** fail-open (`passOnStoreError` + `enableOfflineQueue: false`), rekomendasyon ng AI; "go" ni Nelson.
  **`REDIS_URL` ay opsyonal** (wala → memory, gaya ng dati). **Nasa production din** (desisyon ni Nelson), kahit iisa pa ang backend.
- **Bakit:** ang rate limiter ay isa lang sa mga depensa. Ang account lockout (Day 63, sa database) ay pumipigil pa rin sa panghuhula ng password ng isang account.
  Mas masama ang pagbagsak ng login ng lahat kaysa sa ilang minutong walang IP rate limit, at may alert (`RedisDown`, 5m) para malaman ito.
- **Dalawang bug sa kilos ng `rate-limit-redis`, inayos sa `ResilientRedisStore`:** (1) nire-reload lang nito ang Lua script kapag `NOSCRIPT`,
  kaya kapag patay ang Redis pagka-start, HINDI na kailanman naipapatupad ang limit kahit bumalik ito; (2) sa BAWAT normal na startup, kumokonekta pa
  ang Redis kapag ginawa ang limiter, kaya hindi nabibilang ang unang request. Ayos: i-load ulit ang script sa bawat `ready` at pagkatapos ng bawat pagpalya.
- **Consequences:**
  - Habang patay ang Redis, kahit ang IP na naka-block na ay pinapasok (nakita sa lab). Tinanggap.
  - Hindi na nare-reset ang bilang sa restart ng app: `redis-cli flushall` sa dev (nakasulat sa `08-rate-limit.http`).
  - Walang password ang Redis: walang port sa labas, sa loob lang ng Docker network. Kapag inilabas, kailangan ng password at TLS.
  - Habang patay ang Redis, nagpi-print ang `express-rate-limit` ng stack trace sa console bawat request (hindi JSON, hindi mapapatay). Isang ERROR lang ang sa atin.
  - Sa lab, ang IP na nakikita ng app ay ang sa Caddy pa rin (iisang bilang para sa lahat). Hindi ito inayos ng Redis; kailangan ng `X-Forwarded-For` na pinagkakatiwalaan (backlog).

## D-036 · Server cache sa Redis: cache-aside, laging may TTL, fail-open, hindi para sa personal na data

- **Petsa:** 2026-09-30 (Day 92b)
- **Context:** Tanong ni Nelson (idinagdag sa roadmap): paano ginagamit ang Redis bilang cache? May Redis na mula Day 92 (D-035).
  Ang `GET /api/users/count` ay nagtatanong sa database sa bawat request, kahit nagbabago lang ang sagot kapag may bagong register.
- **Mga pagpipilian:**
  - **TTL lang** (walang pagbura): pinakasimple, pero luma ang bilang nang hanggang TTL pagkatapos ng bawat register;
  - **pagbura lang** (walang TTL): tama agad, pero kapag may nakalimutan o pumalyang pagbura, luma **magpakailanman**;
  - **pareho** (rekomendasyon ng AI): burahin sa register, at TTL bilang huling bantay.
- **Pinili:** pareho. `lib/cache.ts` (`getOrLoad` + `invalidate`), TTL **60s**, susi `cache:users:count`. "go" ni Nelson.
  **Walang bagong library** (`ioredis` na ng Day 92). Kapag walang `REDIS_URL`: walang cache (`X-Cache: BYPASS`).
- **Kapag patay ang Redis:** fail-open, gaya ng D-035. Diretso sa database; hindi pumapalya ang request, at hindi pumapalya ang register dahil sa pagbura.
- **🔐 Ano ang puwedeng i-cache:** data lang na **pareho para sa lahat ng user**. Hindi ang `/me`, sessions o audit logs: iisa ang susi para sa lahat.
  Kung kailangan balang araw, dapat kasama ang user id sa susi, at buburahin kapag nagbago ang data o nag-logout.
- **Bakit 60s:** maikli para maliit ang pinsala ng lumang bilang, mahaba para may silbi kapag sunod-sunod ang basa.
- **Consequences:**
  - **Maliit ang tipid sa dev** (HIT 1.4ms vs MISS 3.1ms): nasa iisang PC ang database at kaunti ang users. Ang cache ay para sa konsepto at sa production (malayo ang Neon).
  - **May natitirang race:** kapag nagsabay ang isang GET (MISS) at isang register, puwedeng maitabi ang lumang bilang pagkatapos ng pagbura. Hanggang 60s lang (TTL). Tinanggap; hindi sinubukang i-reproduce.
  - Ang user na binura o idinagdag **nang hindi dumadaan sa `registerUser`** (hal. SQL, `login-timing.ts`) ay hindi nagbubura ng cache: luma nang hanggang 60s.
  - Sa production, `volatile-ttl` ang eviction ng Redis: kapag napuno ang 48MB, ang mga susing pinakamalapit nang mag-expire ang unang aalisin — ang cache (60s) bago ang bilang ng rate limiter (15m).
  - Ang `redis-cli flushall` sa dev ay nagbubura rin ng cache (walang pinsala: MISS lang ang susunod).

## D-037 · Passkeys (registration): password muna, RP ID mula sa `CLIENT_URL`, challenge sa database

- **Petsa:** 2026-09-30 (Day 95–96)
- **Context:** Unang totoong code ng passkeys: pagdagdag ng passkey sa account na naka-login na. Library: `@simplewebauthn` (nasa `02-tech-stack.md` na).
- **Mga desisyon (rekomendasyon ng AI; "yes go" ni Nelson — walang isa-isang pinag-usapan, kaya puwede kong baguhin):**
  1. **Kailangan ang kasalukuyang password para magdagdag** (gaya ng change password, Day 55). Pagpipilian: session lang (mas madali) o password.
     Pinili ang password: ang passkey ay bagong paraan ng pagpasok. Kung session lang, ang nakaw na session ay makakapagdagdag ng sariling passkey
     at mananatili kahit palitan ang password. *Wala sa reference ang hakbang na ito.*
  2. **RP ID at origin ay hinango sa `CLIENT_URL`**, walang hiwalay na env variable. Sa reference, naiwang `WEBAUTHN_RP_ID=localhost` sa production.
  3. **Challenge sa database** (`webauthn_challenges`), 5 minuto, isa bawat user, kinukuha gamit ang `DELETE … RETURNING`. Hindi sa Redis:
     opsyonal at fail-open ang Redis natin (D-035). **Isang subok bawat challenge**, pumasa man o hindi.
  4. **`residentKey: required`, `userVerification: required`, `attestation: none`.** Discoverable para sa login na walang email (Day 97);
     laging may fingerprint/PIN; hindi natin inaalam kung sino ang gumawa ng device.
  5. **Iisang 400 sa lahat ng pagpalya ng verify**; ang dahilan ay sa audit log lang, bilang **kategorya**.
  6. **Limit: 10 passkey bawat account.** Walang password sa pagbura (nagbabawas ng paraan ng pagpasok, hindi nagdadagdag).
- **Consequences:**
  - **Hindi binubura ng change/reset password ang mga passkey.** Kapag may nakapagdagdag ng passkey habang hawak ang account, mananatili iyon hanggang burahin nang kamay sa `/passkeys`. Tinanggap sa ngayon; pag-isipan sa Day 97–98 (hal. abiso sa email kapag may bagong passkey, o pagbura sa reset).
  - **Walang email na abiso** kapag may bagong passkey. Nasa audit log lang (`passkey_added`).
  - **Ang mga user na walang password** (kung magkakaroon, hal. social login sa Phase 20) ay hindi makakapagdagdag ng passkey sa ganitong paraan.
  - **Hindi nililinis ng retention job ang `webauthn_challenges`.** Ngayon ay hanggang isa lang bawat user, kaya may hangganan. Sa Day 97 (challenge na walang user) ay kailangan na itong idagdag.
  - Ang user handle (`user.id` sa options) ay ang numeric id natin. Hindi personal na data, pero sunod-sunod; sa device lang ito nakikita.
  - Ang library ay may default na algorithm na `-48` (ML-DSA-44, post-quantum) bukod sa EdDSA, ES256 at RS256. Hindi ito binago.
  - **Nasubukan lang sa virtual authenticator** (Chromium) at sa software authenticator ng tests. Hindi pa sa totoong phone o fingerprint reader.

## D-038 · Passkey login: opsyonal na email na may decoy, challenge ayon sa halaga, hiwalay sa password lockout

- **Petsa:** 2026-10-01 (Day 97–98)
- **Context:** Ang login gamit ang passkey. Ayon sa roadmap: "decoy options para hindi ibunyag ang account".
- **Mga desisyon (rekomendasyon ng AI; "yes go" ni Nelson):**
  1. **Opsyonal ang email.** Walang email (default sa Login page): `allowCredentials: []`, ang device ang pipili ng account — walang tinatanong tungkol
     sa kahit sino. May email: ang mga credential id ng account, para sa user na gustong pumili ng account o may maraming account sa device.
  2. **Decoy** para sa email na walang account o walang passkey: isang pekeng id = HMAC-SHA256 ng email. **Pareho sa bawat hingi** (kung random, makikita sa
     pag-ulit). Ang susi ay hinango sa private key ng JWT (walang bagong env variable; kapag pinalitan ang JWT key, magbabago ang mga decoy — walang pinsala).
     **Walang `transports`** sa listahan, kahit sa totoo: kung mayroon sa totoo at wala sa decoy, iyon ang magbubunyag.
  3. **Ang challenge ay walang user** at hinahanap ayon sa halaga nito sa `clientDataJSON` (`DELETE … RETURNING`, UNIQUE index — migration 0014). Isang subok.
  4. **Sinusuri ang `userHandle`** laban sa may-ari ng passkey, at ang **counter** (kapag bumaba: posibleng kinopyang key → tanggihan).
  5. **Hindi hinaharang ng password lockout.** Ang lockout ay laban sa panghuhula; hindi nahuhulaan ang pirma. Ang may-ari ay makakapasok habang may nanghuhula ng password niya.
     Sariling limit: 30 options + 10 palpak na verify bawat 15 minuto bawat IP.
  6. **Parehong session at audit ng password login** (`login` / `login_failed` + `metadata.method = 'passkey'`) — gumagana pa rin ang mga alert at ang audit page.
  7. **Nililinis na ng retention job ang expired na `webauthn_challenges`** (ang sa login ay walang user, kaya walang CASCADE na maglilinis).
- **Consequences / hindi tinatakpan:**
  - **Bilang ng id:** laging 1 ang decoy. Ang account na may 2+ passkey ay may 2+ id → nakikilala. **Haba ng id:** ang decoy ay laging 32 bytes (43 na titik); ang totoo ay depende sa device.
    Kaya ang walang-email ang default at ang inirerekomenda.
  - **Oras:** pareho ang query (may account man o wala), pero hindi sinukat ang pagkakaiba ng oras (hindi gaya ng Day 72).
  - **Sa browser:** sa decoy, sinasabi ng browser na walang passkey sa device na ito — pareho ng totoong user na nasa ibang device ang passkey.
  - **Hindi binabago ng passkey login ang bilang ng maling password** (ni hindi nire-reset). Ang lock ay nananatili hanggang mag-expire.
  - Nasubukan sa software authenticator (tests) at virtual authenticator (Chromium). **Hindi pa sa totoong device.**


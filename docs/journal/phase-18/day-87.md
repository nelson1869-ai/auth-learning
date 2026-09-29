# Day 87 — 2026-09-29 · Phase 18 · Supply-chain security

## Ang tanong ng araw
Ang code na isinulat ko ay maliit na bahagi lang ng tumatakbo. Ang backend at frontend ay may **daan-daang package** na isinulat ng ibang tao.
Paano ko malalaman kung may butas ang isa sa kanila? At paano kung **ako mismo** ang naglagay ng secret sa Git nang hindi napapansin?

## Sinukat muna
| Tanong | Sagot |
|---|---|
| Public ba ang repo? | **Oo, PUBLIC.** Anumang secret na naka-commit, kahit binura na, ay nakikita ng buong mundo |
| Secret scanning, push protection, Dependabot ng GitHub? | **Lahat naka-off** (libre sana sa public repo) |
| `npm audit` sa CI? | Backend lang (`--omit=dev --audit-level=high`). **Walang audit ang frontend** |
| Ilang butas ngayon? | Backend production: 0 · backend lahat: **4 na moderate** · frontend: 0 |
| May secret ba sa history? | gitleaks sa **361 commit**: **1 natuklasan** (tingnan sa ibaba) |

### Ang 1 natuklasan ng gitleaks: false positive
Rule `generic-api-key`, sa `docs/journal/phase-4/day-14.md` sa commit `74250e9`. Hindi ko ipinakita ang "secret": naka-`--redact` ang scan,
at tinakpan ko ang bawat mahabang token bago tingnan ang linya. Ang tumugma ay ang **`argon2.verify`**, pangalan ng function sa isang tanong sa journal,
na nahuli dahil sa entropy ng teksto. **Walang totoong secret sa history.** Nasa `.gitleaksignore` na ito, may dahilan.

### Ang 4 na moderate: tinanggap
Iisang advisory lang (GHSA-67mh-4wv8-2f99): ang dev server ng **esbuild**, na dumarating sa pamamagitan ng `drizzle-kit`.
May epekto lang ito kapag pinatakbo ang `esbuild serve`, na hindi ginagawa ng drizzle-kit. Ang "fix" na mungkahi ng npm ay **downgrade sa drizzle-kit 0.18**,
isang mas lumang major version, kaya hindi ginawa. Tinanggap at nakasulat (D-029). Babalikan kapag nag-update ang drizzle-kit.

## Ano ang ginawa (D-029)
1. **Job `secret-scan` sa CI:** gitleaks sa **buong history** (`fetch-depth: 0`), `--redact`. Kailangan na ito ng `image` job.
   Pinapatakbo bilang **Docker image na naka-pin sa `@sha256:` digest**, hindi third-party action at hindi tag.
   **Bakit:** puwedeng ilipat ang tag sa ibang code (nangyari sa trivy-action noong 2026-03). Ang digest ay hindi.
2. **`npm audit` sa backend AT frontend, dalawang antas:** production → pumapalya kahit **moderate**; lahat (kasama ang dev tools) → **high**.
   Kasama ang frontend, dahil ang mga dependency nito ay **napupunta sa browser ng user**, at ang vite ang gumagawa ng bundle.
3. **Mga action na naka-pin sa commit SHA:** `actions/checkout` at `actions/setup-node` (may `# v7.0.1` na comment).
4. **Dependabot** (`.github/dependabot.yml`): lingguhan, para sa npm (backend, frontend), GitHub Actions, ang Docker base image, at ang mga image sa `devops/`.
   May **cooldown na 7 araw**: hindi agad imumungkahi ang bagong labas na version. Ang mga malisyosong version sa npm ay kadalasang natutuklasan at inaalis sa loob ng ilang araw.
5. **Settings ng GitHub** (pinili ko): **secret scanning + push protection = naka-on.** Dependabot alerts: naka-off muna.

## Paano napatunayan (sadyang sinira)
| Sinubukan | Resulta |
|---|---|
| Pekeng GitHub token, idinagdag tapos **binura sa sumunod na commit** | ✅ gitleaks **exit 1** (`github-pat`), nakatakip ang secret. Nasa history pa rin, kaya nahuli |
| `lodash@4.17.20` (kilalang butas) | ✅ audit gate **exit 1** (high) |
| Ang eksaktong command ng CI sa totoong code | ✅ gitleaks exit 0 (224 commit ng branch) · audit ×2 exit 0 sa backend at frontend |
| Gitleaks image mula sa digest, bilang root (gaya sa CI) | ✅ walang problema sa "dubious ownership" |
| `.http` 31 | ✅ 3/3 |

## 🐛 Mga nahuli (at isang pagtatama)
- **Nahuli ng gitleaks ang sarili nitong ignore file.** Sa comment ng `.gitleaksignore`, SINIPI ko ang tekstong nahuli, kaya pareho itong nahuli ulit,
  sa mismong file ng mga ignore. **Pula ang unang CI run.** Pumasa ito nang lokal dahil sinuri ko ang history **bago** ko i-commit ang file;
  ang CI ay sumusuri ng naka-commit na estado. Ayos: hindi na sinisipi ang teksto, at ang commit na naka-push na ay idinagdag sa ignore (walang force-push).
  **Aral (parehong aral ng Day 21 ng reference):** subukan ang eksaktong estadong susuriin ng CI, hindi ang working copy.
- **Hindi ma-block ng `secret-scan` ang merge** kung hindi ito "required check" sa ruleset. Ang required ay `backend` at `frontend` lang.
  Kailangan ito ng image job, pero ang PR ay puwede pa ring i-merge kahit pula ito. (Tingnan ang "Pagkatapos ng merge".)
- **Kahit ang lodash 4.17.21, na dating "ang ayos", ay may bagong advisory na** (prototype pollution sa `_.unset`). Ang "malinis" ngayon ay puwedeng may butas bukas.
  Kaya ang audit ay tumatakbo sa **bawat** PR, hindi isang beses lang.
- **Pagtatama sa Day 79:** isinulat doon na "walang `workflow` scope ang token", kaya hindi mababago ang CI. Ngayon, **mayroon na** (`gh auth status`: repo, workflow),
  kaya nabago ang `ci.yml` ngayong araw.

## Pagkatapos ng merge
- **Ruleset `main-protection`** (pinili ko): required na ang **`backend`, `frontend`, `secret-scan`**. Buo pa rin ang 4 na rule.
- **CI sa main (`68dccd7`):** berde ang `secret-scan`, `backend`, `frontend`, `image`.
- **Dependabot:** tumakbo nang walang error para sa lahat ng 5 ecosystem, at nagbukas agad ng **2 PR**. Parehong **berde ang CI, at parehong mapanganib:**
  - **#140 — node 24 → 25:** ang Node 25 ay **hindi LTS**.
  - **#141 — 4 na image sa `devops/`:** Prometheus 3.7 → 3.14, Alertmanager 0.28 → 0.34, **Grafana 12 → 13 (major)**, at **Postgres 17 → 18** sa dev compose.
    Ang major ng Postgres ay **hindi makakapagsimula sa lumang data ng volume**, kaya masisira ang dev database ko.
  - **Bakit berde ang CI?** Hindi ginagamit ng CI ang mga image na iyon. Ang image job ay **binubuo** lang ang Node 25 image; sa Node 24 (setup-node) tumatakbo ang tests.
    **Ang berdeng CI sa PR ng Dependabot ay hindi patunay na ligtas** — isa na namang "pumasa sa maling dahilan".
  - **Ayos sa config:** huwag imungkahi ang major ng `node` at `postgres` (sadyang desisyon ang mga iyon); sa `devops/`, minor/patch lang ang pinagsasama,
    at hiwalay na PR ang bawat major. **Hindi ko minerge ang #140 at #141** — desisyon ko kung isasara.

## Kumpara sa reference
- **Pareho:** Dependabot (lingguhan, grouped), `npm audit --omit=dev` sa CI, gitleaks.
- **Iba:** gitleaks bilang image na naka-pin sa **digest** (ang reference: `gitleaks-action@v3`, tag); audit sa **frontend** din at sa dalawang antas;
  mga action na naka-pin sa **SHA**; Dependabot na may **cooldown** at para rin sa Docker at compose images; at naka-on ang secret scanning ng GitHub.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang "supply chain" sa software?**
  S: Lahat ng hindi ko isinulat pero tumatakbo sa app ko: mga npm package, ang Docker base image, ang mga GitHub Action sa CI, pati ang Node mismo.
  Kapag may isang nasira o naging malisyoso, apektado rin ako, kahit walang mali sa sarili kong code.
- **T: Kung binura ko na ang secret sa sumunod na commit, bakit problema pa rin?**
  S: Dahil nasa **history** pa rin ito: kahit sino ay puwedeng mag-`git log -p` o tumingin sa lumang commit sa GitHub. Sa public repo, may mga bot na naghahanap nito
  sa loob ng ilang minuto. Ang tanging ayos ay **i-rotate** ang secret (gumawa ng bago, patayin ang luma). Hindi sapat ang pagbura.
- **T: Ano ang pagkakaiba ng tag, SHA at digest?**
  S: Ang **tag** (`v7`, `v8.30.1`) ay isang pangalang puwedeng ilipat sa ibang code. Ang **commit SHA** (para sa action) at ang **digest** (para sa Docker image)
  ay hash ng mismong laman: kapag nagbago ang code, iba ang hash. Kaya ang naka-pin sa SHA o digest ay laging pareho ang tatakbo.
- **T: Bakit hindi agad i-update ang lahat ng package sa pinakabago?**
  S: Dahil ang pinakabago ay puwedeng may bug, o mismong ang atake (hal. ninakaw na account ng maintainer na naglabas ng malisyosong version).
  Ang cooldown na 7 araw ay nagbibigay ng panahon para matuklasan iyon ng iba. Ang mga **security** update ay hiwalay na usapan: kapag may alam na butas, dapat mabilis.
- **T: Ano ang hindi nahuhuli ng `npm audit`?**
  S: Ang mga **hindi pa kilalang** butas, at ang bagong malisyosong package na wala pang advisory. Nakikita lang nito ang nasa database ng mga advisory.

## Susunod
- **Day 88 — Container scanning:** Grype sa Docker image, at alisin ang hindi kailangan sa runtime image.

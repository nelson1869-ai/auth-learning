# 05 — How We Work (paano nagtatrabaho ang team)

> Ito ang mga "patakaran ng bahay" — pareho sa karamihan ng totoong software teams.

## 1. Branches — huwag direktang magtrabaho sa `main`

`main` = ang bersyong laging **gumagana**. Bawat bagong trabaho ay sa sariling branch:

```bash
git checkout -b feature/hello-api     # gumawa ng branch at lumipat dito
# ... magtrabaho, mag-commit ...
git push -u origin feature/hello-api  # ipadala sa GitHub
# gumawa ng Pull Request sa GitHub → i-review → i-merge sa main
```

| Prefix ng branch | Para saan |
|---|---|
| `feature/...` | Bagong feature |
| `fix/...` | Pag-aayos ng bug |
| `docs/...` | Dokumentasyon lang |
| `chore/...` | Maintenance (hal. pag-update ng tools) |

## 2. Commits — maliliit, at may malinaw na mensahe

Format: `<uri>: <ano ang ginawa>`

```
feat: add hello world API
fix: return 400 when email is missing
docs: add tech stack
chore: add .gitignore
```

**Isang commit = isang lohikal na pagbabago.** Kapag kailangan mo ng "at" para
ipaliwanag ito ("nagdagdag ng login AT inayos ang typo"), dalawang commit dapat iyan.

## 3. Pull Requests (PR)

Bago i-merge sa `main`, gumawa ng PR sa GitHub — kahit ikaw lang ang team.
Doon mo makikita ang lahat ng binago nang sabay, at doon tatakbo ang automated
tests (simula Phase 6).

## 4. "Definition of Done" — kailan masasabing TAPOS ang isang bagay

- [ ] Gumagana (sinubukan mo mismo, hal. gamit ang `.http` file)
- [ ] **Naiintindihan mo** — kaya mong ipaliwanag ang bawat linya
- [ ] 🔐 Security: nasagot ang "paano ito aabusuhin?" para sa mga risk na itinuro sa lesson
- [ ] 🧪 QA: may test (simula Phase 6)
- [ ] 📝 May `.http` file kung may bagong endpoint (o na-update kung nagbago)
- [ ] 📊 May diagram kung may bago o nagbagong flow — at tugma ito sa code
- [ ] 📋 Na-update ang `docs/07-api-contract.md` kung may bago o nagbagong endpoint (simula Day 13)
- [ ] Naka-commit na may malinaw na mensahe
- [ ] Na-update ang docs kung may nagbago (hal. roadmap ✅)

## 5. Mga secret — HINDI kailanman sa Git

Password, API keys, `.env` files → **hindi kailanman** ise-save sa Git. Kapag
na-push na sa GitHub, ituring na nakita na ng lahat. Kaya may `.gitignore`.

## 6. Mga panuntunan ng Architect

- **"Anong problema ang nilulutas nito?"** — Bago magdagdag ng folder, library,
  o abstraction, sagutin ito. Kung walang malinaw na sagot, huwag idagdag.
- **Bawat file ay may isang trabaho** — at may listahan ng **HINDI dapat nasa
  loob** nito (tingnan ang README ng bawat role folder).
- **Official docs muna, hindi lumang tutorial.** Kapag nagbago ang isang library,
  isusulat natin ito nang ganito:
  ```
  LUMANG PARAAN (makikita mo pa sa mga tutorial) → KASALUKUYANG PARAAN
  ```

## 7. Format ng bawat lesson

Maikli at pare-pareho, para alam mo lagi kung ano ang aasahan:

| Bahagi | Laman |
|---|---|
| 🎯 **Layunin** | Ano ang gagawin natin, sa isang pangungusap |
| 💡 **Konsepto** | Ano ito, bakit kailangan, saan nakatira, paano nakikipag-usap sa iba |
| ✍️ **Gagawin mo** | Eksaktong mga hakbang — ikaw ang magta-type |
| ✅ **Inaasahang resulta** | Ano ang dapat mong makita kapag tapos ka na |
| 🔍 **Checklist bago tumuloy** | Ano ang titingnan natin sa review (kasama ang 🔐 at 🧪 kapag may kinalaman) |

Hindi tayo tutuloy sa susunod na lesson hangga't hindi tapos AT naiintindihan ang kasalukuyan.

## 8. `.http` files — manual na pagsubok ng bawat endpoint

Bawat bagong endpoint o feature ay may sariling `.http` file (pareho sa reference project):

- **Lokasyon:** `backend/http/`
- **Pangalan:** may numero, sunod-sunod: `01-health.http`, `02-register.http`, ...
  (tingnan muna ang pinakamataas na numero bago gumawa ng bago — walang dobleng numero)
- **Laman:** bawat request ay may Taglish na paliwanag kung ano ang inaasahang sagot
- **Header:** nakasulat ang **Day at Phase** kung kailan ginawa ang file, hal.
  `### 📅 Day 04 · Phase 2 (Unang API)` — para makita agad ang katugmang lesson sa roadmap
- **Tool:** VS Code extension na **REST Client** — may lalabas na "Send Request" sa itaas
  ng bawat request. I-install nang isang beses:
  ```bash
  code --install-extension humao.rest-client
  ```

Bakit hiwalay pa ito sa automated tests? Ang `.http` ay para **ikaw mismo** ang
makakita at makaintindi ng bawat request at sagot. Ang automated tests (Phase 6)
ay para mahuli ng computer ang mga sira nang kusa.

## 9. Diagrams — ang "mapa" ng code

- **Lokasyon:** `docs/diagrams/`, isang `.md` file bawat paksa, may ```` ```mermaid ```` blocks
- **Pangalan:** may numero: `00-architecture.md`, `01-register-flow.md`, ...
- **Paano tingnan:**
  - **Chrome:** patakbuhin ang `node docs/diagrams/build.mjs` (tuwing may bagong o binagong
    diagram), tapos buksan ang `docs/diagrams/index.html` — may navigator sa kaliwa
  - **GitHub:** kusang nire-render ang mermaid sa `.md` files
  - **VS Code:** Markdown Preview (`Ctrl+Shift+V`) + extension na
    *Markdown Preview Mermaid Support* (`bierner.markdown-mermaid`)
- **Direksyon — patayo o pahalang?**

  | Ilan ang hakbang/kahon? | Direksyon | Halimbawa |
  |---|---|---|
  | ~6 o mas kaunti, magkakaibang system | ➡️ `flowchart LR` | `00-architecture.md` |
  | Higit sa 6, o may desisyon (oo/hindi) | ⬇️ `flowchart TD` | flow ng login/register |

  Kapag kailangan mo nang mag-scroll nang matagal pakanan sa isang `LR`,
  senyales iyon na dapat itong gawing `TD`.
- **Panuntunan:** kapag nagbago ang code, i-update ang diagram. Ang diagram na
  hindi tugma sa code ay mas masama pa kaysa walang diagram.

## 10. Learning journal — isang file bawat araw

- **Lokasyon:** `docs/journal/phase-N/day-NN.md` (hal. `docs/journal/phase-1/day-01.md`)
- **Walang space** sa pangalan, at dalawang digit ang araw (`day-01`, hindi `day-1`)
  para tama ang pagkakasunod kapag umabot na sa `day-10`.
- **Notes lang, hindi code** — ang code ay nasa role folders.
- **Template:**
  ```markdown
  # Day 01 — YYYY-MM-DD · Phase N

  ## Ano ang ginawa ko
  ## Ano ang natutunan ko (sa sarili kong salita)
  ## Mga tanong ko pa / hindi pa malinaw
  ## Mga problema at paano ko nalutas
  ## Susunod
  ```
- Ang **"Mga tanong ko pa"** ang pinakamahalaga — dito magsisimula ang susunod na lesson.

## 11. Comments sa code — Taglish, maikli, at "BAKIT"

**Code = English** (pangalan ng variable, function, file). **Comments = Taglish.**

| | Halimbawa | |
|---|---|---|
| ✅ Paliwanag | `// Health check — para malaman ng monitoring kung buhay ang server` | Tumutulong umintindi |
| ❌ Naka-comment na code | `// res.json({ status: 'ok' });` | Patay na code — nasa Git na ang history |
| ❌ Inuulit ang code | `// tawagin ang res.json` | Walang dagdag na impormasyon |

- **Ipaliwanag ang BAKIT, hindi ang ANO** — nakikita na sa code kung ano ang ginagawa.
- **Maikli:** 1–2 linya. Para lang sa mahalaga, hindi sa bawat linya.
- **I-update kapag nagbago ang code** — ang maling comment ay mas masama pa kaysa wala.

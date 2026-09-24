# Day 03 — 2026-09-24 · Phase 2

## Ano ang ginawa ko
- Gumawa ng npm project sa `backend/` (`npm init -y`)
- Itinakda ang `"type": "module"` para gumana ang `import`
- Nag-install ng Express 5 (`npm install express`)
- Inayos ang `package.json` pagkatapos ng code review (description, `main`, `private`)
- Unang PR na may tunay na code setup

## Ano ang natutunan ko (sa sarili kong salita)
- **Node.js** = nagpapatakbo ng JavaScript sa labas ng browser (sa server/terminal).
- **`package.json`** = ID card ng project: pangalan, scripts, at listahan ng dependencies.
- **`node_modules/`** = kung saan naka-install ang mga package — napakalaki, kaya **hindi** sa Git; nire-reinstall gamit ang `npm install`.
- **`package-lock.json`** = eksaktong bersyon ng bawat package — **sine-save** sa Git para pareho ang install kahit saan.
- **`require` (luma) vs `import` (kasalukuyan):** ES Modules ang gamit natin, kaya `"type": "module"`.
- **Laging basahin ang ginawa ng isang tool** — kinopya ng `npm init -y` ang tanong sa README bilang description!

## Mga command na natutunan ko
- `npm init -y` — gumawa ng `package.json` gamit ang mga default
- `npm pkg set <field>=<value>` / `npm pkg delete <field>` — ligtas na pag-edit ng `package.json`
- `npm install <package>` — mag-install at idagdag sa `dependencies`
- `node --version` — tingnan ang bersyon ng Node
- `node -e '<code>'` — magpatakbo ng maikling JavaScript sa terminal

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Mga problema at paano ko nalutas
- **`bash: !',: event not found`** — sa bash, espesyal ang `!` sa loob ng `"double quotes"` (history expansion). Nalutas gamit ang `'single quotes'` sa labas: `node -e 'console.log("...!")'`.
- **Kakaibang `description` sa `package.json`** — kinuha ito ng `npm init -y` mula sa README. Inayos gamit ang `npm pkg set`.

## Susunod
- Day 04: Hello World server — ang unang route (`GET /api/health`)

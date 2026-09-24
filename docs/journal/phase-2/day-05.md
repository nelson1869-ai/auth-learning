# Day 05 — 2026-09-24 · Phase 2

## Ano ang ginawa ko
- Idinagdag ang `npm run dev` (`node --watch`) at `npm start` sa `package.json`
- Idinagdag ang `time` sa sagot ng `/api/health` — at nakita kong kusang nag-restart ang server nang mag-save ako
- Sinubukan ang `01-health.http` gamit ang REST Client ("Send Request")
- Code review: binura ang naka-comment na lumang code, inayos ang indentation (2 space), at nagdagdag ng maiikling Taglish na comment

## Ano ang natutunan ko (sa sarili kong salita)
- **Status codes:** ang unang digit ang uri — 2xx tagumpay, **4xx mali ng client**, **5xx mali ng server**.
- **200** = OK; **201** = may bagong nagawa (hal. register).
- **`node --watch`** = kusang nagre-restart ang server kapag nag-save; para sa development lang.
- **npm scripts** = maikling pangalan para sa mahabang command (`npm run dev`, `npm start`).
- **Comments:** Taglish, maikli, ipinapaliwanag ang BAKIT. Ang naka-comment na code ay patay na code — nasa Git na ang history.
- **Commit type `style:`** = pagbabagong walang epekto sa behavior (formatting, comments).

## Mga command na natutunan ko
- `npm pkg set scripts.dev="node --watch src/index.js"` — magdagdag ng npm script
- `npm run dev` / `npm start` — patakbuhin ang server (may watch / wala)
- `Shift+Alt+F` sa VS Code — i-format ang buong file
- `Ctrl+Shift+P` → "Reload Window" — i-reload ang VS Code para mabasa ang bagong settings

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Mga problema at paano ko nalutas
- **Naging 4 space ang indentation** pagkatapos mag-save — default iyon ng VS Code. Nalutas sa `"editor.tabSize": 2` sa `.vscode/settings.json`.

## Susunod
- Day 06: pagtanggap ng data — `POST` na may request body, at paghahati ng routes

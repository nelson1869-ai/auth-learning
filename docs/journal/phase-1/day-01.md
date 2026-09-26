# Day 01 — 2026-09-24 · Phase 1

## Ano ang ginawa ko
- Gumawa ng project folder (`auth-learning`) at 4 na role folder
- Nag-`git init -b main` (inulit dahil nawala ang `.git`)
- Binasa ang blueprint at ginawa ang unang commit

## Ano ang natutunan ko (sa sarili kong salita)
- Ang `git add` ay naglalagay ng file sa "kahon", at ang `git commit` ang nagse-seal nito bilang save point.
- Hindi nagtatala si Git ng mga walang-laman na folder, mga file lang.
- Ang `.gitignore` ang nagsasabi kung aling mga file ang hindi dapat i-save, gaya ng mga secret.

## Mga command na natutunan ko
- `git init -b main` — gawing git repo ang folder, simula sa branch na `main`
- `git status` — tingnan kung ano ang nagbago at ano ang naka-stage
- `git add .` — ilagay sa staging ang lahat ng binago
- `git commit -m "..."` — i-save bilang commit, may mensahe
- `git log --oneline` — tingnan ang listahan ng mga commit

## Mga tanong ko pa / hindi pa malinaw
- Hindi ko pa alam kung ano ang JWT at migration.

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang JWT?**
  S: JSON Web Token: isang maikling text na may laman (hal. `sub` = user id) at **pirma**. Ibinibigay ito ng server pagkatapos mag-login. Kapag ibinalik mo ito, sinusuri ng server ang pirma; kung may nagbago kahit isang letra, tatanggihan. Ginamit natin ito simula Day 16, nakatago sa httpOnly cookie.
- **T: Ano ang migration?**
  S: SQL file na naglalarawan ng isang pagbabago sa database (hal. gumawa ng table, magdagdag ng column). Naka-commit sa Git at nakanumero (`0000`, `0001`, `0002`...), kaya pareho ang database sa PC ko, sa tests, at sa production. Natutunan ko ito sa Day 11.
- **T: Bakit kailangan ang `.gitignore` sa simula pa lang?**
  S: Kapag na-commit ang secret (hal. `.env`), nasa history na ito kahit burahin mo pa sa susunod na commit. Mas madaling pigilan kaysa linisin.

## Mga problema at paano ko nalutas
- Nawala ang `.git`, kaya hindi na git repo ang folder. Nalutas ko ito sa pamamagitan ng `git init -b main` ulit.

## Susunod
- Day 02: GitHub repo, unang push, at unang Pull Request

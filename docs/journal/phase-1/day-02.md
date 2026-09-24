# Day 02 — 2026-09-24 · Phase 1

## Ano ang ginawa ko
- Gumawa ng sariling SSH key at idinagdag sa GitHub account ko
- Gumawa ng GitHub repo (`auth-learning`) at nag-push ng `main`
- Unang Pull Request: branch → commit → push → PR → merge (PR #1)
- Unang checkpoint tag: `checkpoint-phase-1`

## Ano ang natutunan ko (sa sarili kong salita)
- **SSH key = susi at kandado.** Ang private key (`id_ed25519`) ay nasa PC ko lang at hindi ibinibigay kahit kanino. Ang public key (`.pub`) ang ibinibigay sa GitHub.
- **Deploy key vs account key:** ang deploy key ay may access sa iisang repo lang; ang key sa account ko ay para sa lahat ng repo ko.
- **Remote** = ang kopya ng repo sa internet (`origin`). **Push** = ipadala ang commits doon; **pull** = kunin ang bago mula doon.
- **Commit vs push:** ang commit ay save point sa PC ko lang; ang push ang nagpapadala nito sa GitHub.
- **Branch** = hiwalay na linya ng trabaho para hindi magalaw ang `main`. **PR** = "pakitingnan bago isama". **Merge** = isama na sa `main`.
- **Tag** = permanenteng save point na may pangalan, para makabalik sa eksaktong estado.

## Mga command na natutunan ko
- `ssh-keygen -t ed25519 -C "email"` — gumawa ng SSH key
- `ssh-keygen -p -f ~/.ssh/id_ed25519` — magdagdag/magpalit ng passphrase
- `ssh -T git@github.com` — subukan kung kilala ako ng GitHub
- `git remote add origin <url>` / `git remote -v` — ikonekta at tingnan ang remote
- `git push -u origin main` — unang push; sa susunod `git push` na lang
- `git checkout -b <branch>` — gumawa ng branch at lumipat dito
- `git diff` — tingnan ang eksaktong binago bago mag-commit
- `git branch -d <branch>` — burahin ang merged na branch
- `git tag <pangalan>` / `git push origin <tag>` — gumawa at mag-push ng tag

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Mga problema at paano ko nalutas
- **`Repository not found`** — hindi ko pa nagagawa ang repo sa GitHub website. Nalutas nang gawin ko muna ang repo, tapos push ulit.
- **`branch ... not found`** — napatakbo ko ang huling hakbang (burahin ang branch) bago pa nagawa ang branch. Aral: mahalaga ang pagkakasunod ng mga Git command.
- **Laging itinatanong ang passphrase** — nalutas gamit ang `keychain`: isang beses na lang bawat pagbukas ng PC.
- **Walang laman ang branch sa PR** — napatakbo ang mga command pero nalaktawan ang pag-edit ng files. Aral: `git status` at `git diff` muna bago mag-commit.

## Susunod
- Phase 2, Day 03: Node.js at npm — ang unang backend code ko

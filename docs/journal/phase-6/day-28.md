# Day 28 — 2026-09-26 · Phase 6 · huling araw

## Ano ang ginawa ko
- Ruleset **`main-protection`** sa GitHub (Settings → Rules): active, `main`, walang bypass — restrict deletions, block force pushes, PR required (0 approvals), required checks **`backend`** at **`frontend`**
- Ginawang **public** ang repo (D-016) — sa private + GitHub Free, "won't be enforced" ang ruleset. Bago iyon, sinuri ng AI ang buong git history: walang secret na na-commit.
- **Patunay:** PR #33 na may sadyang bagsak na test (`expect(1 + 1).toBe(3)`) → sa GitHub: `1 failed | 10 passed` → ❌ `backend` → hindi na-merge; isinara at binura ang branch (`git branch -D` — sinadyang itapon)

## Ano ang natutunan ko (sa sarili kong salita)
- **Branch protection** = ginagawang HADLANG ang CI, hindi lang babala. "Never break main."
- **Required status checks** — eksaktong pangalan ng job; ang typo (`bakend`) ay haharang sa LAHAT ng merge magpakailanman. Piliin mula sa listahan, huwag i-type.
- **Walang bypass** — kasama ako sa haharangin.
- **Public repo** = portfolio, pero lahat ng commit ay makikita — `.env` laging gitignored; walang self-hosted runner (Day 37).
- `git branch -d` (ligtas, tumatanggi kung hindi naka-merge) vs `-D` (pilit — kapag sinadyang itapon).
- **Sagot sa checkpoint (draft):** nahuhuli ng test ang pagkasira nang KUSA sa bawat PR, sa malinis na makina, at kaya na ngayong harangin ang merge — ang `.http` ay ako pa ang pumipindot at tumitingin.

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- ✅ Tag `checkpoint-phase-6` → Phase 7: TypeScript

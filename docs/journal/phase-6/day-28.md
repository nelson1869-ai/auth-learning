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
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung ako lang ang gumagawa, bakit kailangan ng branch protection?**
  S: Para hindi ako mismo ang makasira ng `main` nang hindi sinasadya (hal. push na bagsak ang test). Walang bypass, kaya kahit ako ay dadaan sa PR at berdeng CI.
- **T: Ligtas bang public ang repo?**
  S: Oo, basta walang secret sa Git history (sinuri bago ginawang public). Ang panganib ay nasa mga bagay na kayang patakbuhin ng ibang tao, kaya walang self-hosted runner (D-020) at walang default na admin password (D-023).
- **T: Ano ang mangyayari kapag mali ang pangalan ng required check (`bakend`)?**
  S: Maghihintay ang GitHub sa check na hindi kailanman darating, kaya haharangin ang LAHAT ng merge. Kaya piliin mula sa listahan, huwag i-type.

## Susunod
- ✅ Tag `checkpoint-phase-6` → Phase 7: TypeScript

# Day 89 — 2026-09-29 · Phase 18 · Ligtas na CD

## Ang tanong ng araw
"Deploy lang ang eksaktong commit na pumasa sa CI." Akala ko totoo na ito mula Day 37: galing sa CI ang image, naka-tag sa commit.
Totoo nga ba? At kapag sinabi ng `migrate` na "applied", na-apply nga ba?

## Sinukat muna — tatlong butas
1. **Ang config ay galing sa working copy, hindi sa commit.** Binabasa ng `deploy.sh` ang compose, monitoring at cloudflared config
   sa folder ng PC, anumang branch ang naka-checkout. Sinubukan: pinalitan ko ang `stop_grace_period` ng 99s sa working copy.
   Iyon ang gagamitin ng deploy, habang 10s ang nasa commit na sinuri ng CI. (Ito ang insidente #18 ng reference: nag-deploy mula sa feature branch.)
2. **Ang tag ay pangalan lang.** Ang `…/auth-learning-backend:<sha>` sa GHCR ay puwedeng ilipat sa ibang laman ng kahit sinong may `packages:write`.
3. **🔥 Tahimik na nilalaktawan ng drizzle ang isang migration.** Sa **test** database: nagdagdag ako ng migration na **mas luma ang timestamp** kaysa sa huling na-apply
   (gaya ng migration mula sa branch na matagal nang nakabinbin). Resulta ng `migrate()`: **walang error, walang table na nagawa, walang row sa talaan**.
   Ina-apply lang pala ng drizzle ang mga migration na **mas bago** kaysa sa huling na-apply. Sa production, dati: "Migrations applied" → restart
   → ang bagong code ay tatakbo sa database na **kulang ng table**. Parehong uri ng insidente #21 ng reference ("applied successfully" pero hindi pala).

## Ano ang ginawa (D-031)
**`deploy.sh`, apat na bantay** (lahat ay tumatanggi nang **"walang ginalaw"** bago pa baguhin ang production):
- **(a) Walang aksidenteng rollback:** kapag mas luma ang commit kaysa sa naka-deploy, kailangan ng `ROLLBACK=1`.
- **(b) `devops/` = commit:** kapag iba ang config sa PC (ibang branch, o may hindi pa naka-commit), tumatanggi. Kasama ang `deploy.sh` mismo.
- **(c) Attestation:** sinusuri ang **nilagdaang patunay** ng GitHub na ang image na may ganitong **digest** ay binuo ng `ci.yml`, sa `main`, mula sa commit na ito,
  at hindi sa self-hosted runner. Pagkatapos, ang migrate ay tumatakbo sa **digest**, hindi sa tag.
- **(d) Migrations na SINUSURI:** pagkatapos ng `migrate()`, ikinukumpara ng `verifyMigrations.ts` ang journal ng image sa `drizzle.__drizzle_migrations`.
  May kulang → **exit 1**, hindi ni-restart ang backend. Mas bago ang database (rollback) → kailangan ng `ROLLBACK=1`.

**CI:** label na `revision` sa image, at `actions/attest-build-provenance` (naka-pin sa SHA) pagkatapos ng push. Nilagdaan gamit ang OIDC ng GitHub: walang key na iniimbak.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 6 na test: `verifyMigrations` (3) + ang **totoong script** `migrate.ts` (3): late branch · lumang image ± `ROLLBACK=1` · tugma | ✅ 6/6 · hindi nagalaw ang test database (13 pa rin) |
| Sadyang sira: walang pagsusuri sa "kulang" · pinapayagan ang rollback nang walang `ROLLBACK=1` | ✅ bumagsak ang tamang test sa bawat isa |
| `deploy.sh` mula sa feature branch (binago ang `devops/`) | ✅ tumanggi, walang ginalaw |
| `deploy.sh` sa mas lumang commit | ✅ tumanggi, walang ginalaw |
| `deploy.sh` sa commit na wala sa main | ✅ tumanggi, walang ginalaw |
| Attestation (unang image na mayroon: `7c3f620`) — tamang commit · ibang commit · ibang workflow | ✅ exit 0 · exit 1 ("expected SourceRepositoryDigest…") · exit 1 |
| **Totoong deploy** ng `7c3f620` | ✅ attestation ✅ · **Migrations: 13 sa database, 13 sa image — verified (Neon)** · Live · graceful exit 0 · 3.8s na puwang |
| Rollback sa image na walang attestation (`ROLLBACK=1`, walang `ALLOW_UNATTESTED`) | ✅ pinayagan ang (a) at (b) nang may babala, **tumigil sa (c)** bago mag-migrate — hindi nagalaw ang production |
| `.http` 33 (attestations API ng GitHub, publiko) | ✅ 200 · 404 |
| Buong suite · tsc · lint | ✅ 204 · ✅ · ✅ |

## Dalawang lumang claim na naitama
- **Diagram 09:** "ang dine-deploy ay … hindi 'kung ano ang nasa working copy'". Totoo lang para sa **image**, hindi sa config, hanggang ngayon.
- **`backend/README.md`:** "Migrations sa production: `drizzle-kit migrate`" mula sa PC. Mali mula pa Day 37 (ang `deploy.sh` ang gumagawa, sa loob ng image),
  at ngayon ay **nilalampasan pa nito ang bagong pagsusuri**. Itinama: `deploy.sh` lang.

## Isang epekto na dapat tandaan
Kasama sa bantay (b) ang **lahat** ng nasa `devops/`, pati ang `README.md`. Kaya pagkatapos ng merge na may binago sa `devops/`,
tatanggi ang deploy hangga't **hindi pa tapos ang CI** ng bagong commit (ang pinakabagong "berde" ay mas luma, at iba ang `devops/` nito).
Sadya ito: maghintay ng berde. Kapag talagang kailangan (hal. emergency rollback), `ROLLBACK=1`.

## Kumpara sa reference
- **Pareho:** eksaktong SHA, migrations sa parehong image na ide-deploy, at pagbilang ng migrations laban sa journal (#21).
- **Iba:** attestation ng digest (ang reference ay **bumubuo ng image sa PC mismo** mula sa deploy clone, walang registry, kaya walang tag na mapapalitan — pero ang PC ang gumagawa ng build); **pagsusuri ng config sa parehong working copy** sa halip na hiwalay na deploy clone
  (walang paglilipat ng secret); tinitingnan ang **bawat** migration ayon sa timestamp, hindi lang ang bilang (ang bilang ay puwedeng magtugma kahit may nilaktawan
  kapag may dagdag din); at `ROLLBACK=1` para sa sadyang pagbalik.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang attestation, sa simpleng salita?**
  S: Isang nilagdaang resibo mula sa GitHub: "Ang file na may ganitong fingerprint (digest) ay ginawa ng workflow na ito, mula sa commit na ito."
  Ang lagda ay galing sa pansamantalang certificate na ibinibigay lang sa tumatakbong workflow, kaya hindi ito magagawa ng iba, kahit may access sila sa GHCR.
- **T: Bakit hindi sapat na tingnan ang label na `revision` sa image?**
  S: Dahil ang label ay isinusulat ng gumawa ng image. Ang taong nagpalit ng image ay puwede ring maglagay ng anumang label. Ang attestation ay may lagda na hindi niya kayang gawin.
- **T: Bakit nilalaktawan ng drizzle ang isang migration?**
  S: Para bilis: ang tinitingnan lang nito ay "ano ang huling na-apply?", at ina-apply ang mga mas bago roon. Ayos iyon kapag isa-isang nagagawa ang migration.
  Pero kapag may migration na nagawa noon sa ibang branch at na-merge lang ngayon, mas luma ang timestamp nito, kaya nilalaktawan. Kaya ang pagsusuri ay sa **bawat** migration.
- **T: Kailan ko gagamitin ang `ROLLBACK=1`?**
  S: Kapag may sira ang bagong deploy at gusto kong bumalik sa dati. Paalala: hindi binabawi ang migration. Ligtas lang ang pagbalik kung ang lumang code ay gumagana pa
  sa bagong schema (kaya hindi dapat magbura ng column sa parehong deploy na tumitigil nang gumamit nito).

## Susunod
- **Day 90 — Data retention:** oras-oras na paglilinis ng expired na data, may advisory lock.

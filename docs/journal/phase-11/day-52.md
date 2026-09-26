# Day 52 — 2026-09-27 · Phase 11 · Rotation at reuse detection

## Ano ang ginawa
- **Rotation:** bawat `POST /api/auth/refresh`, binabawi ang lumang refresh token (`revoke_reason = 'rotated'`) at
  nagbibigay ng **bago** sa parehong family.
- **Reuse detection:** kapag ginamit ulit ang lumang token, dalawang tao ang may hawak nito, kaya **binabawi ang buong family**
  (`'reuse'`), may WARN sa log, at may audit row na `refresh_reuse`. Ang ibang login ko (ibang family) ay hindi ginagalaw.
- **Reuse interval (10 segundo):** kapag na-rotate ang token kanina lang at buhay pa ang family, ang pangalawang request ay
  **sabay na refresh** (hal. dalawang tab na iisa ang cookie), hindi pagnanakaw. Access token lang ang ibinibigay.
- **Migration `0005`:** column na `revoke_reason`.
- **Tests: 88** (5 bago).

## Ang race condition na nahuli ng test
Unang bersyon: magkahiwalay ang pag-claim ng lumang token at ang pag-insert ng bago. Nang subukan ang **5 sabay na refresh**:
`[401, 204, 401, 401, 401]`. Sa pagitan ng claim at insert, walang nakitang aktibong token ang mga natalo, kaya itinuring nila itong nakaw.
Sa totoong buhay, **mala-logout ang user na may dalawang tab**.

**Ayos:** iisang **transaction** para sa claim at sa bagong token. Naka-lock ang row habang hindi pa tapos ang nanalo, kaya naghihintay
ang iba, at nakikita nila ang bagong token pagdating ng turn nila. Pumasa nang **5/5** na takbo. Nang tanggalin ang transaction para
patunayan ang test: bumagsak nang **3/3**.

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | walang transaction · walang pagbawi ng family · walang interval · binabawi ang LAHAT ng session | ✅ bumagsak ang bawat isa |
| Dev, browser | dalawang tab, expired ang access token, sabay na Admin page | ✅ parehong naka-load (tapat na tala: 1 refresh lang ang nangyari, nauna ang isang tab) |
| Dev, curl | totoong replay pagkalipas ng 11s | ✅ 401 sa magnanakaw **at** sa bagong token ng user · WARN · audit row |
| Production, curl | rotation · lumang token sa loob ng 10s · pagkalipas ng 11s | ✅ bagong token · 204 · 401 at 401 · 6 migrations · audit row |
| Production, browser | 3 beses "nag-expire" ang access token sa Admin page | ✅ 204 ×3 · napalitan ang refresh cookie · 0 CSP violation |

## Kumpara sa reference
- Pareho: rotation, atomic na claim (`UPDATE … WHERE revoked_at IS NULL RETURNING`), pagbawi ng buong family.
- **Iba:** may **reuse interval**. Wala nito ang reference ("no refresh grace window"), dahil wala silang frontend.
- **Iba:** nasa transaction ang claim at ang bagong token. Sa reference, magkahiwalay ang dalawa. Mas mahigpit ang reference (walang interval),
  kaya ang natalo roon ay agad na "reused". Ang race na nahuli natin ay dahil sa pagsuri natin ng "buhay pa ba ang family".
- **Iba:** may `revoke_reason`, para malaman kung bakit binawi (rotated, reuse o logout).

## Ang pinakanatutunan
- **Rotation = bawat token ay isang beses lang magagamit.** Kaya kapag ginamit nang dalawang beses, siguradong may kopya ang ibang tao.
- **Bakit ang buong family:** hindi alam kung sino ang tunay na user, kaya pareho silang mala-logout. Makakapag-login ulit ang tunay na user; ang magnanakaw, hindi.
- **Subukan ang tunay na sabay na mga request** (`Promise.all`), dahil doon lang lumalabas ang race condition.
- **Security vs usability:** ang 10-segundong interval ay maliit na palugit para hindi ma-logout ang user na may dalawang tab.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano kung ang magnanakaw ang UNANG gumamit ng token, bago ang tunay na user?**
  S: Siya ang makakakuha ng bagong token. Pero pagbalik ng tunay na user (lampas 10s) gamit ang luma, reuse iyon, kaya babawiin ang buong family,
  pati ang token ng magnanakaw. Kaya kahit sino ang mauna, natatapos ang session ng magnanakaw.
- **T: Walang katapusan ba ang session kapag laging aktibo ang user?**
  S: Oo: bawat rotation ay may bagong 7 araw (sliding expiration). Mas ligtas kung may absolute na limit (hal. 30 araw mula sa login,
  kahit aktibo). Kandidato ito para sa backlog.
- **T: Bakit access token lang ang ibinibigay sa reuse interval, walang bagong refresh token?**
  S: Kapag bibigyan din ng refresh token, dalawang aktibong token na ang nasa family, at hindi na malalaman kung alin ang nakaw.
  Ang bagong refresh token ay nasa cookie na mula sa unang request (iisa ang cookie ng dalawang tab).

## Susunod
- Day 53 — totoong logout: bawiin ang refresh token sa **database**, hindi lang burahin ang cookie.

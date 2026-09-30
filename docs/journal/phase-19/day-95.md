# Day 95–96 — 2026-09-30 · Phase 19 · Pagdagdag ng passkey (registration ceremony)

> Dalawang araw ng roadmap sa isang takbo. "yes go" ang sabi ko; ang AI ang sumulat ng code, sumubok, at nagpaliwanag dito.

## 🎯 Layunin
Makapagdagdag ang naka-login na user ng passkey sa account niya, makita ang listahan, at makapagbura. **Hindi pa kasama ang login gamit ang passkey** (Day 97–98).

## 💡 Konsepto: bakit dalawang hakbang
May **device** sa gitna, kaya hindi ito kaya ng isang request:

1. **Options** — server: "narito ang challenge, kung sino ako (RP), at kung sino ka."
2. *(sa browser at device)* fingerprint / PIN → **bagong key pair** para sa site na ito → pirma.
3. **Verify** — server: tama ba ang challenge, ang origin, ang RP ID, at na-verify ba ang user? Kung oo: i-save ang **public key**.

Ito ang tatlong bahagi ng Day 94 (key pair, challenge, origin), ngayon ay may totoong library at database. Diagram: `docs/diagrams/28-passkey-register.md`.

## Ano ang ginawa (D-037)
**Backend**
- **Migration 0013:** `passkeys` (public key, `credential_id` UNIQUE, counter, transports, device type, pangalan) at `webauthn_challenges` (isa bawat user, 5 minuto).
- **`lib/webauthn.ts`:** RP ID at origin mula sa `CLIENT_URL`; pag-save at pagkuha-at-bura ng challenge.
- **`services/auth/passkey.service.ts`:** simula, tapos, listahan, bura. **`controllers/passkey.controller.ts`**, 4 na route sa `routes/auth.ts`.
- **Rate limiter** `passkey-register` (10 palpak / 15 min) dahil humihingi ng password ang hakbang 1.
- 3 bagong audit action: `passkey_added`, `passkey_add_failed`, `passkey_removed`.
- OpenAPI: 4 na path, 6 na schema; ang mga type ng frontend ay galing doon.

**Frontend**
- **`/passkeys`** (`PasskeysPage.tsx`): listahan, "Magdagdag ng passkey" (pangalan + kasalukuyang password), "Burahin". Link mula sa Profile.
- `@simplewebauthn/browser` para sa `navigator.credentials.create()`.

## Anim na desisyon, at bakit
| Desisyon | Bakit |
|---|---|
| **Password muna** bago magdagdag | Ang passkey ay bagong paraan ng pagpasok. Kung session lang, ang nakaw na session ay makakapagdagdag ng sarili niyang passkey at mananatili kahit palitan ko ang password. *Wala ito sa reference.* |
| RP ID at origin **mula sa `CLIENT_URL`** | Sa reference, naiwang `WEBAUTHN_RP_ID=localhost` sa production. Dito, walang hiwalay na setting na maiiwan |
| Challenge sa **database**, hindi Redis | Fail-open at opsyonal ang Redis natin. Ang challenge ay hindi puwedeng mawala |
| **Isang subok** bawat challenge | `DELETE … RETURNING`: burado na bago pa suriin. Atomic, kaya kahit tatlong sabay na verify, isa lang ang papasa |
| **Iisang 400** sa lahat ng pagpalya | Hindi tinutulungan ang umaatake. Ang dahilan ay nasa audit log |
| Public key lang ang naka-save | Walang sikreto sa database. Hindi nakakapirma ang public key |

## Paano sinubukan nang walang totoong device
Ang sabi ng reference: hindi ito kaya ng Vitest, kailangan ng browser. **Hindi pala kailangan ng browser para sa server side.**
Sumulat ang AI ng **software authenticator** (`src/test/softAuthenticator.ts`, ~80 linya): totoong ES256 key pair, at ang `attestationObject` na eksaktong hugis ng galing sa device.
Ang `clientDataJSON` (na sa totoo ay gawa ng browser) ay gawa ng test, kaya **kayang pekein ang origin, ang RP ID at ang challenge**. Iyon mismo ang mga atake.
Ang pagsusuri ay sa **totoong library** pa rin, hindi mock.

**18 test** (`routes/passkeys.test.ts`), lahat laban sa totoong database:

| Sinubok | Resulta |
|---|---|
| Walang login (4 na route) | 401 |
| Maling password | 400 + audit, walang challenge |
| Tamang rehistro | 201, public key sa database, **walang private key**, audit |
| **Replay** (parehong sagot ulit) | 400 |
| **Phishing** (ibang origin) | 400, walang na-save |
| Ibang RP ID · walang user verification | 400 |
| Challenge ng **ibang user** · gawa-gawang challenge | 400 |
| Walang challenge · expired (5 min) | 400 |
| Bagong options → patay ang lumang challenge | 400 |
| **3 sabay na verify**, iisang sagot | eksaktong isang 201 |
| Parehong passkey ulit — sa akin, at sa **ibang account** | 409 |
| `userId` sa body (mass assignment) | binalewala |
| 10 na passkey | 409 |
| Listahan at bura ng **iba** (IDOR) | sarili lang · 404 |
| Bura ng account | burado rin ang passkeys at challenge (CASCADE) |

**Sadyang sinira ang code, 10 beses** (pagkatapos i-commit), nahuli lahat: walang password check · dagdag na origin · hindi binubura ang challenge (4 na test ang bumagsak) ·
hindi kailangan ang user verification · bura na hindi naka-scope sa user · dagdag na RP ID · binalewala ang expiry · listahan na hindi naka-scope · walang limit · mensahe ng library sa audit.

## Sa totoong browser
Headless Chromium + **virtual authenticator** (Chrome DevTools Protocol): ang totoong `navigator.credentials.create()`, walang hardware.

| Hakbang sa `/passkeys` | Nakita |
|---|---|
| Maling password | "Incorrect password" sa tabi ng field · **0** credential sa device (hindi man lang binuksan ang dialog) |
| Tamang password | "✅ Naidagdag: Virtual device" · nasa listahan · nabura ang password sa form |
| Sa device | 1 credential: `rpId: localhost`, resident, **may private key** (doon lang) |
| Parehong device ulit | "May passkey na ang device na ito" (tumanggi ang **browser**, dahil sa `excludeCredentials`) |
| Reload | nasa listahan pa rin |
| Burahin | "Wala ka pang passkey" |

**Hindi ito sa karaniwang dev setup.** Okupado ang port 5173 ng **ibang project ko** (`mern-ecommerce`), at ang 3000 ng dev server ko. Kaya pansamantalang backend sa 3055 (parehong code, `CLIENT_URL=http://localhost:5174`) at Vite sa 5174. Pinatay pagkatapos. *(Unang sinubukan ang 3001: okupado pala ng Grafana ng ibang project. Hindi ito ginalaw.)*

## Production (deploy `0b7d320`)
PR #165. `deploy.sh`: attestation ✅ · backup bago mag-migrate ✅ · **14/14 migrations** (0013 ang bago) · `ready`.

Parehong browser test, sa **`https://nelson1869.com/passkeys`**, gamit ang test account na `delivered+passkey…@resend.dev` (ang sink ng Resend, hindi totoong inbox):

| Hakbang | Nakita |
|---|---|
| Maling password | "Incorrect password" · 0 credential sa device |
| Tamang password | naidagdag · sa device: **`rpId: nelson1869.com`**, resident, may private key |
| Parehong device ulit | tumanggi ang browser ("May passkey na ang device na ito") |
| Reload | "Virtual device" nasa listahan |
| Burahin | "Wala ka pang passkey" |
| Audit log ng account | `register`, `login`, `passkey_add_failed:wrong_password`, `passkey_added`, `passkey_removed` |

Pagkatapos: **binura ang test account** ayon sa eksaktong id (36) at email. Burado rin ang naiwang challenge (CASCADE). 1 user ulit: ako.
Ang RP ID sa production ay `nelson1869.com` nang walang binagong setting — iyon ang punto ng paghango nito sa `CLIENT_URL`.

**Tapat:** virtual authenticator pa rin ito, hindi totoong device. At isang linya ng script ang nagbasa ng listahan bago ito na-refresh (`added: []`); ang sumunod na mga hakbang (bilang = 1, at pagkatapos ng reload) ang nagpatunay na naroon ito.

**CI:** pumalya ang unang takbo ng `backend` job sa `npm ci` (`ETXTBSY` sa postinstall ng `esbuild` — isang race sa runner, bago pa tumakbo ang kahit anong test). Hindi ginalaw ng PR ang `esbuild`. Inulit ang job: pumasa.

## 🐛 Mga nahuli sa daan
1. **Napunta sa audit log ang mismong challenge.** Ang mensahe ng error ng library ay `Unexpected registration response challenge "…", expected "<ang totoong challenge>"`, at isinulat ko iyon nang buo sa `audit_logs.metadata`. Nakita nang tingnan ang database pagkatapos patakbuhin ang `.http`. Nasunog na ang challenge noon (isang gamit), kaya walang magagamit — pero hindi dapat naroon ang mga halagang galing sa umaatake o sa loob ng library. **Ayos:** kategorya lang (`challenge_mismatch`, `origin_mismatch`, …). May test: hindi dapat lumabas ang challenge sa audit log.
2. **Hindi kilala ng sarili nating type generator ang `maxItems`.** Pumalya nang malakas (gaya ng dapat) ang `npm run openapi`. Idinagdag sa mga keyword na pang-validation lang.
3. **Mali ang unang sinulat sa `.http`:** tatlong algorithm ang inilagay ko (EdDSA, ES256, RS256). Apat pala ang ibinabalik: may `-48` (ML-DSA-44, post-quantum) ang library na ito. Itinama pagkatapos ikumpara sa totoong sagot.
4. **Port na akala ko ay libre.** Ang check ko ay nag-print ng "busy" na linya at itinuloy ko pa rin sa 3001. Walang nasira, pero mali ang basa ko.

## Ang hindi pa ginagawa (tapat)
- **Hindi pa nasusubukan sa totoong phone, fingerprint reader o security key.** Virtual authenticator ng Chromium at software authenticator lang.
- **Hindi binubura ng change/reset password ang mga passkey.** Kung may nakapagdagdag ng passkey habang hawak ang account ko, mananatili iyon hanggang burahin ko sa `/passkeys`. At **walang email na abiso** kapag may bagong passkey.
- **Hindi pa magagamit sa login** ang passkey. Nairerehistro pa lang.
- **Walang E2E test sa repo** (ang browser test ngayon ay nasa scratchpad ng AI). Day 99 iyon.
- Hindi nililinis ng retention job ang `webauthn_challenges` (ngayon: hanggang isa bawat user).

## Kumpara sa reference
| | Reference | Dito |
|---|---|---|
| RP ID | hiwalay na env (`WEBAUTHN_RP_ID`) — naiwang `localhost` sa production | hinango sa `CLIENT_URL` |
| Reauthentication bago magdagdag | wala | kasalukuyang password |
| Tests ng verify | Playwright lang (coverage ng `passkey.service.ts`: 40%) | software authenticator sa Vitest: 18 test, kasama ang mga atake |
| Mensahe ng pagpalya | — | iisang 400; kategorya sa audit |

## 🔍 Checklist bago ang Day 97
- [ ] Kaya kong ipaliwanag kung bakit dalawang request ang pagdagdag ng passkey.
- [ ] Kaya kong ipaliwanag kung bakit humihingi ng password kahit naka-login na ako.
- [ ] Kaya kong ipaliwanag kung bakit `DELETE … RETURNING` ang pagkuha ng challenge, at hindi `SELECT` tapos `DELETE`.
- [ ] Nagdagdag ako ng passkey sa totoong device ko sa `https://nelson1869.com/passkeys`, at nakita ko ito sa listahan.
- [ ] Tiningnan ko ang `passkeys` table (`npm run db:studio`): may `public_key`, walang private key.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang "RP" at "RP ID"?**
  S: Relying Party: ang site na umaasa sa passkey, ibig sabihin tayo. Ang RP ID ay ang domain (`nelson1869.com`). Doon **nakatali** ang passkey: hindi ito iaalok ng device sa ibang domain. Iyan ang unang bantay laban sa phishing.
- **T: Bakit may `credential_id` pa kung may public key na?**
  S: Ang credential id ang **pangalan** ng passkey ayon sa device. Sa login (Day 97), sinasabi ng device "ito ang credential id ko", at doon hahanapin ng server kung aling public key ang gagamitin sa pagsuri.
- **T: Ano ang `counter`?**
  S: Bilang ng pirma, ayon sa device. Kung sa susunod na login ay **mas mababa** ito kaysa sa naka-save, posibleng kinopya ang key. Maraming naka-sync na passkey ang laging 0, kaya pahiwatig lang ito. Susuriin sa Day 97.
- **T: Bakit hindi sinasabi ng server kung ano ang mali?**
  S: Ang totoong user ay walang magagawa sa "maling origin": uulitin lang niya. Ang umaatake naman ay matututo kung alin sa mga pinepeke niya ang tama na. Kaya iisang mensahe, at ang detalye ay sa audit log, na admin lang ang nakakakita.
- **T: Ano ang "discoverable" (`residentKey: required`)?**
  S: Itinatago ng device hindi lang ang key kundi pati **kung kaninong account** ito. Kaya sa Day 97, puwedeng mag-login nang hindi nagta-type ng email: ang device ang magsasabi kung sino.

## Susunod
- **Day 97–98 — Login gamit ang passkey:** authentication ceremony, at decoy options para hindi maibunyag kung sino ang may account.

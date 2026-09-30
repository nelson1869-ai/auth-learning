# Day 94 — 2026-09-30 · Phase 19 · Paano gumagana ang WebAuthn (konsepto bago ang code)

> ⚠️ Nagsimula ang Phase 19 habang **bukas pa ang isang item ng Phase 18**: ang Neon restore drill (wala pa ang `database/backups/.env.staging`). Sinabi kong "yes go" sa AI.
> Konsepto lang ang araw na ito: walang endpoint, walang binago sa `backend/src`, walang deploy.

## 🎯 Layunin
Maintindihan, bago sumulat ng kahit isang linya ng totoong code, kung bakit hindi nananakaw ang passkey sa phishing, samantalang ang password ay oo.

## 💡 Konsepto

### Ang problema ng password
Ang password ay isang **sikretong pinagsasaluhan**: alam ko, at (bilang hash) alam ng server. Para patunayang ako ito, **ipinapadala ko ang mismong sikreto**.
Kaya kahit sino ang makatanggap nito, magagamit niya ulit: isang pekeng site, isang keylogger, o ang database ng ibang site kung saan ginamit ko ang parehong password.
Lahat ng ginawa natin sa Phase 9–15 (rate limit, lockout, argon2, device cookies) ay pananggalang **sa paligid** ng problemang iyon. Hindi nito inaalis ang problema.

### Ang ideya ng passkey: huwag nang ipadala ang sikreto
Tatlong bahagi, at bawat isa ay pumipigil sa isang atake:

| Bahagi | Ano ito | Anong atake ang pinipigilan |
|---|---|---|
| **Key pair** | Gumagawa ang device ng **private key** (nananatili sa device) at **public key** (ibinibigay sa server). Ang pirma ng private key ay kayang suriin ng public key, pero hindi kayang gumawa ng pirma ang public key | **Nakaw na database:** public key lang ang makukuha, at hindi iyon sikreto |
| **Challenge** | Sa bawat login, nagpapadala ang server ng bagong random na halaga. Iyon ang pinipirmahan. Isang gamit lang | **Replay:** walang silbi ang lumang pirma |
| **Origin** | Ang **browser** (hindi ang page) ang naglalagay ng totoong address ng site sa pinipirmahan. At ang passkey ay nakatali sa site kung saan ito ginawa | **Phishing:** sa pekeng site, walang iaalok na passkey ang device; at kahit may pirma, maling origin ang nakasulat |

Ang fingerprint, mukha o PIN ay **hindi ipinapadala kahit saan**. Ginagamit lang ito ng device para payagan ang private key na pumirma.

### Nakita ko na ito dati: RS256 (Day 56)
Parehong matematika ng JWT natin: private key ang pumipirma, public key ang nagve-verify. Ang pagkakaiba ay **kung sino ang may hawak ng private key**:
- JWT: ang **server**. Pinapatunayan ng server sa sarili niya na siya ang gumawa ng token.
- Passkey: ang **device ng user**. Pinapatunayan ng user sa server na hawak niya ang device.

### Dalawang "ceremony" (ang tawag ng WebAuthn sa bawat flow)
- **Registration** (Day 95–96): gumagawa ang device ng key pair para sa site, at ipinapadala ang public key. Isang beses bawat device.
- **Authentication** (Day 97–98): challenge → pirma → verify. Sa bawat login.

### Mga salitang makikita ko sa susunod na mga araw
- **Relying Party (RP):** ang site natin. Ang **RP ID** ay ang domain (`nelson1869.com`); dito nakatali ang passkey.
- **Authenticator:** ang gumagawa at nagtatago ng key (phone, laptop, security key).
- **Credential:** isang passkey. May `credential id` at public key sa server.
- **`@simplewebauthn`:** ang library na gagamitin (nasa `02-tech-stack.md`). Ito ang bahala sa mga detalye ng format.

## ✍️ Ang ginawa (AI ang sumulat; ako ang magpapatakbo at magbabasa)
**`backend/playground/02-passkey-concept.js`**: ang tatlong bahagi sa ~60 linya, `node:crypto` lang. Walang library, walang browser, walang database.
Hindi ito bahagi ng app (nasa `playground/`, gaya ng `01-hash.js` ng Day 12).

```bash
cd backend && node playground/02-passkey-concept.js
```

## ✅ Inaasahang resulta (ito ang totoong lumabas)
```
Nasa server: MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQ… (public key lang)

1. Normal na login:         ✅ naka-login
2. Lumang sagot, inulit:     ❌ maling o nagamit nang challenge
3. Pirma mula sa pekeng site: ❌ maling origin (https://nelson1869.com.evil.example)
4. Binago ang origin:        ❌ maling pirma
5. Pirma ng ibang key:       ❌ maling pirma
```

Ang **#4** ang pinakamagandang pag-isipan: binago ng umaatake ang origin **pagkatapos** pumirma para magmukhang galing sa totoong site. Pumalya ito sa **pirma**, hindi sa origin, dahil kasama ang origin sa pinirmahan. Kapag binago ang kahit isang letra, hindi na tugma ang pirma.

## Tapat: saan ito IBA sa totoong WebAuthn
Pinasimple ang playground. Sa totoo (Day 95–98):
- Ang pinipirmahan ay `authenticatorData` + hash ng `clientDataJSON`, hindi isang JSON lang. Nasa `authenticatorData` ang hash ng RP ID at isang **counter**.
- May **user verification** flag (nagpakita ba ng fingerprint/PIN?) at **user presence** (may humawak ba?).
- Ang challenge ay dapat **nakatago sa server na may expiry** (database o Redis), hindi sa isang variable.
- Sa phishing, ang **unang** bantay ay ang device mismo: wala itong iaalok na passkey para sa ibang domain. Ang pagsusuri ng origin sa server ay pangalawang bantay. Sa playground, ang pangalawa lang ang ipinapakita.
- **Hindi ito sinubukan sa totoong browser o device ngayong araw.** Ang napatunayan ay ang lohika ng pirma, challenge at origin.

## Ang hindi inaayos ng passkey
- **Nawalang device:** kailangan pa rin ng ibang paraan para makapasok (password, isa pang passkey, o recovery). Kaya hindi natin aalisin ang password login.
- **Ninakaw na session:** pagkatapos ng login, cookie pa rin ang gamit. Ang nakaw na cookie ay nakaw pa rin (kaya may refresh rotation, Day 52).
- **Malware sa mismong device** ng user.
- **Naka-sync na passkey** (iCloud, Google): mas madaling gamitin, pero ang seguridad ay nakasalalay na rin sa account na iyon.

## 🔍 Checklist bago tumuloy sa Day 95
- [ ] Kaya kong ipaliwanag kung bakit walang silbi sa umaatake ang **public key** na ninakaw mula sa database.
- [ ] Kaya kong ipaliwanag kung bakit kailangang **bago** ang challenge sa bawat login.
- [ ] Kaya kong ipaliwanag kung bakit **browser** ang dapat maglagay ng origin, hindi ang page.
- [ ] Pinatakbo ko ang playground at nabasa ang limang resulta.
- [ ] Sinubukan kong sirain ito: alisin ang `server.challenge = null` at tingnan kung alin sa lima ang magbabago.

## Kumpara sa reference
May buong passkey ang reference (`passkey.service.ts`, `webauthn_challenges`, `webauthn_credentials`, Playwright E2E). Wala itong hiwalay na "concept" na script; idinagdag ito rito dahil para sa pag-aaral ang project.
Isang babala mula sa reference na tatandaan sa Day 95: ang `WEBAUTHN_RP_ID=localhost` sa production ay gumagana lang sa localhost.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung nasa device ang private key, paano kapag nagpalit ako ng phone?**
  S: Dalawang uri. Ang **naka-sync** na passkey (iCloud Keychain, Google Password Manager) ay sumasama sa bagong device. Ang **nakatali sa device** (hal. security key) ay hindi, kaya dapat may higit sa isang passkey o may ibang paraan ng pagpasok.
- **T: Ipinapadala ba ang fingerprint ko sa server?**
  S: Hindi. Sa device lang ito ginagamit, para payagan ang private key na pumirma. Ang natatanggap ng server ay pirma at isang flag na "na-verify ang user".
- **T: Bakit hindi na lang gawing mas mahaba ang password?**
  S: Ang haba ay laban sa **panghuhula**. Hindi ito laban sa **phishing**: ang pinakamahabang password ay ibinibigay pa rin nang buo sa pekeng site.
- **T: Papalitan ba ng passkey ang password sa project?**
  S: Hindi. Idadagdag ito bilang isa pang paraan ng login. Mananatili ang password bilang fallback.

**Mga tinanong ko mismo ngayong araw:**
- **T: "wala ito.. database/backups/.env.staging.. you can check all.."**
  S: Sinuri ng AI: wala ang file sa repo, sa home folder ng WSL, at sa mga Windows user folder. Handa ang lahat ng iba (script, 21 backup, `.env.production`). Ang kulang lang ay ang connection string ng isang staging branch, na sa Neon console ko lang makukuha. Hindi pa ito nagagawa.

## Susunod
- **Bukas pa:** Neon restore drill (Phase 18).
- **Day 95–96 — Pagdagdag ng passkey:** registration ceremony. Bagong table, `@simplewebauthn`, at button sa frontend.

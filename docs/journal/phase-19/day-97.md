# Day 97–98 — 2026-10-01 · Phase 19 · Login gamit ang passkey (authentication ceremony) at ang decoy

> Dalawang araw ng roadmap sa isang takbo. "yes go" ang sabi ko; ang AI ang sumulat, sumubok at nagpaliwanag dito.

## 🎯 Layunin
Makapag-login gamit ang passkey na idinagdag noong Day 95, nang **walang password**, at nang hindi naibubunyag kung sino ang may passkey.

## 💡 Konsepto: ang pagkakaiba sa registration
| | Registration (Day 95) | Login (ngayon) |
|---|---|---|
| Naka-login na? | oo | hindi — ito mismo ang login |
| Ginagawa ng device | **bagong** key pair | **pirma** gamit ang key na mayroon na |
| Sinusuri ng server | ang bagong public key | ang pirma, gamit ang **naka-save** na public key |
| Kilala ang user sa options? | oo | hindi — ang device ang magsasabi (o ang email, kung ibinigay) |

Ito ang Day 94 sa totoong buhay: ang server ay may public key lang, kaya kahit manakaw ang database, hindi makakapirma ang magnanakaw.

## Ano ang ginawa (D-038)
**Backend**
- `POST /api/auth/passkeys/login/options` — walang email: `allowCredentials: []` (ang device ang pipili). May email: ang mga passkey ng account, o **decoy**.
- `POST /api/auth/passkeys/login/verify` — challenge → passkey ayon sa credential id → userHandle → pirma, origin, RP ID, user verification, counter → session.
- Parehong session at cookies ng password login. Audit: `login` / `login_failed` na may `method: "passkey"`.
- **Migration 0014:** UNIQUE index sa `webauthn_challenges.challenge` (hinahanap na ayon sa halaga).
- **Retention:** nililinis na ang expired na challenges (ang sa login ay walang user, kaya walang CASCADE).
- Dalawang bagong rate limit: 30 options, 10 palpak na verify, bawat 15 minuto bawat IP.

**Frontend**
- Login page: **"🪪 Mag-login gamit ang passkey"**. Kung may tinype na email, iyon lang ang tinatanong; kung wala, ang device ang pipili.

## 🔐 Ang decoy
Kapag may email sa options, ibinibigay ng server ang credential id ng mga passkey ng account (para alam ng browser kung alin ang hahanapin).
Kung `[]` ang sagot sa email na walang account, **ang options ay nagiging tanong na "may account ba si X?"**.

Kaya ang email na walang account (o walang passkey) ay may **isang pekeng id**:
- **HMAC ng email** gamit ang sikreto ng server → **pareho sa bawat hingi**. Kung random, makikita sa pag-ulit na peke ito.
- **Walang `transports`**, kahit sa totoo. Kung mayroon sa totoo at wala sa decoy, iyon mismo ang magbubunyag.

**Ang hindi nito tinatakpan:** laging 1 ang decoy, kaya ang account na may 2+ passkey ay nakikilala; at ang haba ng totoong id ay depende sa device.
Kaya **walang email ang default**: wala itong tinatanong tungkol sa kahit sino.

## Mga sinukat
**15 test** (`routes/passkey-login.test.ts`, software authenticator na pumipirma na rin):

| Sinubok | Resulta |
|---|---|
| Walang email | `allowCredentials: []`, challenge na walang user |
| Email na may passkey | ang mga id niya, walang transports |
| **Decoy**: walang account · walang passkey | parehong hugis · pareho sa pag-ulit · iba bawat email |
| Tamang pirma | 200, cookies, gumagana ang `/me`, counter at `last_used_at` na-save, audit |
| **Replay** | 401 — dahil nagamit na ang challenge (`no_challenge`) |
| **Phishing**: maling origin · maling RP ID | 401 |
| **Nakaw na public key**: pirma ng ibang private key | 401 (`bad_signature`) |
| Walang user verification · userHandle ng iba · hindi kilalang passkey · gawa-gawa/expired na challenge | 401 |
| **Kinopyang key**: bumabang counter (5 → 3) | 401 (`counter_regression`); 6 → 200 ulit |
| Binurang passkey | 401 (`unknown_credential`) |
| 3 sabay na verify, iisang sagot | eksaktong isang 200 |
| **Naka-lock ang password (423)** | passkey: 200 |

**Sadyang sinira ang code, 10 beses**, nahuli lahat: random na decoy · walang decoy · hindi binubura ang challenge · dagdag na origin · walang userHandle check ·
hindi kailangan ang user verification · binalewala ang counter · binalewala ang expiry · may transports ang totoo · hindi nililinis ng retention.

### 🐛 Nahuli ng pagsira: ang replay test ay pumapasa sa MALING dahilan
Nang sirain ko ang "isang gamit lang" ng challenge, **pumasa pa rin ang replay test**. Bakit? Tinanggihan pa rin ang replay — pero ng **counter** (parehong bilang ang lumang pirma), hindi ng challenge.
Ang test ay tumitingin lang kung 401, at kung may `no_challenge` **kahit saan** sa audit log (meron, mula sa ibang test).
Inayos: binibilang na ang `no_challenge` bago at pagkatapos, at dapat walang ibang dahilan para sa account na iyon. Ngayon, bumabagsak ito kapag sinira ang challenge.
**Aral:** ang test na pumapasa ay hindi nangangahulugang sinusubok nito ang sinasabi ng pangalan nito.

## Sa totoong browser (virtual authenticator)
| Hakbang | Nakita |
|---|---|
| Walang email | ✅ naka-login (`/profile`) |
| May email ko | ✅ naka-login |
| Email na walang account (decoy) | "❌ Kinansela, o naubos ang oras" — tumanggi ang device (walang passkey na tugma), 0.2s |
| Pagkatapos ng 2 login | `signCount` 3 sa device · "huling gamit" na-update sa `/passkeys` |
| Binura ang passkey sa server, nasa device pa | "❌ Passkey login failed" |

Pansamantalang mga port ulit (3055 at 5174). **Nag-restart ang PC habang ginagawa ito:** namatay ang dev Postgres at Redis (binuhay ulit ng AI), at nabura ang mga file ng AI sa `/tmp`. Kusang bumalik ang production.

## Ang hindi pa ginagawa (tapat)
- **Hindi pa sa totoong device.** Software at virtual authenticator lang.
- **Hindi sinukat ang oras** ng options para sa may account at wala (hindi gaya ng Day 72).
- Hindi binabago ng passkey login ang bilang ng maling password.
- **Walang E2E test sa repo** — Day 99.

## Kumpara sa reference
May decoy din ang reference. Dito, ang default ay **walang email** (walang tinatanong tungkol sa kahit sino), at ang decoy ay para lang sa piniling mag-type ng email.

## 🔍 Checklist bago ang Day 99
- [ ] Kaya kong ipaliwanag kung bakit hindi random ang decoy.
- [ ] Kaya kong ipaliwanag kung bakit hindi hinaharang ng password lockout ang passkey.
- [ ] Kaya kong ipaliwanag kung ano ang ibig sabihin ng bumabang counter.
- [ ] Nag-login ako gamit ang passkey sa totoong device ko, sa `https://nelson1869.com/login`.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Paano nalalaman ng server kung kaninong account kung walang email?**
  S: Ipinapadala ng device ang **credential id** (ang pangalan ng passkey) at ang **userHandle** (ang user id na itinago noong registration). Hinahanap ng server ang passkey ayon sa credential id, at sinusuring tugma ang userHandle sa may-ari.
- **T: Kung nakuha ng umaatake ang sagot ng device (ang pirma), magagamit ba niya?**
  S: Hindi. Ang pirma ay para sa **isang** challenge, at burado na iyon pagkagamit. Ang bagong login ay may bagong challenge, at kailangan ng private key para pumirma ulit.
- **T: Bakit may HMAC pa? Hindi ba puwedeng laging walang email na lang?**
  S: Puwede, at iyon ang default. Ang email ay para sa user na may ilang account sa iisang device, o gustong siguraduhin kung aling account. Kapag inaalok natin iyon, dapat hindi ito maging paraan para alamin kung sino ang may passkey.
- **T: Ano ang mangyayari kapag nawala ang phone ko?**
  S: Password pa rin (hindi natin ito inalis). Pagkapasok, burahin ang passkey ng nawalang phone sa `/passkeys`. At kung naka-sync ang passkey (iCloud, Google), nasa bagong phone na rin ito.

## Susunod
- **Day 99 — E2E test:** Playwright + virtual authenticator **sa repo** (ang ginawa ng AI ngayon ay nasa `/tmp` lang, at nabura na nga ng restart).

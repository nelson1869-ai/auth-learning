# Day 56 — 2026-09-27 · Phase 11 · RS256 at JWT claims

## Ano ang ginawa
- **RS256** na ang access token (dati HS256):
  - **private key** = pumipirma (nasa server lang, lihim);
  - **public key** = sumusuri (kinukuha mula sa private key; hindi ito makakagawa ng token).
- **`iss: auth-learning-api`** (sino ang gumawa) at **`aud: auth-learning-web`** (para kanino), na sinusuri sa bawat request.
- **`JWT_PRIVATE_KEY`** (D-024): PEM na naka-base64 sa `.env`. Sinusuri pagka-start: RSA, ≥ 2048 bits. Kung mali, ayaw mag-start ng server,
  at hindi ipinapakita ang laman.
- **Iba ang key** ng dev, test at production. **Ang CI ay gumagawa ng bagong key bawat run**, kaya walang key na naka-commit.
- **Production:** idinagdag ng AI ang bagong key sa `.env.production` (may backup, walang ipinakitang laman).
  Nandoon pa ang lumang `JWT_SECRET` **para sa rollback** sa lumang image.
- **Tests: 121** (12 bago).

## Ang pinakamagandang bahagi: walang kailangang mag-login ulit
Pinalitan ang buong paraan ng pagpirma. Ang lumang HS256 token ay tinanggihan (401), pero **kusang nag-refresh ang frontend** (Day 51),
at ang refresh token ay nasa database, hindi JWT. Sinubukan sa production: nag-login bago ang deploy (HS256), at pagkatapos ng deploy,
parehong browser: `me 401 → refresh 204 → me 200` (RS256). **Ito ang silbi ng dalawang token.**

## Paano napatunayan
| Saan | Sinubukan | Resulta |
|---|---|---|
| Tests | lumang HS256 · **algorithm confusion** · `alg: none` · ibang RSA key · maling `iss`/`aud` · walang claims | ✅ 401 lahat |
| Tests | pag-start na may maling key (hindi PEM · 1024-bit · EC) | ✅ tumatanggi, at hindi ipinapakita ang laman |
| Tests | tinanggal ang `iss`/`aud` check · tinanggal ang 2048-bit check | ✅ bumagsak ang tests |
| Dev | login → decode | ✅ `RS256` · `iss` · `aud` · 900s |
| Dev | walang `JWT_PRIVATE_KEY` | ✅ `exit 1` na may malinaw na mensahe |
| CI | bagong key bawat run | ✅ berde |
| Production | session mula BAGO ang deploy | ✅ walang login ulit · 0 CSP violation |

## Tapat na tala: ang algorithm confusion
Sinadya kong buksan ang butas (`algorithms: ['RS256', 'HS256']` + PEM string). **Hindi bumagsak ang test**, dahil ang `jsonwebtoken` v9
mismo ang tumatanggi (inayos nila ito, CVE-2022-23540). Kaya ang `algorithms: ['RS256']` natin ay **pangalawang bantay**, at ang test ay
magbabantay kung ma-downgrade o mapalitan ang library.

## Kumpara sa reference
- Pareho: RS256, `iss`/`aud`, private key para pumirma at public para sumuri.
- **Iba:** isang env var (base64) sa halip na dalawang file. Kasya ito sa `env_file` ng Docker, walang volume, at hindi puwedeng magkamali ng pares.
- **Iba:** fail-fast na pagsusuri ng key (RSA, ≥ 2048) pagka-start.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Kung iisang server lang ang gumagawa at sumusuri, may silbi ba ang RS256?**
  S: Ngayon, maliit pa. Pero kapag may ibang serbisyo na kailangang sumuri ng token (hal. isang hiwalay na API), ibibigay lang natin ang **public key**.
  Hindi sila makakagawa ng pekeng token. Sa HS256, kailangang ibigay ang secret, kaya makakagawa rin sila.
- **T: Bakit may `iss` at `aud`?**
  S: Para hindi tanggapin ang token na para sa ibang sistema. Halimbawa, kung may ibang app na gumagamit ng parehong key, hindi dapat gumana dito ang token nito.
- **T: Ano ang mangyayari kapag nanakaw ang private key?**
  S: Makakagawa ang magnanakaw ng token para sa kahit sino. Palitan ang key sa `.env.production` at mag-deploy. Tatanggihan ang lahat ng lumang token,
  at magre-refresh ang mga user nang hindi napapansin (napatunayan ngayon). Sa hinaharap: `kid` sa header para sa maayos na key rotation.

## Susunod
- Day 57 — review day ng Phase 11: suriin ang lahat ng `.http` at diagram, ang folder structure, at ang checkpoint question.

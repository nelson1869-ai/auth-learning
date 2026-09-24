# 01 — Project Brief

> Sa totoong team, ito ang unang dokumentong isinusulat: **ano** ang gagawin,
> **para kanino**, at **ano ang HINDI** gagawin (para hindi lumaki nang walang katapusan).

## Layunin

Gumawa ng simpleng authentication system na **gumagana nang totoo**
(may totoong database, totoong deploy, totoong domain), para matutunan ang
trabaho ng frontend, backend, database, at DevOps.

## Para kanino

- **User:** isang tao na gustong gumawa ng account at mag-login.
- **Ang team (ikaw):** nag-aaral ng bawat role, isa-isa.

## MVP — ang pinakamaliit na bersyong gumagana

> **MVP** = *Minimum Viable Product*. Ang pinakamaliit na bagay na may silbi na.
> Gagawin muna natin ito bago ang anumang "pagpapaganda".

- [ ] Mag-register gamit ang email at password
- [ ] Mag-login
- [ ] Makita ang sariling profile kapag naka-login ("Hello, <pangalan>")
- [ ] Mag-logout
- [ ] Nakatago nang ligtas ang password (hashed — hindi plain text)
- [ ] Tumatakbo sa internet gamit ang sariling domain at HTTPS

## Sa susunod (pagkatapos ng MVP)

Isa-isa, ayon sa [roadmap](03-roadmap.md) — bawat isa ay may katumbas sa reference project:
rate limiting, refresh tokens, account lockout, password reset, email verification,
passkeys, monitoring, at iba pa.

## HINDI saklaw (sinadya)

- Mobile app
- Bayad / payments
- "Login with Google" (baka sa hinaharap)
- Magandang disenyo — **gumagana muna, maganda mamaya**

## Paano natin malalaman na tapos na ang MVP?

Kapag ang isang kaibigan mo, gamit ang **sarili niyang phone**, ay nakapag-register,
nakapag-login, at nakapag-logout sa `https://<domain-mo>` — nang walang tulong mo.

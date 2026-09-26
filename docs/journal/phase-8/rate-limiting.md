# Rate limiting (Day 43, inagahan) — 2026-09-26 · bago ang MVP launch

## Bakit ngayon
Bago buksan ang app sa kaibigan ko, isinara muna ang pinakamalaking butas: walang limit sa panghuhula ng password at sa paggawa ng pekeng account. Nakikita na ng mga bot ang domain (public certificate logs).

## Ano ang ginawa (AI)
- `express-rate-limit` 8.7 — `middleware/rateLimiter.ts`: **login** 10 PALPAK / 15 min (hindi binibilang ang tamang login), **register** 10 / 15 min; 429 + `RateLimit` headers; log `{"event":"rate_limit",...}`
- **Susi = totoong IP:** sa likod ng tunnel, IP ng cloudflared ang `req.ip` ng lahat → `CF-Connecting-IP` kapag `TRUST_CLOUDFLARE=true` (production lang; ligtas dahil walang bukas na port)
- **May test** (hindi tulad ng reference na nilalaktawan ito): maliit na app na limit 3 — sinira nang dalawang beses (laging `req.ip`; binibilang ang tamang login) → parehong pumula
- `08-rate-limit.http`; deploy gamit ang `./devops/deploy.sh`

## Sinubukan nang live (mula sa internet)
- 11 maling login → 1–10: 401, 11: **429**, `RateLimit: "10-in-15min"; r=0; t=895`
- **Key sa log = ang totoong IPv6 ng bahay ko** (`2001:fd8:c431:f700::/56`), tugma sa `cdn-cgi/trace` ng Cloudflare — hindi ang IP ng container. Nasagot ang hindi nasuri ng reference ("cloudflared X-Forwarded-For unverified").
- Na-restart ang backend → nabura ang block (memory store)

## Ano ang natutunan ko (sa sarili kong salita)
- **Rate limiting** = limitahan ang subok bawat IP bawat panahon → hindi kayang manghula nang libu-libo.
- **Sa likod ng proxy, iba ang `req.ip`** — kailangang malaman kung aling header ang mapagkakatiwalaan, at kailan.
- **IPv6 /56** = isang bahay; kaya kasama ang lahat ng device sa Wi-Fi ko sa iisang bilang.
- **Memory store** — nawawala sa restart, at hindi hati sa maraming server → Redis (Day 92).

## Mga tanong ko pa / hindi pa malinaw
- (Idagdag dito ang anumang hindi pa malinaw.)

## Susunod
- Day 38 🎉 — maikling launch kasama ang kaibigan

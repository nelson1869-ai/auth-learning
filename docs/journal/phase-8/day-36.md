# Day 36 — 2026-09-26 · Phase 8 · backend sa internet 🌐

## Ano ang ginawa
- **Ako:** `cloudflared tunnel login` → inaprubahan ang `nelson1869.com` (→ `~/.cloudflared/cert.pem`); ni-ON ang **Always Use HTTPS**
- **AI:** tunnel `auth-learning` + DNS `api.nelson1869.com`; `devops/cloudflared/config.yml`; `devops/docker-compose.prod.yml` (`name: auth-learning-prod`, backend + cloudflared, walang `ports:`)
- **Binura ang lumang `loan-n8n` tunnel** (hiniling ko — walang aktibong koneksyon, sinuri muna)
- Lumampas sa reference: quick tunnel lang ang ginamit doon (pansamantalang URL); **named tunnel** tayo (permanente)

## Sinubukan mula sa internet
| | |
|---|---|
| `https://api.nelson1869.com/api/health` | 200 · `server: cloudflare` · `cf-ray …-SIN` |
| TLS | 1.3 · certificate `nelson1869.com` (Let's Encrypt) |
| Tunnel | 4 na koneksyon — Cebu ×2, Hong Kong ×2 |
| CORS mula sa `https://nelson1869.com` | 204 · allow-origin tama · credentials true |
| Buong flow sa Neon | register 201 → login 200 + `HttpOnly; Secure; SameSite=Lax` → me 200 → logout → 401 (binura ang test user; sequence ni-reset) |
| `http://` | **200 sa una** ❌ → ni-ON ang Always Use HTTPS → **301 → https** ✅ |

## Ano ang natutunan ko (sa sarili kong salita)
- **Tunnel = koneksyong PALABAS** mula sa PC → walang port forwarding, walang nakikitang IP ko.
- **Named vs quick tunnel** — permanente ang address, nakatali sa domain ko.
- **Ingress rules** — isang hostname → isang serbisyo; kahit ano pa → 404.
- **Always Use HTTPS** — kung wala, dadaan ang password nang hindi naka-encrypt kapag `http://` ang tinype.
- Dalawang compose project, magkaibang `name:` — dev at production sa iisang PC.

## ⚠️ Tandaan
- Patay ang API kapag patay ang PC o ang Docker (D-020).
- 🔐 I-reset ang Neon password bago ang Day 38 (nasa roadmap).

## Mga tanong ko pa / hindi pa malinaw
> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit mas ligtas ang tunnel kaysa port forwarding?**
  S: Walang bukas na port sa router ko at hindi nakikita ang IP ng bahay ko. Ang cloudflared ang kumokonekta palabas, kaya ang tanging daan papasok ay dumadaan sa Cloudflare (HTTPS, proteksyon laban sa DDoS).
- **T: Ano ang mangyayari kapag patay ang PC ko?**
  S: Patay ang API (502 mula sa Cloudflare), pero buhay pa rin ang frontend dahil nasa Cloudflare Pages ito. Tanggap na kapalit ito ng libreng hosting (D-020).
- **T: Bakit kailangan ang `name:` sa compose file ng production?**
  S: Para hindi magbanggaan ang dev at production sa iisang PC. Nangyari ito sa reference: pinatay ng production compose ang dev Postgres dahil pareho ang project name.

## Susunod
- Day 36b: frontend sa Cloudflare Pages (`https://nelson1869.com`), `VITE_API_URL`, CDN at caching

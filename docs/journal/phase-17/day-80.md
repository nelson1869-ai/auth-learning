# Day 80 — 2026-09-27 · Phase 17 · Health checks: live vs ready

## Bakit dalawa
- **Live — "buhay ba ang process?"** Kung hindi, i-restart. Hindi dapat nakadepende sa database: kapag ang database ang may problema,
  walang silbi ang pag-restart ng app, at baka lumala pa (sabay-sabay na nagre-restart ang lahat).
- **Ready — "handa bang maglingkod?"** Sinusuri ang database. Kapag hindi, huwag munang magpadala ng trabaho (503), pero huwag i-restart.

## Ano ang ginawa
- **`GET /api/health/live`**: walang database. Ang dating **`/api/health`** ay pareho nito, hindi binago, para hindi masira ang mga dating gumagamit.
- **`GET /api/health/ready`**: `SELECT 1`, may **3 segundong limit** → 200 `ready`, o 503 `not_ready`. Walang detalye ng error sa sagot (nasa log).
- **Docker HEALTHCHECK → `/live`** (tahasan na).
- **`deploy.sh` → `/ready` mula sa internet**, isang beses pagkatapos maging "healthy". Kapag 503, pumapalya ang deploy (dati: "Live" kahit hindi maabot ang database).
- Hugis ng Phase 16: `routes/health.ts` → `controllers/health.controller.ts` → `services/health.service.ts`. Nasa OpenAPI spec din.

## Isang desisyon na iba sa reference: walang database sa HEALTHCHECK
Sa reference, ang `/api/health` ay **readiness** (sinusuri ang database). Dito, **hindi** ang HEALTHCHECK, dahil **Neon (serverless)** ang database natin:
kapag bawat 30 segundo ay may `SELECT 1`, **hindi na makakatulog ang Neon**, at mauubos ang compute hours. Kaya ang readiness ay isang beses lang bawat deploy.
May test na nagbabantay: babagsak ito kapag tumama sa database ang liveness.

## 🐛 Nahuli sa totoong pagsubok: walang log kapag timeout
Pinatay ko ang dev database habang tumatakbo ang server:
| | Resulta |
|---|---|
| `/live` | 200 agad ✅ |
| `/ready` | **503 pagkalipas ng 3.2s** ✅ (ang timeout) |
| Log na `readiness_db_down` | ❌ **0**: ang timeout ay "hindi handa" pero walang bakas kung bakit |

Error lang ang itinatala noon; ang timeout ay tahimik na nagbabalik ng `false`. **Ayos:** may log na rin ang timeout (`reason: timeout`), at may test na babagsak kapag inalis ito.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Sadyang sira: nagtatanong sa database ang liveness · walang timeout · laging 200 | ✅ bumagsak ang tamang test sa bawat isa (ang walang timeout ay nakabitin nang 5s) |
| Sadyang sira: walang log sa timeout | ✅ bumagsak |
| Pinatay ang dev database | ✅ live 200 · ready 503 (3.2s) · binuhay → ready 200 |
| 26 `.http` · buong suite · lint (oxlint + knip) · tsc | ✅ 26/26 · 190 tests · ✅ |
| Production | (pagkatapos ng deploy: gagamitin ng `deploy.sh` ang bagong readiness check) |

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit 503 at hindi 500 ang "hindi handa"?**
  S: Ang 500 ay "may bug o error sa server". Ang **503 Service Unavailable** ay "buhay ako, pero hindi pa kaya ngayon, subukan ulit mamaya". Iyon mismo ang kalagayan.
- **T: Bakit may 3 segundong limit?**
  S: Ang health check na nakabitin ay mas masama pa sa wala: hindi malalaman ng nagtatanong kung buhay pa tayo. Mas mabuti ang malinaw na 503 sa loob ng 3 segundo.
- **T: Kung hindi sinusuri ng HEALTHCHECK ang database, paano ko malalaman kung down ang Neon?**
  S: Sa deploy, sa pamamagitan ng readiness. At sa mismong app: ang mga request na nangangailangan ng database ay magbibigay ng 500 na may `requestId` (at log).
  Sa Day 81–84 (metrics at alerts), makikita ang dami ng 5xx, at may email kapag lumampas.

## Susunod
- **Day 81 — Metrics:** OpenTelemetry + `/metrics` (ilang request, gaano kabilis, ilang error).

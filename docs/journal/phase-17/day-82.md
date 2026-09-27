# Day 82–83 — 2026-09-27 · Phase 17 · Dashboards (Prometheus + Grafana)

## Ang tanong ng araw
*"Nakikita mo ba ang problema bago pa magreklamo ang user?"* Noong Day 81, may mga numero na sa `/metrics`, pero kailangan kong
buksan at basahin ang text. Ngayon: **Prometheus** ang nag-iipon ng mga numero bawat 15 segundo, at **Grafana** ang nagpapakita ng mga ito bilang graph.

## Ano ang ginawa
- **Prometheus v3.7.3** at **Grafana 12.3.0** (naka-pin) sa `devops/docker-compose.prod.yml`, sa tabi ng backend at cloudflared.
- **Lahat ay nasa code, walang click sa UI** (`devops/monitoring/`):
  - `prometheus/prometheus.yml`: scrape ng `backend:9464` bawat 15s, sa loob ng Docker network.
  - `grafana/provisioning/datasources/`: Grafana → `http://prometheus:9090`.
  - `grafana/provisioning/dashboards/json/app-overview.json`: ang dashboard, **8 panel**: up · requests/s · 5xx % · p95 ·
    requests/s ayon sa status · p95 ayon sa route · security events · mga route na may 4xx/5xx.
- **🔐 127.0.0.1 lang** (9091 at 3002; ang 9090/3001 ay gamit na ng reference sa PC na ito). Walang password ang Prometheus, kaya hindi ito puwedeng ilabas.
- **Grafana:** admin password mula sa `devops/.env` (gitignored), walang sign-up, walang anonymous, walang analytics, at **walang pag-download ng plugin tuwing boot**
  (napansin ko sa log: nagda-download ito ng 4 na plugin mula sa internet sa unang boot, na hindi natin kailangan).
  ⚠️ Nasa volume pa ang 4 na na-download bago ko pinatay. Hindi ko sila binura (hindi pinayagan ang agent na magsulat sa loob ng container);
  gawain ko kung gusto: `grafana cli plugins remove <pangalan>` sa loob ng container, tapos restart (nasa devops/README.md).
- **Memory limit** (512M / 256M) at retention (15 araw o 1GB): hindi puwedeng kainin ng monitoring ang PC na nagpapatakbo ng app.
- **`deploy.sh` step 7:** tinitiyak na tumatakbo ang dalawa. **Hindi fatal:** live na ang app sa puntong iyon (aral ng Day 81: hindi dapat magpabagsak ang monitoring).

## 🐛 Dalawang nahuli ng dashboard mismo
1. **"No data" sa 5xx panel sa halip na 0%.** Kapag walang kahit isang 5xx, walang serye, at ang `sum()` ng wala ay wala.
   **Ayos:** `… or vector(0)`. Maliit, pero ang "No data" ay mukhang sira; ang 0% ay sagot.
2. **Isang totoong `login_failed` sa production, pero ang panel ay 0.** Sinilip ko ang raw na mga sample: `1, 1, 1`. Walang `0` bago nito.
   Ang serye ay **"ipinapanganak" sa 1** sa unang event, at ang `increase()` ay kailangan ng naunang sample para makita ang pagtaas.
   Kaya **ang unang event ng bawat action pagkatapos ng bawat restart o deploy ay hindi nakikita.**
   Sa Day 84, ibig sabihin nito: ang unang `account_locked` pagkatapos ng deploy ay **hindi mag-a-alert**.
   **Ayos:** sa `lib/metrics.ts`, sinisimulan sa 0 ang bawat `AUDIT_ACTIONS`. May test; bumagsak ito nang alisin ko ang loop.
   *Hindi ito ginawa para sa HTTP metrics:* walang hangganan ang kombinasyon ng route × status, at trend lang naman ang tinitingnan doon.

May isang maling alarma rin: ang una kong pagsubok sa Grafana ay `000` (walang koneksyon). **Hindi ito sira:** nagsisimula pa lang ang Grafana
(nagda-download ng mga plugin). Pagkalipas ng ilang segundo, 200. Iyon din ang dahilan kung bakit pinatay ko ang pag-download ng plugin.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| Prometheus target | ✅ `http://backend:9464/metrics` · up · walang error · `service_name="auth-learning-backend"` (hindi ang reference) |
| Grafana: walang login · maling password · sign-up | ✅ 401 · 401 · 401 |
| Grafana: datasource health · dashboard | ✅ "Successfully queried the Prometheus API" · 8 panel |
| Bawat query ng dashboard, direkta sa Prometheus | ✅ lahat `success` (pagkatapos ng dalawang ayos sa itaas) |
| Headless na browser, naka-login | ✅ 8 panel, 0 "No data", 0 error |
| Mula sa LAN IP (192.168.254.110) papunta sa 9091 at 3002 | ✅ walang koneksyon |
| Binago ang `app-overview.json` habang tumatakbo | ✅ kusang na-load ng Grafana sa loob ng ~15s (ibinalik pagkatapos) |
| `.http` 28 laban sa totoong Prometheus | ✅ 7/7 (kasama ang 400 sa maling PromQL) |
| Buong suite · tsc · lint (oxlint + knip) | ✅ 194 · ✅ · ✅ |
| 48 diagram (render sa browser) | ✅ 48/48 |
| Production (deploy `520f02b`) | ✅ step 7: prometheus at grafana "Running" · readiness `ready` · 15/15 audit series ay nasa 0 pagka-start · **isang maling login → mga sample `0, 0, 0, 0, 1`, `increase(5m)` = 1.05** (dati: 0). Hindi eksaktong 1 dahil nag-e-extrapolate ang `increase()` sa buong 5 minuto |

## Kumpara sa reference
- **Pareho:** Prometheus + Grafana sa compose, parehong naka-pin na version (v3.7.3, 12.3.0), provisioned na datasource at dashboard, iisang read-only mount para sa provisioning
  (ang nested na mount sa loob ng `:ro` ay pumapalya, aral ng reference), memory limit.
- **Iba:** 127.0.0.1 lang (ang sa reference ay `9090:9090` / `3001:3000`, ibig sabihin lahat ng interface, kaya naaabot mula sa LAN),
  walang pag-download ng plugin, may security events panel, at ang audit counters ay nagsisimula sa 0.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Bakit dalawang tool? Hindi ba puwedeng Grafana na lang?**
  S: Magkaiba ang trabaho. Ang **Prometheus** ay database ng mga numero: kinukuha nito ang `/metrics` bawat 15s at iniimbak nang may oras.
  Ang **Grafana** ay walang iniimbak na metrics; nagtatanong lang ito sa Prometheus (PromQL) at gumuguhit. Sa Day 84, ang Prometheus din ang magsusuri ng mga alert rule.
- **T: Ano ang `rate()` at bakit hindi ko basta ginagamit ang bilang?**
  S: Ang counter ay laging tumataas (hal. 5,231 request mula nang mag-start). Walang sinasabi ang numerong iyon. Ang `rate(x[5m])` ay "ilan bawat segundo sa huling 5 minuto",
  na siyang nagbabago kapag may problema. Bumabalik sa 0 ang counter kapag nag-restart ang app, at alam ng `rate()` kung paano iyon hawakan.
- **T: Bakit hindi ko na lang buksan ang Grafana sa internet para makita ko sa phone?**
  S: Puwede sa hinaharap, pero kailangan ng tamang login sa harap nito (hal. Cloudflare Access). Walang password ang Prometheus,
  at ang dashboard ay nagpapakita ng mga route at security events, na impormasyong kapaki-pakinabang sa attacker. Sa ngayon, sapat na ang PC.
- **T: Bakit provisioning (file) at hindi ko na lang gawin ang dashboard sa UI?**
  S: Ang ginawa sa UI ay nasa volume lang: kapag nabura, wala na, at walang history sa Git. Ang file ay naka-commit, may review sa PR, at pareho sa bawat makina.
  Kapag gusto kong baguhin sa UI, i-export ko ang JSON at palitan ang file.

## Susunod
- **Day 84 — Alerts:** Alertmanager + email kapag down ang app. **Subukan talaga:** patayin ang app at hintayin ang email.

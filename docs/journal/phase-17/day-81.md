# Day 81 — 2026-09-27 · Phase 17 · Metrics (OpenTelemetry → /metrics)

## Logs vs metrics
- **Log (Day 42):** isang kuwento bawat request: sino, ano, bakit, `requestId`. Para sa imbestigasyon.
- **Metric:** mga numero sa paglipas ng oras: ilan, gaano kabilis, ilang error. Mura kahit milyon ang request. Dito nakabatay ang dashboard at **alert**.

## Ano ang ginawa (D-028)
- **OpenTelemetry metrics SDK + Prometheus exporter** (`lib/metrics.ts`), 6 na package lang.
- **`middleware/metrics.ts`** (una sa pipeline): itinatala ang **`http.server.request.duration`** (method, **route template**, status), ayon sa OpenTelemetry semantic conventions.
- **`auth.audit.events { action }`**: bawat audit action ay binibilang na rin (para sa mga alert sa `account_locked`, `refresh_reuse`…).
- **`/metrics` sa hiwalay na port** (`METRICS_PORT`, default 9464), **hindi publiko**: ang tunnel ay papunta lang sa `backend:3000`.

### Bakit hindi ang auto-instrumentation ng reference?
Nagpa-patch ito ng mga module habang nilo-load (kaya kailangang ito ang unang import), daan-daang package, at may mga caveat sa ESM.
Ang maliit na middleware ay malinaw, walang patching, at OpenTelemetry pa rin: puwedeng lumipat sa ibang exporter o magdagdag ng tracing sa hinaharap.

## 🔐 Cardinality
Ang label ay ang **route template** (`/api/auth/sessions/:id`) o **`unmatched`** (404, o hinarang bago umabot sa route, hal. CSRF 403). **Hindi kailanman ang totoong URL.**
Kung URL ang label, bawat session id at bawat random na path ng attacker ay magiging bagong serye sa Prometheus, at lalaki ito nang walang hangganan.

## 🐛 Dalawang nahuli habang sinusubukan
1. **Ginagamit na ang port 9464 sa PC na ito** (ng ibang app, ang reference). **Namatay ang buong backend** dahil pumalya ang metrics server (`EADDRINUSE`).
   Ang monitoring ay hindi dapat magpabagsak sa mismong serbisyo. **Ayos:** hindi na fatal (ERROR log, tuloy ang app). Sinubukan: okupadong port → app 200 + ERROR log.
   Sa dev, `METRICS_PORT=9474` sa `backend/.env`.
2. **Ang unang `/metrics` na nabasa ko ay sa IBANG app** (`service_name="express-auth-demo"`). Muntik ko nang isiping sa amin iyon.
   **Aral:** tiyakin kung sino ang sumasagot. Kaya may `service.name=auth-learning-backend` sa bawat scrape, at nakasulat ito sa `.http`.

## Paano napatunayan
| Sinubukan | Resulta |
|---|---|
| 3 test (`lib/metrics.test.ts`) | ✅ bilang bawat route/status · template, hindi URL o id · bilang ng audit |
| Sadyang sira: URL bilang label · walang bilang sa audit · walang middleware | ✅ bumagsak ang tamang test sa bawat isa |
| Totoong server (dev) | ✅ `/api/auth/me` 401 · `unmatched` 404 · CSRF 403 (`unmatched`) · walang raw na URL |
| Okupadong metrics port | ✅ tuloy ang app (200), may ERROR log |
| 27 `.http` · production `https://api.nelson1869.com/metrics` | ✅ 27/27 · 404 (walang /metrics sa publiko) |
| Production (pagkatapos ng deploy) | ✅ sa loob ng container `:9464/metrics`: `service_name="auth-learning-backend"`, at makikita pa ang readiness check ng deploy (`/api/health/ready` 200) · mula sa internet: 404 · "Metrics at /metrics" sa log, walang "failed" |

## Kumpara sa reference
- **Pareho:** OpenTelemetry, Prometheus exporter, hiwalay na port.
- **Iba:** walang auto-instrumentation (6 na package), route template bilang label (may test), bilang ng audit actions, at hindi fatal ang pagpalya ng metrics server.

## Mga tanong ko pa / hindi pa malinaw

> ✍️ Sinulat ng AI sa hiling ko ("answer all question all days … act as me"): mga tanong na malamang ay tinanong ko sa araw na ito, at ang sagot.

- **T: Ano ang histogram?**
  S: Hindi lang "ilan", kundi "ilan sa bawat saklaw ng tagal" (≤ 5ms, ≤ 10ms, … ≤ 10s). Mula roon, makukuha ang p95 ("95% ng request ay mas mabilis sa X"),
  na mas makabuluhan kaysa sa average, dahil tinatabunan ng average ang iilang napakabagal na request.
- **T: Bakit hiwalay na port ang /metrics?**
  S: Para hindi ito maabot mula sa internet. May impormasyon ito tungkol sa app (mga route, dami ng error, mga security event), kaya para lang ito sa Prometheus, sa loob ng Docker network.
- **T: Bakit binibilang ang audit actions?**
  S: Para sa mga alert sa Day 84: hal. "higit sa 20 `account_locked` sa loob ng 5 minuto" ay posibleng atake. Ang audit log ay para sa detalye; ang metric ay para sa mabilis na pagpansin.

## Susunod
- **Day 82–83 — Dashboards:** Prometheus + Grafana, isang dashboard ng app.

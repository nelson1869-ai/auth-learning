import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { env } from '../config/env.ts';
import { AUDIT_ACTIONS } from '../db/schema.ts';

// Metrics (Day 81) — OpenTelemetry, ine-export para sa Prometheus (D-028).
// Metrics vs logs: ang LOG ay isang kuwento bawat request ("sino, ano, bakit"); ang METRIC ay mga numero sa paglipas
// ng oras ("ilan, gaano kabilis, ilang error"). Mura ang metric kahit milyon ang request, at dito nakabatay ang mga alert.
//
// Walang auto-instrumentation (hindi tulad ng reference): isang maliit na middleware lang ang nagtatala (middleware/metrics.ts).
// Mas kaunting dependency, walang pag-patch ng mga module, at walang problema sa ESM

// Hindi pa sinisimulan ang server dito (preventServerStart): index.ts lang ang nagbubukas ng port — hindi ang tests
export const prometheusExporter = new PrometheusExporter({ port: env.METRICS_PORT, preventServerStart: true });

const provider = new MeterProvider({
  resource: resourceFromAttributes({ 'service.name': 'auth-learning-backend' }),
  readers: [prometheusExporter],
});
const meter = provider.getMeter('auth-learning');

// Gaano katagal ang bawat request — ang pangalan at mga label ay ayon sa OpenTelemetry semantic conventions
// (http.server.request.duration: method, route, status). Sa Prometheus: http_server_request_duration_* (walang _seconds;
// nasa `unit` ang segundo)
export const httpRequestDuration = meter.createHistogram('http.server.request.duration', {
  unit: 's',
  description: 'Tagal ng bawat HTTP request',
  advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] },
});

// Bawat audit action (register, login_failed, account_locked, refresh_reuse …) — para sa mga alert sa security events.
// Kaunti at nakapirmi ang mga action (AUDIT_ACTIONS), kaya ligtas bilang label
export const auditEvents = meter.createCounter('auth.audit.events', { description: 'Bilang ng bawat audit action' });

// Day 82: simulan ang BAWAT action sa 0. Kung hindi, ang serye ay "ipinapanganak" sa 1 sa unang event, at ang
// increase()/rate() ng Prometheus ay walang naunang sample na paghahambingan, kaya HINDI NAKIKITA ang unang event
// pagkatapos ng bawat restart/deploy (nahuli sa dashboard: 1 login_failed → increase = 0). Mahalaga ito sa Day 84:
// ang unang account_locked pagkatapos ng deploy ay dapat mag-alert
for (const action of AUDIT_ACTIONS) auditEvents.add(0, { action });

export async function startMetricsServer(): Promise<void> {
  await prometheusExporter.startServer();
}

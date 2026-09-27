import app from './app.ts';
import { env } from './config/env.ts';
import { logger } from './lib/logger.ts';
import { startMetricsServer } from './lib/metrics.ts';

const PORT = 3000;

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang Ctrl+C
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server running');
});

// Metrics (Day 81): hiwalay na maliit na server para sa Prometheus — http://localhost:<METRICS_PORT>/metrics.
// Hindi dinadaanan ng Cloudflare Tunnel (backend:3000 lang), kaya hindi publiko
// HINDI fatal kapag pumalya (hal. may gumagamit na ng port): ang monitoring ay hindi dapat magpabagsak sa mismong serbisyo.
// ERROR sa log, at tuloy ang app — nang walang /metrics (nahuli noong Day 81: dati, namamatay ang buong server)
try {
  await startMetricsServer();
  logger.info({ port: env.METRICS_PORT }, 'Metrics at /metrics');
} catch (err) {
  logger.error({ err, port: env.METRICS_PORT }, 'Metrics server failed to start — the app keeps running without /metrics');
}

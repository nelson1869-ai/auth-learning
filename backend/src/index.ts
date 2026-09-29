import app from './app.ts';
import { env } from './config/env.ts';
import { closeDb } from './db/index.ts';
import { startRetentionScheduler } from './jobs/retentionScheduler.ts';
import { drainBackground } from './lib/background.ts';
import { logger } from './lib/logger.ts';
import { prometheusExporter, startMetricsServer } from './lib/metrics.ts';
import { shutdown } from './lib/shutdown.ts';

const PORT = 3000;
// Day 85: mas maikli sa 10s ng `docker stop` (stop_grace_period sa compose), para tayo ang magpasya bago ang SIGKILL
const SHUTDOWN_TIMEOUT_MS = 8_000;

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang SIGTERM o Ctrl+C
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server running');
});

// Metrics (Day 81): hiwalay na maliit na server para sa Prometheus — http://localhost:<METRICS_PORT>/metrics.
// Hindi dinadaanan ng Cloudflare Tunnel (backend:3000 lang), kaya hindi publiko
// HINDI fatal kapag pumalya (hal. may gumagamit na ng port): ang monitoring ay hindi dapat magpabagsak sa mismong serbisyo.
// ERROR sa log, at tuloy ang app — nang walang /metrics (nahuli noong Day 81: dati, namamatay ang buong server)
// Day 90: oras-oras na paglilinis ng lumang data (unang takbo pagkalipas ng 60s)
const stopRetention = startRetentionScheduler();

let metricsStarted = false;
try {
  await startMetricsServer();
  metricsStarted = true;
  logger.info({ port: env.METRICS_PORT }, 'Metrics at /metrics');
} catch (err) {
  logger.error({ err, port: env.METRICS_PORT }, 'Metrics server failed to start — the app keeps running without /metrics');
}

// Graceful shutdown (Day 85). Sa Docker, ang node ay PID 1: kapag WALANG handler, hindi pinapansin ang SIGTERM,
// kaya naghihintay ang Docker ng 10s at saka SIGKILL — napuputol ang mga request at nawawala ang mga email sa background
// (sinukat bago nito: docker stop = 14.6s, exit 137). SIGTERM = docker stop / deploy · SIGINT = Ctrl+C
let shuttingDown = false;
async function onSignal(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    // Pangalawang signal (hal. Ctrl+C ulit): huwag nang hintayin
    logger.warn({ signal }, 'Second signal during shutdown — exiting now');
    process.exit(1);
  }
  shuttingDown = true;
  logger.info({ signal, event: 'shutdown_started' }, 'Shutting down gracefully');
  const code = await shutdown(server, {
    timeoutMs: SHUTDOWN_TIMEOUT_MS,
    cleanup: [
      ['retention timer', async () => stopRetention()], // UNA: walang bagong paglilinis habang nagsasara
      ['background tasks', drainBackground], // hal. ang email ng forgot-password, o ang retention na tumatakbo pa — kailangan nila ang database
      ['metrics server', async () => (metricsStarted ? prometheusExporter.stopServer() : undefined)],
      ['database pool', closeDb], // HULI: baka kailangan pa ng mga naunang hakbang
    ],
  });
  logger.info({ event: 'shutdown_complete', exitCode: code }, 'Shutdown complete');
  process.exit(code);
}
process.on('SIGTERM', (signal) => void onSignal(signal));
process.on('SIGINT', (signal) => void onSignal(signal));

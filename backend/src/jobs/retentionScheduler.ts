import { runInBackground } from '../lib/background.ts';
import { logger } from '../lib/logger.ts';
import { retentionDeleted, retentionRuns } from '../lib/metrics.ts';
import { RETENTION_TABLES, runRetentionCleanup } from '../services/retention.service.ts';

// Oras-oras na retention cleanup (Day 90), sa loob ng app mismo (walang hiwalay na cron o container).
// - Unang takbo: 60s pagka-start (hindi sabay sa pagbukas ng server at sa readiness check ng deploy)
// - Sa pamamagitan ng runInBackground: hinihintay ito ng graceful shutdown (Day 85) bago isara ang database
// - Kapag may ibang instance na naglilinis, `skipped` (advisory lock sa retention.service.ts)
export const FIRST_RUN_DELAY_MS = 60_000;
export const INTERVAL_MS = 60 * 60 * 1000;

export function startRetentionScheduler(run: () => Promise<unknown> = cleanupAndLog): () => void {
  const tick = () => runInBackground('retention', async () => void (await run()));
  let interval: NodeJS.Timeout | undefined;
  const first = setTimeout(() => {
    tick();
    interval = setInterval(tick, INTERVAL_MS);
  }, FIRST_RUN_DELAY_MS);
  // Ibinabalik ang "stop": tinatawag ng shutdown para walang bagong takbo habang nagsasara
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
}

for (const table of RETENTION_TABLES) retentionDeleted.add(0, { table });
for (const status of ['ok', 'skipped', 'failed']) retentionRuns.add(0, { status });

// Ang default na trabaho: linisin, itala sa log at sa metrics (makikita sa Prometheus/Grafana — backend/http/34-retention.http)
export async function cleanupAndLog(): Promise<void> {
  const started = Date.now();
  let result;
  try {
    result = await runRetentionCleanup();
  } catch (err) {
    retentionRuns.add(1, { status: 'failed' });
    throw err; // itinatala ng runInBackground bilang background_failed
  }
  retentionRuns.add(1, { status: result.status });
  if (result.status === 'skipped') {
    logger.info({ event: 'retention_skipped' }, 'Retention cleanup skipped — another instance holds the lock');
    return;
  }
  for (const table of RETENTION_TABLES) retentionDeleted.add(result.deleted[table], { table });
  logger.info({ event: 'retention_done', deleted: result.deleted, ms: Date.now() - started }, 'Retention cleanup done');
}

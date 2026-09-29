import type { Server } from 'node:http';
import { logger } from './logger.ts';

// Graceful shutdown (Day 85). Kapag pinapatay ang app (deploy, docker stop, Ctrl+C), dapat:
//   1. huminto sa pagtanggap ng BAGONG koneksyon
//   2. TAPUSIN ang mga request na tumatakbo pa (hindi putulin sa gitna — hal. isang login o isang pagpapalit ng password)
//   3. tapusin ang trabaho sa background (hal. ang email ng forgot-password, Day 59)
//   4. isara ang metrics server at ang database pool — sa ganitong ayos (kailangan pa ng background ang database)
//   5. may DEADLINE: kapag may request na ayaw matapos, putulin na. Mas maikli ito sa 10s ng `docker stop`,
//      para tayo ang magpasya, hindi ang SIGKILL ng Docker
//
// Walang process.exit dito — ibinabalik ang exit code (0 = malinis, 1 = may pumalya o lumampas sa deadline),
// para masubukan ito sa Vitest nang hindi pinapatay ang test runner. Ang index.ts ang tumatawag ng process.exit.

export type CleanupStep = [name: string, run: () => Promise<void>];

export async function shutdown(server: Server, options: { timeoutMs: number; cleanup: CleanupStep[] }): Promise<number> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), options.timeoutMs);
  });

  const work = (async () => {
    // Hinto sa bagong koneksyon; ang callback ay tatawagin kapag TAPOS na ang lahat ng kasalukuyang request.
    // Ang mga keep-alive na koneksyon na walang ginagawa (hal. mula sa cloudflared) ay KUSANG isinasara ng close() mula Node 19 —
    // hindi na kailangan ng closeIdleConnections() (nahuli: pumasa pa rin ang test nang alisin ito). Ang test ang nagbabantay nito
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    logger.info({ event: 'shutdown_http_closed' }, 'HTTP server closed — all in-flight requests finished');

    // Ang bawat hakbang ay tumatakbo KAHIT pumalya ang nauna (hal. dapat pa ring isara ang database)
    let failed = false;
    for (const [name, run] of options.cleanup) {
      try {
        await run();
        logger.info({ event: 'shutdown_step', step: name }, `Shutdown: ${name} done`);
      } catch (err) {
        failed = true;
        logger.error({ err, event: 'shutdown_step_failed', step: name }, `Shutdown: ${name} failed`);
      }
    }
    return failed ? 1 : 0;
  })();

  try {
    const result = await Promise.race([work, deadline]);
    if (result === 'timeout') {
      // May request na ayaw matapos: putulin ang lahat ng natitirang koneksyon at lumabas
      server.closeAllConnections();
      logger.error({ event: 'shutdown_timeout', timeoutMs: options.timeoutMs }, 'Graceful shutdown timed out — forcing exit');
      return 1;
    }
    return result;
  } catch (err) {
    logger.error({ err, event: 'shutdown_failed' }, 'Graceful shutdown failed');
    return 1;
  } finally {
    clearTimeout(timer);
  }
}

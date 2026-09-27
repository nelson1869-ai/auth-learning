import { sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { logger } from '../lib/logger.ts';

// Readiness (Day 80): handa ba ang database? Isang `SELECT 1`, may limit na oras.
// Hindi kailanman nakabitin: kapag walang sagot sa loob ng `timeoutMs`, "hindi handa" — ang health check na nakabitin
// ay mas masama pa sa wala (hindi malalaman ng nagtatanong kung buhay pa tayo)
export async function isDatabaseReady(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  try {
    return await Promise.race([db.execute(sql`select 1`).then(() => true), timeout]);
  } catch (err) {
    // Ang detalye (hal. "connection refused") ay sa LOG lang — hindi sa sagot (Day 41)
    logger.warn({ err, event: 'readiness_db_down' }, 'Readiness: database is not reachable');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

import { sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { logger } from '../lib/logger.ts';

// Readiness (Day 80): handa ba ang database? Isang maliit na query, may limit na oras.
// Day 93: tinatanong na ang TOTOONG table (`users`, walang `public.` — gaya ng mga query ng app), hindi na `SELECT 1`.
// Dalawang beses nang "ready" habang sira ang app: walang table (Day 91), at walang `search_path` pagkatapos ng restore sa pooler
// ng Neon (Day 93). Ang `SELECT 1` ay nagsasabi lang na "may sumasagot", hindi na "kaya ng app na magtrabaho".
// `limit 1` at walang `count(*)`: mura kahit milyon ang users
// Hindi kailanman nakabitin: kapag walang sagot sa loob ng `timeoutMs`, "hindi handa" — ang health check na nakabitin
// ay mas masama pa sa wala (hindi malalaman ng nagtatanong kung buhay pa tayo)
export async function isDatabaseReady(timeoutMs = 3000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      // Itala rin ang timeout (hindi lang ang error) — kung hindi, walang bakas kung BAKIT "hindi handa" (nahuli noong Day 80)
      logger.warn({ event: 'readiness_db_down', reason: 'timeout', timeoutMs }, 'Readiness: database did not answer in time');
      resolve(false);
    }, timeoutMs);
  });
  try {
    return await Promise.race([db.execute(sql`select 1 from ${users} limit 1`).then(() => true), timeout]);
  } catch (err) {
    // Ang detalye (hal. "connection refused") ay sa LOG lang — hindi sa sagot (Day 41)
    logger.warn({ err, event: 'readiness_db_down' }, 'Readiness: database is not reachable');
    return false;
  } finally {
    clearTimeout(timer);
  }
}

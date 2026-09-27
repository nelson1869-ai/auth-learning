import { logger } from './logger.ts';

// Trabaho PAGKATAPOS sumagot sa user (Day 59). Halimbawa: sa forgot-password, sumasagot agad ang server,
// tapos saka hinahanap ang account at nagpapadala ng email. Kung hindi: mas matagal ang sagot kapag may account
// (database + Resend ≈ daan-daang ms) → malalaman ng attacker kung sino ang may account (timing, Day 15).
//
// ⚠️ Nasa memory lang: kapag namatay ang server habang ginagawa ito, mawawala ang email.
// Sa hinaharap: isang tunay na queue (hal. BullMQ + Redis) — nasa backlog
const pending = new Set<Promise<void>>();

export function runInBackground(name: string, work: () => Promise<void>): void {
  const task = work()
    .catch((err) => logger.error({ err, event: 'background_failed', task: name }, 'Background task failed'))
    .finally(() => pending.delete(task));
  pending.add(task);
}

// Para sa tests: hintayin ang lahat ng nasa background bago suriin ang resulta
export async function drainBackground(): Promise<void> {
  while (pending.size > 0) await Promise.all(pending);
}

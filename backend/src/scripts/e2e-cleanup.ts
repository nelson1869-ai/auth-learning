import { like } from 'drizzle-orm';
import { env } from '../config/env.ts';
import { closeDb, db } from '../db/index.ts';
import { users } from '../db/schema.ts';

// Day 99: binubura ang mga account na ginawa ng E2E test (frontend/e2e) pagkatapos ng takbo — `e2e-…@example.com` lang.
// CASCADE: kasama ang sessions, passkeys, challenges. Tinatawag ng frontend/e2e/global-teardown.ts
// 🔐 TUMATANGGI kapag hindi *_test ang database (gaya ng src/test/setup.ts) — hindi kailanman sa dev o production
if (!env.DATABASE_URL.endsWith('_test')) {
  console.error('e2e:cleanup — refusing: DATABASE_URL is not a *_test database');
  process.exit(1);
}
const removed = await db.delete(users).where(like(users.email, 'e2e-%@example.com')).returning({ id: users.id });
console.log(`e2e:cleanup — removed ${removed.length} E2E account(s)`);
await closeDb();

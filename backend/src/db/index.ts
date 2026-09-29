import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.ts';
import { logger } from '../lib/logger.ts';

// Isang pool ng koneksyon para sa buong app. Galing sa .env ang URL (may password), sinuri ng config/env.ts
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Day 41: kapag hindi maabot ang database, sumuko pagkalipas ng 5 segundo → error → 500 + log.
  // Default ng pg ay 0 = maghintay MAGPAKAILANMAN — nakabitin ang request, walang sagot, walang log
  connectionTimeoutMillis: 5_000,
});

// Kapag naputol ng database ang isang idle na koneksyon (hal. nag-restart ang Postgres),
// kung walang nakikinig dito, PINAPATAY ng Node ang buong server. Log lang — gagawa ng bago ang pool.
pool.on('error', (err: Error) => {
  logger.error({ err }, 'Postgres pool error'); // { err } → may type, message at stack sa log
});

export const db = drizzle(pool);

// Day 85: isinasara ng graceful shutdown (index.ts), PAGKATAPOS matapos ang mga request at background tasks.
// Hinihintay ng pool.end() na maibalik ang mga koneksyong ginagamit pa, tapos isinasara ang lahat
export async function closeDb(): Promise<void> {
  await pool.end();
}

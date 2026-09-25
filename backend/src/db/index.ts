import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Isang pool ng koneksyon para sa buong app. Galing sa .env ang URL (may password) — hindi naka-hardcode
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Kapag naputol ng database ang isang idle na koneksyon (hal. nag-restart ang Postgres),
// kung walang nakikinig dito, PINAPATAY ng Node ang buong server. Log lang — gagawa ng bago ang pool.
pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

export const db = drizzle(pool);

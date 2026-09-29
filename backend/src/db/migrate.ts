import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { verifyMigrations } from './verifyMigrations.ts';

// Pinapatakbo ang mga migration (drizzle/*.sql) na hindi pa napapatakbo — sa loob ng production image,
// kaya hindi kailangan ang drizzle-kit (devDependency). Parehong listahan: drizzle.__drizzle_migrations
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: url });
try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });

  // Day 89: patunayan, huwag ipagpalagay. Ang exit code ang binabasa ng deploy.sh: hindi-0 = huwag i-restart ang backend
  const check = await verifyMigrations(pool, './drizzle');
  console.log(`Migrations: ${check.applied} applied in the database, ${check.expected} in this image`);
  if (check.missing.length > 0) {
    console.error(`❌ Not applied: ${check.missing.join(', ')} — the new code must NOT start on this database`);
    process.exitCode = 1;
  } else if (check.extra > 0) {
    // Mas bago ang database kaysa sa image: rollback ito. Ligtas lang kung backward-compatible ang mga bagong migration
    // (walang binurang column na kailangan pa ng lumang code). Kaya kailangan ng tahasang ROLLBACK=1
    const message = `${check.extra} migration(s) in the database are newer than this image (rollback)`;
    if (process.env.ROLLBACK === '1') {
      console.warn(`⚠️ ${message} — allowed by ROLLBACK=1`);
    } else {
      console.error(`❌ ${message} — set ROLLBACK=1 if this is intended`);
      process.exitCode = 1;
    }
  } else {
    console.log('Migrations applied and verified');
  }
} finally {
  await pool.end();
}

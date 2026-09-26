import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Pinapatakbo ang mga migration (drizzle/*.sql) na hindi pa napapatakbo — sa loob ng production image,
// kaya hindi kailangan ang drizzle-kit (devDependency). Parehong listahan: drizzle.__drizzle_migrations
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: url });
await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
await pool.end();
console.log('Migrations applied');

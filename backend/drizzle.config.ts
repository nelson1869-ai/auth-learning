import { defineConfig } from 'drizzle-kit';

// Puwedeng undefined ang process.env — nahuli ito ng TypeScript. Tumanggi agad nang malinaw (fail-fast)
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set — check backend/.env');
}

export default defineConfig({
  out: './drizzle', // dito ilalagay ang mga migration file
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url },
});

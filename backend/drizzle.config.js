import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',                  // dito ilalagay ang mga migration file
  schema: './src/db/schema.js',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
});

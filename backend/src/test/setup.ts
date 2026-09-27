// TEST database at mga secret — bago pa ma-import ang app (built-in sa Node, kapareho ng --env-file).
// Sa CI, walang .env.test: galing sa `env:` ng workflow ang mga variable — kaya ayos lang kung wala ang file
try {
  process.loadEnvFile('.env.test');
} catch {
  // walang .env.test (hal. sa GitHub Actions) — gamitin ang nasa environment na
}

// Pananggalang: huwag kailanman patakbuhin ang tests sa dev database (binubura nila ang users)
if (!process.env.DATABASE_URL?.endsWith('_test')) {
  throw new Error('Tests must use a *_test database — check backend/.env.test');
}

// Linisin ang mga bilang ng email na WALANG account (Day 71). Walang user na kasama nilang nabubura (walang FK), kaya naiipon
// sila sa pagitan ng mga takbo: ang test na laging parehong email (hal. `wala@example.com` sa auth.test.ts) ay naging 423
// pagkatapos ng ilang takbo sa loob ng 15 minuto (nahuli noong Day 74). Ligtas: sunod-sunod ang mga file (fileParallelism: false)
const { db } = await import('../db/index.ts');
const { unknownLoginAttempts } = await import('../db/schema.ts');
await db.delete(unknownLoginAttempts);

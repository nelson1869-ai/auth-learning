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

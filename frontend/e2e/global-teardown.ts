import { execSync } from 'node:child_process';

// Pagkatapos ng LAHAT ng test: burahin ang mga `e2e-…@example.com` na account sa test database (backend/src/scripts/e2e-cleanup.ts)
// CLIENT_URL: kailangan ito ng config/env.ts ng backend. Sa PC, galing sa .env.test; sa CI ay WALA — at doon pumalya ang unang takbo
// (pumasa ang 8 test, pero "CLIENT_URL: expected string, received undefined" sa paglilinis). Kapareho ng sa playwright.config.ts
export default function globalTeardown() {
  execSync('npm run -s e2e:cleanup', { cwd: '../backend', stdio: 'inherit', env: { ...process.env, CLIENT_URL: 'http://localhost:5199' } });
}

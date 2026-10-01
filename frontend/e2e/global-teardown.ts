import { execSync } from 'node:child_process';

// Pagkatapos ng LAHAT ng test: burahin ang mga `e2e-…@example.com` na account sa test database (backend/src/scripts/e2e-cleanup.ts)
export default function globalTeardown() {
  execSync('npm run -s e2e:cleanup', { cwd: '../backend', stdio: 'inherit' });
}

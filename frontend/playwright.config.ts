import { defineConfig, devices } from '@playwright/test';

// E2E (Day 99): ang BUONG system sa totoong browser — React + Express + Postgres. Ang Vitest ng backend ay sumusubok sa API;
// dito sinusubok kung ano ang nakikita at napipindot ng user, at ang mga bagay na sa browser lang nangyayari (passkey dialog, cookies, CORS).
//
// Sariling mga port (hindi 3000/5173): hindi bumabangga sa dev server na bukas na, o sa ibang project.
// Ang backend ay gumagamit ng TEST database (backend/.env.test, o ang env ng CI) — ang e2e-cleanup ay tumatanggi sa iba
const API_PORT = 3100;
const WEB_PORT = 5199;
const WEB_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: './e2e',
  workers: 1, // iisang test database
  retries: 0, // walang "subukan ulit hanggang pumasa": ang paminsan-minsang pagpalya ay bug na dapat makita
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: WEB_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalTeardown: './e2e/global-teardown.ts',
  webServer: [
    {
      // NODE_ENV=test: walang rate limit (paulit-ulit na login sa mga test), walang Secure cookie (http). Ang CLIENT_URL ay ang frontend sa ibaba —
      // kung hindi tugma, tatanggihan ng CORS, ng CSRF, at ng pagsusuri ng origin ng passkey
      command: 'node --env-file-if-exists=.env.test src/index.ts',
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/api/health/ready`,
      env: { PORT: String(API_PORT), CLIENT_URL: WEB_URL, NODE_ENV: 'test', METRICS_PORT: '9599' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/api` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});

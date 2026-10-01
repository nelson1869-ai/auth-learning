import { expect, test } from '@playwright/test';

// Day 98b: kapag WALA sa API natin ang problema. `page.route` ang pumapalit sa network — walang kailangang patayin na server.
// Ang dalawang bug na inayos noong Day 98b: ang Profile na "Loading…" habambuhay, at ang error ng JSON parser sa screen.
// Ang BACKEND lang ang hinaharang (port 3100). Hindi `**/api/**`: tatamaan din ang mga file ng frontend mismo (`/src/api/auth.ts`)
// at hindi na magbubukas ang page — nangyari ito sa unang takbo
const BACKEND = 'http://localhost:3100/api/**';

test('backend unreachable: the profile says so (no endless "Loading…"), and "Subukan ulit" tries again', async ({ page }) => {
  let calls = 0;
  await page.route(BACKEND, (route) => {
    calls++;
    return route.abort('connectionrefused');
  });
  await page.goto('/profile');
  await expect(page.getByRole('alert')).toHaveText('❌ Hindi maabot ang server. Subukan ulit mamaya.');
  const before = calls;
  await page.getByRole('button', { name: 'Subukan ulit' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(calls).toBeGreaterThan(before);
});

test('an answer that is not JSON (HTML 502) gives a clear message, not a JSON parser error', async ({ page }) => {
  await page.route(BACKEND, (route) =>
    route.fulfill({ status: 502, contentType: 'text/html', body: '<html><body><h1>502 Bad Gateway</h1></body></html>' }),
  );
  await page.goto('/login');
  await page.getByLabel('Email').fill('kahit-sino@example.com');
  await page.getByLabel('Password').fill('kahit-ano');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('❌ May problema sa server. Subukan ulit mamaya.');
});

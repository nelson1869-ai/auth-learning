import { expect, test } from '@playwright/test';
import { addVirtualAuthenticator, loginWithPassword, PASSWORD, registerViaApi, uniqueEmail } from './helpers.ts';

// Passkeys (Day 95–98) sa TOTOONG browser: ang navigator.credentials.create()/get() ng Chromium, na may virtual authenticator.
// Ang hindi kaya ng Vitest: ang browser mismo ang naglalagay ng origin, nagtatago ng private key, at tumatanggi sa excludeCredentials
test('add a passkey, then log in with it — with and without an email', async ({ page, context }) => {
  const device = await addVirtualAuthenticator(context, page);
  const email = uniqueEmail('pk');
  await registerViaApi(email);
  await loginWithPassword(page, email);

  await page.getByRole('link', { name: /Mga passkey/ }).click();
  await expect(page.getByText('Wala ka pang passkey.')).toBeVisible();

  // Maling password: tumatanggi ang SERVER bago pa buksan ang dialog — walang nagawang key sa device
  await page.getByLabel('Pangalan').fill('Laptop ko');
  await page.getByLabel('Kasalukuyang password').fill('mali-ang-password');
  await page.getByRole('button', { name: 'Magdagdag ng passkey' }).click();
  await expect(page.getByText('Incorrect password')).toBeVisible();
  expect(await device.credentials()).toHaveLength(0);

  await page.getByLabel('Kasalukuyang password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Magdagdag ng passkey' }).click();
  await expect(page.getByText('✅ Naidagdag: Laptop ko')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Laptop ko' })).toBeVisible();
  const [key] = await device.credentials();
  expect(key).toMatchObject({ rpId: 'localhost', isResidentCredential: true }); // ang private key ay nasa DEVICE

  // Parehong device ulit → ang BROWSER ang tumatanggi (excludeCredentials)
  await page.getByLabel('Kasalukuyang password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Magdagdag ng passkey' }).click();
  await expect(page.getByRole('alert')).toHaveText('❌ May passkey na ang device na ito para sa account mo.');

  // Login gamit ang passkey: walang email (ang device ang pipili)
  await context.clearCookies();
  await page.goto('/login');
  await page.getByRole('button', { name: /Mag-login gamit ang passkey/ }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText(`Hello, ${email}!`)).toBeVisible();

  // …at may email
  await context.clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: /Mag-login gamit ang passkey/ }).click();
  await expect(page).toHaveURL(/\/profile$/);

  // Na-save ang huling gamit
  await page.goto('/passkeys');
  await expect(page.getByRole('listitem').filter({ hasText: 'Laptop ko' })).not.toContainText('huling gamit hindi pa');
});

test('🔐 decoy: an email with no account gets nothing from this device, and no hint why', async ({ page, context }) => {
  await addVirtualAuthenticator(context, page);
  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail('nobody'));
  await page.getByRole('button', { name: /Mag-login gamit ang passkey/ }).click();
  // Ang decoy na id ay walang tugma sa device → kinansela ng browser. Pareho ng totoong user na nasa ibang device ang passkey
  await expect(page.getByRole('alert')).toHaveText('❌ Kinansela, o naubos ang oras. Subukan ulit.');
  await expect(page).toHaveURL(/\/login$/);
});

test('a passkey removed on the server no longer logs in, even though the device still has it', async ({ page, context }) => {
  const device = await addVirtualAuthenticator(context, page);
  const email = uniqueEmail('pk-removed');
  await registerViaApi(email);
  await loginWithPassword(page, email);
  await page.goto('/passkeys');
  await page.getByLabel('Kasalukuyang password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Magdagdag ng passkey' }).click();
  await expect(page.getByText('✅ Naidagdag')).toBeVisible();

  await page.getByRole('button', { name: 'Burahin' }).click();
  await expect(page.getByText('Wala ka pang passkey.')).toBeVisible();
  expect(await device.credentials()).toHaveLength(1); // nasa device pa

  await context.clearCookies();
  await page.goto('/login');
  await page.getByRole('button', { name: /Mag-login gamit ang passkey/ }).click();
  await expect(page.getByRole('alert')).toHaveText('❌ Passkey login failed. Please try again.');
});

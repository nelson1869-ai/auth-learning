import { expect, test } from '@playwright/test';
import { loginWithPassword, PASSWORD, uniqueEmail } from './helpers.ts';

// Ang pinakaunang flow (Phase 5): register → login → profile → logout, sa totoong browser
test('register, log in, see the profile, log out', async ({ page }) => {
  const email = uniqueEmail('auth');
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText(`Nagawa ang account: ${email}`)).toBeVisible();

  await loginWithPassword(page, email);
  await expect(page.getByText(`Hello, ${email}!`)).toBeVisible();
  await expect(page.getByText('Hindi pa verified ang email mo')).toBeVisible(); // soft verification (D-026)

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/); // wala nang session
});

test('a wrong password shows one message and stays on the login page', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(uniqueEmail('wrong'));
  await page.getByLabel('Password').fill('mali-ang-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('❌ Invalid email or password');
  await expect(page).toHaveURL(/\/login$/);
});

test('the login and register forms tell password managers what each field is', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username');
  await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');
  await page.goto('/register');
  await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'new-password');
});

import { expect, type BrowserContext, type Page } from '@playwright/test';

const API = 'http://localhost:3100/api';
export const PASSWORD = 'E2E-Password-2026!';

// `e2e-` + `@example.com`: ang buburahin ng global-teardown — wala nang iba
export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

// Mabilis na paghahanda sa API (hindi ito ang sinusubok); ang Origin ay ang frontend, gaya ng sa browser (CSRF)
export async function registerViaApi(email: string, password = PASSWORD): Promise<void> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5199' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.status, 'register sa API').toBe(201);
}

export async function loginWithPassword(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

// VIRTUAL authenticator (Chrome DevTools Protocol): ang totoong navigator.credentials, pero ang "device" ay software.
// Parang phone na may fingerprint na laging pumapayag (isUserVerified) at laging may humahawak (automaticPresenceSimulation)
export async function addVirtualAuthenticator(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });
  return {
    credentials: async () => (await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials,
  };
}

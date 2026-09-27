import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';

// LAHAT O WALA + side effects PAGKATAPOS (Day 68). Pass-through na mock: ang totoong function, pero kayang pumalya nang
// isang beses kapag sinabi ng test (`mockRejectedValueOnce`). Hiwalay na file: ang vi.mock ay para sa BUONG file.
// (Ang unang rollback test: change-password-rollback.test.ts, Day 55)
vi.mock('../lib/session.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/session.ts')>();
  return { ...original, createRefreshToken: vi.fn(original.createRefreshToken) };
});
vi.mock('../lib/trustedDevices.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/trustedDevices.ts')>();
  return { ...original, createTrustedDevice: vi.fn(original.createTrustedDevice) };
});

const { default: app } = await import('../app.ts');
const { db } = await import('../db/index.ts');
const { auditLogs, refreshTokens, trustedDevices, users } = await import('../db/schema.ts');
const { createRefreshToken } = await import('../lib/session.ts');
const { createTrustedDevice } = await import('../lib/trustedDevices.ts');
const { testOutbox } = await import('../lib/email.ts');
const { drainBackground } = await import('../lib/background.ts');

const PASSWORD = 'Tx-Test-2026-pass!';
const created: string[] = [];

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  expect(res.status).toBe(201); // precondition
  return { email, userId: res.body.user.id as number };
}
const rowsOf = async (table: typeof refreshTokens | typeof trustedDevices, userId: number) =>
  (await db.select().from(table).where(eq(table.userId, userId))).length;

describe('login: no cookie unless every write succeeded', () => {
  it('when saving the refresh token fails: 500, NO cookies, not logged in, nothing left behind', async () => {
    const { email, userId } = await account('tx-login-refresh');
    vi.mocked(createRefreshToken).mockRejectedValueOnce(new Error('database hiccup'));

    const browser = request.agent(app);
    const res = await browser.post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(500);
    expect(res.get('Set-Cookie')).toBeUndefined(); // walang token o device_token sa "nabigong" login
    expect((await browser.get('/api/auth/me')).status).toBe(401); // hindi naka-login
    expect(await rowsOf(trustedDevices, userId)).toBe(0); // walang naiwang device

    const logins = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'login'), eq(auditLogs.targetId, userId)));
    expect(logins).toHaveLength(0);
  });

  it('when saving the trusted device fails: 500, NO cookies, and no refresh token row either', async () => {
    const { email, userId } = await account('tx-login-device');
    vi.mocked(createTrustedDevice).mockRejectedValueOnce(new Error('database hiccup'));

    const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(500);
    expect(res.get('Set-Cookie')).toBeUndefined();
    expect(await rowsOf(refreshTokens, userId)).toBe(0); // lahat o wala

    // Ayos na ang database → ang ulit ay gumagana
    expect((await request(app).post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(200);
  });
});

describe('change password and reset password roll back device trust too (Day 64 writes)', () => {
  it('change password: if trusting this browser fails, other devices keep their sessions AND their trust', async () => {
    const { email, userId } = await account('tx-change');
    const me = request.agent(app);
    const laptop = request.agent(app);
    await me.post('/api/auth/login').send({ email, password: PASSWORD });
    await laptop.post('/api/auth/login').send({ email, password: PASSWORD });
    expect(await rowsOf(trustedDevices, userId)).toBe(2);

    vi.mocked(createTrustedDevice).mockRejectedValueOnce(new Error('database hiccup')); // ang HULING hakbang
    const res = await me.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'Tx-New-2026-pass!' });
    expect(res.status).toBe(500);
    expect(res.get('Set-Cookie')).toBeUndefined();

    expect(await rowsOf(trustedDevices, userId)).toBe(2); // hindi nabawi ang tiwala
    expect((await laptop.post('/api/auth/refresh')).status).toBe(204); // hindi na-logout
    expect((await request(app).post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(200); // lumang password
  });

  it('reset password: if trusting this browser fails, the link, the password, the sessions and the lock are untouched', async () => {
    const { email, userId } = await account('tx-reset');
    const laptop = request.agent(app);
    await laptop.post('/api/auth/login').send({ email, password: PASSWORD });
    for (let i = 0; i < 5; i++) await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' }); // lock

    await request(app).post('/api/auth/forgot-password').send({ email });
    await drainBackground();
    const token = [...testOutbox]
      .reverse()
      .find((m) => m.to === email && m.text.includes('/reset-password#token='))
      ?.text.match(/#token=([\w-]+)/)?.[1];
    expect(token).toBeDefined(); // precondition

    vi.mocked(createTrustedDevice).mockRejectedValueOnce(new Error('database hiccup'));
    const res = await request(app).post('/api/auth/reset-password').send({ token, newPassword: 'Tx-Reset-2026-pass!' });
    expect(res.status).toBe(500);
    expect(res.get('Set-Cookie')).toBeUndefined();

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user?.lockedUntil).not.toBeNull(); // naka-lock pa rin
    expect(await rowsOf(trustedDevices, userId)).toBe(1); // hindi nabawi
    expect((await laptop.post('/api/auth/refresh')).status).toBe(204); // hindi na-logout

    // Hindi nasayang ang link: ang ulit ay gumagana
    expect((await request(app).post('/api/auth/reset-password').send({ token, newPassword: 'Tx-Reset-2026-pass!' })).status).toBe(204);
  });
});

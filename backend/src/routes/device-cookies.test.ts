import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { trustedDevices, users } from '../db/schema.ts';
import { testOutbox } from '../lib/email.ts';
import { drainBackground } from '../lib/background.ts';

const PASSWORD = 'Device-Test-2026!';
const created: string[] = [];
type Agent = ReturnType<typeof request.agent>;

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  return { email, userId: res.body.user.id as number };
}
// Isang "browser" na nakapag-login nang tama → may device_token cookie (pinagkakatiwalaan)
async function trustedBrowser(email: string, password = PASSWORD) {
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
  return agent;
}
// Ang attacker: bawat request ay walang cookie
function stranger() {
  return request(app);
}
async function fail5(client: Agent | ReturnType<typeof request>, email: string) {
  const out: number[] = [];
  for (let i = 0; i < 5; i++) out.push((await client.post('/api/auth/login').send({ email, password: 'wrong-password' })).status);
  return out;
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Device cookies laban sa lockout DoS (Day 64)
describe('device cookies (lockout DoS)', { timeout: 20_000 }, () => {
  it('sets an httpOnly device_token cookie on /api/auth/login only, for 180 days, and stores only its hash', async () => {
    const { email, userId } = await account('cookie');
    const res = await stranger().post('/api/auth/login').send({ email, password: PASSWORD });
    const cookie = res.get('Set-Cookie')?.find((c) => c.startsWith('device_token='));
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth/login');
    expect(cookie).toContain(`Max-Age=${180 * 24 * 60 * 60}`);

    const raw = cookie!.split(';')[0]!.split('=')[1]!;
    const rows = await db.select().from(trustedDevices).where(eq(trustedDevices.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.tokenHash).not.toBe(raw); // hash lang, hindi ang cookie mismo
  });

  it("an attacker can lock the account, but NOT the victim's usual browser", async () => {
    const { email } = await account('victim');
    const victim = await trustedBrowser(email);

    expect(await fail5(stranger(), email)).toEqual([401, 401, 401, 401, 401]);
    expect((await stranger().post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(423); // attacker: naka-lock
    expect((await victim.post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(200); // biktima: hindi
  });

  it("a trusted browser's own wrong passwords lock only that browser", async () => {
    const { email } = await account('own-count');
    const browser = await trustedBrowser(email);

    expect(await fail5(browser, email)).toEqual([401, 401, 401, 401, 401]);
    expect((await browser.post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(423);
    // Ang bilang ng account ay hindi nagalaw: ang ibang (bagong) browser ay makakapag-login pa rin
    expect((await stranger().post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(200);
  });

  it("a device cookie from account A gives no protection for account B", async () => {
    const a = await account('owner-a');
    const b = await account('target-b');
    const browserOfA = await trustedBrowser(a.email);

    expect(await fail5(browserOfA, b.email)).toEqual([401, 401, 401, 401, 401]); // binilang sa ACCOUNT ni B
    expect((await stranger().post('/api/auth/login').send({ email: b.email, password: PASSWORD })).status).toBe(423);
  });

  it('a forged device cookie is treated as untrusted', async () => {
    const { email } = await account('forged');
    const forger = request.agent(app).set('Cookie', 'device_token=gawa-gawa-lang');
    expect(await fail5(forger, email)).toEqual([401, 401, 401, 401, 401]);
    expect((await stranger().post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(423);
  });

  it('change password removes trust from every OTHER browser, and keeps this one trusted', async () => {
    const { email } = await account('change');
    const mine = await trustedBrowser(email);
    const stolenLaptop = await trustedBrowser(email);
    const newPassword = 'Device-Changed-2026!';

    const res = await mine.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword });
    expect(res.status).toBe(204);
    expect(res.get('Set-Cookie')?.some((c) => c.startsWith('device_token='))).toBe(true);

    await fail5(stranger(), email); // i-lock ang account
    expect((await stolenLaptop.post('/api/auth/login').send({ email, password: newPassword })).status).toBe(423);
    expect((await mine.post('/api/auth/login').send({ email, password: newPassword })).status).toBe(200);
  });

  it('password reset is the way out: it clears the account lock and trusts the browser that reset', async () => {
    const { email } = await account('reset');
    await fail5(stranger(), email);
    const victimOnNewPhone = request.agent(app);
    expect((await victimOnNewPhone.post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(423);

    await victimOnNewPhone.post('/api/auth/forgot-password').send({ email });
    await drainBackground();
    const mail = [...testOutbox].reverse().find((m) => m.to === email && m.text.includes('/reset-password#token='));
    const token = mail?.text.match(/#token=([\w-]+)/)?.[1];
    expect(token).toBeDefined();

    const newPassword = 'Device-Reset-2026!';
    const reset = await victimOnNewPhone.post('/api/auth/reset-password').send({ token, newPassword });
    expect(reset.status).toBe(204);
    expect(reset.get('Set-Cookie')?.some((c) => c.startsWith('device_token='))).toBe(true);

    expect((await victimOnNewPhone.post('/api/auth/login').send({ email, password: newPassword })).status).toBe(200);
    // At natanggal ang lock ng account (hindi lang para sa browser na ito)
    expect((await stranger().post('/api/auth/login').send({ email, password: newPassword })).status).toBe(200);
  });
});

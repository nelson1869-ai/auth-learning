import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users, verificationTokens } from '../db/schema.ts';
import { testOutbox } from '../lib/email.ts';
import { drainBackground } from '../lib/background.ts';
import { hashToken } from '../lib/session.ts';

const OLD = 'Old-Reset-Pass-2026!';
const NEW = 'New-Reset-Pass-2026!';
const created: string[] = [];

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: OLD });
  return { email, userId: res.body.user.id as number };
}
// Humingi ng reset link, at kunin ang token mula sa "email" (test outbox)
async function forgot(email: string) {
  const res = await request(app).post('/api/auth/forgot-password').send({ email });
  await drainBackground(); // ang email ay ipinapadala PAGKATAPOS sumagot
  const mail = [...testOutbox].reverse().find((m) => m.to === email);
  const token = mail?.text.match(/#token=([\w-]+)/)?.[1];
  return { res, mail, token };
}
function reset(token: string, newPassword = NEW) {
  return request(app).post('/api/auth/reset-password').send({ token, newPassword });
}
function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Password reset (Day 59)
describe('POST /api/auth/forgot-password', () => {
  it('emails a one-time link with the token in the #fragment, and stores only its hash', async () => {
    const { email } = await account('pr-mail');
    const { res, mail, token } = await forgot(email);
    expect(res.status).toBe(202);
    expect(mail?.subject).toBe('Reset your auth-learning password');
    expect(mail?.text).toMatch(/\/reset-password#token=/); // fragment, hindi ?token= (hindi napupunta sa server logs)
    const [row] = await db.select().from(verificationTokens).where(eq(verificationTokens.tokenHash, hashToken(token!)));
    expect(row).toMatchObject({ purpose: 'password_reset', usedAt: null });
    expect(JSON.stringify(row)).not.toContain(token!);
  });

  it('gives the SAME answer for an email with no account — and sends nothing', async () => {
    const { email } = await account('pr-same');
    const known = await forgot(email);
    const before = testOutbox.length;
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: `walang-account-${Date.now()}@example.com` });
    await drainBackground();
    expect(unknown.status).toBe(known.res.status);
    expect(unknown.body).toEqual(known.res.body);
    expect(testOutbox.length).toBe(before); // walang email
  });

  it('400 for input that is not an email', async () => {
    expect((await request(app).post('/api/auth/forgot-password').send({ email: 'hindi-email' })).status).toBe(400);
  });

  it('a new request makes the older link stop working (only the newest email works)', async () => {
    const { email } = await account('pr-newest');
    const first = await forgot(email);
    const second = await forgot(email);
    expect((await reset(first.token!)).status).toBe(400);
    expect((await reset(second.token!)).status).toBe(204);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('sets the new password, logs out every session, and records it', async () => {
    const { email, userId } = await account('pr-ok');
    const device = request.agent(app);
    await device.post('/api/auth/login').send({ email, password: OLD });
    const { token } = await forgot(email);

    expect((await reset(token!)).status).toBe(204);
    expect((await login(email, OLD)).status).toBe(401);
    expect((await login(email, NEW)).status).toBe(200);
    expect((await device.post('/api/auth/refresh')).status).toBe(401); // na-logout ang dating session

    const rows = await db.select().from(auditLogs).where(and(eq(auditLogs.action, 'password_reset'), eq(auditLogs.actorId, userId)));
    expect(rows).toHaveLength(1);
  });

  it('works only ONCE', async () => {
    const { email } = await account('pr-once');
    const { token } = await forgot(email);
    expect((await reset(token!)).status).toBe(204);
    expect((await reset(token!, 'Another-Pass-2026!')).status).toBe(400);
    expect((await login(email, NEW)).status).toBe(200); // hindi napalitan ng pangalawa
  });

  it('only one of two simultaneous uses of the same link wins', async () => {
    const { email } = await account('pr-race');
    const { token } = await forgot(email);
    const results = await Promise.all([reset(token!, 'Race-Pass-A-2026!'), reset(token!, 'Race-Pass-B-2026!')]);
    expect(results.map((r) => r.status).sort()).toEqual([204, 400]);
  });

  it('400 for an expired link', async () => {
    const { email } = await account('pr-expired');
    const { token } = await forgot(email);
    await db.update(verificationTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(verificationTokens.tokenHash, hashToken(token!)));
    expect((await reset(token!)).status).toBe(400);
    expect((await login(email, OLD)).status).toBe(200);
  });

  it('400 with one message for a made-up token, and for a new password that is too short', async () => {
    const made = await reset('gawa-gawa-lang');
    expect(made.status).toBe(400);
    expect(made.body).toEqual({ error: 'This reset link is invalid or has expired' });
    const { email } = await account('pr-short');
    const { token } = await forgot(email);
    expect((await reset(token!, 'short')).body.fields.newPassword).toBeDefined();
  });
});

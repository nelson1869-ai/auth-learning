import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users, verificationTokens } from '../db/schema.ts';
import { testOutbox } from '../lib/email.ts';
import { drainBackground } from '../lib/background.ts';
import { hashToken } from '../lib/session.ts';

const PASSWORD = 'Verify-Test-2026!';
const created: string[] = [];

// Bagong account (naka-login) + ang verification email na natanggap nito
async function registered(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: PASSWORD });
  await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  await drainBackground(); // ipinapadala ang email PAGKATAPOS sumagot ang register
  return { agent, email, userId: res.body.user.id as number, token: latestToken(email) };
}
function latestToken(email: string) {
  const mail = [...testOutbox].reverse().find((m) => m.to === email && m.subject.startsWith('Confirm'));
  return mail?.text.match(/\/verify-email#token=([\w-]+)/)?.[1];
}
function verify(token: string) {
  return request(app).post('/api/auth/verify-email').send({ token });
}
async function isVerified(agent: ReturnType<typeof request.agent>) {
  return (await agent.get('/api/auth/me')).body.user.emailVerified as boolean;
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Email verification (Day 60) — "soft"
describe('after register', () => {
  it('sends a verification link (token in the #fragment) — and the account can already log in', async () => {
    const { agent, token } = await registered('ve-mail');
    expect(token).toBeTruthy();
    expect(await isVerified(agent)).toBe(false); // soft: naka-login na, pero hindi pa verified
  });
});

describe('POST /api/auth/verify-email', () => {
  it('marks the email as verified — without needing to be logged in — and records it', async () => {
    const { agent, token, userId } = await registered('ve-ok');
    expect((await verify(token!)).status).toBe(204);
    expect(await isVerified(agent)).toBe(true);
    const rows = await db.select().from(auditLogs).where(and(eq(auditLogs.action, 'email_verified'), eq(auditLogs.actorId, userId)));
    expect(rows).toHaveLength(1);
  });

  it('works only once', async () => {
    const { token } = await registered('ve-once');
    expect((await verify(token!)).status).toBe(204);
    expect((await verify(token!)).status).toBe(400);
  });

  it('400 for an expired link', async () => {
    const { agent, token } = await registered('ve-expired');
    await db.update(verificationTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(verificationTokens.tokenHash, hashToken(token!)));
    expect((await verify(token!)).status).toBe(400);
    expect(await isVerified(agent)).toBe(false);
  });

  it('a password RESET token cannot be used to verify an email (different purpose)', async () => {
    const { agent, email } = await registered('ve-purpose');
    await request(app).post('/api/auth/forgot-password').send({ email });
    await drainBackground();
    const resetMail = [...testOutbox].reverse().find((m) => m.to === email && m.subject.startsWith('Reset'));
    const resetToken = resetMail?.text.match(/#token=([\w-]+)/)?.[1];
    expect((await verify(resetToken!)).status).toBe(400);
    expect(await isVerified(agent)).toBe(false);
  });

  it('400 with one message for a made-up token', async () => {
    const res = await verify('gawa-gawa-lang');
    expect(res.body).toEqual({ error: 'This verification link is invalid or has expired' });
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('sends a new link, and the old one stops working', async () => {
    const { agent, email, token: oldToken } = await registered('ve-resend');
    expect((await agent.post('/api/auth/resend-verification')).status).toBe(202);
    await drainBackground();
    const newToken = latestToken(email);
    expect(newToken).not.toBe(oldToken);
    expect((await verify(oldToken!)).status).toBe(400);
    expect((await verify(newToken!)).status).toBe(204);
  });

  it('409 when the email is already verified — no email is sent', async () => {
    const { agent, token } = await registered('ve-already');
    await verify(token!);
    const before = testOutbox.length;
    expect((await agent.post('/api/auth/resend-verification')).status).toBe(409);
    await drainBackground();
    expect(testOutbox.length).toBe(before);
  });

  it('401 without login', async () => {
    expect((await request(app).post('/api/auth/resend-verification')).status).toBe(401);
  });
});

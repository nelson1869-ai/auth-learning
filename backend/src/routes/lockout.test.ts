import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';

const PASSWORD = 'Lockout-Test-2026!';
const created: string[] = [];

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  return { email, userId: res.body.user.id as number };
}
function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}
// Sunod-sunod (hindi sabay) — ang sabay na hula ay para sa Day 66
async function statuses(email: string, password: string, times: number) {
  const out: number[] = [];
  for (let i = 0; i < times; i++) out.push((await login(email, password)).status);
  return out;
}
async function row(userId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return u;
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Per-account lockout (Day 63)
describe('per-account lockout', () => {
  it('locks after 5 wrong passwords: 401 ×5, then 423 — even with the RIGHT password', async () => {
    const { email, userId } = await account('lock');
    expect(await statuses(email, 'wrong-password', 5)).toEqual([401, 401, 401, 401, 401]);

    const wrong = await login(email, 'wrong-password');
    expect(wrong.status).toBe(423);
    const right = await login(email, PASSWORD);
    expect(right.status).toBe(423);
    expect(right.body).toEqual({ error: 'Account temporarily locked. Please try again later.' });
    expect(right.headers['set-cookie']).toBeUndefined(); // walang session
    const retryAfter = Number(right.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(890);
    expect(retryAfter).toBeLessThanOrEqual(900);

    const locks = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'account_locked'), eq(auditLogs.targetId, userId)));
    expect(locks).toHaveLength(1); // isang beses lang, kahit may mga subok pa habang naka-lock
  });

  it('unlocks after 15 minutes: the right password works and the counter starts over', async () => {
    const { email, userId } = await account('expired');
    await statuses(email, 'wrong-password', 5);
    // "Lumipas ang 15 minuto" — hindi naghihintay ang test, inuurong ang oras sa DB
    await db.update(users).set({ lockedUntil: new Date(Date.now() - 1000) }).where(eq(users.id, userId));

    expect((await login(email, PASSWORD)).status).toBe(200);
    const u = await row(userId);
    expect(u?.failedLoginAttempts).toBe(0);
    expect(u?.lockedUntil).toBeNull();
  });

  it('after a lock expires, one more wrong password does not lock again right away', async () => {
    const { email, userId } = await account('fresh-count');
    await statuses(email, 'wrong-password', 5);
    await db.update(users).set({ lockedUntil: new Date(Date.now() - 1000) }).where(eq(users.id, userId));

    expect(await statuses(email, 'wrong-password', 4)).toEqual([401, 401, 401, 401]);
    expect((await row(userId))?.lockedUntil).toBeNull(); // 5 subok ulit, hindi 1
  });

  it('counts only CONSECUTIVE failures: a successful login resets the counter', async () => {
    const { email, userId } = await account('reset');
    await statuses(email, 'wrong-password', 4);
    expect((await row(userId))?.failedLoginAttempts).toBe(4);
    expect((await login(email, PASSWORD)).status).toBe(200);
    expect((await row(userId))?.failedLoginAttempts).toBe(0);
    expect(await statuses(email, 'wrong-password', 4)).toEqual([401, 401, 401, 401]);
    expect((await login(email, PASSWORD)).status).toBe(200);
  });

  it('locks only that account, not others', async () => {
    const victim = await account('victim');
    const other = await account('other');
    await statuses(victim.email, 'wrong-password', 5);
    expect((await login(victim.email, PASSWORD)).status).toBe(423);
    expect((await login(other.email, PASSWORD)).status).toBe(200);
  });

  // Day 63–70: "ang walang account ay hindi kailanman 423" — iyon mismo ang butas (malalaman kung sino ang may account).
  // Day 71: pareho na ang ugali — tingnan ang enumeration.test.ts
  it('an email with no account ALSO locks after 5 (same answers as a real account — Day 71)', async () => {
    const email = `nobody-${Date.now()}@example.com`;
    expect(await statuses(email, 'wrong-password', 7)).toEqual([401, 401, 401, 401, 401, 423, 423]);
  });
});

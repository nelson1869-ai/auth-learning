import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, refreshTokens, users } from '../db/schema.ts';
import { hashToken } from '../lib/session.ts';

const PASSWORD = 'Logout-Test-2026!';
const created: string[] = [];

function cookie(res: request.Response, name: string) {
  return (res.get('Set-Cookie') ?? []).find((c) => c.startsWith(`${name}=`));
}
function valueOf(setCookie: string | undefined) {
  return setCookie?.split(';')[0].split('=').slice(1).join('=') ?? '';
}
function refreshWith(token: string) {
  return request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${token}`);
}

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  return email;
}
async function login(email: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { userId: res.body.user.id as number, refresh: valueOf(cookie(res, 'refresh_token')) };
}
function logoutWith(refresh: string) {
  return request(app).post('/api/auth/logout').set('Cookie', `refresh_token=${refresh}`);
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Totoong logout (Day 53)
describe('logout revokes the session in the database', () => {
  it('a refresh token copied BEFORE logout no longer works after it', async () => {
    const { refresh: copied } = await login(await account('lo-copied'));
    expect((await logoutWith(copied)).status).toBe(204);
    expect((await refreshWith(copied)).status).toBe(401); // dati (Day 51–52): 204 pa rin

    const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(copied)));
    expect(row).toMatchObject({ revokeReason: 'logout' });
  });

  it('also revokes the newest token of a rotated session (the whole family)', async () => {
    const { refresh: first } = await login(await account('lo-rotated'));
    const second = valueOf(cookie(await refreshWith(first), 'refresh_token'));
    await logoutWith(second);
    expect((await refreshWith(second)).status).toBe(401);
    expect((await refreshWith(first)).status).toBe(401); // kahit sa loob ng reuse interval — patay na ang family
  });

  it('only logs out this device, not my other logins', async () => {
    const email = await account('lo-devices');
    const phone = await login(email);
    const laptop = await login(email);
    await logoutWith(phone.refresh);
    expect((await refreshWith(phone.refresh)).status).toBe(401);
    expect((await refreshWith(laptop.refresh)).status).toBe(204);
  });

  it('is not treated as theft: replaying a logged-out token writes no refresh_reuse row', async () => {
    const { userId, refresh } = await login(await account('lo-notreuse'));
    await logoutWith(refresh);
    await refreshWith(refresh);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'refresh_reuse'), eq(auditLogs.targetId, userId)));
    expect(rows).toHaveLength(0);
  });

  it('records who logged out even when the access token already expired (from the refresh token)', async () => {
    const { userId, refresh } = await login(await account('lo-audit'));
    await logoutWith(refresh); // walang access token — refresh_token lang
    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'logout'), eq(auditLogs.actorId, userId)));
    expect(rows).toHaveLength(1);
  });

  it('still works (204) with no cookie or a made-up token', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(204);
    expect((await logoutWith('gawa-gawa-lang')).status).toBe(204);
  });
});

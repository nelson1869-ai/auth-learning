import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, refreshTokens, users } from '../db/schema.ts';
import { hashToken, REUSE_INTERVAL_MS } from '../lib/session.ts';

const PASSWORD = 'Rotation-Test-2026!';
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
async function rowOf(token: string) {
  const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(token)));
  return row;
}
// Gayahin na na-rotate ang token matagal na (lampas sa reuse interval)
async function ageRotation(token: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(Date.now() - REUSE_INTERVAL_MS - 1000) })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}

async function loggedIn(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { email, userId: login.body.user.id as number, token: valueOf(cookie(login, 'refresh_token')) };
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Rotation at reuse detection (Day 52)
describe('rotation', () => {
  it('gives a NEW refresh token each time, in the same family, and retires the old one', async () => {
    const { token: first } = await loggedIn('rot-new');
    const res = await refreshWith(first);
    expect(res.status).toBe(204);
    const second = valueOf(cookie(res, 'refresh_token'));
    expect(second).not.toBe(first);
    expect(second).toBeTruthy();

    const oldRow = await rowOf(first);
    const newRow = await rowOf(second);
    expect(oldRow).toMatchObject({ revokeReason: 'rotated' });
    expect(oldRow.revokedAt).toBeInstanceOf(Date);
    expect(newRow).toMatchObject({ revokedAt: null, familyId: oldRow.familyId });

    // Ang bago ay gumagana ulit (tuloy-tuloy ang session)
    expect((await refreshWith(second)).status).toBe(204);
  });
});

describe('reuse detection', () => {
  it('treats an old token used again (after the interval) as stolen: 401 and the WHOLE family revoked', async () => {
    const { token: first, userId } = await loggedIn('rot-stolen');
    const second = valueOf(cookie(await refreshWith(first), 'refresh_token')); // ang tunay na user ay nag-refresh
    await ageRotation(first);

    const replay = await refreshWith(first); // ang magnanakaw, gamit ang lumang kopya
    expect(replay.status).toBe(401);
    expect(cookie(replay, 'refresh_token')).toMatch(/Expires=Thu, 01 Jan 1970/);

    // Pati ang BAGONG token ng tunay na user ay binawi na — hindi alam kung sino ang magnanakaw
    expect(await rowOf(second)).toMatchObject({ revokeReason: 'reuse' });
    expect((await refreshWith(second)).status).toBe(401);

    // Security event sa audit log
    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'refresh_reuse'), eq(auditLogs.targetId, userId)));
    expect(rows).toHaveLength(1);
  });

  it('does not touch other logins (families) of the same user', async () => {
    const email = `rot-families-${Date.now()}@example.com`;
    created.push(email);
    await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
    const phone = valueOf(cookie(await request(app).post('/api/auth/login').send({ email, password: PASSWORD }), 'refresh_token'));
    const laptop = valueOf(cookie(await request(app).post('/api/auth/login').send({ email, password: PASSWORD }), 'refresh_token'));

    await refreshWith(phone);
    await ageRotation(phone);
    expect((await refreshWith(phone)).status).toBe(401); // nakaw sa phone → phone family lang

    expect((await refreshWith(laptop)).status).toBe(204); // ang laptop ay naka-login pa rin
  });
});

describe('reuse interval (two tabs refreshing at the same time)', () => {
  it('lets parallel refreshes with the same token all succeed, with exactly ONE rotation', async () => {
    const { token } = await loggedIn('rot-parallel');
    const results = await Promise.all(Array.from({ length: 5 }, () => refreshWith(token)));

    expect(results.map((r) => r.status)).toEqual([204, 204, 204, 204, 204]);
    const withNewRefresh = results.filter((r) => cookie(r, 'refresh_token'));
    expect(withNewRefresh).toHaveLength(1); // isa lang ang nanalo sa claim
    expect(results.every((r) => cookie(r, 'token'))).toBe(true); // lahat ay may access token

    const family = (await rowOf(token)).familyId;
    const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.familyId, family));
    expect(rows).toHaveLength(2); // ang luma (rotated) + ISANG bago
    expect(rows.filter((r) => r.revokedAt === null)).toHaveLength(1);
  });

  it('gives no grace once the family is revoked (e.g. after reuse)', async () => {
    const { token: first } = await loggedIn('rot-nograce');
    const second = valueOf(cookie(await refreshWith(first), 'refresh_token'));
    await db.update(refreshTokens).set({ revokedAt: new Date(), revokeReason: 'reuse' }).where(eq(refreshTokens.tokenHash, hashToken(second)));
    expect((await refreshWith(first)).status).toBe(401); // kanina lang na-rotate, pero patay na ang family
  });
});

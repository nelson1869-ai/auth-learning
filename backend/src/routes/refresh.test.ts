import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { refreshTokens, users } from '../db/schema.ts';
import { hashToken } from '../lib/session.ts';

const PASSWORD = 'Refresh-Test-2026!';
const created: string[] = [];

// Ang Set-Cookie ng isang cookie (hal. "refresh_token=...; Path=/api/auth; HttpOnly")
function cookie(res: request.Response, name: string): string | undefined {
  const all = res.get('Set-Cookie') ?? [];
  return all.find((c) => c.startsWith(`${name}=`));
}
function valueOf(setCookie: string | undefined) {
  return setCookie?.split(';')[0].split('=').slice(1).join('=') ?? '';
}

async function loggedIn(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ email, password: PASSWORD });
  const login = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  return { agent, email, login, refresh: valueOf(cookie(login, 'refresh_token')) };
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created)); // CASCADE → pati ang refresh tokens nila
});

// Refresh tokens (Day 51)
describe('login issues two tokens', () => {
  it('a 15-minute access token and a 7-day refresh token only sent to /api/auth', async () => {
    const { login } = await loggedIn('rt-cookies');
    const access = cookie(login, 'token')!;
    const refresh = cookie(login, 'refresh_token')!;

    const payload = jwt.decode(valueOf(access)) as { iat: number; exp: number };
    expect(payload.exp - payload.iat).toBe(15 * 60);
    expect(access).toMatch(/HttpOnly/);

    expect(refresh).toMatch(/Path=\/api\/auth/);
    expect(refresh).toMatch(/HttpOnly/);
    expect(refresh).toMatch(/Max-Age=604800/); // 7 araw
  });

  it('stores only the SHA-256 hash of the refresh token, never the token itself', async () => {
    const { refresh } = await loggedIn('rt-hash');
    const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(refresh)));
    expect(row).toBeDefined();
    const [raw] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, refresh));
    expect(raw).toBeUndefined();
  });
});

describe('POST /api/auth/refresh', () => {
  it('gives a new access token that works on /me', async () => {
    const { refresh } = await loggedIn('rt-ok');
    // Walang access token (parang expired na) — refresh token lang ang ipinapadala
    const res = await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}`);
    expect(res.status).toBe(204);
    const newAccess = valueOf(cookie(res, 'token'));
    const me = await request(app).get('/api/auth/me').set('Cookie', `token=${newAccess}`);
    expect(me.status).toBe(200);
  });

  it.each([
    ['no cookie', undefined],
    ['a made-up token', 'gawa-gawa-lang'],
  ])('401 and clears the cookies with %s', async (_label, value) => {
    const req = request(app).post('/api/auth/refresh');
    const res = await (value ? req.set('Cookie', `refresh_token=${value}`) : req);
    expect(res.status).toBe(401);
    expect(cookie(res, 'refresh_token')).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('401 for an expired or revoked refresh token', async () => {
    const a = await loggedIn('rt-expired');
    await db.update(refreshTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(refreshTokens.tokenHash, hashToken(a.refresh)));
    expect((await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${a.refresh}`)).status).toBe(401);

    const b = await loggedIn('rt-revoked');
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashToken(b.refresh)));
    expect((await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${b.refresh}`)).status).toBe(401);
  });

  it('401 once the user is deleted (their refresh tokens are deleted too)', async () => {
    const { email, refresh } = await loggedIn('rt-deleted');
    await db.delete(users).where(eq(users.email, email));
    expect((await request(app).post('/api/auth/refresh').set('Cookie', `refresh_token=${refresh}`)).status).toBe(401);
  });
});

describe('logout', () => {
  it('clears both cookies', async () => {
    const { agent } = await loggedIn('rt-logout');
    const res = await agent.post('/api/auth/logout');
    expect(cookie(res, 'token')).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie(res, 'refresh_token')).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie(res, 'refresh_token')).toMatch(/Path=\/api\/auth/);
    // Hindi na makakakuha ng bagong access token ang browser na ito
    expect((await agent.post('/api/auth/refresh')).status).toBe(401);
  });
});

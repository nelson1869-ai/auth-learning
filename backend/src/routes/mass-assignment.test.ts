import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import type { Response } from 'express';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { refreshTokens, users } from '../db/schema.ts';
import { parseOr400 } from '../controllers/http.ts';
import { changePasswordSchema, registerSchema } from '../validations/auth.ts';

// Mass assignment (Day 77): nagpapadala ang attacker ng DAGDAG na field sa body (hal. "userId", "role"), umaasang
// basta ipapasa ito ng code sa database. Tatlong depensa (Day 74–76), sinusubok nang hiwalay:
//   1. parseOr400 (Zod) — tinatanggal ang mga field na wala sa schema
//   2. pagkakasunod ng spread — `{ ...input, userId }`: ang galing sa SERVER ang nasa huli, kaya ito ang nananalo
//   3. tahasang pagpili ng field sa service — hal. `values({ email: input.email, name: input.name, passwordHash })`
const PASSWORD = 'Mass-Assign-2026!';
const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  expect(res.status).toBe(201); // precondition
  return { email, id: res.body.user.id as number };
}
async function hashOf(id: number) {
  const [u] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, id));
  return u!.passwordHash;
}

describe('depensa 1: parseOr400 returns ONLY the fields in the schema', () => {
  it('drops smuggled keys (userId, role) from the parsed input', () => {
    const res = { status: () => res, json: () => res } as unknown as Response;
    const parsed = parseOr400(
      changePasswordSchema,
      { currentPassword: 'Old-Password-1', newPassword: 'New-Password-2', userId: 1, role: 'admin' },
      res,
    );
    expect(parsed).toEqual({ currentPassword: 'Old-Password-1', newPassword: 'New-Password-2' });

    const reg = parseOr400(registerSchema, { email: 'x@example.com', password: PASSWORD, role: 'admin', id: 1 }, res);
    expect(Object.keys(reg ?? {}).sort()).toEqual(['email', 'password']);
  });
});

describe('smuggled fields in real requests are ignored', () => {
  it('change-password with a victim userId in the body changes ONLY the attacker password', async () => {
    const victim = await account('ma-victim');
    const attacker = await account('ma-attacker');
    const victimHashBefore = await hashOf(victim.id);

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: attacker.email, password: PASSWORD });
    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: PASSWORD, newPassword: 'Hijacked-2026-pass!', userId: victim.id });
    expect(res.status).toBe(204);

    expect(await hashOf(victim.id)).toBe(victimHashBefore); // hindi nagalaw ang biktima
    expect((await request(app).post('/api/auth/login').send({ email: victim.email, password: PASSWORD })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: attacker.email, password: 'Hijacked-2026-pass!' })).status).toBe(200);
  });

  it('register ignores role, email_verified, lockout and id fields in the body', async () => {
    const email = `ma-register-${Date.now()}@example.com`;
    created.push(email);
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: PASSWORD,
      role: 'admin',
      emailVerifiedAt: new Date().toISOString(),
      failedLoginAttempts: -1000,
      lockedUntil: null,
      id: 1,
    });
    expect(res.status).toBe(201);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u?.role).toBe('user');
    expect(u?.emailVerifiedAt).toBeNull();
    expect(u?.failedLoginAttempts).toBe(0);
    expect(u?.id).not.toBe(1);
  });

  it('login ignores a device (ip, user agent) sent in the body — the server decides', async () => {
    const { email, id } = await account('ma-login');
    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'totoong-browser')
      .send({ email, password: PASSWORD, device: { ip: '6.6.6.6', userAgent: 'pekeng-device' }, deviceToken: 'peke' });
    expect(res.status).toBe(200);
    const [token] = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, id));
    expect(token?.ip).not.toBe('6.6.6.6');
    expect(token?.userAgent).toBe('totoong-browser');
  });
});

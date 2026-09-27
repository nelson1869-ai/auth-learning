import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { inArray } from 'drizzle-orm';

// Pass-through na mock: totoong createRefreshToken, pero kayang pumalya nang isang beses kapag sinabi ng test.
// (Hiwalay na file: ang vi.mock ay para sa BUONG file)
vi.mock('../lib/session.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../lib/session.ts')>();
  return { ...original, createRefreshToken: vi.fn(original.createRefreshToken) };
});

const { default: app } = await import('../app.ts');
const { db } = await import('../db/index.ts');
const { users } = await import('../db/schema.ts');
const { createRefreshToken } = await import('../lib/session.ts');

const OLD = 'Old-Password-2026!';
const created: string[] = [];

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// LAHAT O WALA (Day 55): kapag pumalya sa gitna ng transaction, walang nagbago
describe('change password is all-or-nothing', () => {
  it('when creating the new session fails, the old password and the other devices are untouched', async () => {
    const email = `cp-rollback-${Date.now()}@example.com`;
    created.push(email);
    await request(app).post('/api/auth/register').send({ email, password: OLD });
    const me = request.agent(app);
    const other = request.agent(app);
    await me.post('/api/auth/login').send({ email, password: OLD });
    await other.post('/api/auth/login').send({ email, password: OLD });

    // Papalya ang HULING hakbang ng transaction (pagkatapos ng UPDATE ng password at ng pagbawi ng sessions)
    vi.mocked(createRefreshToken).mockRejectedValueOnce(new Error('database hiccup'));
    const res = await me.post('/api/auth/change-password').send({ currentPassword: OLD, newPassword: 'New-Password-2026!' });
    expect(res.status).toBe(500);

    // Rollback: gumagana pa ang LUMANG password, at hindi na-logout ang ibang device
    expect((await request(app).post('/api/auth/login').send({ email, password: OLD })).status).toBe(200);
    expect((await other.post('/api/auth/refresh')).status).toBe(204);
  });
});

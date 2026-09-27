import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';

const OLD = 'Old-Password-2026!';
const NEW = 'New-Password-2026!';
const created: string[] = [];

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: OLD });
  return email;
}
async function device(email: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: OLD });
  return { agent, userId: res.body.user.id as number };
}
function change(agent: ReturnType<typeof request.agent>, currentPassword: string, newPassword: string) {
  return agent.post('/api/auth/change-password').send({ currentPassword, newPassword });
}
async function auditCount(action: 'password_changed' | 'password_change_failed', userId: number) {
  const rows = await db.select().from(auditLogs).where(and(eq(auditLogs.action, action), eq(auditLogs.actorId, userId)));
  return rows.length;
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Change password (Day 55)
describe('POST /api/auth/change-password', () => {
  it('changes the password, logs out EVERY other device, and keeps this one logged in', async () => {
    const email = await account('cp-ok');
    const laptop = await device(email);
    const phone = await device(email);

    expect((await change(laptop.agent, OLD, NEW)).status).toBe(204);

    // Ang password: bago ang gumagana, hindi na ang luma
    expect((await request(app).post('/api/auth/login').send({ email, password: OLD })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password: NEW })).status).toBe(200);

    // Ang ibang device: na-logout (hindi na makakakuha ng bagong access token)
    expect((await phone.agent.post('/api/auth/refresh')).status).toBe(401);
    // Ang device na ito: may BAGONG session — tuloy pa rin
    expect((await laptop.agent.post('/api/auth/refresh')).status).toBe(204);
    expect(await auditCount('password_changed', laptop.userId)).toBe(1);
  });

  it('400 on a wrong current password — nothing changes, and it is audited', async () => {
    const email = await account('cp-wrong');
    const me = await device(email);
    const other = await device(email);

    const res = await change(me.agent, 'hula-hula-lang', NEW);
    expect(res.status).toBe(400); // hindi 401: hindi ito "hindi ka naka-login"
    expect(res.body.fields.currentPassword).toEqual(['Incorrect password']);

    expect((await request(app).post('/api/auth/login').send({ email, password: OLD })).status).toBe(200);
    expect((await other.agent.post('/api/auth/refresh')).status).toBe(204); // walang na-logout
    expect(await auditCount('password_change_failed', me.userId)).toBe(1);
  });

  it.each([
    ['a new password that is too short', OLD, 'short'],
    ['the same password as now', OLD, OLD],
  ])('400 for %s', async (_label, currentPassword, newPassword) => {
    const me = await device(await account('cp-invalid'));
    const res = await change(me.agent, currentPassword, newPassword);
    expect(res.status).toBe(400);
    expect(res.body.fields.newPassword).toBeDefined();
  });

  it('401 without login', async () => {
    const res = await request(app).post('/api/auth/change-password').send({ currentPassword: OLD, newPassword: NEW });
    expect(res.status).toBe(401);
  });

  it('never stores the new password as plain text', async () => {
    const email = await account('cp-hash');
    const me = await device(email);
    await change(me.agent, OLD, NEW);
    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.email, email));
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row.passwordHash).not.toContain(NEW);
  });
});

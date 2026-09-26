import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { and, eq, inArray, sql } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import { setRole } from '../db/set-role.ts';

const PASSWORD = 'Audit-Test-2026!';
const created: string[] = [];

function uniqueEmail(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  return email;
}

async function registered(prefix: string) {
  const email = uniqueEmail(prefix);
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: PASSWORD });
  return { agent, email, id: res.body.user.id as number };
}

// Mga audit row ng isang user (bilang gumawa O bilang naapektuhan) — hindi apektado ng ibang test
function rowsFor(userId: number) {
  return db.select().from(auditLogs).where(sql`${auditLogs.actorId} = ${userId} OR ${auditLogs.targetId} = ${userId}`);
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Audit log (Day 48): sino, ano, kanino, saan, kailan
describe('audit log', () => {
  it('records register, login and logout with who, IP and user agent', async () => {
    const { agent, email, id } = await registered('audit-flow');
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    await agent.post('/api/auth/logout');

    const rows = await rowsFor(id);
    expect(rows.map((r) => r.action).sort()).toEqual(['login', 'logout', 'register']);
    for (const row of rows) {
      expect(row.actorId).toBe(id);
      expect(row.ip).toBeTruthy();
      expect(row.createdAt).toBeInstanceOf(Date);
    }
  });

  it('records a failed login against the targeted account — never the password', async () => {
    const { email, id } = await registered('audit-fail');
    await request(app).post('/api/auth/login').send({ email, password: 'Wrong-Password-123' });

    const [row] = (await rowsFor(id)).filter((r) => r.action === 'login_failed');
    expect(row).toMatchObject({ actorId: null, targetId: id, metadata: { email } });
    expect(JSON.stringify(row)).not.toContain('Wrong-Password-123');
  });

  it('records a failed login for an email with no account too (target null)', async () => {
    const email = uniqueEmail('audit-nobody');
    await request(app).post('/api/auth/login').send({ email, password: 'whatever-123' });
    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'login_failed'), sql`${auditLogs.metadata}->>'email' = ${email}`));
    expect(rows).toHaveLength(1);
    expect(rows[0].targetId).toBeNull();
  });

  it('records a logout without a valid token as an unknown actor', async () => {
    const ua = `audit-anon-${Date.now()}`;
    await request(app).post('/api/auth/logout').set('User-Agent', ua);
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.userAgent, ua));
    expect(rows).toMatchObject([{ action: 'logout', actorId: null }]);
  });

  it('cuts a very long user agent', async () => {
    const ua = `audit-long-${Date.now()}-`.padEnd(5000, 'x');
    await request(app).post('/api/auth/logout').set('User-Agent', ua);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.userAgent, ua.slice(0, 300)));
    expect(row.userAgent).toHaveLength(300);
  });

  it('records access_denied when a normal user tries an admin route', async () => {
    const { agent, email, id } = await registered('audit-denied');
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    expect((await agent.get('/api/admin/users')).status).toBe(403);
    const [row] = (await rowsFor(id)).filter((r) => r.action === 'access_denied');
    expect(row.metadata).toEqual({ path: '/api/admin/users' });
  });

  it('keeps the rows when the user is deleted (actor becomes null)', async () => {
    const { id } = await registered('audit-deleted');
    await db.delete(users).where(eq(users.id, id));
    const rows = await db.select().from(auditLogs).where(eq(auditLogs.targetId, id));
    expect(rows).toHaveLength(1); // ang register row — nandoon pa
    expect(rows[0].actorId).toBeNull();
  });

  it('does not break login when the audit write fails', async () => {
    const { email } = await registered('audit-broken');
    const realInsert = db.insert.bind(db);
    const spy = vi.spyOn(db, 'insert').mockImplementation(((table: unknown) => {
      if (table === auditLogs) throw new Error('database hiccup');
      return realInsert(table as typeof users);
    }) as typeof db.insert);
    const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    spy.mockRestore();
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/audit-logs', () => {
  it('shows the newest rows with the actor email, and records the viewing itself', async () => {
    const { agent, email, id } = await registered('audit-admin');
    await setRole(db, { email, role: 'admin' });
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });

    const res = await agent.get('/api/admin/audit-logs?limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 5 });
    expect(res.body.logs.length).toBeLessThanOrEqual(5);
    // Ang huling row ng admin na ito: ang pagtingin mismo, may email niya
    const mine = res.body.logs.find((log: { actorId: number }) => log.actorId === id);
    expect(mine).toMatchObject({ action: 'admin_list_audit_logs', actorEmail: email });
  });

  it('403 for a normal user', async () => {
    const { agent, email } = await registered('audit-notadmin');
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    expect((await agent.get('/api/admin/audit-logs')).status).toBe(403);
  });
});

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';

const PASSWORD = 'Sessions-Test-2026!';
const created: string[] = [];

function cookie(res: request.Response, name: string) {
  return (res.get('Set-Cookie') ?? []).find((c) => c.startsWith(`${name}=`));
}

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  return email;
}
// Isang "device" = isang agent (may sariling cookie jar) na may sariling User-Agent
async function device(email: string, userAgent: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set('User-Agent', userAgent).send({ email, password: PASSWORD });
  return { agent, userId: res.body.user.id as number };
}
type Session = { id: string; userAgent: string; current: boolean; since: string; lastUsedAt: string };
async function sessionsOf(agent: ReturnType<typeof request.agent>) {
  const res = await agent.get('/api/auth/sessions');
  return res.body.sessions as Session[];
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Mga device ko (Day 54)
describe('GET /api/auth/sessions', () => {
  it('lists my logged-in devices and marks the one asking as current', async () => {
    const email = await account('ses-list');
    const phone = await device(email, 'Phone Browser');
    await device(email, 'Laptop Browser');

    const list = await sessionsOf(phone.agent);
    expect(list).toHaveLength(2);
    expect(list.map((s) => s.userAgent).sort()).toEqual(['Laptop Browser', 'Phone Browser']);
    expect(list.find((s) => s.current)?.userAgent).toBe('Phone Browser');
    // Walang token o hash — mga field lang na kailangan ng page
    expect(Object.keys(list[0]).sort()).toEqual(['current', 'id', 'ip', 'lastUsedAt', 'since', 'userAgent']);
  });

  it('keeps ONE session per login through rotation, with the latest browser and the original login time', async () => {
    const email = await account('ses-rotate');
    const phone = await device(email, 'Old Browser');
    const [before] = await sessionsOf(phone.agent);
    await phone.agent.post('/api/auth/refresh').set('User-Agent', 'New Browser');
    const after = await sessionsOf(phone.agent);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: before.id, since: before.since, userAgent: 'New Browser', current: true });
  });

  it('401 without login', async () => {
    expect((await request(app).get('/api/auth/sessions')).status).toBe(401);
  });
});

describe('DELETE /api/auth/sessions/:id', () => {
  it('logs out another device of mine', async () => {
    const email = await account('ses-delete');
    const phone = await device(email, 'Phone');
    const laptop = await device(email, 'Laptop');
    const laptopSession = (await sessionsOf(phone.agent)).find((s) => s.userAgent === 'Laptop')!;

    expect((await phone.agent.delete(`/api/auth/sessions/${laptopSession.id}`)).status).toBe(204);
    expect((await laptop.agent.post('/api/auth/refresh')).status).toBe(401); // na-logout ang laptop
    expect((await phone.agent.post('/api/auth/refresh')).status).toBe(204); // ang phone ay hindi
    expect(await sessionsOf(phone.agent)).toHaveLength(1);

    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'session_revoked'), eq(auditLogs.actorId, phone.userId)));
    expect(rows[0].metadata).toEqual({ session: laptopSession.id });
  });

  it('clears my cookies when I log out THIS device', async () => {
    const email = await account('ses-self');
    const phone = await device(email, 'Phone');
    const [mine] = await sessionsOf(phone.agent);
    const res = await phone.agent.delete(`/api/auth/sessions/${mine.id}`);
    expect(res.status).toBe(204);
    expect(cookie(res, 'refresh_token')).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  // 🔐 IDOR: pinalitan ni B ang id sa URL ng session ni A
  it("IDOR: another user's session is 404 — the same answer as an id that does not exist — and stays logged in", async () => {
    const alice = await device(await account('ses-alice'), 'Alice Phone');
    const bob = await device(await account('ses-bob'), 'Bob Phone');
    const [aliceSession] = await sessionsOf(alice.agent);

    const stolen = await bob.agent.delete(`/api/auth/sessions/${aliceSession.id}`);
    const missing = await bob.agent.delete('/api/auth/sessions/00000000-0000-4000-8000-000000000000');
    expect(stolen.status).toBe(404);
    expect(stolen.body).toEqual(missing.body); // hindi malalaman ni Bob na totoo ang id ni Alice
    expect((await alice.agent.post('/api/auth/refresh')).status).toBe(204); // naka-login pa si Alice
  });

  it('404 (not 500) for an id that is not a UUID', async () => {
    const phone = await device(await account('ses-baduuid'), 'Phone');
    expect((await phone.agent.delete('/api/auth/sessions/hindi-uuid')).status).toBe(404);
  });

  it('401 without login', async () => {
    expect((await request(app).delete('/api/auth/sessions/00000000-0000-4000-8000-000000000000')).status).toBe(401);
  });
});

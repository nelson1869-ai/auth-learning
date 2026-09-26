import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { setRole } from '../db/set-role.ts';
import { listUsers } from './admin.ts';

// Hudyat para i-rollback ang transaction pagkatapos ng test
class Rollback extends Error {}

// Sabay-sabay tumatakbo ang mga test file sa iisang test database. Kapag may nag-register habang
// kinukuha ang page 1 at page 2, uusog ang mga page (kahinaan ng offset pagination) → flaky test.
// Kaya: REPEATABLE READ = nakapirmi ang nakikitang data sa loob ng transaction, at rollback sa dulo
async function inFrozenSnapshot(run: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(
      async (tx) => {
        await run(tx);
        throw new Rollback(); // walang maiiwan sa database
      },
      { isolationLevel: 'repeatable read' },
    ),
  ).rejects.toBeInstanceOf(Rollback);
}

describe('listUsers (pagination)', () => {
  it('splits users into pages with no gaps and no repeats, newest first', async () => {
    await inFrozenSnapshot(async (tx) => {
      await tx.insert(users).values(
        Array.from({ length: 5 }, (_, i) => ({ email: `page-${i}-${Date.now()}@example.com`, passwordHash: 'x' })),
      );
      const total = await tx.$count(users);

      const limit = 2;
      const seen: number[] = [];
      const first = await listUsers(tx, { page: 1, limit });
      for (let page = 1; page <= first.totalPages; page++) {
        const result = await listUsers(tx, { page, limit });
        expect(result.users.length).toBeLessThanOrEqual(limit);
        seen.push(...result.users.map((u) => u.id));
      }

      expect(first.total).toBe(total);
      expect(first.totalPages).toBe(Math.ceil(total / limit));
      expect(seen).toHaveLength(total); // walang nalaktawan
      expect(new Set(seen).size).toBe(total); // walang naulit
      expect(seen).toEqual([...seen].sort((a, b) => b - a)); // pinakabago muna
    });
  });

  it('returns an empty page (not an error) after the last page', async () => {
    await inFrozenSnapshot(async (tx) => {
      const total = await tx.$count(users);
      const result = await listUsers(tx, { page: Math.ceil(total / 20) + 1, limit: 20 });
      expect(result.users).toEqual([]);
      expect(result.total).toBe(total);
    });
  });
});

// Sa HTTP: ang validation ng ?page at ?limit
describe('GET /api/admin/users query', () => {
  const email = `page-admin-${Date.now()}@example.com`;
  const agent = request.agent(app);

  afterAll(async () => {
    await db.delete(users).where(inArray(users.email, [email]));
  });

  it('works with page and limit, and says how many there are', async () => {
    await agent.post('/api/auth/register').send({ email, password: 'Page-Test-2026!' });
    await agent.post('/api/auth/login').send({ email, password: 'Page-Test-2026!' });
    await setRole(db, { email, role: 'admin' });

    const res = await agent.get('/api/admin/users?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(2);
    expect(res.body).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.totalPages).toBe(Math.ceil(res.body.total / 2));
  });

  it('400 for a limit over 100, with the field that is wrong', async () => {
    const res = await agent.get('/api/admin/users?limit=101');
    expect(res.status).toBe(400);
    expect(res.body.fields.limit).toBeDefined();
  });

  it('400 for a page over the maximum', async () => {
    const res = await agent.get('/api/admin/users?page=1000001');
    expect(res.status).toBe(400);
  });
});

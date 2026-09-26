import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { setRole } from '../db/set-role.ts';

const PASSWORD = 'Admin-Test-2026!';
const created: string[] = [];

// Bagong account + naka-login na "browser" (agent = tinatandaan ang cookie)
async function loggedIn(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ email, password: PASSWORD });
  await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  return { agent, email };
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created)); // ang mga email lang na ginawa rito
});

// Authorization (Day 46): 401 = sino ka? · 403 = bawal ka rito
describe('admin routes', () => {
  it('401 without login', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('403 for a logged-in user who is not an admin', async () => {
    const { agent } = await loggedIn('rbac-user');
    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' }); // hindi sinasabi kung anong role ang kailangan
  });

  it('200 for an admin, without password hashes', async () => {
    const { agent, email } = await loggedIn('rbac-admin');
    await setRole(db, { email, role: 'admin' });
    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.users.some((u: { email: string }) => u.email === email)).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/password|argon2/i);
  });

  // Ang role ay binabasa sa database bawat request — hindi luma kahit hindi nag-logout
  it('applies a role change immediately, without logging in again', async () => {
    const { agent, email } = await loggedIn('rbac-change');
    expect((await agent.get('/api/admin/users')).status).toBe(403);
    await setRole(db, { email, role: 'admin' });
    expect((await agent.get('/api/admin/users')).status).toBe(200); // parehong cookie
    await setRole(db, { email, role: 'user' });
    expect((await agent.get('/api/admin/users')).status).toBe(403); // tinanggalan → agad bawal
  });

  it('401 when the account was deleted but the token is still valid', async () => {
    const { agent, email } = await loggedIn('rbac-deleted');
    await setRole(db, { email, role: 'admin' });
    await db.delete(users).where(eq(users.email, email));
    expect((await agent.get('/api/admin/users')).status).toBe(401);
  });

  it('401 (not 404) for an unknown admin path without login — does not reveal what exists', async () => {
    const res = await request(app).get('/api/admin/wala-ganito');
    expect(res.status).toBe(401);
  });
});

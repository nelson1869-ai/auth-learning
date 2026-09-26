import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from './index.ts';
import { users } from './schema.ts';
import { setRole } from './set-role.ts';

const created: string[] = [];

async function register(email: string, extra: Record<string, unknown> = {}) {
  created.push(email.toLowerCase());
  return request(app).post('/api/auth/register').send({ email, password: 'Role-Test-2026!', ...extra });
}

async function roleOf(email: string) {
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.email, email));
  return row?.role;
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created)); // ang mga email lang na ginawa rito
});

// Roles (Day 45)
describe('roles', () => {
  it('gives every new account the role "user"', async () => {
    const email = `role-new-${Date.now()}@example.com`;
    expect((await register(email)).status).toBe(201);
    expect(await roleOf(email)).toBe('user');
  });

  // Mass assignment: ang attacker ay nagdadagdag ng "role": "admin" sa register body
  it('ignores a role sent in the register body', async () => {
    const email = `role-sneaky-${Date.now()}@example.com`;
    const res = await register(email, { role: 'admin' });
    expect(res.status).toBe(201);
    expect(await roleOf(email)).toBe('user');
    expect(res.body.user.role).toBeUndefined(); // hindi rin ibinabalik
  });
});

describe('set-role script', () => {
  it('promotes a registered account, matching the email case-insensitively', async () => {
    const email = `role-promote-${Date.now()}@example.com`;
    await register(email);
    const user = await setRole(db, { email: email.toUpperCase(), role: 'admin' });
    expect(user?.role).toBe('admin');
    expect(await roleOf(email)).toBe('admin');
    // Paulit-ulit = pareho ang resulta (idempotent), at puwedeng ibalik sa user
    expect((await setRole(db, { email, role: 'admin' }))?.role).toBe('admin');
    expect((await setRole(db, { email, role: 'user' }))?.role).toBe('user');
  });

  it('returns nothing for an email that has no account', async () => {
    expect(await setRole(db, { email: 'walang-ganito@example.com', role: 'admin' })).toBeUndefined();
  });

  it('rejects a role that does not exist', async () => {
    await expect(setRole(db, { email: 'x@example.com', role: 'superadmin' })).rejects.toThrow();
  });
});

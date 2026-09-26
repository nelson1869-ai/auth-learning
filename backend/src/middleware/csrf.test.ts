import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { inArray } from 'drizzle-orm';
import app from '../app.ts';
import { env } from '../config/env.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

const FRONTEND = new URL(env.CLIENT_URL).origin; // hal. http://localhost:5173
const created: string[] = [];

function register(email: string) {
  created.push(email);
  return request(app).post('/api/auth/register').send({ email, password: 'Csrf-Test-2026!' });
}

afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created)); // ang mga email lang na ginawa rito
});

// CSRF — Origin check (Day 44, D-022)
describe('csrf origin check', () => {
  it('blocks a POST from another site and does not run the route', async () => {
    const email = `csrf-evil-${Date.now()}@example.com`;
    const res = await register(email).set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
    // Walang account na nagawa — hinarang bago umabot sa route
    expect(await db.$count(users, inArray(users.email, [email]))).toBe(0);
  });

  it('blocks a sibling subdomain (same "site" for SameSite, but not our frontend)', async () => {
    const sibling = FRONTEND.replace('://', '://blog.');
    const res = await request(app).post('/api/auth/logout').set('Origin', sibling);
    expect(res.status).toBe(403);
  });

  it('blocks Origin "null" (e.g. a sandboxed iframe)', async () => {
    const res = await request(app).post('/api/auth/logout').set('Origin', 'null');
    expect(res.status).toBe(403);
  });

  it('blocks a browser request without Origin that says it is cross-site', async () => {
    const res = await request(app).post('/api/auth/logout').set('Sec-Fetch-Site', 'cross-site');
    expect(res.status).toBe(403);
  });

  it('allows the frontend', async () => {
    const res = await register(`csrf-ok-${Date.now()}@example.com`).set('Origin', FRONTEND);
    expect(res.status).toBe(201);
  });

  it('allows clients that are not browsers (no Origin: curl, REST Client)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });

  it('does not block safe methods (GET) from anywhere', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
  });
});

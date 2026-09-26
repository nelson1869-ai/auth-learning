import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

// Integration test: route → Zod → argon2 → database → sagot, gamit ang TEST database
beforeEach(async () => {
  await db.delete(users); // malinis na simula bawat test (TEST database lang — tingnan ang setup.js)
});

// Gumawa ng account para sa mga login test
async function registerUser(email = 'ana@example.com', password = 'password123') {
  return request(app).post('/api/auth/register').send({ email, password });
}

describe('POST /api/auth/register', () => {
  it('creates a user (201) without returning the hash', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate email, even with different case (409)', async () => {
    await registerUser('ana@example.com');
    const res = await registerUser('ANA@Example.com');
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with field errors (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'hindi-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('email');
    expect(res.body.fields).toHaveProperty('password');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in (200) and sets an httpOnly token cookie', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    const cookie = res.get('Set-Cookie')?.[0]; // puwedeng walang Set-Cookie — nahuli ng TypeScript
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toContain('HttpOnly');
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    await registerUser();
    const wrong = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'mali-na-password' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'wala@example.com', password: 'password123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body); // walang pahiwatig kung may account (Day 15)
  });
});

describe('GET /api/auth/me', () => {
  it('returns the user with the login cookie, and 401 without it', async () => {
    await registerUser();
    const agent = request.agent(app); // parang browser: tinatandaan ang cookie
    await agent.post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('ana@example.com');

    const anonymous = await request(app).get('/api/auth/me');
    expect(anonymous.status).toBe(401);
  });

  it('returns 401 after logout', async () => {
    await registerUser();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('caching', () => {
  it('never lets browsers or CDNs cache auth responses (no-store)', async () => {
    await registerUser();
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ email: 'ana@example.com', password: 'password123' });
    const me = await agent.get('/api/auth/me');
    const anonymous = await request(app).get('/api/auth/me');
    for (const res of [login, me, anonymous]) {
      expect(res.headers['cache-control']).toBe('no-store');
    }
  });
});


import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Redis, type RedisOptions } from 'ioredis';
import express from 'express';
import request from 'supertest';
import { createAuthLimiter } from './rateLimiter.ts';
import { createRedis } from '../lib/redis.ts';

// Maliit na app para sa limiter lang — hiwalay sa totoong app (kung saan naka-off ito sa tests)
function appWith(options: Parameters<typeof createAuthLimiter>[0], status = 401) {
  const app = express();
  app.post('/try', createAuthLimiter(options), (_req, res) => {
    res.status(status).json({ ok: status < 400 });
  });
  return app;
}

const WINDOW = 60_000;

describe('auth rate limiter', () => {
  it('blocks the 4th attempt with 429 when the limit is 3', async () => {
    const app = appWith({ name: 't', limit: 3, windowMs: WINDOW });
    for (let i = 0; i < 3; i++) expect((await request(app).post('/try')).status).toBe(401);
    const blocked = await request(app).post('/try');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many attempts/i);
    expect(blocked.headers['ratelimit']).toBeDefined(); // makikita ng client kung kailan puwede ulit
  });

  it('does not count successful requests for login (skipSuccessfulRequests)', async () => {
    const app = appWith({ name: 't', limit: 3, windowMs: WINDOW, skipSuccessfulRequests: true }, 200);
    for (let i = 0; i < 5; i++) expect((await request(app).post('/try')).status).toBe(200);
  });

  it('counts each real client separately behind Cloudflare (CF-Connecting-IP)', async () => {
    const app = appWith({ name: 't', limit: 3, windowMs: WINDOW, trustCloudflare: true });
    for (let i = 0; i < 3; i++) await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.1');
    expect((await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.1')).status).toBe(429);
    // ibang user (ibang IP) — hindi dapat maapektuhan ng attacker
    expect((await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.2')).status).toBe(401);
  });

  it('ignores CF-Connecting-IP when not behind Cloudflare (cannot be spoofed to escape the limit)', async () => {
    const app = appWith({ name: 't', limit: 3, windowMs: WINDOW, trustCloudflare: false });
    for (let i = 0; i < 3; i++) await request(app).post('/try').set('CF-Connecting-IP', `198.51.100.${i}`);
    expect((await request(app).post('/try').set('CF-Connecting-IP', '198.51.100.99')).status).toBe(429);
  });
});

// Day 92: pinagsasaluhang bilang sa Redis. TOTOONG Redis (dev: devops/docker-compose.yml, 127.0.0.1:6380 · CI: service).
// Bawat "kopya ng app" ay may SARILING Redis client at SARILING limiter — gaya ng dalawang container sa likod ng load balancer
const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380';
const clients: Redis[] = [];
function client(url = REDIS_URL, options: RedisOptions = {}) {
  const c = new Redis(url, { enableOfflineQueue: false, maxRetriesPerRequest: 1, connectTimeout: 1_000, ...options });
  c.on('error', () => {}); // inaasahan sa mga test na patay ang Redis
  clients.push(c);
  return c;
}
async function ready(c: Redis) {
  if (c.status !== 'ready') await new Promise((resolve) => c.once('ready', resolve));
}
afterAll(async () => {
  await Promise.all(clients.map((c) => c.quit().catch(() => c.disconnect())));
});

describe('auth rate limiter with Redis (shared across app instances)', () => {
  it('two app instances share ONE count: the 4th attempt is blocked no matter which instance gets it', async () => {
    const name = `share-${randomUUID()}`;
    const [a, b] = [createRedis(REDIS_URL), createRedis(REDIS_URL)]; // ang TOTOONG config ng app (lib/redis.ts)
    clients.push(a, b);
    await Promise.all([ready(a), ready(b)]);
    const one = appWith({ name, limit: 3, windowMs: WINDOW, redis: a });
    const two = appWith({ name, limit: 3, windowMs: WINDOW, redis: b });
    // salitan, gaya ng round robin sa lab (Day 91b)
    expect((await request(one).post('/try')).status).toBe(401);
    expect((await request(two).post('/try')).status).toBe(401);
    expect((await request(one).post('/try')).status).toBe(401);
    expect((await request(two).post('/try')).status).toBe(429);
    expect((await request(one).post('/try')).status).toBe(429);
  });

  it('WITHOUT Redis, each instance counts alone — the Day 91b problem (limit 3 lets 6 through)', async () => {
    const one = appWith({ name: 'mem', limit: 3, windowMs: WINDOW });
    const two = appWith({ name: 'mem', limit: 3, windowMs: WINDOW });
    let passed = 0;
    for (let i = 0; i < 8; i++) if ((await request(i % 2 ? two : one).post('/try')).status === 401) passed++;
    expect(passed).toBe(6);
  });

  it('keeps separate counts per limiter name (login attempts do not use up register)', async () => {
    const c = client();
    await ready(c);
    const login = appWith({ name: `login-${randomUUID()}`, limit: 2, windowMs: WINDOW, redis: c });
    const register = appWith({ name: `register-${randomUUID()}`, limit: 2, windowMs: WINDOW, redis: c });
    for (let i = 0; i < 2; i++) await request(login).post('/try');
    expect((await request(login).post('/try')).status).toBe(429);
    expect((await request(register).post('/try')).status).toBe(401);
  });

  it('fails OPEN and fast when Redis is down: the request goes through (no 500, no hang, no crash)', async () => {
    const dead = createRedis('redis://127.0.0.1:1'); // ang TOTOONG config ng app — walang nakikinig sa port 1
    clients.push(dead);
    const app = appWith({ name: `down-${randomUUID()}`, limit: 1, windowMs: WINDOW, redis: dead });
    const started = Date.now();
    for (let i = 0; i < 3; i++) expect((await request(app).post('/try')).status).toBe(401); // lampas sa limit, pero pinapasok
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('enforces limits again once Redis comes back, even if it was down when the app started', async () => {
    const late = client(REDIS_URL, { lazyConnect: true }); // hindi pa konektado — gaya ng Redis na patay pagka-start ng app
    const app = appWith({ name: `late-${randomUUID()}`, limit: 2, windowMs: WINDOW, redis: late });
    expect((await request(app).post('/try')).status).toBe(401); // patay pa: pinapasok (fail-open)
    await ready(late); // bumalik ang Redis (kusang kumokonekta ang lazyConnect client sa unang command)
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await request(app).post('/try')).status);
    expect(codes).toEqual([401, 401, 429, 429]); // gumagana ulit ang limit — mula sa UNANG request pagbalik
  });

  // Nahuli sa totoong dev server (MONITOR ng Redis): sa bawat startup, kumokonekta pa ang Redis kapag ginawa ang limiter,
  // kaya hindi nabibilang ang unang request. Ang karaniwang startup ang sinusubok dito (hindi pa 'ready' ang client)
  it('counts the very first request after a normal startup (Redis still connecting when the limiter is created)', async () => {
    const fresh = createRedis(REDIS_URL);
    clients.push(fresh);
    const app = appWith({ name: `startup-${randomUUID()}`, limit: 2, windowMs: WINDOW, redis: fresh });
    await ready(fresh);
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await request(app).post('/try')).status);
    expect(codes).toEqual([401, 401, 429]);
  });
});

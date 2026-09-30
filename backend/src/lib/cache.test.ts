import { describe, it, expect, afterAll, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { createCache } from './cache.ts';
import { createRedis } from './redis.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { countUsers } from '../services/users.service.ts';
import { registerUser } from '../services/auth/registration.service.ts';
import request from 'supertest';
import app from '../app.ts';

// Day 92b: server cache. TOTOONG Redis (dev: devops/docker-compose.yml, 127.0.0.1:6380 · CI: service) — gaya ng rateLimiter.test.ts
const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6380';
const clients: Redis[] = [];
async function connected() {
  const c = createRedis(REDIS_URL); // ang TOTOONG config ng app (lib/redis.ts)
  clients.push(c);
  if (c.status !== 'ready') await new Promise((resolve) => c.once('ready', resolve));
  return c;
}
afterAll(async () => {
  await Promise.all(clients.map((c) => c.quit().catch(() => c.disconnect())));
});

const key = () => `test:${randomUUID()}`; // sariling susi bawat test — hindi naghahalo, kahit ulitin ang takbo

describe('server cache (cache-aside)', () => {
  it('MISS loads from the source and stores it; the next read is a HIT and does NOT touch the source', async () => {
    const cache = createCache(await connected());
    const load = vi.fn(async () => 7);
    const k = key();
    expect(await cache.getOrLoad(k, 60, load)).toEqual({ value: 7, source: 'miss' });
    expect(await cache.getOrLoad(k, 60, load)).toEqual({ value: 7, source: 'hit' });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('always stores WITH an expiry — a key without a TTL would stay stale forever', async () => {
    const redis = await connected();
    const k = key();
    await createCache(redis).getOrLoad(k, 60, async () => 1);
    const ttl = await redis.ttl(`cache:${k}`); // -1 = walang expiry
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('loads again after the TTL has passed', async () => {
    const cache = createCache(await connected());
    const load = vi.fn(async () => 'x');
    const k = key();
    await cache.getOrLoad(k, 1, load);
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect((await cache.getOrLoad(k, 1, load)).source).toBe('miss');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidate removes the entry: the next read is a MISS with the NEW value', async () => {
    const cache = createCache(await connected());
    const k = key();
    let current = 1;
    await cache.getOrLoad(k, 60, async () => current);
    current = 2;
    expect((await cache.getOrLoad(k, 60, async () => current)).value).toBe(1); // luma pa: ito ang panganib kapag walang invalidation
    await cache.invalidate(k);
    expect(await cache.getOrLoad(k, 60, async () => current)).toEqual({ value: 2, source: 'miss' });
  });

  it('two app instances share ONE cache: what instance A stored is a HIT for instance B', async () => {
    const [a, b] = [createCache(await connected()), createCache(await connected())];
    const k = key();
    expect((await a.getOrLoad(k, 60, async () => 5)).source).toBe('miss');
    expect(await b.getOrLoad(k, 60, async () => 999)).toEqual({ value: 5, source: 'hit' });
    await b.invalidate(k); // at ang pagbura ng isa ay nakikita ng isa pa
    expect((await a.getOrLoad(k, 60, async () => 6)).source).toBe('miss');
  });

  it('fails OPEN and fast when Redis is down: reads go to the source, invalidate does not throw', async () => {
    const dead = createRedis('redis://127.0.0.1:1'); // walang nakikinig sa port 1
    clients.push(dead);
    const cache = createCache(dead);
    const load = vi.fn(async () => 3);
    const started = Date.now();
    expect(await cache.getOrLoad('k', 60, load)).toEqual({ value: 3, source: 'bypass' });
    expect(await cache.getOrLoad('k', 60, load)).toEqual({ value: 3, source: 'bypass' });
    await expect(cache.invalidate('k')).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('without Redis (no REDIS_URL) there is no cache: every read loads', async () => {
    const cache = createCache(undefined);
    const load = vi.fn(async () => 1);
    expect((await cache.getOrLoad('k', 60, load)).source).toBe('bypass');
    expect((await cache.getOrLoad('k', 60, load)).source).toBe('bypass');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('a failing source is NOT cached: the error reaches the caller and the next read tries again', async () => {
    const cache = createCache(await connected());
    const k = key();
    await expect(cache.getOrLoad(k, 60, async () => Promise.reject(new Error('db down')))).rejects.toThrow('db down');
    expect(await cache.getOrLoad(k, 60, async () => 4)).toEqual({ value: 4, source: 'miss' });
  });
});

// Ang totoong gamit: GET /api/users/count (services/users.service.ts) at ang pagbura sa register (registration.service.ts)
describe('users count cache', () => {
  const email = `cache-${randomUUID()}@example.com`;
  afterAll(async () => {
    await db.delete(users).where(eq(users.email, email));
  });

  it('a new registration invalidates the cached count — the next read is fresh, not 60s old', async () => {
    const redis = await connected();
    await redis.del('cache:users:count'); // malinis na simula (iisa ang susi ng bilang)
    const cache = createCache(redis);

    const before = await countUsers(cache);
    expect(before.source).toBe('miss');
    expect((await countUsers(cache)).source).toBe('hit');

    const result = await registerUser({ email, name: 'Cache Test', password: 'password123' }, async () => {}, cache);
    expect(result.status).toBe('created');

    expect(await countUsers(cache)).toEqual({ count: before.count + 1, source: 'miss' });
    await redis.del('cache:users:count');
  });

  it('a rejected registration (email taken) leaves the cache alone', async () => {
    const redis = await connected();
    const cache = createCache(redis);
    await redis.del('cache:users:count');
    await countUsers(cache);
    const result = await registerUser({ email, name: 'Again', password: 'password123' }, async () => {}, cache);
    expect(result.status).toBe('email_taken');
    expect((await countUsers(cache)).source).toBe('hit');
    await redis.del('cache:users:count');
  });

  it('GET /api/users/count says where the answer came from (X-Cache) — BYPASS in tests: the app has no REDIS_URL here', async () => {
    const res = await request(app).get('/api/users/count');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('BYPASS');
    expect(res.body).toEqual({ count: expect.any(Number) });
  });
});

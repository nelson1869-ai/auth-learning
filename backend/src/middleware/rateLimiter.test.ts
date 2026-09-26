import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthLimiter } from './rateLimiter.ts';

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
    const app = appWith({ limit: 3, windowMs: WINDOW });
    for (let i = 0; i < 3; i++) expect((await request(app).post('/try')).status).toBe(401);
    const blocked = await request(app).post('/try');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many attempts/i);
    expect(blocked.headers['ratelimit']).toBeDefined(); // makikita ng client kung kailan puwede ulit
  });

  it('does not count successful requests for login (skipSuccessfulRequests)', async () => {
    const app = appWith({ limit: 3, windowMs: WINDOW, skipSuccessfulRequests: true }, 200);
    for (let i = 0; i < 5; i++) expect((await request(app).post('/try')).status).toBe(200);
  });

  it('counts each real client separately behind Cloudflare (CF-Connecting-IP)', async () => {
    const app = appWith({ limit: 3, windowMs: WINDOW, trustCloudflare: true });
    for (let i = 0; i < 3; i++) await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.1');
    expect((await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.1')).status).toBe(429);
    // ibang user (ibang IP) — hindi dapat maapektuhan ng attacker
    expect((await request(app).post('/try').set('CF-Connecting-IP', '203.0.113.2')).status).toBe(401);
  });

  it('ignores CF-Connecting-IP when not behind Cloudflare (cannot be spoofed to escape the limit)', async () => {
    const app = appWith({ limit: 3, windowMs: WINDOW, trustCloudflare: false });
    for (let i = 0; i < 3; i++) await request(app).post('/try').set('CF-Connecting-IP', `198.51.100.${i}`);
    expect((await request(app).post('/try').set('CF-Connecting-IP', '198.51.100.99')).status).toBe(429);
  });
});

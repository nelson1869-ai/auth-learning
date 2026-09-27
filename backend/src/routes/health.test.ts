import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { isDatabaseReady } from '../services/health.service.ts';
import { healthResponse, readyResponse } from '../validations/responses.ts';

// Health checks (Day 80): live (buhay ang process) vs ready (handa ang database)
afterEach(() => {
  vi.restoreAllMocks();
});

describe('liveness', () => {
  it('/api/health/live and /api/health answer 200 WITHOUT touching the database (Neon can sleep)', async () => {
    const execute = vi.spyOn(db, 'execute');
    for (const path of ['/api/health/live', '/api/health']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(healthResponse.safeParse(res.body).success).toBe(true);
    }
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('readiness', () => {
  it('200 ready when the database answers', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ready', checks: { database: 'ok' } });
    expect(readyResponse.safeParse(res.body).success).toBe(true);
  });

  it('503 not_ready when the database fails — and no error details in the body', async () => {
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.1:5432'));
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'not_ready', checks: { database: 'down' } });
    expect(readyResponse.safeParse(res.body).success).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('never hangs: a database that does not answer counts as not ready after the timeout', async () => {
    vi.spyOn(db, 'execute').mockReturnValueOnce(new Promise(() => {}) as never); // hindi kailanman sasagot
    const started = Date.now();
    expect(await isDatabaseReady(100)).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

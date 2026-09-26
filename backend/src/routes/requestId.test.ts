import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Request ID (Day 42) — para mahanap sa logs ang eksaktong request na nag-report ng problema
describe('request id', () => {
  it('gives every response its own X-Request-Id', async () => {
    const a = await request(app).get('/api/health');
    const b = await request(app).get('/api/health');
    expect(a.headers['x-request-id']).toMatch(UUID);
    expect(b.headers['x-request-id']).toMatch(UUID);
    expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']); // iba-iba bawat request
  });

  it('also sets it on error responses (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.headers['x-request-id']).toMatch(UUID);
  });

  it('ignores an X-Request-Id sent by the client (could be fake)', async () => {
    const res = await request(app).get('/api/health').set('X-Request-Id', 'fake-id-from-attacker');
    expect(res.headers['x-request-id']).toMatch(UUID);
  });
});

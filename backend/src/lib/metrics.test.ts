import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import request from 'supertest';
import { inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { AUDIT_ACTIONS, users } from '../db/schema.ts';
import { observeRedis, prometheusExporter } from './metrics.ts';

// Metrics (Day 81). Binabasa ang /metrics sa pamamagitan ng handler ng exporter (hindi binubuksan ang totoong port sa tests)
let metricsServer: Server;
const created: string[] = [];
beforeAll(async () => {
  metricsServer = createServer((req, res) => prometheusExporter.getMetricsRequestHandler(req, res));
  await new Promise<void>((resolve) => metricsServer.listen(0, resolve));
});
afterAll(async () => {
  await new Promise<void>((resolve) => metricsServer.close(() => resolve()));
  await db.delete(users).where(inArray(users.email, created));
});
async function scrape(): Promise<string> {
  return (await request(metricsServer).get('/metrics')).text;
}
// Ang bilang ng isang serye (0 kung wala pa)
function count(text: string, route: string, status: number, method = 'GET'): number {
  const line = text
    .split('\n')
    .find(
      (l) =>
        l.startsWith('http_server_request_duration_count{') &&
        l.includes(`http_request_method="${method}"`) &&
        l.includes(`http_route="${route}"`) &&
        l.includes(`http_response_status_code="${status}"`),
    );
  return line ? Number(line.split(' ').pop()) : 0;
}

describe('HTTP metrics', () => {
  it('counts each request by method, route TEMPLATE and status', async () => {
    const before = await scrape();
    await request(app).get('/api/auth/me');
    await request(app).get('/api/auth/me');
    const after = await scrape();
    expect(count(after, '/api/auth/me', 401) - count(before, '/api/auth/me', 401)).toBe(2);
  });

  it('uses the route template, never the real URL (cardinality): no ids and no unknown paths in the labels', async () => {
    const id = '00000000-0000-4000-8000-00000000abcd';
    const junk = `/api/wala-${Date.now()}`;
    await request(app).delete(`/api/auth/sessions/${id}`); // 401 (walang login)
    await request(app).get(junk); // 404
    const text = await scrape();
    expect(count(text, '/api/auth/sessions/:id', 401, 'DELETE')).toBeGreaterThan(0);
    expect(count(text, 'unmatched', 404)).toBeGreaterThan(0);
    expect(text).not.toContain(id);
    expect(text).not.toContain(junk);
  });
});

describe('audit metrics', () => {
  // Kung wala pa ang serye bago ang unang event, hindi ito makikita ng increase() sa Prometheus (Day 82)
  it('starts every audit action at 0, so the first event after a restart is visible to increase()', async () => {
    const text = await scrape();
    for (const action of AUDIT_ACTIONS) {
      expect(text).toMatch(new RegExp(`^auth_audit_events_total\\{action="${action}"[^}]*\\} \\d+`, 'm'));
    }
  });

  it('counts audit actions (e.g. register)', async () => {
    const read = (text: string) => Number(text.match(/^auth_audit_events_total\{action="register"[^}]*\} (\d+)/m)?.[1] ?? 0);
    const before = read(await scrape());
    const email = `metrics-${Date.now()}@example.com`;
    created.push(email);
    expect((await request(app).post('/api/auth/register').send({ email, password: 'Metrics-2026-pass' })).status).toBe(201);
    expect(read(await scrape()) - before).toBe(1);
  });
});

// Day 92: ang alert na RedisDown ay nakabatay sa gauge na ito (hindi sa bilang ng error — kapag walang traffic, walang error)
describe('redis gauge', () => {
  it('reports 1 while connected and 0 when not', async () => {
    let up = true;
    observeRedis(() => up);
    expect(await scrape()).toMatch(/^auth_redis_up(\{[^}]*\})? 1$/m);
    up = false;
    expect(await scrape()).toMatch(/^auth_redis_up(\{[^}]*\})? 0$/m);
  });
});

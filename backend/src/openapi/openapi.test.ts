import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import type { Router } from 'express';
import type { z } from 'zod';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { buildOpenApiDocument } from './document.ts';
import * as r from '../validations/responses.ts';
import authRouter from '../routes/auth.ts';
import adminRouter from '../routes/admin.ts';
import usersRouter from '../routes/users.ts';
import healthRouter from '../routes/health.ts';
import echoRouter from '../routes/echo.ts';

// OpenAPI (Day 78): tatlong bantay para HINDI maging luma ang docs
const document = buildOpenApiDocument();
const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

describe('the spec cannot drift from the code', () => {
  it('backend/openapi.json is exactly what the code generates (run `npm run openapi` after changing a schema or route)', () => {
    const committed = JSON.parse(readFileSync(new URL('../../openapi.json', import.meta.url), 'utf8'));
    expect(committed).toEqual(document);
  });

  it('every Express route is in the spec, and every spec path is a real route', () => {
    const fromRouters = [authRouter, adminRouter, usersRouter, healthRouter, echoRouter].flatMap((router) =>
      (router as Router).stack
        .filter((layer) => layer.route)
        .flatMap((layer) =>
          Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods).map(
            (method) => `${method} /api${layer.route!.path.replace(/:(\w+)/g, '{$1}')}`,
          ),
        ),
    );
    const fromSpec = Object.entries(document.paths).flatMap(([path, methods]) => Object.keys(methods).map((m) => `${m} ${path}`));
    expect(fromRouters.sort()).toEqual(fromSpec.sort());
  });

  it('GET /api/openapi.json serves the same document', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(document);
  });
});

// Ang TOTOONG mga sagot ay dapat tugma sa response schemas (strict: bawal ang dagdag na field, hal. passwordHash)
describe('real responses match the documented schemas', () => {
  const check = (schema: z.ZodType, body: unknown) => {
    const result = schema.safeParse(body);
    expect(result.success ? 'ok' : JSON.stringify(result.error.issues)).toBe('ok');
  };

  it('auth, sessions, admin and system responses', async () => {
    const email = `contract-${Date.now()}@example.com`;
    created.push(email);
    const password = 'Contract-Test-2026!';

    const reg = await request(app).post('/api/auth/register').send({ email, password, name: 'Contract' });
    expect(reg.status).toBe(201);
    check(r.userResponse, reg.body);
    const dup = await request(app).post('/api/auth/register').send({ email, password });
    expect(dup.status).toBe(409);
    check(r.errorResponse, dup.body);
    const bad = await request(app).post('/api/auth/register').send({ email: 'hindi-email', password: 'x' });
    expect(bad.status).toBe(400);
    check(r.errorResponse, bad.body);

    const agent = request.agent(app);
    const wrong = await agent.post('/api/auth/login').send({ email, password: 'mali-na-password' });
    expect(wrong.status).toBe(401);
    check(r.errorResponse, wrong.body);
    const login = await agent.post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    check(r.userResponse, login.body);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    check(r.meResponse, me.body);
    const sessions = await agent.get('/api/auth/sessions');
    expect(sessions.status).toBe(200);
    check(r.sessionsResponse, sessions.body);
    const resend = await agent.post('/api/auth/resend-verification');
    expect(resend.status).toBe(202);
    check(r.messageResponse, resend.body);
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(202);
    check(r.messageResponse, forgot.body);

    const forbidden = await agent.get('/api/admin/users');
    expect(forbidden.status).toBe(403);
    check(r.errorResponse, forbidden.body);
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
    const adminUsers = await agent.get('/api/admin/users?limit=5');
    expect(adminUsers.status).toBe(200);
    check(r.adminUsersResponse, adminUsers.body);
    const logs = await agent.get('/api/admin/audit-logs?limit=5');
    expect(logs.status).toBe(200);
    check(r.auditLogsResponse, logs.body);

    check(r.healthResponse, (await request(app).get('/api/health')).body);
    check(r.countResponse, (await request(app).get('/api/users/count')).body);
    check(r.echoResponse, (await request(app).post('/api/echo').send({ a: 1 })).body);
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { pino } from 'pino';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { loggerOptions } from '../lib/logger.ts';
import { createRequestLogger } from '../middleware/requestLogger.ts';
import { errorHandler } from '../middleware/errorHandler.ts';

// Kahawig ng totoong error ni Drizzle kapag nabigo ang query — may SQL at pangalan ng table
const DB_ERROR = new Error('Failed query: select count(*) from "users"');

afterEach(() => {
  vi.restoreAllMocks();
});

// Error handling (Day 41) — laging JSON, at walang internal na detalye sa sagot
describe('error responses', () => {
  it('returns JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns JSON 400 for broken JSON, without the parser stack trace', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON' });
    expect(res.text).not.toMatch(/SyntaxError|node_modules/);
  });

  it('returns JSON 413 for a body that is too large', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'x'.repeat(200_000) })); // lampas sa 100kb ng express.json()
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'Payload Too Large' });
  });

  it('hides a database error: generic 500 with the request id, no SQL', async () => {
    vi.spyOn(db, '$count').mockRejectedValueOnce(DB_ERROR);
    const res = await request(app).get('/api/users/count');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error', requestId: res.headers['x-request-id'] });
    expect(res.text).not.toMatch(/Failed query|users|select/i);
  });
});

// Ang detalye ay nasa LOG — kung hindi, walang paraan para ma-debug ang 500
describe('error logging', () => {
  it('writes the full error to the log with the same request id', async () => {
    const lines: string[] = [];
    const log = pino({ ...loggerOptions, level: 'info' }, { write: (line: string) => lines.push(line) });
    const mini = express();
    mini.use(createRequestLogger(log));
    mini.get('/boom', () => {
      throw DB_ERROR;
    });
    mini.use(errorHandler);

    const res = await request(mini).get('/boom');
    const errorLog = lines.map((line) => JSON.parse(line)).find((entry) => entry.msg === 'Unhandled error');
    expect(errorLog.level).toBe(50); // error
    expect(errorLog.requestId).toBe(res.headers['x-request-id']);
    expect(errorLog.err.message).toContain('Failed query'); // nasa log ang detalye
    expect(errorLog.err.stack).toBeDefined();
  });

  it('treats an error with a strange status as 500', async () => {
    const mini = express();
    mini.use(createRequestLogger(pino({ level: 'silent' })));
    mini.get('/weird', () => {
      throw Object.assign(new Error('weird'), { status: 200 });
    });
    mini.use(errorHandler);
    const res = await request(mini).get('/weird');
    expect(res.status).toBe(500);
  });
});

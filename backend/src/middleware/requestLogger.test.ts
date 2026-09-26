import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { pino } from 'pino';
import { loggerOptions } from '../lib/logger.ts';
import { createRequestLogger } from './requestLogger.ts';

// Maliit na app na ang logs ay napupunta sa array — para mabasa ng test ang mismong log line
function appWithCapturedLogs() {
  const lines: string[] = [];
  const log = pino({ ...loggerOptions, level: 'info' }, { write: (line: string) => lines.push(line) });
  const app = express();
  app.use(createRequestLogger(log));
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/api/thing', (_req, res) => {
    res.status(404).json({ error: 'nope' });
  });
  return { app, logs: () => lines.map((line) => JSON.parse(line)) };
}

describe('request logger', () => {
  // Nahuli sa Day 42: may X-Request-Id sa header pero WALA sa log — hindi mahanap ang request
  it('writes the same requestId to the log as the X-Request-Id header', async () => {
    const { app, logs } = appWithCapturedLogs();
    const res = await request(app).get('/api/thing');
    const [entry] = logs();
    expect(entry.requestId).toBe(res.headers['x-request-id']);
    expect(entry.res.statusCode).toBe(404);
    expect(entry.level).toBe(40); // 4xx = warn
  });

  it('keeps cookies out of the log', async () => {
    const { app, logs } = appWithCapturedLogs();
    await request(app).get('/api/thing').set('Cookie', 'token=secret-jwt');
    expect(JSON.stringify(logs())).not.toContain('secret-jwt');
  });

  it('does not log health checks (Docker calls them all the time)', async () => {
    const { app, logs } = appWithCapturedLogs();
    await request(app).get('/api/health');
    expect(logs()).toHaveLength(0);
  });
});

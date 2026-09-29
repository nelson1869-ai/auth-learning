import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { db } from '../db/index.ts';
import { auditLogs, refreshTokens, trustedDevices, unknownLoginAttempts, users, verificationTokens } from '../db/schema.ts';
import { drainBackground } from '../lib/background.ts';
import { createRefreshToken, hashToken, rotateRefreshToken } from '../lib/session.ts';
import { FIRST_RUN_DELAY_MS, INTERVAL_MS, cleanupAndLog, startRetentionScheduler } from '../jobs/retentionScheduler.ts';
import { prometheusExporter } from '../lib/metrics.ts';
import { createServer } from 'node:http';
import request from 'supertest';
import { RETENTION_LOCK_KEY, RETENTION_TABLES, runRetentionCleanup } from './retention.service.ts';

// Data retention (Day 90). Totoong test database; bawat test ay may sariling user (binubura sa dulo, cascade ang mga token)
const DAY = 24 * 60 * 60 * 1000;
const device = { userAgent: 'retention-test', ip: '127.0.0.1' };
let userId: number;

beforeEach(async () => {
  const [user] = await db
    .insert(users)
    .values({ email: `retention-${randomUUID()}@example.com`, passwordHash: 'x' })
    .returning({ id: users.id });
  userId = user!.id;
});
afterEach(async () => {
  await db.delete(users).where(eq(users.id, userId));
});

const ago = (ms: number) => new Date(Date.now() - ms);
const later = (ms: number) => new Date(Date.now() + ms);

describe('runRetentionCleanup — refresh tokens', () => {
  it('deletes a family only when EVERY token in it has expired', async () => {
    const dead = randomUUID();
    const alive = randomUUID();
    await db.insert(refreshTokens).values([
      { userId, tokenHash: randomUUID(), familyId: dead, expiresAt: ago(DAY), revokedAt: ago(2 * DAY) },
      { userId, tokenHash: randomUUID(), familyId: dead, expiresAt: ago(DAY) },
      { userId, tokenHash: randomUUID(), familyId: alive, expiresAt: ago(DAY), revokedAt: ago(2 * DAY) }, // luma, pero…
      { userId, tokenHash: randomUUID(), familyId: alive, expiresAt: later(DAY) }, // …buhay pa ang family
    ]);
    await runRetentionCleanup();
    const left = await db.select({ familyId: refreshTokens.familyId }).from(refreshTokens).where(eq(refreshTokens.userId, userId));
    expect(left.map((row) => row.familyId)).toEqual([alive, alive]);
  });

  // Ang dahilan ng patakaran sa itaas: kapag nabura ang revoked na token ng buhay na family, ang ninakaw na lumang token
  // ay "invalid" na lang — hindi "reused" — kaya hindi na binabawi ang family (Day 52)
  it('keeps reuse detection working after cleanup: replaying an old rotated token still revokes the family', async () => {
    const stolen = await createRefreshToken(userId, device);
    const rotated = await rotateRefreshToken(stolen, device);
    expect(rotated.status).toBe('rotated');
    // Luma na ang token na ninakaw (expired) at lampas na sa grace window (REUSE_INTERVAL_MS)
    await db
      .update(refreshTokens)
      .set({ expiresAt: ago(DAY), revokedAt: ago(2 * DAY) })
      .where(eq(refreshTokens.tokenHash, hashToken(stolen)));

    await runRetentionCleanup();

    expect((await rotateRefreshToken(stolen, device)).status).toBe('reused');
  });
});

describe('runRetentionCleanup — other tables', () => {
  it('deletes expired verification tokens and trusted devices, keeps valid ones', async () => {
    await db.insert(verificationTokens).values([
      { userId, tokenHash: randomUUID(), purpose: 'password_reset', expiresAt: ago(1000) },
      { userId, tokenHash: randomUUID(), purpose: 'email_verification', expiresAt: later(DAY) },
    ]);
    await db.insert(trustedDevices).values([
      { userId, tokenHash: randomUUID(), expiresAt: ago(1000) },
      { userId, tokenHash: randomUUID(), expiresAt: later(DAY) },
    ]);
    const result = await runRetentionCleanup();
    expect(result.status).toBe('ok');
    const tokens = await db.select({ purpose: verificationTokens.purpose }).from(verificationTokens).where(eq(verificationTokens.userId, userId));
    expect(tokens).toEqual([{ purpose: 'email_verification' }]);
    expect(await db.$count(trustedDevices, eq(trustedDevices.userId, userId))).toBe(1);
  });

  it('deletes unknown-email counters idle 30+ days, but never while locked', async () => {
    const [idle, idleButLocked, recent] = [randomUUID(), randomUUID(), randomUUID()];
    await db.insert(unknownLoginAttempts).values([
      { emailHash: idle, failedLoginAttempts: 2, lastAttemptAt: ago(31 * DAY) },
      { emailHash: idleButLocked, failedLoginAttempts: 5, lastAttemptAt: ago(31 * DAY), lockedUntil: later(DAY) },
      { emailHash: recent, failedLoginAttempts: 1, lastAttemptAt: ago(DAY) },
    ]);
    await runRetentionCleanup();
    const left = await db
      .select({ emailHash: unknownLoginAttempts.emailHash })
      .from(unknownLoginAttempts)
      .where(inArray(unknownLoginAttempts.emailHash, [idle, idleButLocked, recent]));
    expect(left.map((row) => row.emailHash).sort()).toEqual([idleButLocked, recent].sort());
  });

  it('deletes audit logs older than 1 year, keeps younger ones', async () => {
    const rows = await db
      .insert(auditLogs)
      .values([
        { actorId: userId, action: 'login', createdAt: ago(366 * DAY) },
        { actorId: userId, action: 'login', createdAt: ago(364 * DAY) },
      ])
      .returning({ id: auditLogs.id });
    await runRetentionCleanup();
    const left = await db.select({ id: auditLogs.id }).from(auditLogs).where(inArray(auditLogs.id, rows.map((row) => row.id)));
    expect(left).toEqual([rows[1]]);
    await db.delete(auditLogs).where(inArray(auditLogs.id, rows.map((row) => row.id)));
  });
});

describe('runRetentionCleanup — advisory lock', () => {
  // Deterministiko: HINAHAWAKAN ng test ang lock sa ibang koneksyon (hindi dalawang sabay na takbo — kadalasang tapos na ang una)
  it('skips when another instance holds the lock, and deletes nothing', async () => {
    await db.insert(trustedDevices).values({ userId, tokenHash: randomUUID(), expiresAt: ago(1000) });
    const other = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await other.connect();
    try {
      await client.query('begin');
      await client.query('select pg_advisory_xact_lock($1)', [RETENTION_LOCK_KEY]);
      expect(await runRetentionCleanup()).toEqual({ status: 'skipped' });
      expect(await db.$count(trustedDevices, eq(trustedDevices.userId, userId))).toBe(1);
    } finally {
      await client.query('rollback'); // binibitawan ang lock
      client.release();
      await other.end();
    }
    expect((await runRetentionCleanup()).status).toBe('ok'); // wala nang may hawak → tumatakbo
  });
});

describe('retention scheduler', () => {
  afterEach(() => vi.useRealTimers());

  it('runs 60s after start, then hourly, and never again after stop', async () => {
    vi.useFakeTimers();
    const run = vi.fn(async () => {});
    const stop = startRetentionScheduler(run);

    await vi.advanceTimersByTimeAsync(FIRST_RUN_DELAY_MS - 1);
    expect(run).toHaveBeenCalledTimes(0); // hindi sabay sa pagbukas ng server
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(run).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(3 * INTERVAL_MS);
    expect(run).toHaveBeenCalledTimes(2);
    await drainBackground();
  });

  it('stop() before the first run means it never runs', async () => {
    vi.useFakeTimers();
    const run = vi.fn(async () => {});
    startRetentionScheduler(run)();
    await vi.advanceTimersByTimeAsync(2 * INTERVAL_MS);
    expect(run).not.toHaveBeenCalled();
  });
});

// Nakatali ang lock sa transaction (xact): pagkatapos ng lahat ng takbo sa itaas, walang dapat natirang hawak
it('leaves no advisory lock behind', async () => {
  const held = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from pg_locks where locktype = 'advisory' and objid = ${RETENTION_LOCK_KEY}`,
  );
  expect(held.rows[0]?.n).toBe(0);
});

// Day 90: nakikita ang cleanup sa Prometheus (backend/http/34-retention.http). Lahat ng serye ay nasa 0 bago pa ang unang takbo
describe('retention metrics', () => {
  const scrape = async () => {
    const server = createServer((req, res) => prometheusExporter.getMetricsRequestHandler(req, res));
    return (await request(server).get('/metrics')).text;
  };
  const value = (text: string, name: string, label: string) =>
    Number(text.match(new RegExp(`^${name}\\{${label}[^}]*\\} (\\d+)`, 'm'))?.[1] ?? NaN);

  it('starts every table and status at 0, then counts what a run deleted', async () => {
    const before = await scrape();
    for (const table of RETENTION_TABLES) expect(value(before, 'auth_retention_deleted_total', `table="${table}"`)).toBeGreaterThanOrEqual(0);
    for (const status of ['ok', 'skipped', 'failed']) expect(value(before, 'auth_retention_runs_total', `status="${status}"`)).toBeGreaterThanOrEqual(0);

    await db.insert(trustedDevices).values({ userId, tokenHash: randomUUID(), expiresAt: ago(1000) });
    await cleanupAndLog();
    const after = await scrape();
    const diff = (name: string, label: string) => value(after, name, label) - value(before, name, label);
    expect(diff('auth_retention_deleted_total', 'table="trustedDevices"')).toBe(1);
    expect(diff('auth_retention_runs_total', 'status="ok"')).toBe(1);
  });
});

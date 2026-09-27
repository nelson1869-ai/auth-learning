import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import request from 'supertest';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, refreshTokens, trustedDevices, users, verificationTokens } from '../db/schema.ts';
import { createRefreshToken } from '../lib/session.ts';
import { testOutbox } from '../lib/email.ts';
import { drainBackground } from '../lib/background.ts';

// Race conditions (Day 66) — "check then act" (TOCTOU): gumagana ang lahat sa ISANG request, pero kapag N ang SABAY,
// lahat sila ay nakakabasa ng parehong lumang estado bago pa may makapagsulat. Dito, pinapaputok nang sabay ang parehong
// request (Promise.all) at sinusuri ang patakaran ("5 hula lang", "isang account lang", "isang beses lang ang link").
// Ang ibang race test: routes/rotation.test.ts (refresh, Day 52) · routes/password-reset.test.ts (reset link, Day 59)

const PARALLEL = 20;
const PASSWORD = 'Race-Test-2026!';
const created: string[] = [];

// ISANG server para sa lahat ng request (aral ng reference): ang `request(app)` ay gumagawa ng bagong server BAWAT request —
// 20 sabay = 20 server na sabay nagbubukas at nagsasara, na paminsan-minsang nagbibigay ng ECONNRESET sa mabagal na CI
let server: Server;
beforeAll(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
});
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.delete(users).where(inArray(users.email, created));
});

function uniqueEmail(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  return email;
}
async function account(prefix: string) {
  const email = uniqueEmail(prefix);
  const res = await request(server).post('/api/auth/register').send({ email, password: PASSWORD });
  expect(res.status).toBe(201); // precondition: kung hindi nagawa ang account, walang saysay ang sukat (aral ng reference)
  return { email, userId: res.body.user.id as number };
}
function count(statuses: number[], status: number) {
  return statuses.filter((s) => s === status).length;
}
async function parallelWrongLogins(email: string, cookie?: string) {
  const responses = await Promise.all(
    Array.from({ length: PARALLEL }, () => {
      const req = request(server).post('/api/auth/login');
      if (cookie) req.set('Cookie', cookie);
      return req.send({ email, password: 'wrong-password' });
    }),
  );
  return responses.map((r) => r.status);
}

// Day 66: ang dalawang test sa ibaba ay TAHASANG sumusukat sa bug ("higit sa 5 ang nasuri, hindi na-lock") — pumasa habang
// may bug. Day 67 (reserve-then-verify, lib/loginLockout.ts): bumagsak sila gaya ng inaasahan ("expected 5 to be greater
// than 5"), at binaligtad dito. Hindi `it.fails` ang ginamit: pumapasa iyon sa KAHIT ANONG error (maling dahilan)
describe('per-account lockout under concurrency (fixed on Day 67)', () => {
  it('checks exactly 5 guesses when 20 wrong passwords arrive at once, locks the account, and audits the lock once', async () => {
    const { email, userId } = await account('race-account');
    const statuses = await parallelWrongLogins(email);

    expect(count(statuses, 401)).toBe(5); // 5 hula lang ang nasuri (argon2)
    expect(count(statuses, 423)).toBe(PARALLEL - 5); // ang iba: hindi na umabot sa argon2
    const after = await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(after.status).toBe(423); // naka-lock, kahit tamang password
    const locks = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.action, 'account_locked'), eq(auditLogs.targetId, userId)));
    expect(locks).toHaveLength(1); // isang beses lang, kahit maraming sabay na umabot sa limit
  });

  it("checks exactly 5 guesses on a trusted device's own counter too, and locks only that device", async () => {
    const { email, userId } = await account('race-device');
    const login = await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    const deviceCookie = login.get('Set-Cookie')?.find((c) => c.startsWith('device_token='))?.split(';')[0];
    expect(deviceCookie).toBeDefined(); // precondition: may device cookie talaga

    const statuses = await parallelWrongLogins(email, deviceCookie);
    expect(count(statuses, 401)).toBe(5);
    expect(count(statuses, 423)).toBe(PARALLEL - 5);
    const [device] = await db.select().from(trustedDevices).where(eq(trustedDevices.userId, userId));
    expect(device?.lockedUntil).not.toBeNull(); // naka-lock ang device
    // …pero hindi ang account: ang ibang browser (walang cookie) ay makakapag-login pa rin
    expect((await request(server).post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(200);
  });
});

describe('no-account counter under concurrency (Day 71)', () => {
  it('checks exactly 5 guesses for an email with NO account too (same as a real one)', async () => {
    const email = uniqueEmail('race-unknown');
    const statuses = await parallelWrongLogins(email);
    expect(count(statuses, 401)).toBe(5);
    expect(count(statuses, 423)).toBe(PARALLEL - 5);
  });
});

describe('already race-safe (proof, not a fix)', () => {
  it('registers exactly one account when the same email is registered 20 times at once (409s, never 500)', async () => {
    const email = uniqueEmail('race-register');
    const responses = await Promise.all(
      Array.from({ length: PARALLEL }, () => request(server).post('/api/auth/register').send({ email, password: PASSWORD })),
    );
    const statuses = responses.map((r) => r.status);
    expect(count(statuses, 201)).toBe(1);
    expect(count(statuses, 409)).toBe(PARALLEL - 1);
    const rows = await db.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });

  it('uses an email verification link exactly once when it is opened 20 times at once', async () => {
    const { email } = await account('race-verify');
    await drainBackground();
    const mail = [...testOutbox].reverse().find((m) => m.to === email && m.subject.startsWith('Confirm'));
    const token = mail?.text.match(/\/verify-email#token=([\w-]+)/)?.[1];
    expect(token).toBeDefined(); // precondition

    const responses = await Promise.all(
      Array.from({ length: PARALLEL }, () => request(server).post('/api/auth/verify-email').send({ token })),
    );
    const statuses = responses.map((r) => r.status);
    expect(count(statuses, 204)).toBe(1);
    expect(count(statuses, 400)).toBe(PARALLEL - 1);
  });
});

// Day 69 — "DAPAT ISA LANG": ang database ang huling bantay, hindi lang ang code.
// Ang code ay "UPDATE ang luma, tapos INSERT ang bago" — dalawang statement. Kapag sabay, walang nakikitang luma ang lahat,
// at lahat ay nag-i-INSERT. Isang partial UNIQUE index lang ang makakagarantiya nito, kahit ano pa ang gawin ng code
describe('one active X — enforced by the database (Day 69)', () => {
  const activeTokens = async (userId: number, purpose: 'password_reset' | 'email_verification') =>
    (
      await db
        .select()
        .from(verificationTokens)
        .where(and(eq(verificationTokens.userId, userId), eq(verificationTokens.purpose, purpose), isNull(verificationTokens.usedAt)))
    ).length;

  it('keeps ONE active verification link when "send again" is pressed 20 times at once', async () => {
    const { email, userId } = await account('race-resend');
    const login = await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    const cookies = (login.get('Set-Cookie') ?? []).map((c) => c.split(';')[0]).join('; ');

    const responses = await Promise.all(
      Array.from({ length: PARALLEL }, () => request(server).post('/api/auth/resend-verification').set('Cookie', cookies)),
    );
    expect(responses.map((r) => r.status)).toEqual(Array(PARALLEL).fill(202)); // walang 500
    await drainBackground(); // ang token ay ginagawa PAGKATAPOS sumagot — kung hindi hihintayin, nakadepende sa timing ang bilang
    expect(await activeTokens(userId, 'email_verification')).toBe(1);
  });

  it('keeps ONE active reset link when "forgot password" is sent 20 times at once', async () => {
    const { email, userId } = await account('race-forgot');
    await Promise.all(Array.from({ length: PARALLEL }, () => request(server).post('/api/auth/forgot-password').send({ email })));
    await drainBackground(); // ang email at token ay ginagawa PAGKATAPOS sumagot
    expect(await activeTokens(userId, 'password_reset')).toBe(1);
  });

  it('refuses a second ACTIVE refresh token in the same family, even if some code tried', async () => {
    const { email, userId } = await account('family-guard');
    await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    const [active] = await db
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    expect(active).toBeDefined(); // precondition

    // Isang "bug" na nakalimutang bawiin ang luma bago gumawa ng bago: dapat tanggihan ng DATABASE
    await expect(createRefreshToken(userId, { userAgent: null, ip: null }, active!.familyId)).rejects.toThrow();
  });
});

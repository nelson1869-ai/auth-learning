import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { inArray, sql } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { drainBackground } from '../lib/background.ts';
import { hashToken } from '../lib/session.ts';

// User enumeration (Day 71): hindi dapat malaman ng attacker kung may account ang isang email.
// Ang tanong ng bawat test: "may pagkakaiba ba ang sagot para sa email na MAY account at WALA?" — dapat wala
const PASSWORD = 'Enum-Test-2026-pass!';
const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}
async function withAccount() {
  const email = uniqueEmail('enum-real');
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  expect(res.status).toBe(201); // precondition
  return email;
}
// Ang nakikita ng attacker: status, body, at kung may Retry-After
async function sixWrongLogins(email: string) {
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    out.push(`${res.status} ${JSON.stringify(res.body)} retry-after:${res.headers['retry-after'] ? 'oo' : 'wala'}`);
  }
  return out;
}

describe('login gives no hint whether an account exists', () => {
  it('six wrong passwords: identical statuses, bodies and headers for a real account and for no account', async () => {
    const real = await sixWrongLogins(await withAccount());
    const none = await sixWrongLogins(uniqueEmail('enum-none'));
    expect(none).toEqual(real);
    expect(real[5]).toMatch(/^423 /); // precondition: talagang umabot sa lock ang totoong account
  });

  it('the no-account counter stores only a hash of the email, never the email itself', async () => {
    const email = uniqueEmail('enum-hash');
    await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    const rows = await db.execute(sql`select * from unknown_login_attempts`);
    expect(rows.rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(rows.rows)).not.toContain(email);
  });
});

describe('no-account lock expires like a real one', () => {
  it('after 15 minutes: 5 new tries, and the expired lock is cleared (NULL), not left behind', async () => {
    const email = uniqueEmail('enum-expire');
    await sixWrongLogins(email); // naka-lock
    // Ang row LANG ng email na ito (may ibang naka-lock na row mula sa ibang test sa table)
    const emailHash = hashToken(email);
    await db.execute(sql`update unknown_login_attempts set locked_until = now() - interval '1 second' where email_hash = ${emailHash}`);
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    const rows = await db.execute(sql`select locked_until, failed_login_attempts from unknown_login_attempts where email_hash = ${emailHash}`);
    expect(rows.rows).toEqual([{ locked_until: null, failed_login_attempts: 1 }]);
  });
});

describe('forgot password gives no hint whether an account exists', () => {
  it('same status and body for a real account and for no account', async () => {
    const real = await request(app).post('/api/auth/forgot-password').send({ email: await withAccount() });
    const none = await request(app).post('/api/auth/forgot-password').send({ email: uniqueEmail('enum-none') });
    await drainBackground();
    expect(none.status).toBe(real.status);
    expect(none.body).toEqual(real.body);
  });
});

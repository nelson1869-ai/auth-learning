import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { publicKey, signAccessToken, JWT_AUDIENCE, JWT_ISSUER } from './jwt.ts';

const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

async function userId() {
  const email = `jwt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  const res = await request(app).post('/api/auth/register').send({ email, password: 'Jwt-Test-2026!' });
  return res.body.user.id as number;
}
function me(token: string) {
  return request(app).get('/api/auth/me').set('Cookie', `token=${token}`);
}
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

// RS256 at JWT claims (Day 56)
describe('access token', () => {
  it('is RS256 with iss and aud, and works on /me', async () => {
    const id = await userId();
    const token = signAccessToken(id);
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('RS256');
    expect(decoded?.payload).toMatchObject({ sub: String(id), iss: JWT_ISSUER, aud: JWT_AUDIENCE });
    expect((await me(token)).status).toBe(200);
  });
});

describe('rejected tokens (all 401)', () => {
  it('an old HS256 token (before Day 56)', async () => {
    const token = jwt.sign({ sub: String(await userId()) }, 'isang-lumang-JWT_SECRET-na-mahaba-pa-rin-dito', { expiresIn: '15m' });
    expect((await me(token)).status).toBe(401);
  });

  // Algorithm confusion: pampubliko ang public key. Kung hahayaan ng server na ang header ng token ang pumili
  // ng algorithm, gagawa ang attacker ng HS256 token na pinirmahan gamit ang PUBLIC key bilang "secret"
  it('algorithm confusion: HS256 signed with the PUBLIC key as the secret', async () => {
    const header = b64({ alg: 'HS256', typ: 'JWT' });
    const payload = b64({ sub: String(await userId()), iss: JWT_ISSUER, aud: JWT_AUDIENCE, exp: Math.floor(Date.now() / 1000) + 600 });
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const signature = createHmac('sha256', pem).update(`${header}.${payload}`).digest('base64url');
    expect((await me(`${header}.${payload}.${signature}`)).status).toBe(401);
  });

  it('alg: none (no signature)', async () => {
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: String(await userId()), iss: JWT_ISSUER, aud: JWT_AUDIENCE })}.`;
    expect((await me(token)).status).toBe(401);
  });

  it('signed by a different RSA key', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
    const token = jwt.sign({ sub: String(await userId()) }, other, { algorithm: 'RS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    expect((await me(token)).status).toBe(401);
  });

  it.each([
    ['a wrong issuer', { issuer: 'ibang-sistema', audience: JWT_AUDIENCE }],
    ['a wrong audience', { issuer: JWT_ISSUER, audience: 'ibang-app' }],
    ['no issuer or audience', {}],
  ])('the right key, but %s', async (_label, claims) => {
    const token = jwt.sign({ sub: String(await userId()) }, getPrivateKeyForTest(), { algorithm: 'RS256', expiresIn: '15m', ...claims });
    expect((await me(token)).status).toBe(401);
  });
});

// Ang tamang private key (para sa pagsubok ng maling claims) — galing sa parehong env ng app
function getPrivateKeyForTest() {
  return Buffer.from(process.env.JWT_PRIVATE_KEY ?? '', 'base64').toString('utf8');
}

// Fail-fast: ayaw mag-start ng server kapag mali ang key
describe('JWT_PRIVATE_KEY validation', () => {
  function startWith(key: string): string {
    try {
      execFileSync(process.execPath, ['-e', "await import('./src/config/env.ts')"], {
        env: { ...process.env, JWT_PRIVATE_KEY: key },
        stdio: 'pipe',
        input: '',
      });
      return 'started';
    } catch (err) {
      return String((err as { stderr?: Buffer }).stderr ?? err);
    }
  }
  const pemOf = (type: 'rsa' | 'ec', options: object) =>
    Buffer.from(
      generateKeyPairSync(type as 'rsa', options as { modulusLength: number }).privateKey.export({ type: 'pkcs8', format: 'pem' }),
    ).toString('base64');

  it('refuses a value that is not a PEM key, without printing it', () => {
    const out = startWith('hindi-ito-key');
    expect(out).toContain('Not a base64-encoded PEM private key');
    expect(out).not.toContain('hindi-ito-key');
  });

  it('refuses an RSA key under 2048 bits', () => {
    expect(startWith(pemOf('rsa', { modulusLength: 1024 }))).toContain('at least 2048 bits');
  });

  it('refuses a non-RSA key', () => {
    expect(startWith(pemOf('ec', { namedCurve: 'P-256' }))).toContain('Need an RSA key');
  });

  it('accepts a 2048-bit RSA key', () => {
    expect(startWith(pemOf('rsa', { modulusLength: 2048 }))).toBe('started');
  });
});

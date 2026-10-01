import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, passkeys, users, webauthnChallenges } from '../db/schema.ts';
import { EXPECTED_ORIGIN, RP_ID } from '../lib/webauthn.ts';
import { passkeyAuthenticationOptions, userResponse } from '../validations/responses.ts';
import { newSoftCredential, softCreate, softGet, type SoftCredential } from '../test/softAuthenticator.ts';

// Login gamit ang passkey (Day 97–98). Totoong library at totoong pirma (test/softAuthenticator.ts), walang browser
const PASSWORD = 'Passkey-Login-2026!';
const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created));
});

// Isang account na may passkey na (dumaan sa totoong registration ng Day 95)
async function withPasskey(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  const userId = login.body.user.id as number;
  const credential = newSoftCredential();
  const { challenge } = (await agent.post('/api/auth/passkeys/register/options').send({ currentPassword: PASSWORD })).body;
  const reg = await agent.post('/api/auth/passkeys/register/verify').send({ response: softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, credential }).response });
  expect(reg.status).toBe(201);
  return { email, userId, credential, passkeyId: reg.body.passkey.id as number };
}

const options = (body: Record<string, unknown> = {}) => request(app).post('/api/auth/passkeys/login/options').send(body);
const verify = (response: unknown, agent: ReturnType<typeof request.agent> | typeof request = request) =>
  (agent === request ? request(app) : (agent as ReturnType<typeof request.agent>)).post('/api/auth/passkeys/login/verify').send({ response });
// Isang buong login: options → pirma ng device → verify
async function loginWith(credential: SoftCredential, userId: number, overrides: Partial<Parameters<typeof softGet>[0]> = {}) {
  const { challenge } = (await options()).body;
  return verify(softGet({ credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, userHandle: String(userId), ...overrides }));
}
const failures = (userId: number | null) =>
  db.select({ metadata: auditLogs.metadata }).from(auditLogs).where(and(userId === null ? undefined : eq(auditLogs.targetId, userId), eq(auditLogs.action, 'login_failed')));
// Ilang `login_failed` na may ganitong dahilan ang WALANG target (hal. no_challenge, unknown_credential) — bago at pagkatapos
const countReason = async (reason: string) => (await failures(null)).filter((f) => f.metadata?.reason === reason).length;
const FAILED = { error: 'Passkey login failed. Please try again.' };
const cookie = (res: request.Response, name: string) => (res.get('Set-Cookie') ?? []).find((c) => c.startsWith(`${name}=`));

describe('POST /api/auth/passkeys/login/options', () => {
  it('without an email: no list of credentials — the DEVICE picks the account (discoverable)', async () => {
    const res = await options();
    expect(res.status).toBe(200);
    expect(passkeyAuthenticationOptions.safeParse(res.body).success).toBe(true);
    expect(res.body).toMatchObject({ rpId: RP_ID, userVerification: 'required', allowCredentials: [] });
    const [row] = await db.select().from(webauthnChallenges).where(eq(webauthnChallenges.challenge, res.body.challenge));
    expect(row).toMatchObject({ userId: null, purpose: 'authentication' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it("with an email: that account's passkeys, without transports", async () => {
    const { email, credential } = await withPasskey('pkl-allow');
    const res = await options({ email: `  ${email.toUpperCase()} ` }); // trim + lowercase, gaya ng login
    expect(res.body.allowCredentials).toEqual([{ id: credential.credentialId.toString('base64url'), type: 'public-key' }]);
  });

  it('🔐 DECOY: an email with no account (or no passkey) gets a fake credential — same shape, and the SAME on every call', async () => {
    const { email } = await withPasskey('pkl-real');
    const noPasskey = `pkl-nopk-${Date.now()}@example.com`;
    created.push(noPasskey);
    await request(app).post('/api/auth/register').send({ email: noPasskey, password: PASSWORD });

    const real = (await options({ email })).body;
    const ghost1 = (await options({ email: 'walang-ganito@example.com' })).body;
    const ghost2 = (await options({ email: 'walang-ganito@example.com' })).body;
    const other = (await options({ email: 'iba-pang-wala@example.com' })).body;
    const noPk = (await options({ email: noPasskey })).body;

    // Parehong hugis: parehong mga key, isang credential, walang transports
    for (const body of [ghost1, other, noPk]) {
      expect(Object.keys(body).sort()).toEqual(Object.keys(real).sort());
      expect(body.allowCredentials).toHaveLength(1);
      expect(Object.keys(body.allowCredentials[0]).sort()).toEqual(Object.keys(real.allowCredentials[0]).sort());
      expect(body.allowCredentials[0].id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    expect(ghost2.allowCredentials).toEqual(ghost1.allowCredentials); // hindi random — kung random, makikita sa pag-ulit
    expect(other.allowCredentials).not.toEqual(ghost1.allowCredentials); // iba bawat email
    expect(ghost1.challenge).not.toBe(ghost2.challenge); // pero bago pa rin ang challenge
  });

  it('rejects a malformed email (400), like the password login', async () => {
    expect((await options({ email: 'hindi-email' })).status).toBe(400);
  });
});

describe('POST /api/auth/passkeys/login/verify', () => {
  it('logs in with a valid signature: 200, session cookies, /me works, audited as a passkey login, counter saved', async () => {
    const { email, userId, credential, passkeyId } = await withPasskey('pkl-ok');
    const agent = request.agent(app);
    const { challenge } = (await options()).body;
    const res = await verify(softGet({ credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, userHandle: String(userId) }), agent);
    expect(res.status).toBe(200);
    expect(userResponse.safeParse(res.body).success).toBe(true);
    expect(res.body.user).toEqual({ id: userId, email, name: null });
    expect(cookie(res, 'token')).toMatch(/HttpOnly/);
    expect(cookie(res, 'refresh_token')).toMatch(/Path=\/api\/auth/);
    expect(cookie(res, 'device_token')).toBeDefined();
    expect((await agent.get('/api/auth/me')).body.user.email).toBe(email);

    const [row] = await db.select().from(passkeys).where(eq(passkeys.id, passkeyId));
    expect(row?.counter).toBe(credential.signCount);
    expect(row?.lastUsedAt).toBeInstanceOf(Date);
    const logs = await db.select({ metadata: auditLogs.metadata }).from(auditLogs).where(and(eq(auditLogs.actorId, userId), eq(auditLogs.action, 'login')));
    expect(logs.map((l) => l.metadata)).toContainEqual({ method: 'passkey', passkey: passkeyId });
  });

  it('works without a userHandle too, and with an email-first challenge', async () => {
    const { email, credential } = await withPasskey('pkl-email');
    const { challenge } = (await options({ email })).body;
    expect((await verify(softGet({ credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID }))).status).toBe(200);
  });

  it('REPLAY: the same signed answer cannot log in twice', async () => {
    const { userId, credential } = await withPasskey('pkl-replay');
    const { challenge } = (await options()).body;
    const answer = softGet({ credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, userHandle: String(userId) });
    expect((await verify(answer)).status).toBe(200);
    const before = await countReason('no_challenge');
    const again = await verify(answer);
    expect(again.status).toBe(401);
    expect(again.body).toEqual(FAILED);
    // Tumanggi dahil NAGAMIT na ang challenge — hindi dahil sa ibang bantay (hal. ang counter)
    expect(await countReason('no_challenge')).toBe(before + 1);
    expect(await failures(userId)).toEqual([]);
  });

  it('PHISHING: a signature made on another site is rejected — wrong origin, and wrong RP ID', async () => {
    const { userId, credential } = await withPasskey('pkl-phish');
    expect((await loginWith(credential, userId, { origin: 'https://nelson1869.com.evil.example' })).status).toBe(401);
    expect((await loginWith(credential, userId, { rpId: 'evil.example' })).status).toBe(401);
    expect((await failures(userId)).map((f) => f.metadata)).toEqual([
      { method: 'passkey', reason: 'origin_mismatch' },
      { method: 'passkey', reason: 'rp_id_mismatch' },
    ]);
  });

  it('a stolen PUBLIC key is useless: a signature from another private key is rejected', async () => {
    const { userId, credential } = await withPasskey('pkl-forge');
    const thief = newSoftCredential();
    const res = await loginWith(credential, userId, { signWith: thief.privateKey });
    expect(res.status).toBe(401);
    expect((await failures(userId)).map((f) => f.metadata?.reason)).toEqual(['bad_signature']);
  });

  it('rejects: no user verification · a userHandle of another account · an unknown credential · a challenge that never existed or expired', async () => {
    const a = await withPasskey('pkl-a');
    const b = await withPasskey('pkl-b');
    expect((await loginWith(a.credential, a.userId, { userVerified: false })).status).toBe(401);
    expect((await loginWith(a.credential, b.userId)).status).toBe(401); // key ni A, pero sinasabing si B
    expect((await loginWith(newSoftCredential(), a.userId)).status).toBe(401); // hindi nakarehistro dito
    expect((await verify(softGet({ credential: a.credential, challenge: 'gawa-gawa', origin: EXPECTED_ORIGIN, rpId: RP_ID }))).status).toBe(401);

    const { challenge } = (await options()).body;
    await db.update(webauthnChallenges).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(webauthnChallenges.challenge, challenge));
    expect((await verify(softGet({ credential: a.credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID }))).status).toBe(401);

    expect((await failures(a.userId)).map((f) => f.metadata?.reason)).toEqual(['user_not_verified', 'user_handle_mismatch']);
  });

  it('CLONED KEY: a signature counter that goes DOWN is rejected', async () => {
    const { userId, credential } = await withPasskey('pkl-clone');
    expect((await loginWith(credential, userId, { signCount: 5 })).status).toBe(200);
    expect((await loginWith(credential, userId, { signCount: 3 })).status).toBe(401);
    expect((await failures(userId)).map((f) => f.metadata?.reason)).toEqual(['counter_regression']);
    expect((await loginWith(credential, userId, { signCount: 6 })).status).toBe(200);
  });

  it('a removed passkey cannot log in anymore', async () => {
    const { email, userId, credential, passkeyId } = await withPasskey('pkl-removed');
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    expect((await agent.delete(`/api/auth/passkeys/${passkeyId}`)).status).toBe(204);
    const before = await countReason('unknown_credential');
    expect((await loginWith(credential, userId)).status).toBe(401);
    expect(await countReason('unknown_credential')).toBe(before + 1);
  });

  it('three verifies at the same moment with the same answer: exactly ONE session', async () => {
    const { userId, credential } = await withPasskey('pkl-race');
    const { challenge } = (await options()).body;
    const answer = softGet({ credential, challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, userHandle: String(userId) });
    const codes = (await Promise.all([verify(answer), verify(answer), verify(answer)])).map((r) => r.status);
    expect(codes.sort()).toEqual([200, 401, 401]);
  });

  it('a passkey still works while the PASSWORD is locked by guessing (423) — a signature cannot be guessed', async () => {
    const { email, userId, credential } = await withPasskey('pkl-locked');
    for (let i = 0; i < 5; i++) await request(app).post('/api/auth/login').send({ email, password: 'hula-hula' });
    expect((await request(app).post('/api/auth/login').send({ email, password: PASSWORD })).status).toBe(423);
    expect((await loginWith(credential, userId)).status).toBe(200);
  });

  it('validates the shape first: 400 with fields', async () => {
    const res = await verify({ id: 'x', rawId: 'x', type: 'public-key', response: { clientDataJSON: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });
});

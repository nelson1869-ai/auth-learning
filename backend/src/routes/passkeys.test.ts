import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import app from '../app.ts';
import { db } from '../db/index.ts';
import { auditLogs, passkeys, users, webauthnChallenges } from '../db/schema.ts';
import { EXPECTED_ORIGIN, hasRegistrationChallenge, RP_ID } from '../lib/webauthn.ts';
import { passkeyRegistrationOptions, passkeyResponse, passkeysResponse } from '../validations/responses.ts';
import { newSoftCredential, softCreate } from '../test/softAuthenticator.ts';

// Passkeys, registration (Day 95–96). Ang "device" ay test/softAuthenticator.ts — totoong key pair at totoong pirma ng library,
// pero walang browser. Kaya kaya nating pekein ang origin, ang RP ID at ang challenge: iyon mismo ang mga atake
const PASSWORD = 'Passkey-Test-2026!';
const created: string[] = [];
afterAll(async () => {
  await db.delete(users).where(inArray(users.email, created)); // CASCADE: pati ang passkeys at challenges
});

async function account(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  created.push(email);
  await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  return { agent, email, userId: res.body.user.id as number };
}
type Agent = Awaited<ReturnType<typeof account>>['agent'];
const optionsOf = (agent: Agent, currentPassword = PASSWORD) => agent.post('/api/auth/passkeys/register/options').send({ currentPassword });
const verify = (agent: Agent, response: unknown, extra: Record<string, unknown> = {}) =>
  agent.post('/api/auth/passkeys/register/verify').send({ response, ...extra });
// Isang buong matagumpay na pagdagdag
async function addPasskey(agent: Agent, name?: string) {
  const { challenge } = (await optionsOf(agent)).body;
  const soft = softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID });
  const res = await verify(agent, soft.response, name ? { name } : {});
  return { res, soft };
}
const audits = (userId: number, action: 'passkey_added' | 'passkey_add_failed' | 'passkey_removed') =>
  db.select().from(auditLogs).where(and(eq(auditLogs.targetId, userId), eq(auditLogs.action, action)));
const stored = (userId: number) => db.select().from(passkeys).where(eq(passkeys.userId, userId));
const FAILED = { error: 'Passkey registration failed. Please try again.' };

describe('POST /api/auth/passkeys/register/options', () => {
  it('needs a login: 401 without a session, on all four passkey routes', async () => {
    expect((await request(app).post('/api/auth/passkeys/register/options').send({ currentPassword: PASSWORD })).status).toBe(401);
    expect((await request(app).post('/api/auth/passkeys/register/verify').send({})).status).toBe(401);
    expect((await request(app).get('/api/auth/passkeys')).status).toBe(401);
    expect((await request(app).delete('/api/auth/passkeys/1')).status).toBe(401);
  });

  it('needs the CURRENT password (a stolen session alone cannot add a way in): 400, audit, no challenge', async () => {
    const { agent, userId } = await account('pk-pw');
    const res = await optionsOf(agent, 'hula-lang-ito');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid input', fields: { currentPassword: ['Incorrect password'] } });
    expect(await hasRegistrationChallenge(userId)).toBe(false);
    const [log] = await audits(userId, 'passkey_add_failed');
    expect(log?.metadata).toEqual({ reason: 'wrong_password' });
    expect((await agent.post('/api/auth/passkeys/register/options').send({})).status).toBe(400); // walang password
  });

  it('returns options tied to OUR site and this user, and stores the challenge', async () => {
    const { agent, email, userId } = await account('pk-opt');
    const res = await optionsOf(agent);
    expect(res.status).toBe(200);
    expect(passkeyRegistrationOptions.safeParse(res.body).success).toBe(true);
    expect(res.body.rp).toEqual({ id: RP_ID, name: 'auth-learning' });
    expect(res.body.user.name).toBe(email);
    expect(Buffer.from(res.body.user.id, 'base64url').toString()).toBe(String(userId)); // user handle = id, hindi email
    expect(res.body.authenticatorSelection).toMatchObject({ residentKey: 'required', userVerification: 'required' });
    expect(res.body.attestation).toBe('none');
    expect(res.body.challenge.length).toBeGreaterThanOrEqual(32);
    expect(await hasRegistrationChallenge(userId)).toBe(true);
    expect(res.headers['cache-control']).toBe('no-store');
    // bago sa bawat hingi
    expect((await optionsOf(agent)).body.challenge).not.toBe(res.body.challenge);
  });
});

describe('POST /api/auth/passkeys/register/verify', () => {
  it('saves the PUBLIC key of a valid registration: 201, listed, audited — and nothing secret in the database', async () => {
    const { agent, userId } = await account('pk-ok');
    const { res, soft } = await addPasskey(agent, '  Laptop ko  ');
    expect(res.status).toBe(201);
    expect(passkeyResponse.safeParse(res.body).success).toBe(true); // strict: walang publicKey o credentialId sa sagot
    expect(res.body.passkey).toMatchObject({ name: 'Laptop ko', deviceType: 'singleDevice', backedUp: false, lastUsedAt: null });

    const [row] = await stored(userId);
    expect(row).toMatchObject({ credentialId: soft.response.id, counter: 0, transports: ['internal'] });
    // Ang naka-save ay ang PUBLIC key ng device, at HINDI ang private key
    const privateD = soft.credential.privateKey.export({ format: 'jwk' }).d!;
    expect(Buffer.from(row!.publicKey, 'base64url').includes(Buffer.from(soft.credential.publicKey.export({ format: 'jwk' }).x!, 'base64url'))).toBe(true);
    expect(JSON.stringify(row)).not.toContain(privateD);

    const list = await agent.get('/api/auth/passkeys');
    expect(passkeysResponse.safeParse(list.body).success).toBe(true);
    expect(list.body.passkeys).toHaveLength(1);
    const [log] = await audits(userId, 'passkey_added');
    expect(log?.metadata).toMatchObject({ passkey: res.body.passkey.id });
    expect(await hasRegistrationChallenge(userId)).toBe(false); // nagamit na
  });

  it('REPLAY: the same answer cannot be sent twice (the challenge is single-use)', async () => {
    const { agent, userId } = await account('pk-replay');
    const { res, soft } = await addPasskey(agent);
    expect(res.status).toBe(201);
    const again = await verify(agent, soft.response);
    expect(again.status).toBe(400);
    expect(again.body).toEqual(FAILED);
    expect(await stored(userId)).toHaveLength(1);
  });

  it('PHISHING: an answer made on another site (wrong origin) is rejected, and nothing is saved', async () => {
    const { agent, userId } = await account('pk-phish');
    const { challenge } = (await optionsOf(agent)).body;
    const res = await verify(agent, softCreate({ challenge, origin: 'http://localhost.evil.example:5173', rpId: RP_ID }).response);
    expect(res.status).toBe(400);
    expect(res.body).toEqual(FAILED); // hindi sinasabi kung alin ang mali
    expect(await stored(userId)).toHaveLength(0);
    const [log] = await audits(userId, 'passkey_add_failed');
    expect(log?.metadata).toEqual({ reason: 'origin_mismatch' }); // ang dahilan ay nasa audit log — kategorya lang, hindi ang origin ng umaatake
  });

  it('rejects a passkey bound to another domain (wrong RP ID)', async () => {
    const { agent, userId } = await account('pk-rp');
    const { challenge } = (await optionsOf(agent)).body;
    const res = await verify(agent, softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: 'evil.example' }).response);
    expect(res.status).toBe(400);
    expect(await stored(userId)).toHaveLength(0);
    expect((await audits(userId, 'passkey_add_failed'))[0]?.metadata).toEqual({ reason: 'rp_id_mismatch' });
  });

  it('rejects a device that did not verify the user (no fingerprint/PIN)', async () => {
    const { agent, userId } = await account('pk-uv');
    const { challenge } = (await optionsOf(agent)).body;
    const res = await verify(agent, softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, userVerified: false }).response);
    expect(res.status).toBe(400);
    expect(await stored(userId)).toHaveLength(0);
    expect((await audits(userId, 'passkey_add_failed'))[0]?.metadata).toEqual({ reason: 'user_not_verified' });
  });

  it("rejects an answer to ANOTHER user's challenge, and a made-up challenge", async () => {
    const victim = await account('pk-victim');
    const attacker = await account('pk-attacker');
    const { challenge } = (await optionsOf(victim.agent)).body;
    await optionsOf(attacker.agent); // may sarili siyang challenge — pero iba
    expect((await verify(attacker.agent, softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID }).response)).status).toBe(400);
    await optionsOf(attacker.agent);
    expect((await verify(attacker.agent, softCreate({ challenge: 'gawa-gawa-lang', origin: EXPECTED_ORIGIN, rpId: RP_ID }).response)).status).toBe(400);
    expect(await stored(attacker.userId)).toHaveLength(0);
    // 🔐 Ang audit log ay may KATEGORYA lang — hindi ang challenge (nahuli sa totoong takbo: isinulat ng library ang inaasahang challenge sa mensahe)
    const logs = await audits(attacker.userId, 'passkey_add_failed');
    expect(logs.map((l) => l.metadata)).toEqual([{ reason: 'challenge_mismatch' }, { reason: 'challenge_mismatch' }]);
    expect(JSON.stringify(logs)).not.toContain(challenge);
  });

  it('rejects when there is no challenge at all, and when it has expired (5 minutes)', async () => {
    const { agent, userId } = await account('pk-exp');
    const orphan = softCreate({ challenge: 'walang-options', origin: EXPECTED_ORIGIN, rpId: RP_ID });
    expect((await verify(agent, orphan.response)).status).toBe(400);

    const { challenge } = (await optionsOf(agent)).body;
    await db.update(webauthnChallenges).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(webauthnChallenges.userId, userId));
    expect((await verify(agent, softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID }).response)).status).toBe(400);
    expect(await stored(userId)).toHaveLength(0);
  });

  it('a new options request replaces the old challenge (only ONE per user)', async () => {
    const { agent, userId } = await account('pk-one');
    const first = (await optionsOf(agent)).body.challenge;
    const second = (await optionsOf(agent)).body.challenge;
    expect(await db.select().from(webauthnChallenges).where(eq(webauthnChallenges.userId, userId))).toHaveLength(1);
    expect((await verify(agent, softCreate({ challenge: first, origin: EXPECTED_ORIGIN, rpId: RP_ID }).response)).status).toBe(400);
    // …at nasunog na rin ang pangalawa: isang subok lang bawat challenge
    expect((await verify(agent, softCreate({ challenge: second, origin: EXPECTED_ORIGIN, rpId: RP_ID }).response)).status).toBe(400);
  });

  it('two verifies at the same moment with the same answer: exactly ONE passkey (atomic consume)', async () => {
    const { agent, userId } = await account('pk-race');
    const { challenge } = (await optionsOf(agent)).body;
    const soft = softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID });
    const codes = (await Promise.all([verify(agent, soft.response), verify(agent, soft.response), verify(agent, soft.response)])).map((r) => r.status);
    expect(codes.sort()).toEqual([201, 400, 400]);
    expect(await stored(userId)).toHaveLength(1);
  });

  it('the same passkey cannot be registered twice — not by me, not by another account (409)', async () => {
    const me = await account('pk-dup');
    const other = await account('pk-dup-other');
    const credential = newSoftCredential();
    const first = (await optionsOf(me.agent)).body;
    expect((await verify(me.agent, softCreate({ challenge: first.challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, credential }).response)).status).toBe(201);

    const second = (await optionsOf(me.agent)).body;
    expect(second.excludeCredentials).toEqual([expect.objectContaining({ id: credential.credentialId.toString('base64url') })]); // sinasabi sa browser
    const dup = await verify(me.agent, softCreate({ challenge: second.challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, credential }).response);
    expect(dup.status).toBe(409);

    const theirs = (await optionsOf(other.agent)).body;
    expect((await verify(other.agent, softCreate({ challenge: theirs.challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID, credential }).response)).status).toBe(409);
    expect(await stored(other.userId)).toHaveLength(0);
  });

  it('MASS ASSIGNMENT: a userId in the body is ignored — the passkey goes to the logged-in user', async () => {
    const me = await account('pk-ma');
    const victim = await account('pk-ma-victim');
    const { challenge } = (await optionsOf(me.agent)).body;
    const res = await verify(me.agent, softCreate({ challenge, origin: EXPECTED_ORIGIN, rpId: RP_ID }).response, { userId: victim.userId });
    expect(res.status).toBe(201);
    expect(await stored(victim.userId)).toHaveLength(0);
    expect(await stored(me.userId)).toHaveLength(1);
  });

  it('validates the shape before doing any work: 400 with fields', async () => {
    const { agent } = await account('pk-shape');
    await optionsOf(agent);
    const res = await verify(agent, { id: 'x', rawId: 'x', type: 'public-key', response: { clientDataJSON: 'hindi base64url!!', attestationObject: '' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
    expect((await verify(agent, softCreate({ challenge: 'x', origin: EXPECTED_ORIGIN, rpId: RP_ID }).response, { name: 'x'.repeat(51) })).status).toBe(400);
  });

  it('stops at 10 passkeys per account', async () => {
    const { agent, userId } = await account('pk-max');
    await db.insert(passkeys).values(
      Array.from({ length: 10 }, (_, i) => ({ userId, credentialId: `max-${userId}-${i}`, publicKey: 'x', deviceType: 'singleDevice' as const, backedUp: false, name: `#${i}` })),
    );
    const res = await optionsOf(agent);
    expect(res.status).toBe(409);
    expect(await hasRegistrationChallenge(userId)).toBe(false);
  });
});

describe('GET and DELETE /api/auth/passkeys', () => {
  it('lists only MY passkeys; deleting is scoped to me (IDOR → 404), audited, and 404 for ids that are not numbers', async () => {
    const me = await account('pk-list');
    const other = await account('pk-list-other');
    const mine = (await addPasskey(me.agent, 'Akin')).res.body.passkey;
    const theirs = (await addPasskey(other.agent, 'Kanila')).res.body.passkey;

    expect((await me.agent.get('/api/auth/passkeys')).body.passkeys.map((p: { name: string }) => p.name)).toEqual(['Akin']);

    expect((await me.agent.delete(`/api/auth/passkeys/${theirs.id}`)).status).toBe(404);
    expect(await stored(other.userId)).toHaveLength(1); // buo pa rin ang sa iba
    for (const bad of ['abc', '0', '-1', '1.5', '99999999999']) expect((await me.agent.delete(`/api/auth/passkeys/${bad}`)).status).toBe(404);

    expect((await me.agent.delete(`/api/auth/passkeys/${mine.id}`)).status).toBe(204);
    expect(await stored(me.userId)).toHaveLength(0);
    expect((await me.agent.delete(`/api/auth/passkeys/${mine.id}`)).status).toBe(404); // wala na
    const [log] = await audits(me.userId, 'passkey_removed');
    expect(log?.metadata).toEqual({ passkey: mine.id });
  });

  it('deleting the account deletes its passkeys and challenges (CASCADE)', async () => {
    const { agent, userId, email } = await account('pk-cascade');
    await addPasskey(agent);
    await optionsOf(agent);
    await db.delete(users).where(eq(users.email, email));
    expect(await stored(userId)).toHaveLength(0);
    expect(await db.select().from(webauthnChallenges).where(eq(webauthnChallenges.userId, userId))).toHaveLength(0);
  });
});

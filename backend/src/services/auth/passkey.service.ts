import argon2 from 'argon2';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { and, asc, count, eq } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db/index.ts';
import { isUniqueViolation } from '../../db/errors.ts';
import { passkeys, users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { consumeRegistrationChallenge, EXPECTED_ORIGIN, RP_ID, RP_NAME, saveRegistrationChallenge } from '../../lib/webauthn.ts';
import type { passkeyRegisterVerifySchema } from '../../validations/auth.ts';

// Passkeys (Day 95–96) — ang REGISTRATION ceremony: pagdagdag ng passkey sa account na naka-login na.
// Business logic lang: walang req/res (Day 75). Ang login gamit ang passkey ay sa Day 97.
//
// Dalawang hakbang, dahil may device sa gitna:
//   1. start:  server → challenge + kung sino tayo (RP) + kung sino ang user   → browser → device (fingerprint/PIN, bagong key pair)
//   2. finish: device → public key + pirma sa challenge at origin → server: suriin, tapos i-save ang PUBLIC key

const MAX_PASSKEYS_PER_USER = 10; // may hangganan ang lahat ng kayang palakihin ng user

const publicColumns = {
  id: passkeys.id,
  name: passkeys.name,
  deviceType: passkeys.deviceType,
  backedUp: passkeys.backedUp,
  createdAt: passkeys.createdAt,
  lastUsedAt: passkeys.lastUsedAt,
};

export type StartRegistrationResult =
  | { status: 'no_user' }
  | { status: 'wrong_password' }
  | { status: 'too_many' }
  | { status: 'ok'; options: Awaited<ReturnType<typeof generateRegistrationOptions>> };

export async function startPasskeyRegistration(userId: number, currentPassword: string, audit: Audit): Promise<StartRegistrationResult> {
  const [user] = await db.select({ email: users.email, name: users.name, passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user) return { status: 'no_user' };

  // Reauthentication (gaya ng change password, Day 55): ang session lang ay hindi sapat para magdagdag ng paraan ng pagpasok
  if (!(await argon2.verify(user.passwordHash, currentPassword))) {
    await audit({ action: 'passkey_add_failed', actorId: userId, targetId: userId, metadata: { reason: 'wrong_password' } });
    return { status: 'wrong_password' };
  }

  const existing = await db.select({ credentialId: passkeys.credentialId, transports: passkeys.transports }).from(passkeys).where(eq(passkeys.userId, userId));
  if (existing.length >= MAX_PASSKEYS_PER_USER) return { status: 'too_many' };

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email, // ang ipinapakita ng device sa listahan ng mga passkey nito
    userDisplayName: user.name ?? user.email,
    // Ang "user handle" na itinatago ng device kasama ng key. Hindi dapat personal na data (hal. email): ang id lang natin
    userID: new TextEncoder().encode(String(userId)),
    attestationType: 'none', // hindi natin kailangang malaman ang gumawa ng device (at mas kaunting data tungkol sa user)
    // Huwag irehistro ulit ang device na mayroon na: sasabihin ng browser na "may passkey ka na rito"
    excludeCredentials: existing.map((p) => ({ id: p.credentialId, transports: p.transports ?? undefined })),
    authenticatorSelection: {
      residentKey: 'required', // "discoverable": ang device mismo ang nakakaalam kung kaninong account — kailangan sa login na walang email (Day 97)
      userVerification: 'required', // fingerprint, mukha o PIN — hindi sapat ang "may humawak lang"
    },
  });
  await saveRegistrationChallenge(userId, options.challenge);
  return { status: 'ok', options };
}

export type FinishRegistrationInput = z.infer<typeof passkeyRegisterVerifySchema> & { userId: number };
export type PublicPasskey = { id: number; name: string; deviceType: 'singleDevice' | 'multiDevice'; backedUp: boolean; createdAt: Date; lastUsedAt: Date | null };
export type FinishRegistrationResult =
  | { status: 'no_challenge' } // walang start, expired (5 min), o nagamit na
  | { status: 'invalid' } // hindi pumasa: maling challenge, origin, RP ID, pirma, o walang user verification
  | { status: 'already_registered' }
  | { status: 'too_many' }
  | { status: 'created'; passkey: PublicPasskey };

export async function finishPasskeyRegistration(input: FinishRegistrationInput, audit: Audit): Promise<FinishRegistrationResult> {
  const { userId } = input;
  const fail = async (reason: string, result: FinishRegistrationResult) => {
    await audit({ action: 'passkey_add_failed', actorId: userId, targetId: userId, metadata: { reason } });
    return result;
  };

  // Kunin AT burahin ang challenge: isang subok lang, pumasa man o hindi
  const expectedChallenge = await consumeRegistrationChallenge(userId);
  if (!expectedChallenge) return fail('no_challenge', { status: 'no_challenge' });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: { ...input.response, clientExtensionResults: input.response.clientExtensionResults ?? {} },
      expectedChallenge, // laban sa replay
      expectedOrigin: EXPECTED_ORIGIN, // laban sa phishing: ang page na tumawag ay dapat ang frontend natin
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    // Nagta-throw ang library sa karamihan ng pagpalya. Ang DAHILAN ay sa audit lang — hindi sa sagot (walang tulong sa umaatake)
    return fail(err instanceof Error ? err.message.slice(0, 200) : 'verify_error', { status: 'invalid' });
  }
  if (!verification.verified) return fail('not_verified', { status: 'invalid' });

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  try {
    const created = await db.transaction(async (tx) => {
      // Bilangin sa loob ng transaction — pero ang totoong bantay laban sa doble ay ang UNIQUE ng credential_id
      const [{ total } = { total: 0 }] = await tx.select({ total: count() }).from(passkeys).where(eq(passkeys.userId, userId));
      if (total >= MAX_PASSKEYS_PER_USER) return undefined;
      const [row] = await tx
        .insert(passkeys)
        .values({
          userId,
          credentialId: credential.id,
          publicKey: Buffer.from(credential.publicKey).toString('base64url'),
          counter: credential.counter,
          transports: credential.transports ?? null,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          name: input.name ?? 'Passkey',
        })
        .returning(publicColumns);
      return row;
    });
    if (!created) return { status: 'too_many' };
    await audit({ action: 'passkey_added', actorId: userId, targetId: userId, metadata: { passkey: created.id, deviceType: created.deviceType } });
    return { status: 'created', passkey: created };
  } catch (err) {
    if (isUniqueViolation(err)) return fail('already_registered', { status: 'already_registered' });
    throw err;
  }
}

export function listPasskeys(userId: number): Promise<PublicPasskey[]> {
  return db.select(publicColumns).from(passkeys).where(eq(passkeys.userId, userId)).orderBy(asc(passkeys.id));
}

// 🔐 IDOR (gaya ng sessions, Day 54): naka-scope sa naka-login na user. Ang passkey ng iba ay "wala", pareho ng id na wala
export async function removePasskey(userId: number, passkeyId: number, audit: Audit): Promise<boolean> {
  const removed = await db
    .delete(passkeys)
    .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
    .returning({ id: passkeys.id });
  if (removed.length === 0) return false;
  await audit({ action: 'passkey_removed', actorId: userId, targetId: userId, metadata: { passkey: passkeyId } });
  return true;
}

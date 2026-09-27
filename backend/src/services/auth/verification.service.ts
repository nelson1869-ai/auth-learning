import { and, eq, isNull } from 'drizzle-orm';
import { env } from '../../config/env.ts';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { passwordResetEmail, sendEmail, verifyEmailEmail } from '../../lib/email.ts';
import { RESET_TOKEN_TTL_MS, VERIFY_TOKEN_TTL_MS, claimVerificationToken, createVerificationToken } from '../../lib/verificationTokens.ts';

// Mga email na may link (Day 59–60) at email verification (Day 60, "soft" — D-026). Walang Express dito:
// ang controller ang nagpapasya KAILAN (hal. pagkatapos sumagot) at ang status code

// Link para i-verify ang email (pagka-register, at sa "Ipadala ulit")
export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const token = await createVerificationToken(userId, 'email_verification', VERIFY_TOKEN_TTL_MS);
  // #fragment (Day 59): hindi napupunta sa kahit anong server ang token
  await sendEmail(verifyEmailEmail(email, `${env.CLIENT_URL}/verify-email#token=${token}`));
}

// Link para palitan ang password
export async function sendPasswordResetEmail(userId: number, email: string): Promise<void> {
  const token = await createVerificationToken(userId, 'password_reset', RESET_TOKEN_TTL_MS);
  await sendEmail(passwordResetEmail(email, `${env.CLIENT_URL}/reset-password#token=${token}`));
}

// I-verify ang email gamit ang link. Hindi kailangang naka-login: puwedeng buksan ang link sa ibang device.
// LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + markahang verified
export async function verifyEmail(token: string, audit: Audit): Promise<'verified' | 'invalid'> {
  const userId = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(token, 'email_verification', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, claimed), isNull(users.emailVerifiedAt)));
    return claimed;
  });
  if (userId === undefined) return 'invalid';
  await audit({ action: 'email_verified', actorId: userId, targetId: userId });
  return 'verified';
}

// "Ipadala ulit" — ang pasya lang (ang email mismo ay ipinapadala ng controller sa background, pagkatapos sumagot)
export type ResendResult = { status: 'no_user' } | { status: 'already_verified' } | { status: 'send'; email: string };

export async function checkResendVerification(userId: number): Promise<ResendResult> {
  const [user] = await db
    .select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return { status: 'no_user' };
  if (user.emailVerifiedAt !== null) return { status: 'already_verified' };
  return { status: 'send', email: user.email };
}

import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { signAccessToken } from '../../lib/jwt.ts';
import { createRefreshToken, revokeAllSessions, type Device } from '../../lib/session.ts';
import { claimVerificationToken, isVerificationTokenUsable } from '../../lib/verificationTokens.ts';
import { sendPasswordResetEmail } from './verification.service.ts';
import { createTrustedDevice, revokeAllTrustedDevices } from '../../lib/trustedDevices.ts';
import type { changePasswordSchema, resetPasswordSchema } from '../../validations/auth.ts';

// Mga password (Day 55, 59) — business logic lang: walang req/res, walang cookies (Day 75)

// Change password (Day 55) — isang "high-risk event": dito nauuwi ang account kapag may nakanakaw
export type ChangePasswordInput = z.infer<typeof changePasswordSchema> & {
  userId: number; // mula sa requireAuth — HINDI mula sa body
  device: Device;
};
export type ChangePasswordResult =
  | { status: 'no_user' } // nabura ang account
  | { status: 'wrong_password' }
  | { status: 'changed'; accessToken: string; refreshToken: string; deviceToken: string };

export async function changePassword(input: ChangePasswordInput, audit: Audit): Promise<ChangePasswordResult> {
  const { userId } = input;
  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user) return { status: 'no_user' };

  // Reauthentication: patunayan ulit na ikaw talaga
  if (!(await argon2.verify(user.passwordHash, input.currentPassword))) {
    await audit({ action: 'password_change_failed', actorId: userId, targetId: userId });
    return { status: 'wrong_password' };
  }

  // I-hash muna BAGO ang transaction: mabagal ang argon2 (~50ms) — huwag hawakan ang koneksyon at ang lock habang naghihintay
  const passwordHash = await argon2.hash(input.newPassword);

  // LAHAT O WALA: bagong password + bawiin ang LAHAT ng session (pati ang sa magnanakaw) + bagong session para sa
  // device na ito. Kung hiwalay at pumalya sa gitna: bagong password, pero buhay pa ang session ng magnanakaw.
  // Day 64: + alisin ang tiwala ng LAHAT ng device (pati ang sa magnanakaw), at pagkatiwalaan ulit ang browser na ito
  const { refreshToken, deviceToken } = await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await revokeAllSessions(userId, tx);
    await revokeAllTrustedDevices(userId, tx);
    return {
      refreshToken: await createRefreshToken(userId, input.device, undefined, tx),
      deviceToken: await createTrustedDevice(userId, tx),
    };
  });
  // Pagkatapos ng commit lang ang audit (at ang cookies — sa controller)
  await audit({ action: 'password_changed', actorId: userId, targetId: userId });
  return { status: 'changed', accessToken: signAccessToken(userId), refreshToken, deviceToken };
}

// Password reset (Day 59) — hakbang 1: humingi ng link. Tinatawag ng controller PAGKATAPOS sumagot (sa background):
// laging parehong sagot at parehong tagal, may account man o wala (hindi malalaman kung sino ang may account)
export async function requestPasswordReset(email: string, audit: Audit): Promise<void> {
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email));
  await audit({ action: 'password_reset_requested', targetId: user?.id ?? null, metadata: { email } });
  if (!user) return;
  // Token sa #fragment, hindi sa ?query: hindi ipinapadala ng browser ang fragment sa kahit anong server —
  // kaya hindi ito lalabas sa logs ng Cloudflare Pages, sa Referer, o sa analytics
  await sendPasswordResetEmail(user.id, user.email);
}

// Password reset — hakbang 2: gamitin ang link
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordResult = { status: 'invalid' } | { status: 'reset'; deviceToken: string };

export async function resetPassword(input: ResetPasswordInput, audit: Audit): Promise<ResetPasswordResult> {
  // Mabilis na suri muna — walang argon2 para sa pekeng token (CPU abuse)
  if (!(await isVerificationTokenUsable(input.token, 'password_reset'))) return { status: 'invalid' };
  const passwordHash = await argon2.hash(input.newPassword); // BAGO ang transaction (Day 55)

  // LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + bagong password + i-logout ang LAHAT ng session.
  // Kapag sabay ang dalawang request na may parehong link: isa lang ang mananalo sa claim
  // Day 64: ang reset ang "labasan" ng biktimang naka-lock sa BAGONG device: tinatanggal ang lock ng account,
  // binabawi ang tiwala ng lahat ng device, at pinagkakatiwalaan ang browser na nag-reset (napatunayang kanya ang email)
  const done = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(input.token, 'password_reset', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, claimed));
    await revokeAllSessions(claimed, tx, 'password_reset');
    await revokeAllTrustedDevices(claimed, tx);
    return { userId: claimed, deviceToken: await createTrustedDevice(claimed, tx) };
  });
  if (done === undefined) return { status: 'invalid' };
  await audit({ action: 'password_reset', actorId: done.userId, targetId: done.userId });
  return { status: 'reset', deviceToken: done.deviceToken };
}

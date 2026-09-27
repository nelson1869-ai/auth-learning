import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { signAccessToken } from '../../lib/jwt.ts';
import { createRefreshToken, revokeAllSessions, type Device } from '../../lib/session.ts';
import { createTrustedDevice, revokeAllTrustedDevices } from '../../lib/trustedDevices.ts';
import type { changePasswordSchema } from '../../validations/auth.ts';

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

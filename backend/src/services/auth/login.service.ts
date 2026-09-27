import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { signAccessToken } from '../../lib/jwt.ts';
import { lockCounter, lockedUntilOf, MAX_FAILED_LOGINS, reserveAttempt, resetCounter, unknownEmailCounter } from '../../lib/loginLockout.ts';
import type { LockCounter } from '../../lib/loginLockout.ts';
import { createRefreshToken, type Device } from '../../lib/session.ts';
import { createTrustedDevice, findTrustedDevice } from '../../lib/trustedDevices.ts';
import type { loginSchema } from '../../validations/auth.ts';

// Login (Day 15 → 72) — business logic lang: walang req/res, walang cookies, walang status code (Day 74).
// Ang controller ang nagsasalin: invalid → 401 · locked → 423 + Retry-After · ok → 200 + cookies

// Pang-verify kapag walang account — para pareho ang tagal (~50ms) ng sagot, may account man o wala.
// Kung wala ito, mas mabilis ang 401 ng email na walang account → malalaman ng attacker kung sino ang may account (Day 72: sinukat)
const DUMMY_HASH = await argon2.hash('dummy-password-para-sa-timing');

export type LoginInput = z.infer<typeof loginSchema> & {
  deviceToken: unknown; // ang raw na device_token cookie (Day 64) — hindi pa nasusuri
  device: Device; // anong browser at IP (Day 54)
};
export type LoginResult =
  | { status: 'invalid' }
  | { status: 'locked'; retryAfterSeconds: number | null }
  | {
      status: 'ok';
      user: { id: number; email: string; name: string | null };
      accessToken: string;
      refreshToken: string;
      newDeviceToken: string | undefined; // may laman lang kung bagong browser (Day 64)
    };

export async function login(input: LoginInput, audit: Audit): Promise<LoginResult> {
  const { email, password } = input; // lowercase na ang email (Zod)
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Day 64: may valid na device cookie ba ang browser na ito PARA SA ACCOUNT NA ITO? → sariling bilang ng device.
  // Wala (bagong browser, attacker, cookie ng ibang account) → ang bilang ng account.
  // Day 71: walang account → sariling bilang din (hash ng email), para PAREHO ang sagot: 401 ×5 → 423
  const device = user ? await findTrustedDevice(input.deviceToken, user.id) : undefined;
  const counter: LockCounter = device
    ? { scope: 'device', id: device.id }
    : user
      ? { scope: 'account', id: user.id }
      : unknownEmailCounter(email);

  // 423 (Day 63): kahit TAMA ang password — hindi na sinusuri ang hula habang naka-lock.
  // Day 71: pareho ang 423 (at ang Retry-After) para sa email na walang account — hindi na nito sinasabing may account
  async function locked(): Promise<LoginResult> {
    await audit({ action: 'login_failed', targetId: user?.id ?? null, metadata: { email, reason: 'locked', scope: counter.scope } });
    const until = await lockedUntilOf(counter);
    return { status: 'locked', retryAfterSeconds: until ? Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000)) : null };
  }

  // Day 67 — RESERVE-THEN-VERIFY: kunin muna ang numero ng subok (atomic, sa database), BAGO ang argon2
  const attempt = await reserveAttempt(counter);
  if (attempt === null) return locked(); // naka-lock na
  if (attempt > MAX_FAILED_LOGINS) {
    // Sabay-sabay na hula na lampas sa 5: hindi na sinusuri ang password. Siguraduhing naka-lock
    // (kung sakaling pumalya ang request na dapat mag-lock)
    if (await lockCounter(counter)) {
      await audit({ action: 'account_locked', targetId: user?.id ?? null, metadata: { email, attempts: attempt, scope: counter.scope } });
    }
    return locked();
  }

  // Laging may verify — totoong hash kung may user, DUMMY_HASH kung wala
  const ok = await argon2.verify(user ? user.passwordHash : DUMMY_HASH, password);
  if (!user || !ok) {
    // Audit (Day 48): target = ang account na sinubukang pasukin (kung mayroon), at ang email na tinype.
    // Itinatala sa DALAWANG kaso (may account o wala) — kaya pareho pa rin ang tagal ng sagot
    await audit({ action: 'login_failed', targetId: user?.id ?? null, metadata: { email } });
    // Ang ika-5 maling hula ang nagla-lock (isang beses lang ang audit, kahit sabay)
    if (attempt >= MAX_FAILED_LOGINS && (await lockCounter(counter))) {
      await audit({ action: 'account_locked', targetId: user?.id ?? null, metadata: { email, attempts: attempt, scope: counter.scope } });
    }
    // Iisang sagot para sa maling email AT maling password — hindi sinasabi kung may account
    return { status: 'invalid' };
  }

  // Tamang password → balik sa 0 ang bilang na ginamit (sunod-sunod na mali lang ang binibilang, hindi ang kabuuan)
  await resetCounter(counter);

  // Day 68 — LAHAT NG PAGSULAT MUNA (iisang transaction), saka ang cookies (sa controller, pagkatapos bumalik ito).
  // Dati: naka-set na ang `token` cookie BAGO i-save ang refresh token → 500 pero naka-login (nahuli ng transactions.test.ts)
  const { refreshToken, newDeviceToken } = await db.transaction(async (tx) => ({
    // Dalawang token (Day 51): maikling access token (JWT, 15 min, walang row) + mahabang refresh token (7 araw, nasa DB)
    refreshToken: await createRefreshToken(user.id, input.device, undefined, tx),
    // Day 64: nakapag-login nang tama mula sa browser na ito → pagkakatiwalaan na ito (sariling bilang sa susunod)
    newDeviceToken: device ? undefined : await createTrustedDevice(user.id, tx),
  }));
  await audit({ action: 'login', actorId: user.id, targetId: user.id });

  // Piling field lang — hindi kasama ang passwordHash
  return {
    status: 'ok',
    user: { id: user.id, email: user.email, name: user.name },
    accessToken: signAccessToken(user.id),
    refreshToken,
    newDeviceToken,
  };
}

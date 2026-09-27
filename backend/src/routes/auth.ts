import { Router } from 'express';
import type { RequestHandler } from 'express';
import argon2 from 'argon2';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/auth.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { audit } from '../lib/audit.ts';
import { revokeAllSessions } from '../lib/session.ts';
import {
  changePasswordLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimiter.ts';
import { createTrustedDevice, DEVICE_COOKIE, revokeAllTrustedDevices } from '../lib/trustedDevices.ts';
import { runInBackground } from '../lib/background.ts';
import { claimVerificationToken, isVerificationTokenUsable } from '../lib/verificationTokens.ts';
import { changePassword, login, logout, me, refresh, register, revokeSessionById, sessions } from '../controllers/auth.controller.ts';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/auth/verification.service.ts';
import { DEVICE_COOKIE_OPTIONS } from '../controllers/http.ts';

const router = Router();

// Walang limiter sa tests (undefined) — pass-through na middleware
const pass: RequestHandler = (_req, _res, next) => next();

// 🔐 Walang cache sa kahit anong sagot ng auth (user data, login, cookies) — hindi dapat itago
// ng browser o ng CDN; kung hindi, puwedeng makita ng susunod na gumamit ang data ng iba
router.use('/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/auth/register', registerLimiter ?? pass, register);

router.post('/auth/login', loginLimiter ?? pass, login);

router.get('/auth/me', requireAuth, me);

router.post('/auth/refresh', refresh);
// Walang requireAuth: laging gumagana ang logout, kahit expired na ang access token
router.post('/auth/logout', logout);

// ---------------------------------------------------------------------------------------------
// Mga device ko (Day 54)

router.get('/auth/sessions', requireAuth, sessions);
// 🔐 IDOR: tingnan ang controller at ang session.service (404 sa session na hindi iyo)
router.delete('/auth/sessions/:id', requireAuth, revokeSessionById);

// ---------------------------------------------------------------------------------------------
// Change password (Day 55) — isang "high-risk event": dito nauuwi ang account kapag may nakanakaw
router.post('/auth/change-password', requireAuth, changePasswordLimiter ?? pass, changePassword);

// ---------------------------------------------------------------------------------------------
// Password reset (Day 59)

// POST /api/auth/forgot-password { email } — LAGING parehong sagot, may account man o wala (hindi malalaman
// ng attacker kung sino ang may account). Sumasagot MUNA, tapos saka hinahanap ang account at nagpapadala ng
// email — kung hindi, mas matagal ang sagot kapag may account (database + Resend), at iyon ang magsasabi
router.post('/auth/forgot-password', forgotPasswordLimiter ?? pass, async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  const { email } = result.data;
  res.status(202).json({ message: 'If an account exists for that email, a reset link has been sent.' });

  runInBackground('password_reset_email', async () => {
    const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email));
    await audit(req, { action: 'password_reset_requested', targetId: user?.id ?? null, metadata: { email } });
    if (!user) return;
    // Token sa #fragment, hindi sa ?query: hindi ipinapadala ng browser ang fragment sa kahit anong server —
    // kaya hindi ito lalabas sa logs ng Cloudflare Pages, sa Referer, o sa analytics
    await sendPasswordResetEmail(user.id, user.email);
  });
});

// POST /api/auth/reset-password { token, newPassword }
router.post('/auth/reset-password', async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  const { token, newPassword } = result.data;
  const invalid = () => res.status(400).json({ error: 'This reset link is invalid or has expired' });

  // Mabilis na suri muna — walang argon2 para sa pekeng token (CPU abuse)
  if (!(await isVerificationTokenUsable(token, 'password_reset'))) return invalid();
  const passwordHash = await argon2.hash(newPassword); // BAGO ang transaction (Day 55)

  // LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + bagong password + i-logout ang LAHAT ng session.
  // Kapag sabay ang dalawang request na may parehong link: isa lang ang mananalo sa claim
  // Day 64: ang reset ang "labasan" ng biktimang naka-lock sa BAGONG device: tinatanggal ang lock ng account,
  // binabawi ang tiwala ng lahat ng device, at pinagkakatiwalaan ang browser na nag-reset (napatunayang kanya ang email)
  const done = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(token, 'password_reset', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, claimed));
    await revokeAllSessions(claimed, tx, 'password_reset');
    await revokeAllTrustedDevices(claimed, tx);
    return { userId: claimed, deviceToken: await createTrustedDevice(claimed, tx) };
  });
  if (done === undefined) return invalid();
  const { userId } = done;

  res.cookie(DEVICE_COOKIE, done.deviceToken, DEVICE_COOKIE_OPTIONS);
  await audit(req, { action: 'password_reset', actorId: userId, targetId: userId });
  res.status(204).end(); // walang auto-login: mag-login gamit ang bagong password
});

// ---------------------------------------------------------------------------------------------
// Email verification (Day 60) — "soft": makakapag-login pa rin ang hindi pa verified (D-026)


// POST /api/auth/verify-email { token } — hindi kailangang naka-login: puwedeng buksan ang link sa ibang device
router.post('/auth/verify-email', async (req, res) => {
  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  // LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + markahang verified
  const userId = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(result.data.token, 'email_verification', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, claimed), isNull(users.emailVerifiedAt)));
    return claimed;
  });
  if (userId === undefined) return res.status(400).json({ error: 'This verification link is invalid or has expired' });
  await audit(req, { action: 'email_verified', actorId: userId, targetId: userId });
  res.status(204).end();
});

// POST /api/auth/resend-verification — naka-login; bagong link (ang luma ay mawawalan ng bisa)
router.post('/auth/resend-verification', requireAuth, resendVerificationLimiter ?? pass, async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) return res.status(401).json({ error: 'Not authenticated' });
  const [user] = await db
    .select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.emailVerifiedAt !== null) return res.status(409).json({ error: 'Email is already verified' });
  res.status(202).json({ message: 'A new verification link has been sent.' });
  runInBackground('verify_email', () => sendVerificationEmail(userId, user.email));
});

export default router;


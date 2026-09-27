import { Router } from 'express';
import type { RequestHandler } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { verifyEmailSchema } from '../validations/auth.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { audit } from '../lib/audit.ts';
import {
  changePasswordLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimiter.ts';
import { runInBackground } from '../lib/background.ts';
import { claimVerificationToken } from '../lib/verificationTokens.ts';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  revokeSessionById,
  sessions,
} from '../controllers/auth.controller.ts';
import { sendVerificationEmail } from '../services/auth/verification.service.ts';

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

router.post('/auth/forgot-password', forgotPasswordLimiter ?? pass, forgotPassword);
router.post('/auth/reset-password', resetPassword);

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


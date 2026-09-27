import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../middleware/requireAuth.ts';
import {
  changePasswordLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimiter.ts';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerification,
  resetPassword,
  revokeSessionById,
  sessions,
  verifyEmail,
} from '../controllers/auth.controller.ts';

// /api/auth/* — ROUTING LANG (Day 76): aling URL → aling middleware (rate limit, requireAuth) → aling controller.
// Ang HTTP (input, status, cookies) ay nasa controllers/auth.controller.ts; ang logic ay nasa services/auth/*
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

// Mga device ko (Day 54) — 🔐 IDOR: 404 sa session na hindi iyo (tingnan ang controller at session.service)
router.get('/auth/sessions', requireAuth, sessions);
router.delete('/auth/sessions/:id', requireAuth, revokeSessionById);

// Change password (Day 55) — isang "high-risk event": dito nauuwi ang account kapag may nakanakaw
router.post('/auth/change-password', requireAuth, changePasswordLimiter ?? pass, changePassword);

// Password reset (Day 59) — hindi kailangang naka-login
router.post('/auth/forgot-password', forgotPasswordLimiter ?? pass, forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Email verification (Day 60) — "soft": makakapag-login pa rin ang hindi pa verified (D-026).
// Hindi kailangang naka-login ang verify: puwedeng buksan ang link sa ibang device
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/resend-verification', requireAuth, resendVerificationLimiter ?? pass, resendVerification);

export default router;

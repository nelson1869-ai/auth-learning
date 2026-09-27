import type { RequestHandler } from 'express';
import { z } from 'zod';
import { auditFor } from '../lib/audit.ts';
import { runInBackground } from '../lib/background.ts';
import { DEVICE_COOKIE } from '../lib/trustedDevices.ts';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/auth.ts';
import { login as loginService } from '../services/auth/login.service.ts';
import { changePassword as changePasswordService, requestPasswordReset, resetPassword as resetPasswordService } from '../services/auth/password.service.ts';
import { registerUser } from '../services/auth/registration.service.ts';
import { getMe, listMySessions, logout as logoutService, refreshSession, revokeMySession } from '../services/auth/session.service.ts';
import { checkResendVerification, sendVerificationEmail, verifyEmail as verifyEmailService } from '../services/auth/verification.service.ts';
import { clearSessionCookies, deviceOf, parseOr400, setAccessCookie, setDeviceCookie, setRefreshCookie } from './http.ts';

// Auth controllers (Day 74) — HTTP LANG: suriin ang input → tawagin ang service → isalin ang resulta sa status, body at cookies.
// Walang SQL, walang argon2, walang patakaran ng negosyo dito — nasa services/auth/* ang mga iyon

export const register: RequestHandler = async (req, res) => {
  // Suriin at linisin ang input BAGO gamitin — maling input = 400, hindi 500
  const input = parseOr400(registerSchema, req.body, res);
  if (!input) return;
  const result = await registerUser(input, auditFor(req));
  if (result.status === 'email_taken') {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  res.status(201).json({ user: result.user });
  // Day 60: email na may verification link — PAGKATAPOS sumagot (hindi naghihintay ang register sa Resend)
  runInBackground('verify_email', () => sendVerificationEmail(result.user.id, result.user.email));
};

export const login: RequestHandler = async (req, res) => {
  const input = parseOr400(loginSchema, req.body, res);
  if (!input) return;
  const result = await loginService(
    // Server-derived na mga field sa HULI — hindi ito mapapalitan ng body (Day 77: mass assignment)
    { ...input, deviceToken: req.cookies[DEVICE_COOKIE], device: deviceOf(req) },
    auditFor(req),
  );
  if (result.status === 'invalid') {
    // Iisang mensahe para sa maling email AT maling password — hindi sinasabi kung may account
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (result.status === 'locked') {
    if (result.retryAfterSeconds !== null) res.setHeader('Retry-After', String(result.retryAfterSeconds));
    res.status(423).json({ error: 'Account temporarily locked. Please try again later.' });
    return;
  }
  // Nai-commit na ng service ang lahat — ngayon lang ang cookies (Day 68)
  setAccessCookie(res, result.accessToken);
  setRefreshCookie(res, result.refreshToken);
  if (result.newDeviceToken) setDeviceCookie(res, result.newDeviceToken);
  res.json({ user: result.user });
};

// requireAuth muna sa route: kung walang tamang token, hindi na aabot dito (401)
export const me: RequestHandler = async (req, res) => {
  // Nilagay ng requireAuth — pero `number | undefined` ang type, kaya suriin (walang `!` na hula)
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = await getMe(userId);
  if (!user) {
    // tama ang token, pero nabura na ang user
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user });
};

// GET /api/auth/sessions — ang refresh_token cookie ay ipinapadala rito dahil /api/auth ang path nito
export const sessions: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ sessions: await listMySessions(userId, req.cookies.refresh_token) });
};

// DELETE /api/auth/sessions/:id — 404 (hindi 403) sa session ng ibang user, sa id na wala, at sa id na hindi UUID
const sessionIdSchema = z.uuid();
export const revokeSessionById: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  // Hindi UUID → hindi na tinatanong ang database (kung hindi: error ng Postgres sa maling uuid → 500)
  const parsed = sessionIdSchema.safeParse(req.params.id);
  const result = parsed.success ? await revokeMySession(userId, parsed.data, req.cookies.refresh_token, auditFor(req)) : undefined;
  if (!result || result.status === 'not_found') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  // Kung ang device na ito mismo ang ni-logout — burahin din ang mga cookie nito
  if (result.wasCurrent) clearSessionCookies(res);
  res.status(204).end();
};

// POST /api/auth/refresh — tinatawag ng frontend kapag 401 ang isang request.
// Walang body — ang refresh_token cookie lang (Path=/api/auth, kaya dito lang ito ipinapadala)
export const refresh: RequestHandler = async (req, res) => {
  const result = await refreshSession(req.cookies.refresh_token, deviceOf(req), auditFor(req));
  if (result.status === 'rotated') {
    setAccessCookie(res, result.accessToken);
    setRefreshCookie(res, result.refreshToken);
    res.status(204).end();
    return;
  }
  if (result.status === 'grace') {
    // Ang bagong refresh token ay nasa cookie na mula sa unang request — HINDI ginagalaw ang refresh_token cookie
    setAccessCookie(res, result.accessToken);
    res.status(204).end();
    return;
  }
  if (result.status === 'reused') {
    // Security event: sa logs (Day 42, kasama ang requestId) — ang audit ay itinala na ng service (Day 48)
    req.log.warn({ event: 'refresh_reuse', userId: result.userId }, 'Refresh token reuse — family revoked');
  }
  // Wala, binawi, expired, pekeng token, o nakaw — burahin ang mga cookie para hindi na subukan ulit ng browser
  clearSessionCookies(res);
  res.status(401).json({ error: 'Not authenticated' });
};

// POST /api/auth/logout — walang requireAuth: laging gumagana, kahit expired na ang access token
export const logout: RequestHandler = async (req, res) => {
  await logoutService(req.cookies.refresh_token, req.cookies.token, auditFor(req));
  clearSessionCookies(res); // pareho ng access at refresh (Day 51)
  res.status(204).end(); // 204 = nagawa, walang body
};

// POST /api/auth/change-password (requireAuth + rate limit sa route)
export const changePassword: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const input = parseOr400(changePasswordSchema, req.body, res);
  if (!input) return;
  // Server-derived na mga field sa HULI — hindi mapapalitan ng body ang userId (Day 77: mass assignment)
  const result = await changePasswordService({ ...input, userId, device: deviceOf(req) }, auditFor(req));
  if (result.status === 'no_user') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (result.status === 'wrong_password') {
    // 400 (hindi 401): hindi ito "hindi ka naka-login" — at ang 401 ay magpapa-refresh at magpapaulit ng request
    // sa frontend (apiFetch), dodoble ang bilang ng subok
    res.status(400).json({ error: 'Invalid input', fields: { currentPassword: ['Incorrect password'] } });
    return;
  }
  // Nai-commit na — ngayon lang ang cookies (kung nag-rollback, walang dapat maipadala)
  setAccessCookie(res, result.accessToken);
  setRefreshCookie(res, result.refreshToken);
  setDeviceCookie(res, result.deviceToken);
  res.status(204).end();
};

// POST /api/auth/forgot-password { email } — LAGING parehong sagot, may account man o wala.
// Sumasagot MUNA, tapos saka ang lahat (sa background) — kung hindi, mas matagal ang sagot kapag may account
// (database + Resend), at iyon ang magsasabi. Ang pagkakasunod na ito ay HTTP, kaya nasa controller
export const forgotPassword: RequestHandler = async (req, res) => {
  const input = parseOr400(forgotPasswordSchema, req.body, res);
  if (!input) return;
  res.status(202).json({ message: 'If an account exists for that email, a reset link has been sent.' });
  const audit = auditFor(req); // basahin ang req NGAYON (hindi sa loob ng background task)
  runInBackground('password_reset_email', () => requestPasswordReset(input.email, audit));
};

// POST /api/auth/reset-password { token, newPassword }
export const resetPassword: RequestHandler = async (req, res) => {
  const input = parseOr400(resetPasswordSchema, req.body, res);
  if (!input) return;
  const result = await resetPasswordService(input, auditFor(req));
  if (result.status === 'invalid') {
    res.status(400).json({ error: 'This reset link is invalid or has expired' });
    return;
  }
  // Nai-commit na: pagkatiwalaan ang browser na ito (Day 64)
  setDeviceCookie(res, result.deviceToken);
  res.status(204).end(); // walang auto-login: mag-login gamit ang bagong password
};

// POST /api/auth/verify-email { token } — hindi kailangang naka-login
export const verifyEmail: RequestHandler = async (req, res) => {
  const input = parseOr400(verifyEmailSchema, req.body, res);
  if (!input) return;
  if ((await verifyEmailService(input.token, auditFor(req))) === 'invalid') {
    res.status(400).json({ error: 'This verification link is invalid or has expired' });
    return;
  }
  res.status(204).end();
};

// POST /api/auth/resend-verification — naka-login (requireAuth + rate limit sa route); bagong link, ang luma ay mawawalan ng bisa
export const resendVerification: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const result = await checkResendVerification(userId);
  if (result.status === 'no_user') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (result.status === 'already_verified') {
    res.status(409).json({ error: 'Email is already verified' });
    return;
  }
  res.status(202).json({ message: 'A new verification link has been sent.' });
  runInBackground('verify_email', () => sendVerificationEmail(userId, result.email));
};

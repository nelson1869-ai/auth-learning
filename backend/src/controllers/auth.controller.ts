import type { RequestHandler } from 'express';
import { z } from 'zod';
import { auditFor } from '../lib/audit.ts';
import { runInBackground } from '../lib/background.ts';
import { DEVICE_COOKIE } from '../lib/trustedDevices.ts';
import { loginSchema, registerSchema } from '../validations/auth.ts';
import { login as loginService } from '../services/auth/login.service.ts';
import { registerUser } from '../services/auth/registration.service.ts';
import { getMe, listMySessions, revokeMySession } from '../services/auth/session.service.ts';
import { sendVerificationEmail } from '../services/auth/verification.service.ts';
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

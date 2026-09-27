import type { RequestHandler } from 'express';
import { auditFor } from '../lib/audit.ts';
import { runInBackground } from '../lib/background.ts';
import { DEVICE_COOKIE } from '../lib/trustedDevices.ts';
import { loginSchema, registerSchema } from '../validations/auth.ts';
import { login as loginService } from '../services/auth/login.service.ts';
import { registerUser } from '../services/auth/registration.service.ts';
import { sendVerificationEmail } from '../services/auth/verification.service.ts';
import { deviceOf, parseOr400, setAccessCookie, setDeviceCookie, setRefreshCookie } from './http.ts';

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

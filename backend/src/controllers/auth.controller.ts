import type { RequestHandler } from 'express';
import { auditFor } from '../lib/audit.ts';
import { runInBackground } from '../lib/background.ts';
import { registerSchema } from '../validations/auth.ts';
import { registerUser } from '../services/auth/registration.service.ts';
import { sendVerificationEmail } from '../services/auth/verification.service.ts';
import { parseOr400 } from './http.ts';

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

import type { RequestHandler } from 'express';
import { z } from 'zod';
import { auditFor } from '../lib/audit.ts';
import { finishPasskeyRegistration, listPasskeys, removePasskey, startPasskeyRegistration } from '../services/auth/passkey.service.ts';
import { passkeyRegisterOptionsSchema, passkeyRegisterVerifySchema } from '../validations/auth.ts';
import { parseOr400 } from './http.ts';

// Passkey controllers (Day 95–96) — HTTP lang. requireAuth muna sa lahat ng route na ito (routes/auth.ts)

// POST /api/auth/passkeys/register/options — hakbang 1: password → options (challenge atbp.) para sa browser
export const passkeyRegisterOptions: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const input = parseOr400(passkeyRegisterOptionsSchema, req.body, res);
  if (!input) return;
  const result = await startPasskeyRegistration(userId, input.currentPassword, auditFor(req));
  if (result.status === 'no_user') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (result.status === 'wrong_password') {
    // 400 (hindi 401), gaya ng change password: ang 401 ay magpapa-refresh at magpapaulit ng request sa frontend
    res.status(400).json({ error: 'Invalid input', fields: { currentPassword: ['Incorrect password'] } });
    return;
  }
  if (result.status === 'too_many') {
    res.status(409).json({ error: 'Passkey limit reached. Remove one first.' });
    return;
  }
  res.json(result.options);
};

// POST /api/auth/passkeys/register/verify — hakbang 2: ang sagot ng device → suriin → i-save ang public key
export const passkeyRegisterVerify: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const input = parseOr400(passkeyRegisterVerifySchema, req.body, res);
  if (!input) return;
  // Server-derived na field sa HULI — hindi mapapalitan ng body ang userId (Day 77)
  const result = await finishPasskeyRegistration({ ...input, userId }, auditFor(req));
  if (result.status === 'created') {
    res.status(201).json({ passkey: result.passkey });
    return;
  }
  if (result.status === 'already_registered') {
    res.status(409).json({ error: 'This passkey is already registered' });
    return;
  }
  if (result.status === 'too_many') {
    res.status(409).json({ error: 'Passkey limit reached. Remove one first.' });
    return;
  }
  // no_challenge at invalid: IISANG sagot. Hindi sinasabi kung alin ang mali (challenge? origin? pirma?) — nasa audit log iyon
  res.status(400).json({ error: 'Passkey registration failed. Please try again.' });
};

// GET /api/auth/passkeys
export const passkeysList: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ passkeys: await listPasskeys(userId) });
};

// DELETE /api/auth/passkeys/:id — 404 sa passkey ng ibang user, sa id na wala, at sa id na hindi numero
const passkeyIdSchema = z.coerce.number().int().positive().max(2_147_483_647);
export const passkeyRemove: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const parsed = passkeyIdSchema.safeParse(req.params.id);
  if (!parsed.success || !(await removePasskey(userId, parsed.data, auditFor(req)))) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).end();
};

import { z } from 'zod';
import { AUDIT_ACTIONS } from '../db/schema.ts';

// Ang HUGIS NG MGA SAGOT ng API (Day 78) — ang kapares ng mga input schema sa auth.ts/pagination.ts.
// Ginagamit sa dalawang lugar, kaya hindi puwedeng magkaiba ang docs at ang code:
//   1. openapi/document.ts — ang OpenAPI spec (Swagger UI, at ang mga type ng frontend)
//   2. openapi/contract.test.ts — sinusuri ang TOTOONG mga sagot laban dito
// `z.strictObject`: kapag may lumabas na field na wala rito (hal. passwordHash), babagsak ang contract test

export const errorResponse = z.strictObject({
  error: z.string(),
  fields: z.record(z.string(), z.array(z.string())).optional(), // 400 mula sa Zod: mensahe bawat field
  requestId: z.string().optional(), // 500 lang: ang "reference number" para sa logs (Day 41)
});
export const messageResponse = z.strictObject({ message: z.string() });

const role = z.enum(['user', 'admin']);

// Ang user sa register at login — piling field lang, walang password_hash
export const publicUser = z.strictObject({ id: z.int(), email: z.string(), name: z.string().nullable() });
export const userResponse = z.strictObject({ user: publicUser });

// /me: + role (Day 49) at emailVerified (Day 60)
export const meUser = z.strictObject({
  id: z.int(),
  email: z.string(),
  name: z.string().nullable(),
  role,
  emailVerified: z.boolean(),
});
export const meResponse = z.strictObject({ user: meUser });

// Mga device ko (Day 54). JSON ay walang Date type — ISO string
export const session = z.strictObject({
  id: z.uuid(),
  userAgent: z.string().nullable(),
  ip: z.string().nullable(),
  lastUsedAt: z.iso.datetime(),
  since: z.iso.datetime(),
  current: z.boolean(),
});
export const sessionsResponse = z.strictObject({ sessions: z.array(session) });

// Admin (Day 47–48): isang page + ang kabuuang bilang
const pageInfo = { page: z.int(), limit: z.int(), total: z.int(), totalPages: z.int() };
export const adminUser = z.strictObject({
  id: z.int(),
  email: z.string(),
  name: z.string().nullable(),
  role,
  createdAt: z.iso.datetime(),
});
export const adminUsersResponse = z.strictObject({ users: z.array(adminUser), ...pageInfo });
export const auditLog = z.strictObject({
  id: z.int(),
  action: z.enum(AUDIT_ACTIONS),
  actorId: z.int().nullable(),
  actorEmail: z.string().nullable(),
  targetId: z.int().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.iso.datetime(),
});
export const auditLogsResponse = z.strictObject({ logs: z.array(auditLog), ...pageInfo });

export const healthResponse = z.strictObject({ status: z.literal('ok'), time: z.iso.datetime() });
export const countResponse = z.strictObject({ count: z.int() });
export const echoResponse = z.strictObject({ received: z.unknown() });

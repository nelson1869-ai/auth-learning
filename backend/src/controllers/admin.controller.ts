import type { RequestHandler } from 'express';
import { auditFor } from '../lib/audit.ts';
import { paginationSchema } from '../validations/pagination.ts';
import { adminListAuditLogs, adminListUsers } from '../services/admin.service.ts';
import { parseOr400 } from './http.ts';

// Admin controllers (Day 76) — HTTP lang: suriin ang ?page&limit → tawagin ang service → JSON.
// Nakarating lang dito kung naka-login AT admin (requireAuth + requireRole sa route)

// GET /api/admin/users?page=1&limit=20
export const listUsers: RequestHandler = async (req, res) => {
  const pagination = parseOr400(paginationSchema, req.query, res);
  if (!pagination) return;
  res.json(await adminListUsers(pagination, req.userId, auditFor(req)));
};

// GET /api/admin/audit-logs?page=1&limit=20 (Day 48)
export const listAuditLogs: RequestHandler = async (req, res) => {
  const pagination = parseOr400(paginationSchema, req.query, res);
  if (!pagination) return;
  res.json(await adminListAuditLogs(pagination, req.userId, auditFor(req)));
};

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.ts';
import { requireRole } from '../middleware/requireRole.ts';
import { listAuditLogs, listUsers } from '../controllers/admin.controller.ts';

// /api/admin/* — ROUTING LANG (Day 76). Ang logic ay nasa services/admin.service.ts
const router = Router();

// LAHAT ng /api/admin/* ay dumadaan dito muna: sino ka (401) → admin ka ba (403).
// Isang lugar lang — hindi makakalimutan sa bagong admin route
router.use('/admin', requireAuth, requireRole('admin'));

router.get('/admin/users', listUsers);
router.get('/admin/audit-logs', listAuditLogs); // Day 48

export default router;

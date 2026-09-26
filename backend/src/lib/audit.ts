import type { Request } from 'express';
import { db } from '../db/index.ts';
import { auditLogs, type AuditAction } from '../db/schema.ts';
import { env } from '../config/env.ts';
import { clientIp } from './clientIp.ts';
import { logger } from './logger.ts';

type AuditEvent = {
  action: AuditAction;
  actorId?: number | null; // sino ang gumawa (null = hindi kilala)
  targetId?: number | null; // sino/ano ang naapektuhan
  metadata?: Record<string, unknown>; // 🔐 walang password, token, o cookie
};

// Itala sa audit_logs (Day 48). Ang IP at user agent ay galing sa request.
// Kapag pumalya ang pagtatala (hal. saglit na problema sa database), HINDI ibinabagsak ang request ng user
// (tulad ng reference) — pero itinatala ito bilang ERROR sa logs, para makita na may nawawalang talaan
export async function audit(req: Request, event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: event.action,
      actorId: event.actorId ?? null,
      targetId: event.targetId ?? null,
      ip: clientIp(req, env.TRUST_CLOUDFLARE),
      // Galing sa client ang user agent — kayang magpadala ng napakahaba. Putulin para hindi lumaki ang table
      userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
      metadata: event.metadata ?? null,
    });
  } catch (err) {
    (req.log ?? logger).error({ err, event: 'audit_failed', action: event.action }, 'Audit log write failed');
  }
}

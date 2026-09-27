import type { Request } from 'express';
import { db } from '../db/index.ts';
import { auditLogs, type AuditAction } from '../db/schema.ts';
import { env } from '../config/env.ts';
import { clientIp } from './clientIp.ts';
import { logger } from './logger.ts';

export type AuditEvent = {
  action: AuditAction;
  actorId?: number | null; // sino ang gumawa (null = hindi kilala)
  targetId?: number | null; // sino/ano ang naapektuhan
  metadata?: Record<string, unknown>; // 🔐 walang password, token, o cookie
};

// Saan galing ang request — PLAIN na data, hindi `req` (Day 74). Kaya ang mga service ay walang alam sa Express
export type AuditSource = { ip: string | null; userAgent: string | null };
// Ang ibinibigay ng controller sa service: "itala ito", nakakabit na ang IP at user agent
export type Audit = (event: AuditEvent) => Promise<void>;

// Itala sa audit_logs (Day 48).
// Kapag pumalya ang pagtatala (hal. saglit na problema sa database), HINDI ibinabagsak ang request ng user
// (tulad ng reference) — pero itinatala ito bilang ERROR sa logs, para makita na may nawawalang talaan
export async function writeAudit(source: AuditSource, event: AuditEvent, log: Pick<typeof logger, 'error'> = logger): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: event.action,
      actorId: event.actorId ?? null,
      targetId: event.targetId ?? null,
      ip: source.ip,
      userAgent: source.userAgent,
      metadata: event.metadata ?? null,
    });
  } catch (err) {
    log.error({ err, event: 'audit_failed', action: event.action }, 'Audit log write failed');
  }
}

// Ang "adapter" sa pagitan ng HTTP at ng service (Day 74): dito LANG binabasa ang `req`.
// Ang controller ay tumatawag ng `auditFor(req)` at ipinapasa ang resulta sa service
export function auditFor(req: Request): Audit {
  const source: AuditSource = {
    ip: clientIp(req, env.TRUST_CLOUDFLARE),
    // Galing sa client ang user agent — kayang magpadala ng napakahaba. Putulin para hindi lumaki ang table
    userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
  };
  return (event) => writeAudit(source, event, req.log ?? logger);
}

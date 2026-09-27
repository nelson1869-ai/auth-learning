import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import type { Audit } from '../lib/audit.ts';
import type { Pagination } from '../validations/pagination.ts';

// Admin (Day 46–48) — business logic lang: walang req/res (Day 76). Ang proteksyon (401 → 403) ay nasa route:
// requireAuth + requireRole('admin'), para sa LAHAT ng /api/admin/*

// Ang `db` mismo, o isang transaction (ginagamit ng test para nakapirmi ang data)
type Reader = Pick<typeof db, 'select' | '$count'>;

// Isang page ng users + ang kabuuang bilang (Day 47)
export async function listUsers(database: Reader, { page, limit }: Pagination) {
  const [list, total] = await Promise.all([
    database
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
      .from(users)
      // Pinakabago muna. Laging iisang ayos (id ay natatangi) — kung wala, puwedeng magpalit ang ayos
      // sa pagitan ng mga page at may lalaktawan o uulitin
      .orderBy(desc(users.id))
      .limit(limit)
      .offset((page - 1) * limit), // page 1 → laktawan ang 0 · page 2 → laktawan ang 20 ...
    database.$count(users),
  ]);
  return { users: list, page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Isang page ng audit log (Day 48), pinakabago muna. May email ng gumawa (LEFT JOIN: kahit walang actor
// o nabura na ang user, kasama pa rin ang row — null lang ang email)
export async function listAuditLogs(database: Reader, { page, limit }: Pagination) {
  const [logs, total] = await Promise.all([
    database
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorId: auditLogs.actorId,
        actorEmail: users.email,
        targetId: auditLogs.targetId,
        ip: auditLogs.ip,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .orderBy(desc(auditLogs.id))
      .limit(limit)
      .offset((page - 1) * limit),
    database.$count(auditLogs),
  ]);
  return { logs, page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Ang ginagawa ng admin page: itala MUNA kung sino ang tumingin, saka ibigay ang listahan
// Admin action = itala kung sino ang tumingin sa listahan ng users (may personal na data)
export async function adminListUsers(pagination: Pagination, adminId: number | undefined, audit: Audit) {
  await audit({ action: 'admin_list_users', actorId: adminId, metadata: pagination });
  return listUsers(db, pagination);
}

// Pati ang pagtingin sa audit log ay itinatala ("sino ang nagbabantay sa mga bantay?")
export async function adminListAuditLogs(pagination: Pagination, adminId: number | undefined, audit: Audit) {
  await audit({ action: 'admin_list_audit_logs', actorId: adminId, metadata: pagination });
  return listAuditLogs(db, pagination);
}

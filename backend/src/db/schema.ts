import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Mga role (Day 45) — enum sa Postgres: TUMATANGGI ang database sa ibang value (hal. 'superadmin' o 'Admin'),
// hindi lang ang app. Tatlong role ang reference; dalawa lang ang kailangan natin ngayon
export const roleEnum = pgEnum('user_role', ['user', 'admin']);

// Hugis ng `users` table — dapat tugma sa CREATE TABLE ng Day 09
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  // Hash lang ang naka-save, hindi kailanman ang password mismo (Day 12)
  passwordHash: text('password_hash').notNull(),
  // Default 'user': ang bawat bagong account (at ang mga dati na) ay user. Hindi ito kailanman
  // galing sa request — script lang ang nagtatakda ng admin (src/db/set-role.ts)
  role: roleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Ang type ng isang row, galing mismo sa schema — hindi na kailangang isulat nang dalawang beses
export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number]; // 'user' | 'admin'

// Audit log (Day 48) — talaan ng mahahalagang pangyayari: SINO, ANO, KANINO, SAAN, KAILAN.
// Para sa imbestigasyon ("sino ang nag-login sa account ko kagabi?"), hindi para sa debugging (iyon ang Pino logs).
// Text + TypeScript type ang `action`, hindi enum sa Postgres: madalas madagdagan ang mga action,
// at ayaw nating kailanganin ang migration bawat bago. Ang TypeScript ang bantay laban sa typo
export const AUDIT_ACTIONS = [
  'register',
  'login',
  'login_failed',
  'logout',
  'access_denied', // 403 — may naka-login na sumubok pumasok sa hindi niya puwede
  'admin_list_users',
  'admin_list_audit_logs',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    // Ang gumawa. NULL kapag hindi kilala (hal. maling login) o nabura na ang user — nananatili ang talaan
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').$type<AuditAction>().notNull(),
    // Ang naapektuhan (hal. ang account na sinubukang pasukin). Walang foreign key: manatili kahit mabura
    targetId: integer('target_id'),
    ip: text('ip'), // totoong IP ng client (lib/clientIp.ts), hindi ang cloudflared container
    userAgent: text('user_agent'),
    // Dagdag na detalye (hal. { page, limit }). 🔐 Kailanman: walang password, token, o cookie
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // Index: mabilis ang "pinakabago muna" at ang "lahat ng ginawa ng user X"
  (table) => [index('audit_logs_created_at_idx').on(table.createdAt), index('audit_logs_actor_id_idx').on(table.actorId)],
);

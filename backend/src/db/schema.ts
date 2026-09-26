import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  'refresh_reuse', // Day 52 — ginamit ulit ang lumang refresh token: posibleng nakaw → binawi ang buong family
  'session_revoked', // Day 54 — nag-logout ng isang device mula sa "Mga device ko"
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

// Refresh tokens (Day 51) — ang "mahabang" session. Ang access token (JWT, 15 min) ay hindi naka-save;
// ang refresh token (7 araw) ay naka-save, kaya KAYANG bawiin ng server (Day 53: logout, Day 54: devices).
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    // CASCADE: kapag nabura ang user, burado rin ang mga session niya (walang silbi ang session na walang user)
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // HASH lang (SHA-256), hindi ang token mismo — kapag na-leak ang database, hindi magagamit ang mga token
    tokenHash: text('token_hash').notNull().unique(),
    // Isang "family" bawat login — gagamitin sa Day 52 (rotation: iisang family ang bawat bagong token)
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }), // null = aktibo pa
    // Bakit binawi (Day 52): 'rotated' = napalitan ng bago (normal) · 'reuse' = ginamit ulit ang luma (nakaw!) ·
    // 'logout' = nag-logout (Day 53). Kailangan para malaman kung sabay na refresh lang o pagnanakaw
    revokeReason: text('revoke_reason').$type<'rotated' | 'reuse' | 'logout'>(),
    // Ang device (Day 54) — para sa "Mga device ko". Ina-update sa bawat rotation, kaya ang pinakabagong token
    // ng family ang nagsasabi ng HULING gamit: anong browser at saang IP
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)],
);

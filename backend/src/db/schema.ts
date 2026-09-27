import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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
  // Kailan napatunayang kanya ang email (Day 60). NULL = hindi pa — "soft": makakapag-login pa rin, may paalala
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  // Per-account lockout (Day 63): ilang sunod-sunod na maling password, at hanggang kailan naka-lock (NULL = hindi)
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
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
  'password_changed', // Day 55 — napalitan ang password; binawi ang LAHAT ng session
  'password_change_failed', // Day 55 — maling kasalukuyang password (posibleng nakaw na session na nanghuhula)
  'password_reset_requested', // Day 59 — may humiling ng reset link (target = ang account kung mayroon)
  'password_reset', // Day 59 — napalitan ang password gamit ang reset link
  'email_verified', // Day 60 — napatunayang kanya ang email (binuksan ang link)
  'account_locked', // Day 63 — 5 sunod-sunod na maling password → naka-lock nang 15 minuto (Day 64: metadata.scope)
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
    revokeReason: text('revoke_reason').$type<'rotated' | 'reuse' | 'logout' | 'password_change' | 'password_reset'>(),
    // Ang device (Day 54) — para sa "Mga device ko". Ina-update sa bawat rotation, kaya ang pinakabagong token
    // ng family ang nagsasabi ng HULING gamit: anong browser at saang IP
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_tokens_user_id_idx').on(table.userId),
    // Huling bantay (Day 69): ISANG aktibong token lang bawat family. Ang rotation (Day 52) ay laging binabawi muna ang luma
    // sa parehong transaction — pero kung may code na makalimot, ang DATABASE ang tatanggi (23505)
    uniqueIndex('refresh_tokens_one_active_per_family_idx').on(table.familyId).where(sql`revoked_at IS NULL`),
  ],
);

// Mga token na isang beses lang magagamit (Day 59) — ang link sa email: password reset (at email verification sa Day 60).
// Pareho ng refresh token: SHA-256 hash lang ang naka-save, kaya kapag na-leak ang database, walang magagamit na link
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    purpose: text('purpose').$type<'password_reset' | 'email_verification'>().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }), // null = hindi pa nagagamit (single-use)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('verification_tokens_user_id_idx').on(table.userId),
    // Huling bantay (Day 69): ISANG aktibong link lang bawat user at layunin. Dati, "UPDATE ang luma, tapos INSERT"
    // (dalawang statement) — 20 sabay na "ipadala ulit" = 18 aktibong link. Partial index: ang mga nagamit na (used_at)
    // ay hindi kasama, kaya puwedeng marami ang luma
    uniqueIndex('verification_tokens_one_active_idx').on(table.userId, table.purpose).where(sql`used_at IS NULL`),
  ],
);

// Mga pinagkakatiwalaang device (Day 64 — OWASP "device cookies", laban sa lockout DoS).
// Ang browser na nakapag-login nang TAMA ay may `device_token` cookie; ang maling password mula roon ay binibilang
// dito (sariling bilang ng device), HINDI sa `users` (ang bilang na pinaghahatian ng lahat ng walang cookie — pati ang attacker).
// Hindi ito login: kailangan pa rin ang password. Pinipili lang nito kung ALING bilang ang gagamitin
export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(), // SHA-256 lang, gaya ng refresh token
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('trusted_devices_user_id_idx').on(table.userId)],
);
export type TrustedDevice = typeof trustedDevices.$inferSelect;

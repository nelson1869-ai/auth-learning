import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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

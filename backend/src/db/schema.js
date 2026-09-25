import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Hugis ng `users` table sa JavaScript — dapat tugma sa CREATE TABLE ng Day 09
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  // Hash lang ang naka-save, hindi kailanman ang password mismo (Day 12)
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

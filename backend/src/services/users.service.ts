import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

// Bilang lang, hindi ang listahan — hindi dapat makita ng kahit sino ang email ng lahat (Day 9)
export function countUsers(): Promise<number> {
  return db.$count(users); // SELECT count(*) FROM users
}

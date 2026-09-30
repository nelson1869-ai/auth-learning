import argon2 from 'argon2';
import type { z } from 'zod';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { isUniqueViolation } from '../../db/errors.ts';
import type { Audit } from '../../lib/audit.ts';
import type { Cache } from '../../lib/cache.ts';
import { invalidateUsersCount } from '../users.service.ts';
import type { registerSchema } from '../../validations/auth.ts';

// Register (Day 12–13, 48) — business logic lang: walang req/res, walang status code.
// Ang controller ang nagsasalin ng resulta sa HTTP (201 / 409)
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterResult =
  | { status: 'created'; user: { id: number; email: string; name: string | null } }
  | { status: 'email_taken' };

export async function registerUser(input: RegisterInput, audit: Audit, cache?: Cache): Promise<RegisterResult> {
  // Hash BAGO i-save — hindi kailanman plain text sa database
  const passwordHash = await argon2.hash(input.password);
  try {
    // INSERT agad, walang "SELECT muna" — ang UNIQUE ng database ang huling bantay (kahit sabay ang 2 request)
    const [user] = await db
      .insert(users)
      .values({ email: input.email, name: input.name, passwordHash })
      // Piling column lang — hindi dapat lumabas ang password_hash kahit hash pa
      .returning({ id: users.id, email: users.email, name: users.name });
    await audit({ action: 'register', actorId: user!.id, targetId: user!.id });
    // Day 92b: nagbago ang bilang ng users — burahin ang naka-cache. Kung hindi, luma ang /api/users/count hanggang mag-expire (60s)
    await invalidateUsersCount(cache);
    return { status: 'created', user: user! };
  } catch (err) {
    if (isUniqueViolation(err)) return { status: 'email_taken' };
    throw err; // ibang error → hayaan si Express (500)
  }
}

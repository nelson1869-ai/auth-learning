import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { familyOf, listSessions, revokeSession } from '../../lib/session.ts';

// Sessions (Day 49–54) — business logic lang: walang req/res, walang cookies, walang status code (Day 75).
// Ang raw na refresh token (mula sa cookie) ay `unknown`: ang service ang sumusuri kung string ito

// Ang naka-login na user — galing sa DATABASE, hindi sa token (laging bago, hal. kung pinalitan ang name).
// + role (Day 49): para sa Admin link sa frontend — UX lang; ang requireRole pa rin ang tunay na bantay.
// + emailVerified (Day 60): para sa paalala ("soft" verification). undefined = nabura na ang user
export async function getMe(userId: number) {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return undefined;
  const { emailVerifiedAt, ...rest } = user;
  return { ...rest, emailVerified: emailVerifiedAt !== null };
}

// Mga device ko (Day 54). Ang "current" = ang device na nagtatanong (ang family ng refresh token nito)
export async function listMySessions(userId: number, rawRefreshToken: unknown) {
  const current = typeof rawRefreshToken === 'string' ? await familyOf(rawRefreshToken) : undefined;
  const sessions = await listSessions(userId);
  return sessions.map((session) => ({ ...session, current: session.id === current }));
}

// I-logout ang isang device. 🔐 IDOR: naka-scope sa naka-login na user ang pagbawi (revokeSession) —
// ang session ng ibang user ay "not_found", pareho ng id na wala (hindi nalalaman kung totoo ang id)
export type RevokeResult = { status: 'not_found' } | { status: 'revoked'; wasCurrent: boolean };

export async function revokeMySession(userId: number, sessionId: string, rawRefreshToken: unknown, audit: Audit): Promise<RevokeResult> {
  if (!(await revokeSession(userId, sessionId))) return { status: 'not_found' };
  await audit({ action: 'session_revoked', actorId: userId, targetId: userId, metadata: { session: sessionId } });
  // Ang device ba na ito mismo ang ni-logout? (kung oo, buburahin ng controller ang mga cookie nito)
  const wasCurrent = typeof rawRefreshToken === 'string' && (await familyOf(rawRefreshToken)) === sessionId;
  return { status: 'revoked', wasCurrent };
}

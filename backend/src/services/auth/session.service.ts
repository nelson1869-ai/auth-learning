import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import type { Audit } from '../../lib/audit.ts';
import { signAccessToken, userIdFromAccessToken } from '../../lib/jwt.ts';
import { familyOf, listSessions, revokeFamilyOf, revokeSession, rotateRefreshToken, type Device } from '../../lib/session.ts';

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

// Bagong access token gamit ang refresh token (Day 51). Day 52: bawat refresh ay may BAGONG refresh token (rotation);
// ang paggamit ulit ng luma = nakaw → binawi ang buong family
export type RefreshResult =
  | { status: 'rotated'; accessToken: string; refreshToken: string }
  | { status: 'grace'; accessToken: string } // sabay na refresh (dalawang tab): access token lang
  | { status: 'reused'; userId: number } // security event — itinala na sa audit; ang controller ang magla-log
  | { status: 'invalid' }; // wala, binawi, expired, o peke

export async function refreshSession(rawRefreshToken: unknown, device: Device, audit: Audit): Promise<RefreshResult> {
  if (typeof rawRefreshToken !== 'string') return { status: 'invalid' };
  const result = await rotateRefreshToken(rawRefreshToken, device);
  if (result.status === 'rotated') {
    return { status: 'rotated', accessToken: signAccessToken(result.userId), refreshToken: result.refreshToken };
  }
  if (result.status === 'grace') return { status: 'grace', accessToken: signAccessToken(result.userId) };
  if (result.status === 'reused') {
    await audit({ action: 'refresh_reuse', targetId: result.userId });
    return { status: 'reused', userId: result.userId };
  }
  return { status: 'invalid' };
}

// Day 53 — totoong logout: binabawi ang refresh token sa DATABASE. Laging nagtatagumpay (kahit walang cookie).
// ⚠️ Ang access token (JWT) ay valid pa hanggang mag-expire (≤ 15 min) — hindi ito naka-save, kaya hindi mababawi
export async function logout(rawRefreshToken: unknown, rawAccessToken: unknown, audit: Audit): Promise<void> {
  const revokedFor = typeof rawRefreshToken === 'string' ? await revokeFamilyOf(rawRefreshToken) : undefined;
  // Sino ang nag-logout? Mula sa access token kung valid pa, o mula sa binawing refresh token; kung wala, null
  const userId = userIdFromAccessToken(rawAccessToken) ?? revokedFor ?? null;
  await audit({ action: 'logout', actorId: userId, targetId: userId });
}

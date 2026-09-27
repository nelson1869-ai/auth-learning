import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, desc, eq, gt, inArray, isNull, min } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { refreshTokens } from '../db/schema.ts';

// Session (Day 51) — DALAWANG token:
//   access token  = JWT, 15 minuto, hindi naka-save. Sinusuri sa bawat request (mabilis, walang database).
//   refresh token = random, 7 araw, naka-save (hash). Ginagamit lang para kumuha ng bagong access token.
// Bakit dalawa? Kapag nanakaw ang access token, 15 minuto lang ang silbi nito. Ang mahabang token ay nasa
// database, kaya kayang bawiin (Day 53). Walang alam ang file na ito sa HTTP (walang req/res) — nasa route ang cookies.

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minuto
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 araw

// SHA-256, hindi argon2: ang refresh token ay 32 random bytes (256 bits), kaya imposibleng hulaan kahit
// mabilis ang hash. Ang argon2 ay para sa PASSWORD — maikli at hinuhulaan ng tao, kaya kailangang mabagal
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Ang `db` mismo, o isang transaction (Day 52: ang rotation ay nasa transaction)
type Writer = Pick<typeof db, 'insert'>;

// Ang device na gumagamit ng session (Day 54). Galing sa request ang laman, pero plain na data lang ito dito
export type Device = { userAgent: string | null; ip: string | null };

// Bagong refresh token para sa user. Ibinabalik ang RAW na token (para sa cookie) — ang hash lang ang naka-save
export async function createRefreshToken(
  userId: number,
  device: Device,
  familyId: string = randomUUID(),
  executor: Writer = db,
): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await executor.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(raw),
    familyId,
    userAgent: device.userAgent,
    ip: device.ip,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return raw;
}

// ---------------------------------------------------------------------------------------------
// Rotation at reuse detection (Day 52)
//
// Bawat refresh: ang lumang refresh token ay binabawi ('rotated') at may BAGONG token sa parehong family.
// Kapag may gumamit ulit ng lumang token → dalawang tao ang may hawak nito (ang tunay na user at ang
// magnanakaw), at hindi natin alam kung sino → bawiin ang BUONG family. Parehong mala-logout, pero
// mawawalan ng session ang magnanakaw.
//
// Reuse interval (10 segundo): ang lumang token na na-rotate KANINA LANG ay hindi pa ituturing na nakaw —
// ganito ang nangyayari kapag sabay na nag-refresh ang dalawang tab (iisang cookie ang gamit nila).
// Access token lang ang ibinibigay (walang bagong refresh token). Kapalit: 10 segundong palugit.
export const REUSE_INTERVAL_MS = 10_000;

export type RotateResult =
  | { status: 'rotated'; userId: number; refreshToken: string } // normal
  | { status: 'grace'; userId: number } // sabay na refresh — access token lang
  | { status: 'reused'; userId: number } // NAKAW — binawi ang buong family
  | { status: 'invalid' }; // wala, expired, o binawi dahil sa logout

export async function rotateRefreshToken(raw: string, device: Device): Promise<RotateResult> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  // 1. I-claim ang token sa ISANG atomic na statement: ang kondisyon ay nasa WHERE, hindi sa hiwalay na SELECT.
  //    Kapag sabay ang dalawang request, isa lang ang makakapagpalit ng revoked_at mula NULL.
  //    TRANSACTION kasama ang bagong token: habang hindi pa tapos ang nanalo, NAKA-LOCK ang row at naghihintay ang
  //    iba; pagdating ng turn nila, nakikita na nila ang bagong token (step 3). Kung hiwalay (nahuli ng test, Day 52):
  //    walang makikitang aktibong token ang natalo → ituturing na nakaw → mala-logout ang dalawang tab
  const rotated = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(refreshTokens)
      .set({ revokedAt: now, revokeReason: 'rotated' })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)))
      .returning({ userId: refreshTokens.userId, familyId: refreshTokens.familyId });
    if (!claimed) return undefined;
    const refreshToken = await createRefreshToken(claimed.userId, device, claimed.familyId, tx); // parehong family
    return { userId: claimed.userId, refreshToken };
  });
  if (rotated) return { status: 'rotated', ...rotated };

  // 2. Hindi ma-claim. Bakit?
  const [row] = await db
    .select({
      userId: refreshTokens.userId,
      familyId: refreshTokens.familyId,
      revokedAt: refreshTokens.revokedAt,
      revokeReason: refreshTokens.revokeReason,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));
  if (!row || !row.revokedAt) return { status: 'invalid' }; // walang ganito, o expired lang (hindi binawi)
  if (row.revokeReason !== 'rotated') return { status: 'invalid' }; // binawi na ang family (logout o nakaw)

  // 3. Na-rotate kanina lang, at buhay pa ang family → sabay na refresh, hindi pagnanakaw
  if (now.getTime() - row.revokedAt.getTime() < REUSE_INTERVAL_MS) {
    const [active] = await db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.familyId, row.familyId), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)));
    if (active) return { status: 'grace', userId: row.userId };
  }

  // 4. Ginamit ulit ang lumang token → NAKAW. Bawiin ang lahat ng aktibo sa family
  await db
    .update(refreshTokens)
    .set({ revokedAt: now, revokeReason: 'reuse' })
    .where(and(eq(refreshTokens.familyId, row.familyId), isNull(refreshTokens.revokedAt)));
  return { status: 'reused', userId: row.userId };
}

// ---------------------------------------------------------------------------------------------
// Totoong logout (Day 53): bawiin ang session sa DATABASE, hindi lang burahin ang cookie.
// Ang buong family ng token (ang login na ito, sa device na ito) — hindi ang ibang device ko.
// Isang statement: hanapin ang family ng token (subquery) at bawiin ang lahat ng aktibo roon.
// Ibinabalik ang user id (para sa audit), o undefined kung walang ganitong token
export async function revokeFamilyOf(raw: string): Promise<number | undefined> {
  const familyOfToken = db
    .select({ familyId: refreshTokens.familyId })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashToken(raw)));
  const revoked = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: 'logout' })
    .where(and(inArray(refreshTokens.familyId, familyOfToken), isNull(refreshTokens.revokedAt)))
    .returning({ userId: refreshTokens.userId });
  return revoked[0]?.userId;
}

// ---------------------------------------------------------------------------------------------
// Mga device ko (Day 54)
//
// Isang "session" = isang family = isang login sa isang device. Ang aktibong token ng family ang pinakabago,
// kaya ito ang nagsasabi ng huling gamit (oras, browser, IP). Ang `since` = ang unang token (ang login mismo)
export async function listSessions(userId: number) {
  const now = new Date();
  const active = await db
    .select({
      id: refreshTokens.familyId,
      userAgent: refreshTokens.userAgent,
      ip: refreshTokens.ip,
      lastUsedAt: refreshTokens.createdAt,
    })
    .from(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, now)))
    .orderBy(desc(refreshTokens.createdAt));
  if (active.length === 0) return [];

  const firstTokens = await db
    .select({ id: refreshTokens.familyId, since: min(refreshTokens.createdAt) })
    .from(refreshTokens)
    .where(inArray(refreshTokens.familyId, active.map((session) => session.id)))
    .groupBy(refreshTokens.familyId);
  const sinceOf = new Map(firstTokens.map((row) => [row.id, row.since]));
  return active.map((session) => ({ ...session, since: sinceOf.get(session.id) ?? session.lastUsedAt }));
}

// Ang family ng refresh token (para malaman kung alin ang "ito ang device ko")
export async function familyOf(raw: string): Promise<string | undefined> {
  const [row] = await db
    .select({ familyId: refreshTokens.familyId })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashToken(raw)));
  return row?.familyId;
}

// I-logout ang isang device. 🔐 IDOR: ang WHERE ay may `user_id` ng NAKA-LOGIN na user — kaya ang family ng
// ibang user ay parang wala (false → 404), hindi "bawal" (403, na nagsasabing totoo pala ang id)
export async function revokeSession(userId: number, familyId: string): Promise<boolean> {
  const revoked = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: 'logout' })
    .where(and(eq(refreshTokens.familyId, familyId), eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
    .returning({ id: refreshTokens.id });
  return revoked.length > 0;
}

// Bawiin ang LAHAT ng session ng user (Day 55: pagpalit ng password — lahat ng device, pati ang magnanakaw).
// Tumatanggap ng transaction para kasama ito sa "lahat o wala" ng pagpalit ng password
export async function revokeAllSessions(userId: number, executor: Pick<typeof db, 'update'> = db): Promise<void> {
  await executor
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: 'password_change' })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

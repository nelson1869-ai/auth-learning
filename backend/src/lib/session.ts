import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { refreshTokens } from '../db/schema.ts';
import { env } from '../config/env.ts';

// Session (Day 51) — DALAWANG token:
//   access token  = JWT, 15 minuto, hindi naka-save. Sinusuri sa bawat request (mabilis, walang database).
//   refresh token = random, 7 araw, naka-save (hash). Ginagamit lang para kumuha ng bagong access token.
// Bakit dalawa? Kapag nanakaw ang access token, 15 minuto lang ang silbi nito. Ang mahabang token ay nasa
// database, kaya kayang bawiin (Day 53). Walang alam ang file na ito sa HTTP (walang req/res) — nasa route ang cookies.

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minuto
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 araw

export function signAccessToken(userId: number): string {
  // Id lang (sub) ang laman — nababasa ng KAHIT SINO ang payload ng JWT
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}

// SHA-256, hindi argon2: ang refresh token ay 32 random bytes (256 bits), kaya imposibleng hulaan kahit
// mabilis ang hash. Ang argon2 ay para sa PASSWORD — maikli at hinuhulaan ng tao, kaya kailangang mabagal
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Ang `db` mismo, o isang transaction (Day 52: ang rotation ay nasa transaction)
type Writer = Pick<typeof db, 'insert'>;

// Bagong refresh token para sa user. Ibinabalik ang RAW na token (para sa cookie) — ang hash lang ang naka-save
export async function createRefreshToken(
  userId: number,
  familyId: string = randomUUID(),
  executor: Writer = db,
): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await executor.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(raw),
    familyId,
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

export async function rotateRefreshToken(raw: string): Promise<RotateResult> {
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
    const refreshToken = await createRefreshToken(claimed.userId, claimed.familyId, tx); // parehong family
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

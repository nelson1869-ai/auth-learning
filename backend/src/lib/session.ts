import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { and, eq, gt, isNull } from 'drizzle-orm';
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

// Bagong refresh token para sa user. Ibinabalik ang RAW na token (para sa cookie) — ang hash lang ang naka-save
export async function createRefreshToken(userId: number, familyId: string = randomUUID()): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(raw),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return raw;
}

// Ang aktibong refresh token (hindi binawi, hindi expired) — o undefined
export async function findActiveRefreshToken(raw: string) {
  const [row] = await db
    .select({ id: refreshTokens.id, userId: refreshTokens.userId, familyId: refreshTokens.familyId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hashToken(raw)),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    );
  return row;
}

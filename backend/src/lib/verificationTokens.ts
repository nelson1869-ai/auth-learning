import { randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { verificationTokens } from '../db/schema.ts';
import { hashToken } from './session.ts';

// Mga token sa email link (Day 59): random, isang beses lang magagamit, may expiry.
// Walang alam sa HTTP (walang req/res) — ang route ang may cookies at status codes
type Purpose = 'password_reset' | 'email_verification';
type Executor = Pick<typeof db, 'insert' | 'update'>;

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 oras
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 oras (Day 60) — mababa ang panganib, kaya mas mahaba

// Bagong token — isang aktibong link lang bawat user at layunin (ang pinakabagong email lang ang gagana).
// Day 69: ISANG statement (upsert). Kung may aktibo na, PINAPALITAN ang hash at expiry nito sa lugar — kaya hindi na gagana ang
// lumang link. Dati: "UPDATE ang luma, tapos INSERT" — dalawang statement, kaya ang sabay na request ay parehong nag-INSERT.
// Ang partial UNIQUE index (schema.ts) ang nagpapasya kung may "conflict"; naghihintay ang sabay na request at saka nag-a-update
export async function createVerificationToken(userId: number, purpose: Purpose, ttlMs: number, executor: Executor = db) {
  const raw = randomBytes(32).toString('base64url');
  const now = new Date();
  const values = { tokenHash: hashToken(raw), expiresAt: new Date(now.getTime() + ttlMs), createdAt: now };
  await executor
    .insert(verificationTokens)
    .values({ userId, purpose, ...values })
    .onConflictDoUpdate({
      target: [verificationTokens.userId, verificationTokens.purpose],
      targetWhere: sql`used_at IS NULL`, // dapat tugma sa WHERE ng index
      set: values,
    });
  return raw;
}

// I-claim ang token: ISANG atomic na statement (pareho ng Day 52). Kapag sabay ang dalawang request na may
// parehong link, isa lang ang makakapagpalit ng used_at mula NULL — ang isa ay walang makukuha.
// Ibinabalik ang user id, o undefined kung wala, nagamit na, expired, o ibang layunin
export async function claimVerificationToken(raw: string, purpose: Purpose, executor: Executor = db) {
  const now = new Date();
  const [claimed] = await executor
    .update(verificationTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(verificationTokens.tokenHash, hashToken(raw)),
        eq(verificationTokens.purpose, purpose),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, now),
      ),
    )
    .returning({ userId: verificationTokens.userId });
  return claimed?.userId;
}

// Mabilis na pagsusuri (walang binabago) — para hindi mag-argon2 ang server para sa pekeng token (CPU abuse).
// Hindi ito ang "claim": puwedeng may ibang gumamit sa pagitan, kaya ang claim pa rin ang huling bantay
export async function isVerificationTokenUsable(raw: string, purpose: Purpose): Promise<boolean> {
  const [row] = await db
    .select({ id: verificationTokens.id })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, hashToken(raw)),
        eq(verificationTokens.purpose, purpose),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    );
  return row !== undefined;
}


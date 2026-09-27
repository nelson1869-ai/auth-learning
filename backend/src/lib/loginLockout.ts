import { and, eq, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { trustedDevices, users } from '../db/schema.ts';

// Per-account lockout (Day 63) + device cookies (Day 64) — ATOMIC mula Day 67.
//
// Dati (Day 63–66): basahin ang bilang → +1 sa JavaScript → isulat. Kapag 20 hula ang SABAY, lahat ay nakabasa ng "0"
// bago pa may makapagsulat, kaya 20 ang nasuri at hindi na-lock (nahuli ng concurrency.test.ts, diagram 20).
//
// Ngayon: RESERVE-THEN-VERIFY. Ang +1 at ang "naka-lock ba?" ay nasa ISANG `UPDATE … WHERE … RETURNING`, at ginagawa ito
// BAGO ang argon2. Naka-lock ng Postgres ang row habang nag-a-update, kaya ang 20 sabay na request ay nakakakuha ng
// kanya-kanyang numero (1, 2, 3 … 20). Ang lampas sa 5 ay hindi na umaabot sa argon2. Walang `req` dito (gaya ng session.ts)

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

// Aling bilang: ang sariling bilang ng pinagkakatiwalaang device, o ang bilang ng account (users) na pinaghahatian
// ng LAHAT ng walang valid na device cookie — kasama ang attacker
export type LockCounter = { scope: 'account' | 'device'; id: number };

// Kunin ang susunod na numero ng subok (1, 2, 3, …). null = naka-lock pa (walang row na nabago)
export async function reserveAttempt(counter: LockCounter): Promise<number | null> {
  const now = new Date();
  if (counter.scope === 'device') {
    const [row] = await db
      .update(trustedDevices)
      // sa DATABASE ang +1, hindi sa JS · lockedUntil: null — kung expired na ang lumang lock, burahin (malinis na data)
      .set({ failedLoginAttempts: sql`${trustedDevices.failedLoginAttempts} + 1`, lockedUntil: null })
      .where(
        and(
          eq(trustedDevices.id, counter.id),
          or(isNull(trustedDevices.lockedUntil), lte(trustedDevices.lockedUntil, now)),
        ),
      )
      .returning({ attempt: trustedDevices.failedLoginAttempts });
    return row?.attempt ?? null;
  }
  const [row] = await db
    .update(users)
    .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`, lockedUntil: null })
    .where(and(eq(users.id, counter.id), or(isNull(users.lockedUntil), lte(users.lockedUntil, now))))
    .returning({ attempt: users.failedLoginAttempts });
  return row?.attempt ?? null;
}

// I-lock nang 15 minuto (0 ulit ang bilang: pagkatapos, 5 subok ulit). true = ITONG tawag ang nag-lock —
// kaya isang beses lang ang audit kahit maraming sabay na request ang umabot sa limit
export async function lockCounter(counter: LockCounter): Promise<boolean> {
  const now = new Date();
  const values = { failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MS) };
  if (counter.scope === 'device') {
    const [row] = await db
      .update(trustedDevices)
      .set(values)
      .where(
        and(
          eq(trustedDevices.id, counter.id),
          or(isNull(trustedDevices.lockedUntil), lte(trustedDevices.lockedUntil, now)),
        ),
      )
      .returning({ id: trustedDevices.id });
    return row !== undefined;
  }
  const [row] = await db
    .update(users)
    .set(values)
    .where(and(eq(users.id, counter.id), or(isNull(users.lockedUntil), lte(users.lockedUntil, now))))
    .returning({ id: users.id });
  return row !== undefined;
}

// Tamang password → 0 ulit (laging may na-reserve na tayo sa itaas, kaya laging may ire-reset)
export async function resetCounter(counter: LockCounter): Promise<void> {
  if (counter.scope === 'device') {
    await db
      .update(trustedDevices)
      .set({ failedLoginAttempts: 0, lockedUntil: null, lastUsedAt: new Date() })
      .where(eq(trustedDevices.id, counter.id));
    return;
  }
  await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, counter.id));
}

// Hanggang kailan naka-lock (para sa Retry-After) — binabasa ulit, dahil puwedeng kaka-lock lang ng ibang request
export async function lockedUntilOf(counter: LockCounter): Promise<Date | null> {
  const [row] =
    counter.scope === 'device'
      ? await db.select({ until: trustedDevices.lockedUntil }).from(trustedDevices).where(eq(trustedDevices.id, counter.id))
      : await db.select({ until: users.lockedUntil }).from(users).where(eq(users.id, counter.id));
  return row?.until ?? null;
}

import { randomBytes } from 'node:crypto';
import { and, eq, gt, lte } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { trustedDevices } from '../db/schema.ts';
import { hashToken } from './session.ts';

// Device cookies (Day 64) — laban sa LOCKOUT DoS. Walang `req`/`res` dito (gaya ng session.ts): ang route ang
// nagbabasa at nagse-set ng cookie. Tingnan ang schema.ts (trustedDevices) para sa "bakit"

export const DEVICE_COOKIE = 'device_token';
export const DEVICE_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 araw — matagal: ang silbi nito ay "ito ang dati kong browser"

// Ang trusted device ng EKSAKTONG user na ito. Ang cookie ng ibang account, gawa-gawa, o expired → undefined (untrusted)
export async function findTrustedDevice(raw: unknown, userId: number) {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const [device] = await db
    .select()
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.tokenHash, hashToken(raw)),
        eq(trustedDevices.userId, userId),
        gt(trustedDevices.expiresAt, new Date()),
      ),
    );
  return device;
}

// Bagong trusted device. Ibinabalik ang RAW token (para sa cookie) — hash lang ang naka-save
export async function createTrustedDevice(userId: number, executor: Pick<typeof db, 'insert' | 'delete'> = db) {
  const now = new Date();
  // Linisin ang mga expired na device ng user na ito — para hindi lumaki nang walang hanggan ang table
  await executor
    .delete(trustedDevices)
    .where(and(eq(trustedDevices.userId, userId), lte(trustedDevices.expiresAt, now)));
  const raw = randomBytes(32).toString('base64url');
  await executor
    .insert(trustedDevices)
    .values({ userId, tokenHash: hashToken(raw), expiresAt: new Date(now.getTime() + DEVICE_TTL_MS) });
  return raw;
}

// Change/reset password: alisin ang tiwala ng LAHAT ng device. Kung may nakakuha ng device cookie gamit ang lumang
// password (hal. nanakaw na laptop), nawawala ang kakayahan niyang lumampas sa lockout
export async function revokeAllTrustedDevices(userId: number, executor: Pick<typeof db, 'delete'> = db) {
  await executor.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
}

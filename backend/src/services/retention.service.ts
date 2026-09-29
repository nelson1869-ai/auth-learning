import { and, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { auditLogs, refreshTokens, trustedDevices, unknownLoginAttempts, verificationTokens } from '../db/schema.ts';

// Data retention (Day 90) — ang data na wala nang silbi ay binubura, para may HANGGANAN ang paglaki ng database
// at para hindi itinatago nang walang dahilan ang personal na data (IP, user agent, bakas ng mga login).
// Mga patakaran (D-032):
//   refresh_tokens        — BUONG family, kapag expired na ang LAHAT ng token nito. HUWAG burahin ang revoked na token ng
//                           buhay na family: hinahanap iyon ng reuse detection (lib/session.ts, Day 52). Kapag nabura,
//                           ang ninakaw na lumang token ay "invalid" na lang, hindi "reused", kaya hindi na binabawi ang family
//   verification_tokens   — expired na (walang silbi ang expired na link)
//   trusted_devices       — expired na
//   unknown_login_attempts — walang attempt nang 30+ araw AT hindi naka-lock (hindi mabubura ang lock ng umaatake)
//   audit_logs            — mahigit 1 taon (desisyon ni Nelson, Day 90)
const UNKNOWN_ATTEMPTS_IDLE_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIT_LOG_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
// Isang numero para sa advisory lock: kapag dalawang instance ang sabay na naglilinis, isa lang ang gagawa (ang isa: `skipped`).
// Nakatali ang lock sa transaction (xact): kusang binibitawan sa commit o rollback, kahit mamatay ang process
export const RETENTION_LOCK_KEY = 90_001;

export const RETENTION_TABLES = ['refreshTokens', 'verificationTokens', 'trustedDevices', 'unknownLoginAttempts', 'auditLogs'] as const;

export type RetentionResult =
  | { status: 'skipped' } // may ibang naglilinis ngayon
  | { status: 'ok'; deleted: Record<(typeof RETENTION_TABLES)[number], number> };

export async function runRetentionCleanup(now: Date = new Date()): Promise<RetentionResult> {
  return db.transaction(async (tx) => {
    const lock = await tx.execute<{ locked: boolean }>(sql`select pg_try_advisory_xact_lock(${RETENTION_LOCK_KEY}) as locked`);
    if (!lock.rows[0]?.locked) return { status: 'skipped' };

    const expiredFamilies = tx
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .groupBy(refreshTokens.familyId)
      .having(sql`max(${refreshTokens.expiresAt}) < ${now}`);

    const refresh = await tx
      .delete(refreshTokens)
      .where(sql`${refreshTokens.familyId} in (${expiredFamilies})`)
      .returning({ id: refreshTokens.id });
    const verification = await tx
      .delete(verificationTokens)
      .where(lt(verificationTokens.expiresAt, now))
      .returning({ id: verificationTokens.id });
    const devices = await tx
      .delete(trustedDevices)
      .where(lt(trustedDevices.expiresAt, now))
      .returning({ id: trustedDevices.id });
    const unknown = await tx
      .delete(unknownLoginAttempts)
      .where(
        and(
          lt(unknownLoginAttempts.lastAttemptAt, new Date(now.getTime() - UNKNOWN_ATTEMPTS_IDLE_MS)),
          or(isNull(unknownLoginAttempts.lockedUntil), lt(unknownLoginAttempts.lockedUntil, now)),
        ),
      )
      .returning({ emailHash: unknownLoginAttempts.emailHash });
    const audit = await tx
      .delete(auditLogs)
      .where(lt(auditLogs.createdAt, new Date(now.getTime() - AUDIT_LOG_RETENTION_MS)))
      .returning({ id: auditLogs.id });

    return {
      status: 'ok',
      deleted: {
        refreshTokens: refresh.length,
        verificationTokens: verification.length,
        trustedDevices: devices.length,
        unknownLoginAttempts: unknown.length,
        auditLogs: audit.length,
      },
    };
  });
}

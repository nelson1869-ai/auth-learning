import { and, eq, gt } from 'drizzle-orm';
import { env } from '../config/env.ts';
import { db } from '../db/index.ts';
import { webauthnChallenges } from '../db/schema.ts';

// WebAuthn (Day 95) — ang config ng "relying party" (tayo) at ang taguan ng mga challenge. Walang `req` dito.
//
// Ang RP ID at ang origin ay HINANGO sa CLIENT_URL — walang hiwalay na env variable. Sa reference, hiwalay ang
// `WEBAUTHN_RP_ID`, at naiwan itong `localhost` sa production: gumagana lang ang passkeys sa localhost. Dito, hindi iyon puwedeng mangyari:
//   dev:         CLIENT_URL=http://localhost:5173  → rpID `localhost`,      origin `http://localhost:5173`
//   production:  CLIENT_URL=https://nelson1869.com → rpID `nelson1869.com`, origin `https://nelson1869.com`
// RP ID = ang domain kung saan NAKATALI ang passkey (hindi ito gagana sa ibang domain — iyan ang laban sa phishing).
// origin = ang eksaktong address ng page na tumawag sa WebAuthn; ang browser ang naglalagay nito sa pinipirmahan
const client = new URL(env.CLIENT_URL);
export const RP_ID = client.hostname;
export const RP_NAME = 'auth-learning';
export const EXPECTED_ORIGIN = client.origin;

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // sapat para sa fingerprint/PIN; maikli para walang silbi ang nakaw na challenge

// Itabi ang challenge ng user. Ang bago ay PUMAPALIT sa luma (unique index: isa lang bawat user at layunin) — iisang statement
export async function saveRegistrationChallenge(userId: number, challenge: string, now: Date = new Date()): Promise<void> {
  const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MS);
  await db
    .insert(webauthnChallenges)
    .values({ userId, purpose: 'registration', challenge, expiresAt })
    .onConflictDoUpdate({ target: [webauthnChallenges.userId, webauthnChallenges.purpose], set: { challenge, expiresAt } });
}

// Kunin AT burahin sa IISANG statement (DELETE … RETURNING) — atomic: kahit dalawang verify ang magsabay, isa lang ang makakakuha
// (aral ng Phase 14). Burado na ito pumasa man o hindi ang pagsusuri: isang subok lang bawat challenge.
// undefined = walang challenge, o expired na
export async function consumeRegistrationChallenge(userId: number, now: Date = new Date()): Promise<string | undefined> {
  const [row] = await db
    .delete(webauthnChallenges)
    .where(and(eq(webauthnChallenges.userId, userId), eq(webauthnChallenges.purpose, 'registration')))
    .returning({ challenge: webauthnChallenges.challenge, expiresAt: webauthnChallenges.expiresAt });
  if (!row || row.expiresAt <= now) return undefined;
  return row.challenge;
}

// Para sa tests: may buhay pa bang challenge ang user?
export async function hasRegistrationChallenge(userId: number, now: Date = new Date()): Promise<boolean> {
  const rows = await db
    .select({ id: webauthnChallenges.id })
    .from(webauthnChallenges)
    .where(and(eq(webauthnChallenges.userId, userId), eq(webauthnChallenges.purpose, 'registration'), gt(webauthnChallenges.expiresAt, now)));
  return rows.length > 0;
}

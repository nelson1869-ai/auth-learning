import { createPublicKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';

// RS256 (Day 56) — dalawang susi:
//   PRIVATE key = PUMIPIRMA (nasa server lang, lihim)
//   PUBLIC key  = SUMUSURI (puwedeng ibigay kahit kanino — hindi ito makakagawa ng token)
// Dati (HS256, D-012): iisang JWT_SECRET ang pumipirma AT sumusuri, kaya kailangang lihim ito kahit saan ginagamit.
// Kinukuha ang public key mula sa private key — hindi puwedeng magkamali ng pares
const privateKey = env.JWT_PRIVATE_KEY;
export const publicKey = createPublicKey(privateKey);

// Sino ang gumawa ng token (iss) at para kanino (aud). Sinusuri sa verify: ang token na para sa ibang
// sistema (hal. ibang app na parehong key) ay hindi tatanggapin dito
export const JWT_ISSUER = 'auth-learning-api';
export const JWT_AUDIENCE = 'auth-learning-web';

export function signAccessToken(userId: number): string {
  // Id lang (sub) ang laman — nababasa ng KAHIT SINO ang payload ng JWT
  return jwt.sign({ sub: String(userId) }, privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

// Ang user id mula sa access token — o undefined kapag walang token, binago, expired, sira, maling algorithm,
// maling iss/aud. Iisang sagot para sa lahat (hindi sinasabi kung alin)
export function userIdFromAccessToken(token: unknown): number | undefined {
  if (typeof token !== 'string') return undefined;
  try {
    // RS256 LANG: ang HS256 na token na pinirmahan gamit ang PUBLIC key bilang "secret" (algorithm confusion
    // attack) ay tatanggihan — hindi hinahayaang ang header ng token ang pumili ng algorithm.
    // (Sinubukan, Day 56: tumatanggi na rin ang jsonwebtoken v9 mismo — CVE-2022-23540. Pangalawang bantay ito,
    // at ang test ay magbabantay kung sakaling ma-downgrade o mapalitan ang library)
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    if (typeof payload === 'string' || !payload.sub) return undefined;
    return Number(payload.sub);
  } catch {
    return undefined;
  }
}

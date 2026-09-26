import type { Request } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.ts';
import { clientIp } from '../lib/clientIp.ts';
import { logger } from '../lib/logger.ts';

type LimiterOptions = {
  limit: number; // ilang subok
  windowMs: number; // sa loob ng gaano katagal
  skipSuccessfulRequests?: boolean; // true: ang mga PALPAK lang ang binibilang (login)
  trustCloudflare?: boolean; // gamitin ang CF-Connecting-IP (tingnan ang config/env.ts)
};

// Kanino ang "bilang"? Sa totoong IP ng client — tingnan ang lib/clientIp.ts (CF-Connecting-IP)
export function clientKey(req: Request, trustCloudflare: boolean): string {
  return ipKeyGenerator(clientIp(req, trustCloudflare)); // IPv6: isang /56 na bloke = isang user (hindi makakaiwas sa bagong address)
}

// Factory — para masubukan sa test na may maliit na limit (hal. 3), hiwalay sa app
export function createAuthLimiter({
  limit,
  windowMs,
  skipSuccessfulRequests = false,
  trustCloudflare = false,
}: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8', // RateLimit-* headers: makikita ng client kung ilan pa ang natitira
    legacyHeaders: false,
    keyGenerator: (req) => clientKey(req, trustCloudflare),
    // Security event: itala kung sino ang na-block (makikita sa `docker compose logs backend`).
    // req.log = logger na may requestId na (Day 42); wala ito sa maliit na test app, kaya may `?? logger`
    handler: (req, res, _next, options) => {
      (req.log ?? logger).warn({ event: 'rate_limit', path: req.path, key: clientKey(req, trustCloudflare) }, 'Rate limit hit');
      res.status(options.statusCode).json({ error: 'Too many attempts. Please try again later.' });
    },
  });
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;
// Sa Vitest: iisang app ang ginagamit ng lahat ng test — sariling test ang limiter (rateLimiter.test.ts)
const skip = env.NODE_ENV === 'test';

// Login: 10 PALPAK na subok bawat 15 minuto bawat IP — hindi naaabala ang user na tama ang password
export const loginLimiter = skip
  ? undefined
  : createAuthLimiter({
      limit: 10,
      windowMs: FIFTEEN_MINUTES,
      skipSuccessfulRequests: true,
      trustCloudflare: env.TRUST_CLOUDFLARE,
    });

// Register: 10 bawat 15 minuto bawat IP (lahat binibilang) — pananggalang laban sa pekeng accounts
export const registerLimiter = skip
  ? undefined
  : createAuthLimiter({ limit: 10, windowMs: FIFTEEN_MINUTES, trustCloudflare: env.TRUST_CLOUDFLARE });

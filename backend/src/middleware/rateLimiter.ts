import type { Request } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.ts';

type LimiterOptions = {
  limit: number; // ilang subok
  windowMs: number; // sa loob ng gaano katagal
  skipSuccessfulRequests?: boolean; // true: ang mga PALPAK lang ang binibilang (login)
  trustCloudflare?: boolean; // gamitin ang CF-Connecting-IP (tingnan ang config/env.ts)
};

// Kanino ang "bilang"? Sa likod ng tunnel, IP ng cloudflared container ang req.ip ng LAHAT ng user —
// kaya ang totoong IP ay nasa CF-Connecting-IP (idinadagdag ng Cloudflare). Kung hindi sa likod ng
// Cloudflare, huwag pagkatiwalaan ang header na iyon: kayang pekein ng kahit sino
export function clientKey(req: Request, trustCloudflare: boolean): string {
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = trustCloudflare && typeof cfIp === 'string' ? cfIp : (req.ip ?? 'unknown');
  return ipKeyGenerator(ip); // IPv6: isang /56 na bloke = isang user (hindi makakaiwas sa bagong address)
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
    // Security event: itala kung sino ang na-block (makikita sa `docker compose logs backend`)
    handler: (req, res, _next, options) => {
      console.warn(JSON.stringify({ event: 'rate_limit', path: req.path, key: clientKey(req, trustCloudflare) }));
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

import type { Request } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.ts';
import { clientIp } from '../lib/clientIp.ts';
import { logger } from '../lib/logger.ts';
import { redis as sharedRedis } from '../lib/redis.ts';

type LimiterOptions = {
  name: string; // Day 92: prefix sa Redis (rl:<name>:<ip>) — hindi naghahalo ang bilang ng login at register
  limit: number; // ilang subok
  windowMs: number; // sa loob ng gaano katagal
  skipSuccessfulRequests?: boolean; // true: ang mga PALPAK lang ang binibilang (login)
  trustCloudflare?: boolean; // gamitin ang CF-Connecting-IP (tingnan ang config/env.ts)
  redis?: Redis; // Day 92: kapag mayroon, iisang bilang ng LAHAT ng kopya ng app (default: ang REDIS_URL). Wala: sa memory
};

// Kanino ang "bilang"? Sa totoong IP ng client — tingnan ang lib/clientIp.ts (CF-Connecting-IP)
// Day 92: ang RedisStore ay nagre-reload ng Lua script LANG kapag `NOSCRIPT` ang error. Kapag PATAY ang Redis pagka-start ng app,
// ang naka-save na script ID ay isang pumalyang promise MAGPAKAILANMAN — kaya kahit bumalik ang Redis, hindi na kailanman
// ipinapatupad ang limit hanggang i-restart ang app (nahuli ng test: 401, 401, 401, 401 — walang 429). Dito: kapag pumalya,
// i-load ulit ang mga script para sa susunod na request. May `.catch` para walang unhandledRejection habang patay pa ang Redis
// Day 92 (2): sa BAWAT startup, kumokonekta pa lang ang Redis kapag ginawa ang store — kaya pumapalya ang unang pag-load
// (enableOfflineQueue: false), at ang UNANG request ay hindi nabibilang (nakita sa MONITOR ng Redis). Kaya:
//   - tahimik na init(): hindi naghihintay (at hindi nag-iingay ng 5 stack trace sa console)
//   - ang createAuthLimiter ay naglo-load ulit ng mga script sa bawat 'ready' ng Redis (startup at pagbalik)
class ResilientRedisStore extends RedisStore {
  override async init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
    this.reloadScripts();
  }
  override async increment(key: string) {
    try {
      return await super.increment(key);
    } catch (err) {
      this.reloadScripts();
      throw err; // → passOnStoreError: papasukin ang request
    }
  }
  override async get(key: string) {
    try {
      return await super.get(key);
    } catch (err) {
      this.reloadScripts();
      throw err;
    }
  }
  reloadScripts() {
    this.incrementScriptSha = this.loadIncrementScript();
    this.getScriptSha = this.loadGetScript();
    this.incrementScriptSha.catch(() => {});
    this.getScriptSha.catch(() => {});
  }
}

function clientKey(req: Request, trustCloudflare: boolean): string {
  return ipKeyGenerator(clientIp(req, trustCloudflare)); // IPv6: isang /56 na bloke = isang user (hindi makakaiwas sa bagong address)
}

// Factory — para masubukan sa test na may maliit na limit (hal. 3), hiwalay sa app
function redisStore(redis: Redis, name: string): ResilientRedisStore {
  const store = new ResilientRedisStore({
    prefix: `rl:${name}:`,
    sendCommand: (command: string, ...args: string[]) => redis.call(command, ...args) as never,
  });
  redis.on('ready', () => store.reloadScripts()); // bago pa dumating ang unang request
  return store;
}

export function createAuthLimiter({
  name,
  limit,
  windowMs,
  skipSuccessfulRequests = false,
  trustCloudflare = false,
  redis = sharedRedis,
}: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    // Day 92: sa Redis kapag mayroon — kung hindi, bawat kopya ng app ay may sariling bilang (sinukat sa lab: 20 sa halip na 10)
    store: redis ? redisStore(redis, name) : undefined,
    // Kapag pumalya ang Redis: PAPASUKIN ang request (fail-open) sa halip na 500 sa lahat ng login. Nasa database ang account lockout
    passOnStoreError: true,
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
      name: 'login',
      limit: 10,
      windowMs: FIFTEEN_MINUTES,
      skipSuccessfulRequests: true,
      trustCloudflare: env.TRUST_CLOUDFLARE,
    });

// Change password (Day 55): 10 PALPAK bawat 15 minuto — kahit may nakanakaw ng session, hindi niya
// mahuhulaan nang paulit-ulit ang kasalukuyang password dito (hindi binibilang ang matagumpay)
export const changePasswordLimiter = skip
  ? undefined
  : createAuthLimiter({
      name: 'change-password',
      limit: 10,
      windowMs: FIFTEEN_MINUTES,
      skipSuccessfulRequests: true,
      trustCloudflare: env.TRUST_CLOUDFLARE,
    });

// Dagdag ng passkey (Day 95): humihingi ng kasalukuyang password — 10 PALPAK bawat 15 minuto, gaya ng change password
export const passkeyRegisterLimiter = skip
  ? undefined
  : createAuthLimiter({
      name: 'passkey-register',
      limit: 10,
      windowMs: FIFTEEN_MINUTES,
      skipSuccessfulRequests: true,
      trustCloudflare: env.TRUST_CLOUDFLARE,
    });

// Forgot password (Day 59): 5 bawat 15 minuto bawat IP (lahat binibilang) — bawat request ay puwedeng
// magpadala ng email; kung walang limit, kayang gamitin ang app para mag-spam ng inbox ng iba, at masisira ang
// reputasyon ng domain (Day 58)
export const forgotPasswordLimiter = skip
  ? undefined
  : createAuthLimiter({ name: 'forgot-password', limit: 5, windowMs: FIFTEEN_MINUTES, trustCloudflare: env.TRUST_CLOUDFLARE });

// Resend verification (Day 60): 5 bawat 15 minuto bawat IP — nagpapadala ng email, pareho ng forgot-password
export const resendVerificationLimiter = skip
  ? undefined
  : createAuthLimiter({ name: 'resend-verification', limit: 5, windowMs: FIFTEEN_MINUTES, trustCloudflare: env.TRUST_CLOUDFLARE });

// Register: 10 bawat 15 minuto bawat IP (lahat binibilang) — pananggalang laban sa pekeng accounts
export const registerLimiter = skip
  ? undefined
  : createAuthLimiter({ name: 'register', limit: 10, windowMs: FIFTEEN_MINUTES, trustCloudflare: env.TRUST_CLOUDFLARE });

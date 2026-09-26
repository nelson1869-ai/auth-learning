import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import { logger } from '../lib/logger.ts';
import { clientIp } from '../lib/clientIp.ts';
import { env } from '../config/env.ts';

// Isang log bawat request (Day 42), kapag natapos na ang sagot:
// { requestId, clientIp, req: { method, url }, res: { statusCode }, responseTime, msg: "request completed" }
// Factory — para masubukan sa test na may sariling logger na nababasa (requestLogger.test.ts)
export function createRequestLogger(log: Logger) {
  return pinoHttp({
    logger: log,

    // Request ID: bagong UUID sa BAWAT request, ibinabalik sa client bilang X-Request-Id header.
    // Kapag may nag-report ng problema, ibigay niya ang ID → hanapin sa logs → ang eksaktong request.
    // Hindi tinatanggap ang X-Request-Id na galing sa client: kayang pekein (kapareho ng CF-Connecting-IP)
    genReqId: (_req, res) => {
      const id = randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },

    // quietReqLogger: ang req.log (hal. sa rate limiter) ay may `requestId` lang na nakadikit sa bawat
    // linya, hindi ang buong request. Ang "request completed" log ang may req/res
    quietReqLogger: true,
    customAttributeKeys: { reqId: 'requestId' },

    // Totoong IP ng client (hindi ang cloudflared container) — para makita kung sino ang mga bot
    customProps: (req) => ({ clientIp: clientIp(req, env.TRUST_CLOUDFLARE) }),

    // Kaunting data lang ang isinusulat (hindi ang lahat ng headers): mas madaling basahin, at
    // walang maipon na hindi kailangan (privacy). Dagdag na proteksyon pa rin ang redact sa logger.ts
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, userAgent: req.headers['user-agent'] }),
      res: (res) => ({ statusCode: res.statusCode }),
    },

    // Level ayon sa status: 5xx = error (sira ang server) · 4xx = warn (mali ang client) · iba = info
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },

    // Hindi itinatala ang /api/health — tinatawag ito ng Docker HEALTHCHECK nang paulit-ulit (ingay lang)
    autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
  });
}

export const requestLogger = createRequestLogger(logger);

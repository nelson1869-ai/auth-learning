import { pino, type LoggerOptions } from 'pino';
import { env } from '../config/env.ts';

// Structured logging (Day 42): bawat log ay isang linya ng JSON — { level, time, msg, ... }.
// Mahahanap at masasala (hal. lahat ng level 50 = error), hindi tulad ng console.log na text lang.

// Hiwalay ang options para magamit din ng test (logger.test.ts) na may sariling "stream"
export const loggerOptions: LoggerOptions = {
  // test: tahimik (malinis ang output ng vitest) · dev: pati debug · production: info pataas
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  // 🔐 HUWAG isulat sa logs ang mga secret — nababasa ng sinumang may access sa logs
  redact: {
    paths: [
      'req.headers.cookie', // may JWT (token=...)
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      '*.password', // hal. logger.info({ body: req.body }) — kahit mangyari iyon nang hindi sinasadya
    ],
    censor: '[REDACTED]',
  },
};

export const logger = pino({
  ...loggerOptions,
  // Sa dev lang: may kulay at madaling basahin (pino-pretty — devDependency, wala sa production image).
  // Sa production: JSON pa rin, dahil makina ang magbabasa (docker logs, hanapan, alerts)
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
});

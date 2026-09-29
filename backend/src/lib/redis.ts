import { Redis } from 'ioredis';
import { env } from '../config/env.ts';
import { logger } from './logger.ts';

// Redis (Day 92) — ang pinagsasaluhang bilang ng rate limiter ng lahat ng kopya ng app.
// Ang pinakamahalagang desisyon: ano ang mangyayari kapag PATAY ang Redis? Ang sagot dito: hindi dapat bumagsak ang login.
//   - enableOfflineQueue: false — kapag hindi konektado, PUMAPALYA AGAD ang command (hindi pumipila at naghihintay).
//     Kung hindi, mabibitin ang BAWAT request na dumaan sa rate limiter hanggang bumalik ang Redis
//   - ang rate limiter ay `passOnStoreError` (middleware/rateLimiter.ts): kapag pumalya ang Redis, papasukin ang request (fail-open).
//     Nasa database pa rin ang account lockout (Day 63), kaya may proteksyon pa rin laban sa panghuhula ng password
export function createRedis(url: string): Redis {
  const client = new Redis(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    retryStrategy: (times) => Math.min(times * 200, 5_000), // subukan ulit nang paunti-unti, hanggang bawat 5s
  });
  // Isang ERROR lang bawat pagkawala (hindi isa bawat subok na kumonekta, na paulit-ulit bawat ilang segundo)
  let down = false;
  client.on('error', (err) => {
    if (down) return;
    down = true;
    logger.error({ err, event: 'redis_down' }, 'Redis unavailable — rate limits are NOT enforced until it is back');
  });
  client.on('ready', () => {
    if (down) logger.info({ event: 'redis_up' }, 'Redis is back — rate limits enforced again');
    down = false;
  });
  return client;
}

export const redis = env.REDIS_URL ? createRedis(env.REDIS_URL) : undefined;

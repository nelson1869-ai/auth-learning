import type { Redis } from 'ioredis';
import { cacheLookups } from './metrics.ts';
import { redis as sharedRedis } from './redis.ts';

// Server cache (Day 92b) — "cache-aside": tanungin muna ang Redis; kapag wala (MISS), kunin sa database at itabi sa Redis.
// Para LANG sa data na madalas basahin, bihirang magbago, at PAREHO para sa lahat ng user (hal. bilang ng users).
// 🔐 HUWAG dito ang personal na data (hal. /me): iisa ang susi para sa lahat, kaya makikita ni B ang data ni A.
//    Kung talagang kailangan, dapat kasama ang user id sa susi (`user:42:profile`) — at burahin kapag nagbago o nag-logout.
//
// Tatlong patakaran (D-036):
//   - LAGING may TTL. Kapag pumalya ang pagbura (invalidate), ang TTL ang huling bantay: luma nang hanggang TTL, hindi magpakailanman
//   - fail-open, gaya ng rate limiter (D-035): kapag patay ang Redis, diretso sa database. Mas mabagal, pero tama at buhay
//   - kapag walang REDIS_URL (dev na walang Redis, tests ng app): walang cache — `bypass`
export type CacheSource = 'hit' | 'miss' | 'bypass';

const PREFIX = 'cache:'; // hiwalay sa `rl:` ng rate limiter — iisang Redis, magkaibang susi

for (const result of ['hit', 'miss', 'error']) cacheLookups.add(0, { result }); // aral ng Day 82: simulan sa 0

export function createCache(redis: Redis | undefined = sharedRedis) {
  return {
    async getOrLoad<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<{ value: T; source: CacheSource }> {
      if (!redis) return { value: await load(), source: 'bypass' };
      let cached: string | null;
      try {
        cached = await redis.get(PREFIX + key);
      } catch {
        // Patay ang Redis (isang ERROR na sa log — lib/redis.ts). Hindi ito dahilan para pumalya ang request
        cacheLookups.add(1, { result: 'error' });
        return { value: await load(), source: 'bypass' };
      }
      if (cached !== null) {
        cacheLookups.add(1, { result: 'hit' });
        return { value: JSON.parse(cached) as T, source: 'hit' };
      }
      cacheLookups.add(1, { result: 'miss' });
      const value = await load();
      // EX = expiry sa segundo, sa IISANG command kasama ng SET (atomic): walang sandali na may susi na walang TTL
      await redis.set(PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds).catch(() => {});
      return { value, source: 'miss' };
    },

    // Hindi kailanman nagta-throw: ang register ay hindi dapat pumalya dahil lang hindi nabura ang cache (TTL ang bahala)
    async invalidate(key: string): Promise<void> {
      await redis?.del(PREFIX + key).catch(() => {});
    },
  };
}

export type Cache = ReturnType<typeof createCache>;
export const cache = createCache();

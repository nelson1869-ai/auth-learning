import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { cache as appCache, type Cache, type CacheSource } from '../lib/cache.ts';

// Day 92b: ang bilang ay naka-cache sa Redis. Pareho ito para sa lahat ng user (hindi personal), madalas basahin, at
// nagbabago lang kapag may bagong register — kaya bagay sa cache. 60s ang TTL: kahit pumalya ang pagbura, 1 minuto lang itong luma
const USERS_COUNT_KEY = 'users:count';
const USERS_COUNT_TTL_SECONDS = 60;

// Bilang lang, hindi ang listahan — hindi dapat makita ng kahit sino ang email ng lahat (Day 9)
export async function countUsers(cache: Cache = appCache): Promise<{ count: number; source: CacheSource }> {
  const { value, source } = await cache.getOrLoad(
    USERS_COUNT_KEY,
    USERS_COUNT_TTL_SECONDS,
    () => db.$count(users), // SELECT count(*) FROM users — sa MISS lang
  );
  return { count: value, source };
}

// Cache invalidation: tinatawag ng registration.service.ts pagkatapos ng INSERT. Dito nakatira ang susi, kaya dito rin ang pagbura
export function invalidateUsersCount(cache: Cache = appCache): Promise<void> {
  return cache.invalidate(USERS_COUNT_KEY);
}

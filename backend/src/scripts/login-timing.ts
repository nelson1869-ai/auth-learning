// Sukatin ang tagal ng maling login: email na MAY account vs WALA (Day 72 — timing attack).
// Kahit pareho ang sagot (Day 71), puwedeng ibunyag ng ORAS kung may account.
//
// DEV LANG. Kailangan ng tumatakbong server na walang rate limit (NODE_ENV=test), sa PAREHONG dev database:
//   NODE_ENV=test node --env-file=.env src/index.ts          (terminal 1)
//   npm run timing:login                                    (terminal 2)
// Gumagawa ng isang demo account, at binubura ito sa dulo.
import { performance } from 'node:perf_hooks';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { unknownLoginAttempts, users } from '../db/schema.ts';
import { hashToken } from '../lib/session.ts';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
if (!/^http:\/\/localhost(:\d+)?$/.test(BASE)) throw new Error('Dev lang: localhost ang BASE_URL');
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? '')) throw new Error('Dev lang: lokal na database');

const ROUNDS = Number(process.env.ROUNDS ?? 20);
const PER_ROUND = 4; // < 5: hindi aabot sa lock (ang 423 ay walang argon2 — iba ang tagal)
const stamp = Date.now();
const real = `timing-real-${stamp}@example.com`;
const none = `timing-none-${stamp}@example.com`;

async function post(path: string, body: object) {
  const start = performance.now();
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  await res.text();
  return { status: res.status, ms: performance.now() - start };
}
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const pct = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * p)]!;

const reg = await post('/api/auth/register', { email: real, password: 'Timing-Real-2026!' });
if (reg.status !== 201) throw new Error(`Precondition: dapat 201 ang register, ${reg.status} ang nakuha (rate limit? tumatakbo ba ang server?)`);

const times = { real: [] as number[], none: [] as number[] };
try {
  // Warm-up (hindi binibilang): unang koneksyon, JIT, cache
  for (let i = 0; i < 3; i++) {
    await post('/api/auth/login', { email: real, password: 'mali' });
    await post('/api/auth/login', { email: none, password: 'mali' });
  }
  for (let round = 0; round < ROUNDS; round++) {
    // Ibalik sa 0 ang dalawang bilang — sa labas ng sinusukat na oras
    await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.email, real));
    await db
      .update(unknownLoginAttempts)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(unknownLoginAttempts.emailHash, hashToken(none)));
    for (let i = 0; i < PER_ROUND; i++) {
      // Salitan, at palit ang nauuna bawat round
      const order = (round + i) % 2 === 0 ? (['real', 'none'] as const) : (['none', 'real'] as const);
      for (const who of order) {
        const r = await post('/api/auth/login', { email: who === 'real' ? real : none, password: 'maling-password' });
        if (r.status !== 401) throw new Error(`Precondition: dapat 401, ${r.status} ang nakuha (${who})`);
        times[who].push(r.ms);
      }
    }
  }
} finally {
  await db.delete(users).where(eq(users.email, real));
  await db.delete(unknownLoginAttempts).where(eq(unknownLoginAttempts.emailHash, hashToken(none)));
  await db.$client.end();
}

const row = (name: string, xs: number[]) =>
  `${name.padEnd(16)} n=${xs.length}  median ${median(xs).toFixed(1)}ms  p10 ${pct(xs, 0.1).toFixed(1)}  p90 ${pct(xs, 0.9).toFixed(1)}`;
console.log(row('MAY account', times.real));
console.log(row('WALANG account', times.none));
console.log(`pagkakaiba ng median: ${(median(times.real) - median(times.none)).toFixed(1)}ms`);

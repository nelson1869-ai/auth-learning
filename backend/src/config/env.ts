import { z } from 'zod';

// Iisang lugar na sumusuri sa LAHAT ng env variable pagka-start (fail-fast).
// Kung may kulang o mali, hindi mag-i-start ang server — mas mabuti kaysa sa misteryosong error mamaya.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32), // maikling secret = madaling hulaan → tanggihan
  CLIENT_URL: z.url(), // ang frontend na pinapayagan ng CORS
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // true LANG kapag nasa likod ng Cloudflare Tunnel (production) at walang bukas na port ang backend:
  // doon lang mapagkakatiwalaan ang CF-Connecting-IP (ang totoong IP ng user) — kung hindi, kaya itong pekein
  TRUST_CLOUDFLARE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  const fields = z.flattenError(result.error).fieldErrors;
  throw new Error(`Invalid environment variables — check backend/.env: ${JSON.stringify(fields)}`);
}

// Typed na: env.JWT_SECRET ay `string` (hindi `string | undefined`)
export const env = result.data;

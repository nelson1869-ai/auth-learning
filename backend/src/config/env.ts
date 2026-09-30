import { createPrivateKey, type KeyObject } from 'node:crypto';
import { z } from 'zod';

// Iisang lugar na sumusuri sa LAHAT ng env variable pagka-start (fail-fast).
// Kung may kulang o mali, hindi mag-i-start ang server — mas mabuti kaysa sa misteryosong error mamaya.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // RS256 (Day 56): ang PRIVATE key na pumipirma ng access token — PEM, naka-base64 (isang linya sa .env).
  // Sinusuri pagka-start: tamang PEM, RSA, at ≥ 2048 bits. Ang public key ay kinukuha mula rito (lib/jwt.ts)
  JWT_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((value, ctx): KeyObject => {
      try {
        const key = createPrivateKey(Buffer.from(value, 'base64').toString('utf8'));
        const bits = key.asymmetricKeyDetails?.modulusLength ?? 0;
        if (key.asymmetricKeyType !== 'rsa' || bits < 2048) {
          ctx.addIssue({ code: 'custom', message: `Need an RSA key of at least 2048 bits (got ${key.asymmetricKeyType} ${bits})` });
          return z.NEVER;
        }
        return key;
      } catch {
        // Hindi ipinapakita ang laman — secret ito
        ctx.addIssue({ code: 'custom', message: 'Not a base64-encoded PEM private key' });
        return z.NEVER;
      }
    }),
  CLIENT_URL: z.url(), // ang frontend na pinapayagan ng CORS
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // true LANG kapag nasa likod ng Cloudflare Tunnel (production) at walang bukas na port ang backend:
  // doon lang mapagkakatiwalaan ang CF-Connecting-IP (ang totoong IP ng user) — kung hindi, kaya itong pekein
  TRUST_CLOUDFLARE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Email (Day 58). Resend API key (nagsisimula sa "re_"). Kapag wala: nilo-log lang ang email (dev at tests)
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  // Kanino galing ang email — dapat nasa domain na na-verify sa Resend (SPF/DKIM)
  EMAIL_FROM: z.string().default('auth-learning <no-reply@nelson1869.com>'),
  // Metrics (Day 81): hiwalay na port para sa /metrics (Prometheus). HINDI ito dinadaanan ng Cloudflare Tunnel (backend:3000 lang),
  // kaya hindi ito publiko — sa loob lang ng Docker network (at localhost sa dev)
  METRICS_PORT: z.coerce.number().int().min(1).max(65535).default(9464),
  // Rate limiter (Day 92): kapag may REDIS_URL, iisa ang bilang ng LAHAT ng kopya ng app (at hindi nare-reset sa bawat deploy).
  // Kapag wala: sa memory ng process (ayos lang sa iisang kopya — dev at tests)
  REDIS_URL: z.url({ protocol: /^rediss?$/ }).optional(),
})
  // Sa production, BAWAL walang email provider: kung hindi, tahimik na mawawala ang reset/verification emails
  .refine((env) => env.NODE_ENV !== 'production' || env.RESEND_API_KEY !== undefined, {
    path: ['RESEND_API_KEY'],
    message: 'Required in production (emails would silently go nowhere)',
  });

const result = envSchema.safeParse(process.env);
if (!result.success) {
  const fields = z.flattenError(result.error).fieldErrors;
  throw new Error(`Invalid environment variables — check backend/.env: ${JSON.stringify(fields)}`);
}

// Typed na: hal. env.CLIENT_URL ay `string` (hindi `string | undefined`), at env.JWT_PRIVATE_KEY ay KeyObject
export const env = result.data;

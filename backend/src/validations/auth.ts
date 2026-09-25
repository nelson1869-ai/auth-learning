import { z } from 'zod';

// Hugis ng tamang register input. Tinatanggal ni Zod ang ibang field (hal. "role": "admin")
export const registerSchema = z.object({
  // trim + lowercase: iisang account ang "Nelson@X.com" at "nelson@x.com"
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // max 128: para hindi mapahirapan ang argon2 ng napakahabang password
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

// Ang TypeScript type ay galing mismo sa schema (z.infer) — iisang source of truth:
// kapag binago ang schema, kusang nagbabago ang type
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

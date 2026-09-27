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

// Change password (Day 55): kailangan ang KASALUKUYANG password (reauthentication) — kahit may nakanakaw ng
// session ko, hindi niya mapapalitan ang password kung hindi niya ito alam. Ang bago: parehong patakaran ng register
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: registerSchema.shape.password,
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

// Password reset (Day 59)
export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) });
export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  newPassword: registerSchema.shape.password,
});

// Ang TypeScript type ay galing mismo sa schema (z.infer) — iisang source of truth:
// kapag binago ang schema, kusang nagbabago ang type
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

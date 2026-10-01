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

// Email verification (Day 60)
export const verifyEmailSchema = z.object({ token: z.string().min(1).max(200) });

// Passkeys (Day 95). Hakbang 1: kailangan ang KASALUKUYANG password (reauthentication, gaya ng change password — Day 55).
// Ang passkey ay isang bagong paraan ng pagpasok: kung sapat na ang session, ang nakaw na session ay makakapagdagdag ng
// sarili niyang passkey at mananatili sa account kahit palitan pa ang password
export const passkeyRegisterOptionsSchema = z.object({ currentPassword: z.string().min(1).max(128) });

// Hakbang 2: ang sagot ng browser (`navigator.credentials.create()` → JSON). Hugis at haba lang ang sinusuri dito;
// ang LAMAN (challenge, origin, pirma) ay sinusuri ng @simplewebauthn/server. base64url lang ang tinatanggap na mga titik
const base64url = (max: number) => z.string().min(1).max(max).regex(/^[A-Za-z0-9_-]+$/);
export const passkeyRegisterVerifySchema = z.object({
  name: z.string().trim().min(1).max(50).optional(), // pangalan sa listahan, hal. "Laptop ko"
  response: z.object({
    id: base64url(1024),
    rawId: base64url(1024),
    type: z.literal('public-key'),
    response: z.object({
      clientDataJSON: base64url(4096),
      attestationObject: base64url(16384),
      transports: z.array(z.string().max(32)).max(10).optional(),
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  }),
});

// Login gamit ang passkey (Day 97). Opsyonal ang email: kapag wala, ang DEVICE ang magsasabi kung kaninong account
// (discoverable — `residentKey: required` sa registration). Kapag mayroon: ang mga passkey lang ng account na iyon (o decoy)
export const passkeyLoginOptionsSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()).optional() });

export const passkeyLoginVerifySchema = z.object({
  response: z.object({
    id: base64url(1024),
    rawId: base64url(1024),
    type: z.literal('public-key'),
    response: z.object({
      clientDataJSON: base64url(4096),
      authenticatorData: base64url(4096),
      signature: base64url(1024),
      userHandle: base64url(256).optional(), // ang user id na itinago ng device noong registration
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  }),
});


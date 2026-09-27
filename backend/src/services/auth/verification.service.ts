import { env } from '../../config/env.ts';
import { passwordResetEmail, sendEmail, verifyEmailEmail } from '../../lib/email.ts';
import { RESET_TOKEN_TTL_MS, VERIFY_TOKEN_TTL_MS, createVerificationToken } from '../../lib/verificationTokens.ts';

// Mga email na may link (Day 59–60). Walang Express dito: ang controller ang nagpapasya KAILAN (hal. pagkatapos sumagot)

// Link para i-verify ang email (pagka-register, at sa "Ipadala ulit")
export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const token = await createVerificationToken(userId, 'email_verification', VERIFY_TOKEN_TTL_MS);
  // #fragment (Day 59): hindi napupunta sa kahit anong server ang token
  await sendEmail(verifyEmailEmail(email, `${env.CLIENT_URL}/verify-email#token=${token}`));
}

// Link para palitan ang password
export async function sendPasswordResetEmail(userId: number, email: string): Promise<void> {
  const token = await createVerificationToken(userId, 'password_reset', RESET_TOKEN_TTL_MS);
  await sendEmail(passwordResetEmail(email, `${env.CLIENT_URL}/reset-password#token=${token}`));
}

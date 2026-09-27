import { env } from '../config/env.ts';
import { logger } from './logger.ts';

// Email (Day 58) — "transactional" na email: isang tao, isang dahilan (reset, verification), hindi marketing.
// Dalawang paraan ng pagpapadala (transport):
//   Resend  — kapag may RESEND_API_KEY (production): totoong email, galing sa na-verify na domain
//   log     — kapag wala (dev at tests): isinusulat lang sa log, walang totoong ipinapadala
// Pareho ang tawag ng lahat (`sendEmail`) — walang kailangang malaman ang tumatawag kung alin

export type Email = { to: string; subject: string; text: string };
type Transport = (email: Email) => Promise<void>;

// a***@gmail.com — hindi buong email sa logs (personal na data)
export function maskEmail(address: string): string {
  const [name = '', domain = ''] = address.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
}

// Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email) — fetch lang, walang library.
// Hiwalay na factory para masubukan nang walang totoong network (email.test.ts)
export function createResendTransport(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): Transport {
  return async ({ to, subject, text }) => {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000), // huwag maghintay nang walang hanggan (natutunan sa Day 41)
    });
    if (!res.ok) {
      // Ang mensahe ng Resend (hal. "domain is not verified") — walang API key dito
      const detail = (await res.text()).slice(0, 200);
      throw new Error(`Resend ${res.status}: ${detail}`);
    }
    const { id } = (await res.json()) as { id?: string };
    logger.info({ event: 'email_sent', to: maskEmail(to), subject, id }, 'Email sent');
  };
}

// Sa tests: nakatabi rito ang mga "ipinadalang" email, para mabasa ng test ang link
export const testOutbox: Email[] = [];

const logTransport: Transport = async (email) => {
  if (env.NODE_ENV === 'test') {
    testOutbox.push(email);
    return;
  }
  // Dev lang: buong laman (kasama ang link) — para makopya mo ang link habang nagte-test
  logger.info({ event: 'email_logged', to: email.to, subject: email.subject, text: email.text }, '📧 Email (hindi ipinadala — walang RESEND_API_KEY)');
};

const transport: Transport = env.RESEND_API_KEY ? createResendTransport(env.RESEND_API_KEY, env.EMAIL_FROM) : logTransport;

export function sendEmail(email: Email): Promise<void> {
  return transport(email);
}

// ---------------------------------------------------------------------------------------------
// Mga email ng app (Day 59). Malinaw na transactional: kanino, bakit, ano ang gagawin, at "kung hindi ikaw…"
// (Day 58: ang "test", emoji at hindi malinaw na laman ay itinuring na spam)
export function passwordResetEmail(to: string, link: string): Email {
  return {
    to,
    subject: 'Reset your auth-learning password',
    text: [
      'Hi,',
      '',
      'Someone asked to reset the password for your auth-learning account.',
      'To choose a new password, open this link (it works once and expires in 1 hour):',
      '',
      link,
      '',
      'If you did not ask for this, you can ignore this email. Your password will not change.',
      '',
      '— auth-learning',
    ].join('\n'),
  };
}


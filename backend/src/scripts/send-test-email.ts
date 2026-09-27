import { sendEmail } from '../lib/email.ts';
import { env } from '../config/env.ts';

// Magpadala ng test email (Day 58) — para masubukan ang provider at ang deliverability (SPF/DKIM).
//   dev:         npm run email:test -- ikaw@gmail.com        (walang RESEND_API_KEY → nilo-log lang)
//   production:  docker run --rm --env-file ../backend/.env.production <image> node src/scripts/send-test-email.ts ikaw@gmail.com
// Script lang ito, hindi endpoint: kapag endpoint, kayang gamitin ng kahit sino para magpadala ng email sa kahit sino (spam)
const to = process.argv[2] ?? '';
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
  console.error('Usage: send-test-email.ts <email>');
  process.exit(1);
}
// Ang laman ay parang tunay na transactional email: malinaw kung kanino, bakit, at ano ang gagawin.
// (Day 58: ang unang bersyon — may "test", emoji, at "Spam/SPF/DKIM" sa laman — ay napunta sa Spam ng Gmail
// kahit PASS ang SPF, DKIM at DMARC: "similar to messages that were identified as spam")
await sendEmail({
  to,
  subject: 'Your auth-learning email is set up',
  text: [
    'Hi,',
    '',
    'This message confirms that auth-learning can send email to this address.',
    'You will receive password reset and email verification messages from this sender.',
    '',
    `Sender: ${env.EMAIL_FROM}`,
    '',
    'If you did not expect this message, you can ignore it.',
    '',
    '— auth-learning',
  ].join('\n'),
});
console.log(`✅ ${env.RESEND_API_KEY ? 'Naipadala sa Resend' : 'Nilo-log lang (walang RESEND_API_KEY)'} → ${to}`);

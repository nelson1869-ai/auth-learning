import { describe, it, expect, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createResendTransport, maskEmail, sendEmail, testOutbox } from './email.ts';

const EMAIL = { to: 'ana@example.com', subject: 'Hello', text: 'Test body' };

// Email (Day 58) — walang totoong email mula sa tests: pekeng fetch
describe('Resend transport', () => {
  it('POSTs the email to Resend with the API key and the verified sender', async () => {
    const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 }));
    await createResendTransport('re_test_key', 'auth-learning <no-reply@nelson1869.com>', fakeFetch)(EMAIL);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = fakeFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');
    expect(JSON.parse(String(init.body))).toEqual({
      from: 'auth-learning <no-reply@nelson1869.com>',
      to: ['ana@example.com'],
      subject: 'Hello',
      text: 'Test body',
    });
    expect(init.signal).toBeInstanceOf(AbortSignal); // may timeout
  });

  it("throws with Resend's message on an error — never with the API key", async () => {
    const fakeFetch = vi.fn(async () => new Response('{"message":"The nelson1869.com domain is not verified"}', { status: 403 }));
    const send = createResendTransport('re_secret_key_123', 'x <no-reply@nelson1869.com>', fakeFetch);
    await expect(send(EMAIL)).rejects.toThrow(/Resend 403: .*not verified/);
    await expect(send(EMAIL)).rejects.not.toThrow(/re_secret_key_123/);
  });
});

describe('in tests (no RESEND_API_KEY)', () => {
  it('sends nothing for real — the email goes to the test outbox', async () => {
    await sendEmail({ ...EMAIL, subject: 'outbox check' });
    expect(testOutbox.at(-1)).toMatchObject({ subject: 'outbox check', to: 'ana@example.com' });
  });
});

describe('maskEmail', () => {
  it('keeps only the first letter and the domain (for logs)', () => {
    expect(maskEmail('nelson@gmail.com')).toBe('n***@gmail.com');
  });
});

// Fail-fast: ang production na walang email provider ay ayaw mag-start
describe('RESEND_API_KEY in production', () => {
  function startAs(extra: Record<string, string>): string {
    const env = { ...process.env, ...extra };
    if (!('RESEND_API_KEY' in extra)) delete env.RESEND_API_KEY;
    try {
      execFileSync(process.execPath, ['-e', "await import('./src/config/env.ts')"], { env, stdio: 'pipe', input: '' });
      return 'started';
    } catch (err) {
      return String((err as { stderr?: Buffer }).stderr ?? err);
    }
  }

  it('refuses to start in production without it', () => {
    expect(startAs({ NODE_ENV: 'production' })).toContain('Required in production');
  });

  it('starts in production with a key, and in development without one', () => {
    expect(startAs({ NODE_ENV: 'production', RESEND_API_KEY: 're_fake_for_test' })).toBe('started');
    expect(startAs({ NODE_ENV: 'development' })).toBe('started');
  });

  it('refuses a value that is not a Resend key', () => {
    expect(startAs({ NODE_ENV: 'production', RESEND_API_KEY: 'hindi-resend-key' })).toContain('RESEND_API_KEY');
  });
});

import { describe, it, expect } from 'vitest';
import { pino } from 'pino';
import { loggerOptions } from './logger.ts';

// Parehong options ng totoong logger, pero isinusulat sa array (hindi sa terminal) para mabasa ng test
function captureLogger() {
  const lines: string[] = [];
  const log = pino({ ...loggerOptions, level: 'info' }, { write: (line: string) => lines.push(line) });
  return { log, lines };
}

describe('logger redaction', () => {
  it('hides cookies, authorization and set-cookie headers', () => {
    const { log, lines } = captureLogger();
    log.info({
      req: { headers: { cookie: 'token=secret-jwt', authorization: 'Bearer secret-jwt', host: 'x' } },
      res: { headers: { 'set-cookie': 'token=secret-jwt' } },
    });
    expect(lines[0]).not.toContain('secret-jwt');
    expect(lines[0]).toContain('[REDACTED]');
    expect(lines[0]).toContain('"host":"x"'); // ang ibang header ay nandoon pa rin
  });

  it('hides a password even if a whole body is logged by mistake', () => {
    const { log, lines } = captureLogger();
    log.info({ body: { email: 'a@example.com', password: 'Sup3r-secret!' } });
    expect(lines[0]).not.toContain('Sup3r-secret!');
    expect(lines[0]).toContain('a@example.com');
  });
});

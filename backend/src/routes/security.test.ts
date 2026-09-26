import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.ts';

// Secure headers (helmet) — sa bawat sagot ng API
describe('security headers', () => {
  it('sets the helmet headers and hides the server technology', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined(); // hindi "Express"
    expect(res.headers['x-content-type-options']).toBe('nosniff'); // huwag hulaan ang uri ng file
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN'); // hindi mailalagay sa iframe ng iba
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/); // HTTPS lang sa susunod
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
});

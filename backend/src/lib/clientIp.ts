import type { IncomingMessage } from 'node:http';

// Ang TOTOONG IP ng client (Day 42 — hinango mula sa rateLimiter.ts ng Day 43, para iisa ang patakaran
// ng rate limiter at ng logs).
// Sa likod ng tunnel, IP ng cloudflared container ang req.ip ng LAHAT ng user — kaya ang totoong IP ay
// nasa CF-Connecting-IP (idinadagdag ng Cloudflare). Kung hindi sa likod ng Cloudflare, huwag
// pagkatiwalaan ang header na iyon: kayang pekein ng kahit sino
export function clientIp(req: IncomingMessage & { ip?: string }, trustCloudflare: boolean): string {
  const cfIp = req.headers['cf-connecting-ip'];
  return trustCloudflare && typeof cfIp === 'string' ? cfIp : (req.ip ?? 'unknown');
}

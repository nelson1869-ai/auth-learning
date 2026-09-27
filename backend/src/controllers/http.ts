import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { clientIp } from '../lib/clientIp.ts';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS, type Device } from '../lib/session.ts';
import { DEVICE_COOKIE, DEVICE_TTL_MS } from '../lib/trustedDevices.ts';

// Mga pirasong pang-HTTP na ginagamit ng lahat ng controller (Day 74): cookies, validation, at ang device ng request.
// Dito lang (at sa mga controller) ang `req`/`res` — ang mga service ay walang alam sa Express

// Iisang settings para sa pag-set (login) AT pag-clear (logout) ng cookie — dapat magkapareho,
// kung hindi, may mga browser na hindi magbubura ng cookie
export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // hindi mababasa ng JavaScript sa browser — hindi manakaw ng XSS
  sameSite: 'lax', // hindi ipinapadala sa POST mula sa ibang website
  secure: env.NODE_ENV === 'production', // HTTPS lang kapag naka-deploy
};

// Refresh token (Day 51): ipinapadala LANG sa /api/auth/* (refresh, logout) — hindi sa bawat request.
// Mas kaunting daan = mas kaunting pagkakataong manakaw
export const REFRESH_COOKIE_OPTIONS: CookieOptions = { ...COOKIE_OPTIONS, path: '/api/auth' };

// Device cookie (Day 64): ipinapadala LANG sa /api/auth/login — iyon lang ang nagbabasa nito. 180 araw
export const DEVICE_COOKIE_OPTIONS: CookieOptions = { ...COOKIE_OPTIONS, path: '/api/auth/login', maxAge: DEVICE_TTL_MS };

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_TTL_MS });
}

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refresh_token', refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
}

export function setDeviceCookie(res: Response, deviceToken: string) {
  res.cookie(DEVICE_COOKIE, deviceToken, DEVICE_COOKIE_OPTIONS);
}

export function clearSessionCookies(res: Response) {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS); // parehong path, kung hindi hindi mabubura
}

// Ang device ng request (Day 54): anong browser (pinutol — galing sa client) at ang totoong IP
export function deviceOf(req: Request): Device {
  return { userAgent: req.headers['user-agent']?.slice(0, 300) ?? null, ip: clientIp(req, env.TRUST_CLOUDFLARE) };
}

// Suriin ang input gamit ang Zod. Mali → 400 na may fields (at undefined ang ibinabalik — tapos na ang sagot).
// Tama → ang NALINIS na data. Ito lang ang ipinapasa sa service, hindi kailanman ang `req.body` (Day 77: mass assignment)
export function parseOr400<T extends z.ZodType>(schema: T, input: unknown, res: Response): z.infer<T> | undefined {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  return undefined;
}

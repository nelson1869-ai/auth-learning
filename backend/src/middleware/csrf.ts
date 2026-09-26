import type { RequestHandler } from 'express';
import { env } from '../config/env.ts';
import { logger } from '../lib/logger.ts';

// CSRF protection (Day 44) — Origin check (D-022).
//
// Ang CSRF: isang masamang site ang nagpapadala ng request sa API natin gamit ang browser ng biktima,
// at kusang isinasama ng browser ang cookie niya. Ang mga depensa natin na nasubukan na (Day 44):
//   1. SameSite=Lax na cookie — hindi ipinapadala mula sa IBANG site (hal. evil.com)
//   2. JSON lang ang tinatanggap — hindi makakapagpadala ng JSON ang HTML form
//   3. CORS — hinaharang ng browser ang fetch na may JSON mula sa ibang origin
// Ang butas: para sa SameSite, "parehong site" ang lahat ng *.nelson1869.com. Kapag na-hack ang isang
// subdomain, maipapadala na ang cookie. Kaya dito: ang frontend LANG ang puwedeng magpadala.

// Hindi nagbabago ng data ang mga ito — hindi kailangang suriin
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// new URL(...).origin: "https://nelson1869.com" — kahit may "/" sa dulo ang CLIENT_URL
const ALLOWED_ORIGIN = new URL(env.CLIENT_URL).origin;

export const requireSameOrigin: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  // Origin: kusang inilalagay ng browser sa bawat POST — HINDI ito mababago ng JavaScript ng attacker
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) return next();

  // Walang Origin at walang Sec-Fetch-Site → hindi browser (curl, REST Client, tests).
  // Walang biktimang browser na may cookie → walang CSRF
  const fetchSite = req.headers['sec-fetch-site'];
  if (origin === undefined && (fetchSite === undefined || fetchSite === 'same-origin' || fetchSite === 'none')) {
    return next();
  }

  // Ibang site, ibang subdomain, o "null" (hal. sandboxed iframe) → harangin, BAGO pa basahin ang body
  (req.log ?? logger).warn({ event: 'csrf_blocked', origin, fetchSite, path: req.path }, 'Cross-site request blocked');
  res.status(403).json({ error: 'Forbidden' });
};

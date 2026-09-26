import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';

// Ang user id mula sa token — o undefined kapag walang token, binago, expired, o sira.
// Hiwalay na function (Day 48) para magamit din ng logout, na hindi nangangailangan ng login
export function userIdFromToken(token: unknown): number | undefined {
  if (typeof token !== 'string') return undefined;
  // try/catch: nagtatapon ng error ang jwt.verify kapag binago ang token o expired na
  try {
    // algorithms: HS256 lang ang tatanggapin — hindi malilinlang sa pagpalit ng "alg" sa header
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    // Nahuli ng TypeScript: puwedeng string ang payload, o walang `sub` — tanggihan ang dalawa
    if (typeof payload === 'string' || !payload.sub) return undefined;
    return Number(payload.sub); // "32" → 32
  } catch {
    return undefined;
  }
}

// Middleware: dinadaanan BAGO ang route. next() = pasado, tuloy; walang next() = hanggang dito lang
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = userIdFromToken(req.cookies.token); // galing sa cookieParser (Day 16)
  if (userId === undefined) {
    // Iisang sagot para sa walang token, binago, expired, o sira — hindi sinasabi kung alin
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = userId; // para magamit ng route
  next();
}

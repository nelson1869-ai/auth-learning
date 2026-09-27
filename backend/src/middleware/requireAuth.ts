import type { Request, Response, NextFunction } from 'express';
import { userIdFromAccessToken } from '../lib/jwt.ts';

// Middleware: dinadaanan BAGO ang route. next() = pasado, tuloy; walang next() = hanggang dito lang
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Ang pagsusuri ng token ay nasa lib/jwt.ts (Day 56: RS256 + iss/aud). Ang cookie ay galing sa cookieParser (Day 16)
  const userId = userIdFromAccessToken(req.cookies.token);
  if (userId === undefined) {
    // Iisang sagot para sa walang token, binago, expired, o sira — hindi sinasabi kung alin
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = userId; // para magamit ng route
  next();
}

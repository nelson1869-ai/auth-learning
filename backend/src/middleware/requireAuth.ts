import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';

// Middleware: dinadaanan BAGO ang route. next() = pasado, tuloy; walang next() = hanggang dito lang
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies.token; // galing sa cookieParser (Day 16)
  if (typeof token !== 'string') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // try/catch: nagtatapon ng error ang jwt.verify kapag binago ang token o expired na
  try {
    // algorithms: HS256 lang ang tatanggapin — hindi malilinlang sa pagpalit ng "alg" sa header
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    // Nahuli ng TypeScript: puwedeng string ang payload, o walang `sub` — tanggihan ang dalawa
    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    req.userId = Number(payload.sub); // "32" → 32, para magamit ng route
    next();
  } catch {
    // Iisang sagot para sa binago, expired, o sirang token — hindi sinasabi kung alin
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

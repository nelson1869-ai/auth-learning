import type { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, type Role } from '../db/schema.ts';
import { logger } from '../lib/logger.ts';

// Authorization (Day 46) — "ANO ang pinapayagan sa iyo?" Laging pagkatapos ng requireAuth ("SINO ka?").
//   401 = hindi ka kilala (walang login / sirang token / nabura ang account)
//   403 = kilala ka, pero BAWAL ka rito
//
// Ang role ay binabasa sa DATABASE sa bawat request, hindi sa JWT. Kapag nasa JWT ito (tulad ng reference),
// luma ito hanggang mag-expire ang token: ang tinanggalan ng admin ay admin pa rin nang hanggang 1 oras.
// Isang maliit na query lang ito, at sa admin routes lang
export function requireRole(...allowed: Role[]): RequestHandler {
  return async (req, res, next) => {
    const userId = req.userId;
    if (userId === undefined) {
      // Hindi dumaan sa requireAuth — pagkakamali ng programmer; ligtas na tanggihan
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!user) {
      // Tama ang token, pero nabura na ang account — pareho ng /me
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowed.includes(user.role)) {
      // Security event: may naka-login na sumubok pumasok sa admin — itala (makikita sa logs, Day 42)
      (req.log ?? logger).warn({ event: 'forbidden', userId, role: user.role, path: req.originalUrl }, 'Forbidden');
      // Hindi sinasabi kung anong role ang kailangan (ang reference ay sinasabi) — hindi kailangang malaman
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

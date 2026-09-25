import { Router } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { registerSchema, loginSchema } from '../validations/auth.ts';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Iisang settings para sa pag-set (login) AT pag-clear (logout) ng cookie — dapat magkapareho,
// kung hindi, may mga browser na hindi magbubura ng cookie
const COOKIE_OPTIONS = {
  httpOnly: true, // hindi mababasa ng JavaScript sa browser — hindi manakaw ng XSS
  sameSite: 'lax', // hindi ipinapadala sa POST mula sa ibang website
  secure: process.env.NODE_ENV === 'production', // HTTPS lang kapag naka-deploy
};

router.post('/auth/register', async (req, res) => {
  // Suriin at linisin ang input BAGO gamitin — maling input = 400, hindi 500
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid input',
      fields: z.flattenError(result.error).fieldErrors,
    });
  }
  const { email, password, name } = result.data; // ang NALINIS na data, hindi req.body

  // Hash BAGO i-save — hindi kailanman plain text sa database
  const passwordHash = await argon2.hash(password);

  try {
    // INSERT agad, walang "SELECT muna" — ang UNIQUE ng database ang huling bantay (kahit sabay ang 2 request)
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      // Piling column lang — hindi dapat lumabas ang password_hash kahit hash pa
      .returning({ id: users.id, email: users.email, name: users.name });
    res.status(201).json({ user });
  } catch (err) {
    // 23505 = unique violation ng Postgres. Nasa err.cause, hindi err.code (binabalot ni Drizzle)
    if (err.cause?.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err; // ibang error → hayaan si Express (500)
  }
});

// Pang-verify kapag walang account — para pareho ang tagal (~50ms) ng sagot, may account man o wala.
// Kung wala ito, mas mabilis ang 401 ng email na walang account → malalaman ng attacker kung sino ang may account.
const DUMMY_HASH = await argon2.hash('dummy-password-para-sa-timing');

router.post('/auth/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid input',
      fields: z.flattenError(result.error).fieldErrors,
    });
  }
  const { email, password } = result.data; // lowercase na ang email (Zod)

  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Laging may verify — totoong hash kung may user, DUMMY_HASH kung wala
  const ok = await argon2.verify(user ? user.passwordHash : DUMMY_HASH, password);
  if (!user || !ok) {
    // Iisang mensahe para sa maling email AT maling password — hindi sinasabi kung may account
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Id lang (sub) ang laman — nababasa ng KAHIT SINO ang payload ng JWT (base64 lang, hindi encrypted)
  const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // maxAge: 1 oras, sa millisecond — kapareho ng expiresIn ng JWT
  res.cookie('token', token, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 1000 });

  // Piling field lang — hindi kasama ang passwordHash
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// requireAuth muna: kung walang tamang token, hindi na aabot dito (401)
router.get('/auth/me', requireAuth, async (req, res) => {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, req.userId));

  if (!user) {
    // tama ang token, pero nabura na ang user
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Galing sa database, hindi sa token — laging bago (hal. kung pinalitan ang name)
  res.json({ user });
});

// Walang requireAuth: laging puwedeng burahin ang sariling cookie, kahit expired na ang token.
// ⚠️ Sa browser lang nabubura — kung may nakakopya ng token, valid pa ito hanggang mag-expire (D-012)
router.post('/auth/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(204).end(); // 204 = nagawa, walang body
});

export default router;


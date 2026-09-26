import { Router } from 'express';
import type { CookieOptions, RequestHandler, Response } from 'express';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { registerSchema, loginSchema } from '../validations/auth.ts';
import { requireAuth, userIdFromToken } from '../middleware/requireAuth.ts';
import { audit } from '../lib/audit.ts';
import { logger } from '../lib/logger.ts';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  createRefreshToken,
  revokeFamilyOf,
  rotateRefreshToken,
  signAccessToken,
} from '../lib/session.ts';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.ts';
import { env } from '../config/env.ts';

const router = Router();

// Walang limiter sa tests (undefined) — pass-through na middleware
const pass: RequestHandler = (_req, _res, next) => next();

// 🔐 Walang cache sa kahit anong sagot ng auth (user data, login, cookies) — hindi dapat itago
// ng browser o ng CDN; kung hindi, puwedeng makita ng susunod na gumamit ang data ng iba
router.use('/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Sa catch, `unknown` ang error — suriin muna ang hugis bago basahin (nahuli ng TypeScript)
function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    typeof err.cause === 'object' &&
    err.cause !== null &&
    'code' in err.cause &&
    err.cause.code === '23505'
  );
}

// Iisang settings para sa pag-set (login) AT pag-clear (logout) ng cookie — dapat magkapareho,
// kung hindi, may mga browser na hindi magbubura ng cookie
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // hindi mababasa ng JavaScript sa browser — hindi manakaw ng XSS
  sameSite: 'lax', // hindi ipinapadala sa POST mula sa ibang website
  secure: env.NODE_ENV === 'production', // HTTPS lang kapag naka-deploy
};

// Refresh token (Day 51): ipinapadala LANG sa /api/auth/* (refresh, logout) — hindi sa bawat request.
// Mas kaunting daan = mas kaunting pagkakataong manakaw
const REFRESH_COOKIE_OPTIONS: CookieOptions = { ...COOKIE_OPTIONS, path: '/api/auth' };

function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_TTL_MS });
}

function clearSessionCookies(res: Response) {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS); // parehong path, kung hindi hindi mabubura
}

router.post('/auth/register', registerLimiter ?? pass, async (req, res) => {
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
    await audit(req, { action: 'register', actorId: user.id, targetId: user.id });
    res.status(201).json({ user });
  } catch (err) {
    // 23505 = unique violation ng Postgres. Nasa err.cause, hindi err.code (binabalot ni Drizzle)
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err; // ibang error → hayaan si Express (500)
  }
});

// Pang-verify kapag walang account — para pareho ang tagal (~50ms) ng sagot, may account man o wala.
// Kung wala ito, mas mabilis ang 401 ng email na walang account → malalaman ng attacker kung sino ang may account.
const DUMMY_HASH = await argon2.hash('dummy-password-para-sa-timing');

router.post('/auth/login', loginLimiter ?? pass, async (req, res) => {
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
    // Audit (Day 48): target = ang account na sinubukang pasukin (kung mayroon), at ang email na tinype.
    // Itinatala sa DALAWANG kaso (may account o wala) — kaya pareho pa rin ang tagal ng sagot
    await audit(req, { action: 'login_failed', targetId: user?.id ?? null, metadata: { email } });
    // Iisang mensahe para sa maling email AT maling password — hindi sinasabi kung may account
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Dalawang token (Day 51): maikling access token (JWT, 15 min) + mahabang refresh token (7 araw, nasa DB)
  setAccessCookie(res, signAccessToken(user.id));
  const refreshToken = await createRefreshToken(user.id);
  res.cookie('refresh_token', refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
  await audit(req, { action: 'login', actorId: user.id, targetId: user.id });

  // Piling field lang — hindi kasama ang passwordHash
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// requireAuth muna: kung walang tamang token, hindi na aabot dito (401)
router.get('/auth/me', requireAuth, async (req, res) => {
  // Nilagay ng requireAuth — pero `number | undefined` ang type, kaya suriin (walang `!` na hula)
  const userId = req.userId;
  if (userId === undefined) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const [user] = await db
    // + role (Day 49): para malaman ng frontend kung ipapakita ang Admin link. UX lang iyon —
    // ang requireRole ng backend pa rin ang tunay na bantay sa /api/admin/*
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    // tama ang token, pero nabura na ang user
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Galing sa database, hindi sa token — laging bago (hal. kung pinalitan ang name)
  res.json({ user });
});

// Bagong access token gamit ang refresh token (Day 51). Tinatawag ng frontend kapag 401 ang isang request.
// Walang body — ang refresh_token cookie lang (Path=/api/auth, kaya dito lang ito ipinapadala).
// Day 52: bawat refresh ay may BAGONG refresh token (rotation); ang paggamit ulit ng luma = nakaw
router.post('/auth/refresh', async (req, res) => {
  const raw: unknown = req.cookies.refresh_token;
  const result = typeof raw === 'string' ? await rotateRefreshToken(raw) : ({ status: 'invalid' } as const);

  if (result.status === 'rotated') {
    setAccessCookie(res, signAccessToken(result.userId));
    res.cookie('refresh_token', result.refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
    return res.status(204).end();
  }
  if (result.status === 'grace') {
    // Sabay na refresh (hal. dalawang tab): access token lang — ang bagong refresh token ay nasa cookie na
    // mula sa unang request. HINDI ginagalaw ang refresh_token cookie
    setAccessCookie(res, signAccessToken(result.userId));
    return res.status(204).end();
  }
  if (result.status === 'reused') {
    // Security event: sa logs (Day 42) at sa audit log (Day 48)
    (req.log ?? logger).warn({ event: 'refresh_reuse', userId: result.userId }, 'Refresh token reuse — family revoked');
    await audit(req, { action: 'refresh_reuse', targetId: result.userId });
  }
  // Wala, binawi, expired, pekeng token, o nakaw — burahin ang mga cookie para hindi na subukan ulit ng browser
  clearSessionCookies(res);
  res.status(401).json({ error: 'Not authenticated' });
});

// Walang requireAuth: laging gumagana ang logout, kahit expired na ang access token.
// Day 53 — totoong logout: binabawi ang refresh token sa DATABASE. Kahit may nakakopya nito, hindi na ito gagana.
// ⚠️ Ang access token (JWT) ay valid pa hanggang mag-expire (≤ 15 min) — hindi ito naka-save, kaya hindi mababawi
router.post('/auth/logout', async (req, res) => {
  const raw: unknown = req.cookies.refresh_token;
  const revokedFor = typeof raw === 'string' ? await revokeFamilyOf(raw) : undefined;
  // Sino ang nag-logout? Mula sa access token kung valid pa, o mula sa binawing refresh token; kung wala, null
  const userId = userIdFromToken(req.cookies.token) ?? revokedFor ?? null;
  await audit(req, { action: 'logout', actorId: userId, targetId: userId });
  clearSessionCookies(res); // pareho ng access at refresh (Day 51)
  res.status(204).end(); // 204 = nagawa, walang body
});

export default router;


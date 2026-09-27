import { Router } from 'express';
import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import argon2 from 'argon2';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/auth.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import { signAccessToken, userIdFromAccessToken } from '../lib/jwt.ts';
import { audit } from '../lib/audit.ts';
import { clientIp } from '../lib/clientIp.ts';
import { logger } from '../lib/logger.ts';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  createRefreshToken,
  familyOf,
  listSessions,
  revokeAllSessions,
  revokeFamilyOf,
  revokeSession,
  rotateRefreshToken,
  type Device,
} from '../lib/session.ts';
import {
  changePasswordLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimiter.ts';
import { passwordResetEmail, sendEmail, verifyEmailEmail } from '../lib/email.ts';
import { lockCounter, lockedUntilOf, MAX_FAILED_LOGINS, reserveAttempt, resetCounter } from '../lib/loginLockout.ts';
import type { LockCounter } from '../lib/loginLockout.ts';
import { createTrustedDevice, DEVICE_COOKIE, DEVICE_TTL_MS, findTrustedDevice, revokeAllTrustedDevices } from '../lib/trustedDevices.ts';
import { runInBackground } from '../lib/background.ts';
import {
  RESET_TOKEN_TTL_MS,
  VERIFY_TOKEN_TTL_MS,
  claimVerificationToken,
  createVerificationToken,
  isVerificationTokenUsable,
} from '../lib/verificationTokens.ts';
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

// Device cookie (Day 64): ipinapadala LANG sa /api/auth/login — iyon lang ang nagbabasa nito. 180 araw
const DEVICE_COOKIE_OPTIONS: CookieOptions = { ...COOKIE_OPTIONS, path: '/api/auth/login', maxAge: DEVICE_TTL_MS };

function setAccessCookie(res: Response, accessToken: string) {
  res.cookie('token', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_TTL_MS });
}

// Ang device ng request (Day 54): anong browser (pinutol — galing sa client) at ang totoong IP
function deviceOf(req: Request): Device {
  return { userAgent: req.headers['user-agent']?.slice(0, 300) ?? null, ip: clientIp(req, env.TRUST_CLOUDFLARE) };
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
    // Day 60: email na may verification link — pagkatapos sumagot (hindi naghihintay ang register sa Resend)
    runInBackground('verify_email', () => sendVerificationEmail(user.id, user.email));
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

  // Day 64: may valid na device cookie ba ang browser na ito PARA SA ACCOUNT NA ITO? → sariling bilang ng device.
  // Wala (bagong browser, attacker, cookie ng ibang account) → ang bilang ng account
  const device = user ? await findTrustedDevice(req.cookies[DEVICE_COOKIE], user.id) : undefined;
  const counter: LockCounter | undefined = device
    ? { scope: 'device', id: device.id }
    : user
      ? { scope: 'account', id: user.id }
      : undefined;

  // 423 (Day 63): kahit TAMA ang password — hindi na sinusuri ang hula habang naka-lock.
  // Tandaan: ang 423 ay nagsasabing MAY account ang email na ito — aayusin sa Phase 15 (anti-enumeration)
  async function locked(lockedCounter: LockCounter, userId: number) {
    await audit(req, { action: 'login_failed', targetId: userId, metadata: { email, reason: 'locked', scope: lockedCounter.scope } });
    const until = await lockedUntilOf(lockedCounter);
    if (until) res.setHeader('Retry-After', String(Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000))));
    return res.status(423).json({ error: 'Account temporarily locked. Please try again later.' });
  }

  // Day 67 — RESERVE-THEN-VERIFY: kunin muna ang numero ng subok (atomic, sa database), BAGO ang argon2
  let attempt = 0;
  if (user && counter) {
    const reserved = await reserveAttempt(counter);
    if (reserved === null) return locked(counter, user.id); // naka-lock na
    if (reserved > MAX_FAILED_LOGINS) {
      // Sabay-sabay na hula na lampas sa 5: hindi na sinusuri ang password. Siguraduhing naka-lock
      // (kung sakaling pumalya ang request na dapat mag-lock)
      if (await lockCounter(counter)) {
        await audit(req, { action: 'account_locked', targetId: user.id, metadata: { email, attempts: reserved, scope: counter.scope } });
      }
      return locked(counter, user.id);
    }
    attempt = reserved;
  }

  // Laging may verify — totoong hash kung may user, DUMMY_HASH kung wala
  const ok = await argon2.verify(user ? user.passwordHash : DUMMY_HASH, password);
  if (!user || !counter || !ok) {
    // Audit (Day 48): target = ang account na sinubukang pasukin (kung mayroon), at ang email na tinype.
    // Itinatala sa DALAWANG kaso (may account o wala) — kaya pareho pa rin ang tagal ng sagot
    await audit(req, { action: 'login_failed', targetId: user?.id ?? null, metadata: { email } });
    // Ang ika-5 maling hula ang nagla-lock (isang beses lang ang audit, kahit sabay)
    if (user && counter && attempt >= MAX_FAILED_LOGINS && (await lockCounter(counter))) {
      await audit(req, { action: 'account_locked', targetId: user.id, metadata: { email, attempts: attempt, scope: counter.scope } });
    }
    // Iisang mensahe para sa maling email AT maling password — hindi sinasabi kung may account
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Tamang password → balik sa 0 ang bilang na ginamit (sunod-sunod na mali lang ang binibilang, hindi ang kabuuan)
  await resetCounter(counter);

  // Day 68 — LAHAT NG PAGSULAT MUNA, SAKA ANG COOKIES. Dati: naka-set na ang `token` cookie BAGO i-save ang refresh token.
  // Kapag pumalya ang pag-save → 500, pero dala ng sagot ang cookie: "nabigo" ang login pero naka-login ka nang 15 minuto,
  // at walang `login` sa audit (nahuli ng transactions.test.ts). Ngayon: iisang transaction ang dalawang row (lahat o wala)
  const { refreshToken, deviceToken } = await db.transaction(async (tx) => ({
    // Dalawang token (Day 51): maikling access token (JWT, 15 min, walang row) + mahabang refresh token (7 araw, nasa DB)
    refreshToken: await createRefreshToken(user.id, deviceOf(req), undefined, tx),
    // Day 64: nakapag-login nang tama mula sa browser na ito → pagkakatiwalaan na ito (sariling bilang sa susunod)
    deviceToken: device ? undefined : await createTrustedDevice(user.id, tx),
  }));

  // Pagkatapos ng commit lang ang cookies at audit
  setAccessCookie(res, signAccessToken(user.id));
  res.cookie('refresh_token', refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
  if (deviceToken) res.cookie(DEVICE_COOKIE, deviceToken, DEVICE_COOKIE_OPTIONS);
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
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    // tama ang token, pero nabura na ang user
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Galing sa database, hindi sa token — laging bago (hal. kung pinalitan ang name).
  // Day 60: emailVerified (true/false) — para sa paalala sa frontend ("soft" verification)
  const { emailVerifiedAt, ...rest } = user;
  res.json({ user: { ...rest, emailVerified: emailVerifiedAt !== null } });
});

// Bagong access token gamit ang refresh token (Day 51). Tinatawag ng frontend kapag 401 ang isang request.
// Walang body — ang refresh_token cookie lang (Path=/api/auth, kaya dito lang ito ipinapadala).
// Day 52: bawat refresh ay may BAGONG refresh token (rotation); ang paggamit ulit ng luma = nakaw
router.post('/auth/refresh', async (req, res) => {
  const raw: unknown = req.cookies.refresh_token;
  const result = typeof raw === 'string' ? await rotateRefreshToken(raw, deviceOf(req)) : ({ status: 'invalid' } as const);

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
  const userId = userIdFromAccessToken(req.cookies.token) ?? revokedFor ?? null;
  await audit(req, { action: 'logout', actorId: userId, targetId: userId });
  clearSessionCookies(res); // pareho ng access at refresh (Day 51)
  res.status(204).end(); // 204 = nagawa, walang body
});

// ---------------------------------------------------------------------------------------------
// Mga device ko (Day 54)

// GET /api/auth/sessions — ang mga naka-login kong session. Ang "current" = ang device na nagtatanong
// (ang refresh_token cookie ay ipinapadala rito dahil /api/auth ang path nito)
router.get('/auth/sessions', requireAuth, async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) return res.status(401).json({ error: 'Not authenticated' });
  const raw: unknown = req.cookies.refresh_token;
  const current = typeof raw === 'string' ? await familyOf(raw) : undefined;
  const sessions = await listSessions(userId);
  res.json({ sessions: sessions.map((session) => ({ ...session, current: session.id === current })) });
});

// DELETE /api/auth/sessions/:id — i-logout ang isang device.
// 🔐 IDOR (Insecure Direct Object Reference): ang id ay galing sa URL, kaya kayang palitan ng kahit sino.
// Kaya: (1) naka-scope sa naka-login na user ang pagbawi (revokeSession), at (2) 404 — hindi 403 — sa session
// ng ibang user, sa id na wala, at sa id na hindi UUID. Iisang sagot: hindi nalalaman kung totoo ang id
const sessionId = z.uuid();
router.delete('/auth/sessions/:id', requireAuth, async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) return res.status(401).json({ error: 'Not authenticated' });
  // Hindi UUID → hindi na tinatanong ang database (kung hindi: error ng Postgres sa maling uuid → 500)
  const parsed = sessionId.safeParse(req.params.id);
  if (!parsed.success || !(await revokeSession(userId, parsed.data))) {
    return res.status(404).json({ error: 'Not found' });
  }
  await audit(req, { action: 'session_revoked', actorId: userId, targetId: userId, metadata: { session: parsed.data } });
  // Kung ang device na ito mismo ang ni-logout — burahin din ang mga cookie nito
  const raw: unknown = req.cookies.refresh_token;
  if (typeof raw === 'string' && (await familyOf(raw)) === parsed.data) clearSessionCookies(res);
  res.status(204).end();
});

// ---------------------------------------------------------------------------------------------
// Change password (Day 55) — isang "high-risk event": dito nauuwi ang account kapag may nakanakaw
router.post('/auth/change-password', requireAuth, changePasswordLimiter ?? pass, async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) return res.status(401).json({ error: 'Not authenticated' });
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  const { currentPassword, newPassword } = result.data;

  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!user) return res.status(401).json({ error: 'Not authenticated' }); // nabura ang account

  // Reauthentication: patunayan ulit na ikaw talaga. 400 (hindi 401): hindi ito "hindi ka naka-login" —
  // at ang 401 ay magpapa-refresh at magpapaulit ng request sa frontend (apiFetch), dodoble ang bilang ng subok
  if (!(await argon2.verify(user.passwordHash, currentPassword))) {
    await audit(req, { action: 'password_change_failed', actorId: userId, targetId: userId });
    return res.status(400).json({ error: 'Invalid input', fields: { currentPassword: ['Incorrect password'] } });
  }

  // I-hash muna BAGO ang transaction: mabagal ang argon2 (~50ms) — huwag hawakan ang koneksyon at ang lock habang naghihintay
  const passwordHash = await argon2.hash(newPassword);

  // LAHAT O WALA: bagong password + bawiin ang LAHAT ng session (pati ang sa magnanakaw) + bagong session para sa
  // device na ito. Kung hiwalay at pumalya sa gitna: bagong password, pero buhay pa ang session ng magnanakaw
  // Day 64: + alisin ang tiwala ng LAHAT ng device (pati ang sa magnanakaw), at pagkatiwalaan ulit ang browser na ito
  const { refreshToken, deviceToken } = await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await revokeAllSessions(userId, tx);
    await revokeAllTrustedDevices(userId, tx);
    return {
      refreshToken: await createRefreshToken(userId, deviceOf(req), undefined, tx),
      deviceToken: await createTrustedDevice(userId, tx),
    };
  });

  // Pagkatapos ng commit lang ang cookies at audit — kung nag-rollback, walang dapat maipadala
  setAccessCookie(res, signAccessToken(userId));
  res.cookie('refresh_token', refreshToken, { ...REFRESH_COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_TTL_MS });
  res.cookie(DEVICE_COOKIE, deviceToken, DEVICE_COOKIE_OPTIONS);
  await audit(req, { action: 'password_changed', actorId: userId, targetId: userId });
  res.status(204).end();
});

// ---------------------------------------------------------------------------------------------
// Password reset (Day 59)

// POST /api/auth/forgot-password { email } — LAGING parehong sagot, may account man o wala (hindi malalaman
// ng attacker kung sino ang may account). Sumasagot MUNA, tapos saka hinahanap ang account at nagpapadala ng
// email — kung hindi, mas matagal ang sagot kapag may account (database + Resend), at iyon ang magsasabi
router.post('/auth/forgot-password', forgotPasswordLimiter ?? pass, async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  const { email } = result.data;
  res.status(202).json({ message: 'If an account exists for that email, a reset link has been sent.' });

  runInBackground('password_reset_email', async () => {
    const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email));
    await audit(req, { action: 'password_reset_requested', targetId: user?.id ?? null, metadata: { email } });
    if (!user) return;
    const token = await createVerificationToken(user.id, 'password_reset', RESET_TOKEN_TTL_MS);
    // Token sa #fragment, hindi sa ?query: hindi ipinapadala ng browser ang fragment sa kahit anong server —
    // kaya hindi ito lalabas sa logs ng Cloudflare Pages, sa Referer, o sa analytics
    await sendEmail(passwordResetEmail(user.email, `${env.CLIENT_URL}/reset-password#token=${token}`));
  });
});

// POST /api/auth/reset-password { token, newPassword }
router.post('/auth/reset-password', async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  const { token, newPassword } = result.data;
  const invalid = () => res.status(400).json({ error: 'This reset link is invalid or has expired' });

  // Mabilis na suri muna — walang argon2 para sa pekeng token (CPU abuse)
  if (!(await isVerificationTokenUsable(token, 'password_reset'))) return invalid();
  const passwordHash = await argon2.hash(newPassword); // BAGO ang transaction (Day 55)

  // LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + bagong password + i-logout ang LAHAT ng session.
  // Kapag sabay ang dalawang request na may parehong link: isa lang ang mananalo sa claim
  // Day 64: ang reset ang "labasan" ng biktimang naka-lock sa BAGONG device: tinatanggal ang lock ng account,
  // binabawi ang tiwala ng lahat ng device, at pinagkakatiwalaan ang browser na nag-reset (napatunayang kanya ang email)
  const done = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(token, 'password_reset', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ passwordHash, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, claimed));
    await revokeAllSessions(claimed, tx, 'password_reset');
    await revokeAllTrustedDevices(claimed, tx);
    return { userId: claimed, deviceToken: await createTrustedDevice(claimed, tx) };
  });
  if (done === undefined) return invalid();
  const { userId } = done;

  res.cookie(DEVICE_COOKIE, done.deviceToken, DEVICE_COOKIE_OPTIONS);
  await audit(req, { action: 'password_reset', actorId: userId, targetId: userId });
  res.status(204).end(); // walang auto-login: mag-login gamit ang bagong password
});

// ---------------------------------------------------------------------------------------------
// Email verification (Day 60) — "soft": makakapag-login pa rin ang hindi pa verified (D-026)

// Gumawa ng link at ipadala (tinatawag sa background: pagka-register, at sa resend)
async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const token = await createVerificationToken(userId, 'email_verification', VERIFY_TOKEN_TTL_MS);
  // #fragment (Day 59): hindi napupunta sa kahit anong server ang token
  await sendEmail(verifyEmailEmail(email, `${env.CLIENT_URL}/verify-email#token=${token}`));
}

// POST /api/auth/verify-email { token } — hindi kailangang naka-login: puwedeng buksan ang link sa ibang device
router.post('/auth/verify-email', async (req, res) => {
  const result = verifyEmailSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input', fields: z.flattenError(result.error).fieldErrors });
  }
  // LAHAT O WALA: gamitin ang token (atomic, isang beses lang) + markahang verified
  const userId = await db.transaction(async (tx) => {
    const claimed = await claimVerificationToken(result.data.token, 'email_verification', tx);
    if (claimed === undefined) return undefined;
    await tx.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, claimed), isNull(users.emailVerifiedAt)));
    return claimed;
  });
  if (userId === undefined) return res.status(400).json({ error: 'This verification link is invalid or has expired' });
  await audit(req, { action: 'email_verified', actorId: userId, targetId: userId });
  res.status(204).end();
});

// POST /api/auth/resend-verification — naka-login; bagong link (ang luma ay mawawalan ng bisa)
router.post('/auth/resend-verification', requireAuth, resendVerificationLimiter ?? pass, async (req, res) => {
  const userId = req.userId;
  if (userId === undefined) return res.status(401).json({ error: 'Not authenticated' });
  const [user] = await db
    .select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.emailVerifiedAt !== null) return res.status(409).json({ error: 'Email is already verified' });
  res.status(202).json({ message: 'A new verification link has been sent.' });
  runInBackground('verify_email', () => sendVerificationEmail(userId, user.email));
});

export default router;


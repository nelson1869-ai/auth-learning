import { STATUS_CODES } from 'node:http';
import type { ErrorRequestHandler, RequestHandler } from 'express';

// Sentral na error handling (Day 41). Bago nito: HTML ni Express, at sa dev pati ang stack trace at
// mga file path ng PC — nakikita ng kahit sinong nagpadala ng sirang request.

// Walang route na tumugma → JSON 404 (hindi ang HTML na "Cannot GET /").
// Hindi ibinabalik ang URL na hiningi: huwag i-echo pabalik ang input ng client
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

// Status ng error: ang mga library (hal. express.json) ay naglalagay ng `status` (400, 413 ...).
// Kung wala o kakaiba ang status → 500 (bug o sira ang database)
function statusOf(err: unknown): number {
  if (typeof err === 'object' && err !== null) {
    const status = 'status' in err ? err.status : 'statusCode' in err ? err.statusCode : undefined;
    if (typeof status === 'number' && status >= 400 && status <= 599) return status;
  }
  return 500;
}

// 4 na parameter (err, req, res, next) — kaya alam ni Express na ERROR handler ito.
// Dito napupunta ang bawat `throw` at bawat nabigong `await` sa mga route (Express 5)
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Nagsimula nang magpadala ng sagot bago nag-error → hindi na mapapalitan; si Express na ang bahala
  if (res.headersSent) return next(err);

  const status = statusOf(err);

  if (status >= 500) {
    // 🔐 BUONG detalye sa LOG lang (mensahe, stack, SQL) — hindi sa sagot.
    // Ang Drizzle error ay may "Failed query: select ... from users" — pangalan ng table para sa attacker
    req.log.error({ err }, 'Unhandled error');
    // Ang requestId ang "reference number": ibigay ng user → hanapin sa logs ang eksaktong error
    res.status(status).json({ error: 'Internal server error', requestId: req.id });
    return;
  }

  // 4xx mula sa library: maikli at pare-parehong mensahe, walang detalye ng parser
  const isBadJson = typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
  res.status(status).json({ error: isBadJson ? 'Invalid JSON' : (STATUS_CODES[status] ?? 'Error') });
};

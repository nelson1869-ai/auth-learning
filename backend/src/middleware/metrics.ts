import type { RequestHandler } from 'express';
import { httpRequestDuration } from '../lib/metrics.ts';

// Itala ang bawat request kapag tapos na ang sagot (Day 81): method, ROUTE at status, at kung gaano katagal.
// 🔐 Cardinality: ang ROUTE TEMPLATE lang ang label ("/api/auth/sessions/:id"), HINDI ang totoong URL — kung ang URL,
// bawat session id ay magiging bagong serye sa Prometheus (lalaki nang walang hangganan, at puwedeng abusuhin ng attacker).
// Walang tumugmang route (404, o hinarang bago umabot sa route — hal. CSRF 403) → "unmatched"
export const recordMetrics: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route ? `${req.baseUrl}${String(req.route.path)}` : 'unmatched';
    httpRequestDuration.record(seconds, {
      'http.request.method': req.method,
      'http.route': route,
      'http.response.status_code': res.statusCode,
    });
  });
  next();
};

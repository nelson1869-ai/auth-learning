import type { RequestHandler } from 'express';
import { isDatabaseReady } from '../services/health.service.ts';

// Dalawang uri ng health check (Day 80):
//   LIVE  — buhay ba ang process? Walang database. Para sa Docker HEALTHCHECK (bawat 30s).
//           Bakit walang database: kapag bawat 30s ay may `SELECT 1`, HINDI na makakatulog ang Neon (serverless) —
//           mauubos ang compute hours. At kung ang database ang may problema, walang silbi ang pag-restart ng app
//   READY — handa bang maglingkod? Sinusuri ang database. Para sa deploy (isang beses) at sa monitoring
// Laging bago ang `time` — para makitang bagong sagot ito, hindi lumang kopya (cache)

export const live: RequestHandler = (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};

export const ready: RequestHandler = async (_req, res) => {
  const database = (await isDatabaseReady()) ? 'ok' : 'down';
  // 503 = "Service Unavailable": buhay ako, pero hindi pa handa — ang load balancer o ang deploy ay huwag munang magpadala
  res.status(database === 'ok' ? 200 : 503).json({
    status: database === 'ok' ? 'ready' : 'not_ready',
    checks: { database },
    time: new Date().toISOString(),
  });
};

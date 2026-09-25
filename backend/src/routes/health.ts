import { Router } from 'express';

const router = Router();

// Ang "hugis" ng sagot — kapag mali ang ibinalik (hal. walang `time`), mahuhuli ito ng tsc bago pa tumakbo
type HealthResponse = {
  status: 'ok'; // literal type: 'ok' lang ang puwede, hindi kahit anong string
  time: string;
};

// Health check — para malaman ng monitoring at deploy kung buhay ang server.
// Kasama ang `time` para makitang bagong sagot ito, hindi lumang kopya (cache).
router.get('/health', (_req, res) => {
  const body: HealthResponse = { status: 'ok', time: new Date().toISOString() };
  res.json(body);
});

export default router;

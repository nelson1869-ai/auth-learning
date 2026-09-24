import { Router } from 'express';

const router = Router();

// Health check — para malaman ng monitoring at deploy kung buhay ang server.
// Kasama ang `time` para makitang bagong sagot ito, hindi lumang kopya (cache).
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;

import { Router } from 'express';
import { live, ready } from '../controllers/health.controller.ts';

// Health checks — ROUTING LANG (Day 80). Tingnan ang controller para sa "bakit dalawa"
const router = Router();

router.get('/health', live); // ang dati (Day 3) — pareho ng /health/live, para hindi masira ang mga dating gumagamit
router.get('/health/live', live);
router.get('/health/ready', ready);

export default router;

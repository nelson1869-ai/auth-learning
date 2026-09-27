import { Router } from 'express';
import { usersCount } from '../controllers/users.controller.ts';

// /api/users/* — ROUTING LANG (Day 76)
const router = Router();

router.get('/users/count', usersCount);

export default router;

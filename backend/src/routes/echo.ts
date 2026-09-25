import { Router } from 'express';

const router = Router();

// Ibinabalik lang ang natanggap — para makita kung ano talaga ang nasa req.body
router.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

export default router;

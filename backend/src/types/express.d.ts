// Dinadagdagan ang type ng Express Request ng `userId` — inilalagay ito ng requireAuth
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export {};

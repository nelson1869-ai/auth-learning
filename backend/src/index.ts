import app from './app.ts';
import { logger } from './lib/logger.ts';

const PORT = 3000;

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang Ctrl+C
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server running');
});

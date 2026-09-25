import express from 'express';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health.js';
import echoRouter from './routes/echo.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = 3000;

// Una ito — kailangang mabasa ang JSON body BAGO umabot sa mga route
app.use(express.json());
app.use(cookieParser()); // binabasa ang cookies → req.cookies (kailangan ng auth sa Day 17)

// '/api' + '/health' = /api/health
app.use('/api', healthRouter);
app.use('/api', echoRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);

// Simulan ang pakikinig sa port — hindi hihinto hangga't walang Ctrl+C
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

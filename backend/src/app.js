import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import healthRouter from './routes/health.ts';
import echoRouter from './routes/echo.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';

// Binubuo lang ang app dito — walang listen. Kaya ma-i-import ito ng tests nang hindi binubuksan ang port
const app = express();

// CORS: payagan ang frontend (ibang origin/port) na tumawag dito, kasama ang cookie.
// Una sa lahat — para masagot din ang preflight (OPTIONS) bago umabot sa mga route
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Una ito — kailangang mabasa ang JSON body BAGO umabot sa mga route
app.use(express.json());
app.use(cookieParser()); // binabasa ang cookies → req.cookies (kailangan ng auth sa Day 17)

// '/api' + '/health' = /api/health
app.use('/api', healthRouter);
app.use('/api', echoRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);

export default app;

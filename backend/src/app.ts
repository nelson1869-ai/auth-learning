import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health.ts';
import echoRouter from './routes/echo.ts';
import usersRouter from './routes/users.ts';
import authRouter from './routes/auth.ts';
import { env } from './config/env.ts';
import { requestLogger } from './middleware/requestLogger.ts';

// Binubuo lang ang app dito — walang listen. Kaya ma-i-import ito ng tests nang hindi binubuksan ang port
const app = express();

// Logging (Day 42) — PINAKAUNA: bawat request ay may ID at naitatala, kahit ang hinarang pa ng
// ibang middleware (hal. CORS, 429). Ang log mismo ay isinusulat kapag tapos na ang sagot
app.use(requestLogger);

// Secure headers (Day 39) — una sa lahat: nosniff, HSTS, frameguard, CSP para sa API, at tinatanggal
// ang `X-Powered-By: Express` (hindi dapat malaman ng attacker kung anong server ito)
app.use(helmet());

// CORS: payagan ang frontend (ibang origin/port) na tumawag dito, kasama ang cookie.
// Una sa lahat — para masagot din ang preflight (OPTIONS) bago umabot sa mga route
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// Una ito — kailangang mabasa ang JSON body BAGO umabot sa mga route
app.use(express.json());
app.use(cookieParser()); // binabasa ang cookies → req.cookies (kailangan ng auth sa Day 17)

// '/api' + '/health' = /api/health
app.use('/api', healthRouter);
app.use('/api', echoRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);

export default app;

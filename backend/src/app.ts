import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health.ts';
import echoRouter from './routes/echo.ts';
import usersRouter from './routes/users.ts';
import authRouter from './routes/auth.ts';
import adminRouter from './routes/admin.ts';
import docsRouter from './routes/docs.ts';
import { env } from './config/env.ts';
import { requestLogger } from './middleware/requestLogger.ts';
import { recordMetrics } from './middleware/metrics.ts';
import { notFound, errorHandler } from './middleware/errorHandler.ts';
import { requireSameOrigin } from './middleware/csrf.ts';

// Binubuo lang ang app dito — walang listen. Kaya ma-i-import ito ng tests nang hindi binubuksan ang port
const app = express();

// Logging (Day 42) — PINAKAUNA: bawat request ay may ID at naitatala, kahit ang hinarang pa ng
// ibang middleware (hal. CORS, 429). Ang log mismo ay isinusulat kapag tapos na ang sagot
app.use(recordMetrics); // Day 81: tagal + status ng bawat request (para sa Prometheus) — una, para kasama pati ang mga hinarang
app.use(requestLogger);

// Secure headers (Day 39) — una sa lahat: nosniff, HSTS, frameguard, CSP para sa API, at tinatanggal
// ang `X-Powered-By: Express` (hindi dapat malaman ng attacker kung anong server ito)
app.use(helmet());

// CORS: payagan ang frontend (ibang origin/port) na tumawag dito, kasama ang cookie.
// Una sa lahat — para masagot din ang preflight (OPTIONS) bago umabot sa mga route
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// CSRF (Day 44): ang POST/PUT/DELETE mula sa browser ay dapat galing sa frontend (Origin check).
// Pagkatapos ng cors (para masagot ang preflight), BAGO ang express.json (hindi na babasahin ang body)
app.use(requireSameOrigin);

// Una ito — kailangang mabasa ang JSON body BAGO umabot sa mga route
app.use(express.json());
app.use(cookieParser()); // binabasa ang cookies → req.cookies (kailangan ng auth sa Day 17)

// '/api' + '/health' = /api/health
app.use('/api', healthRouter);
app.use('/api', echoRouter);
app.use('/api', usersRouter);
app.use('/api', authRouter);
app.use('/api', adminRouter); // /api/admin/* — admin lang (Day 46)
app.use('/api', docsRouter); // /api/openapi.json · /api/docs (Day 78)

// HULI sa lahat (Day 41): walang tumugmang route → 404 JSON · may error saanman sa itaas → errorHandler
app.use(notFound);
app.use(errorHandler);

export default app;

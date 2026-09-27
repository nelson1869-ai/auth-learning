import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from '../openapi/document.ts';

// API documentation (Day 78) — ang spec (JSON) at ang Swagger UI (page na mababasa at masusubukan)
const router = Router();
const document = buildOpenApiDocument(); // isang beses lang, pagka-start

router.get('/openapi.json', (_req, res) => {
  res.json(document);
});

// "Try it out": ang GET ay gumagana; ang POST mula rito ay 403 sa production (ibang Origin — Day 44 CSRF check)
router.use('/docs', swaggerUi.serve, swaggerUi.setup(document, { customSiteTitle: 'auth-learning API' }));

export default router;

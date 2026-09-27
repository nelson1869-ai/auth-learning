// Isulat ang OpenAPI spec at ang mga type ng frontend (Day 78): `npm run openapi` (sa backend/).
//   backend/openapi.json                      — ang spec (Swagger UI, at pinagkukunan ng types)
//   frontend/src/api/openapi.generated.ts     — mga TypeScript type mula sa spec (D-019 → D-027)
// Parehong naka-commit. May test (openapi.test.ts) na babagsak kapag hindi na tugma ang alinman sa code —
// kaya patakbuhin ito tuwing may binago sa schema o sa endpoint
import { writeFileSync } from 'node:fs';
import { buildOpenApiDocument } from '../openapi/document.ts';
import { componentsToTypeScript } from '../openapi/typescript.ts';

const document = buildOpenApiDocument();
const specFile = new URL('../../openapi.json', import.meta.url);
const typesFile = new URL('../../../frontend/src/api/openapi.generated.ts', import.meta.url);

writeFileSync(specFile, JSON.stringify(document, null, 2) + '\n');
writeFileSync(typesFile, componentsToTypeScript(document.components.schemas));
console.log(`✅ ${specFile.pathname}\n✅ ${typesFile.pathname}`);

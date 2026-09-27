// Isulat ang OpenAPI spec sa backend/openapi.json (Day 78): `npm run openapi`.
// Naka-commit ang file: dito kumukuha ang frontend ng mga type (openapi-typescript), at may test na babagsak kapag
// hindi na ito tugma sa code (openapi.test.ts) — kaya patakbuhin ito tuwing may binago sa schema o sa endpoint
import { writeFileSync } from 'node:fs';
import { buildOpenApiDocument } from '../openapi/document.ts';

const file = new URL('../../openapi.json', import.meta.url);
writeFileSync(file, JSON.stringify(buildOpenApiDocument(), null, 2) + '\n');
console.log(`✅ ${file.pathname}`);

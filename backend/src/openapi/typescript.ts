// JSON Schema (mula sa OpenAPI spec) → mga TypeScript type para sa frontend (Day 78, D-027).
//
// Bakit sarili at hindi `openapi-typescript`? Kailangan nito ng TypeScript 5 (ginagamit ang compiler API nito), pero
// TypeScript 7 ang project. Ang `--legacy-peer-deps` ay malamang masira; ang `npx` na may TS 5 sa bawat build ay nagda-download
// ng mga package na walang lockfile (supply-chain risk). Simple lang ang mga schema natin, kaya sapat ang maliit na generator na ito.
//
// Tuntunin: kapag may keyword na HINDI kilala (hal. oneOf, allOf, $ref), PAPALYA nang malakas — huwag tahimik na gumawa ng maling type

type Json = Record<string, unknown>;

// Para sa validation lang, hindi para sa hugis ng type
const IGNORED = new Set(['format', 'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'default', 'propertyNames', 'description']);
const HANDLED = new Set(['type', 'enum', 'const', 'anyOf', 'items', 'properties', 'required', 'additionalProperties']);

// Lagyan ng panaklong ang union bago gawing array: (string | null)[] — pero ang " | " lang sa PINAKALABAS na antas,
// hindi ang nasa loob ng isang object ({ action: "a" | "b" }[] ay hindi kailangan ng panaklong)
function wrap(t: string): string {
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '{' || c === '(' || c === '<') depth++;
    else if (c === '}' || c === ')' || c === '>') depth--;
    else if (depth === 0 && t.startsWith(' | ', i)) return `(${t})`;
  }
  return t;
}

export function schemaToType(schema: Json, indent = ''): string {
  for (const key of Object.keys(schema)) {
    if (!IGNORED.has(key) && !HANDLED.has(key)) throw new Error(`Hindi pa kaya ng generator ang JSON Schema keyword na "${key}"`);
  }
  if ('const' in schema) return JSON.stringify(schema.const);
  if (Array.isArray(schema.enum)) return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  if (Array.isArray(schema.anyOf)) return (schema.anyOf as Json[]).map((s) => schemaToType(s, indent)).join(' | ');

  const type = schema.type;
  if (type === undefined) return 'unknown'; // {} = kahit ano
  if (Array.isArray(type)) return type.map((t) => schemaToType({ ...schema, type: t }, indent)).join(' | ');
  switch (type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      return `${wrap(schemaToType((schema.items ?? {}) as Json, indent))}[]`;
    case 'object':
      return objectType(schema, indent);
    default:
      throw new Error(`Hindi kilalang JSON Schema type: ${JSON.stringify(type)}`);
  }
}

function objectType(schema: Json, indent: string): string {
  const properties = (schema.properties ?? {}) as Record<string, Json>;
  const required = new Set((schema.required ?? []) as string[]);
  const extra = schema.additionalProperties;
  const keys = Object.keys(properties);
  // Walang properties: isang "record" (hal. { email: ['Too small'] }) — o kahit anong object
  if (keys.length === 0) {
    return `Record<string, ${extra && typeof extra === 'object' ? schemaToType(extra as Json, indent) : 'unknown'}>`;
  }
  const inner = indent + '  ';
  const lines = keys.map((key) => `${inner}${key}${required.has(key) ? '' : '?'}: ${schemaToType(properties[key]!, inner)};`);
  if (extra && typeof extra === 'object') lines.push(`${inner}[key: string]: ${schemaToType(extra as Json, inner)};`);
  return `{\n${lines.join('\n')}\n${indent}}`;
}

// Ang buong file para sa frontend: isang `export type` bawat schema sa `components.schemas`
export function componentsToTypeScript(schemas: Record<string, Json>): string {
  const header = [
    '// ⚠️ GINAWA NG CODE — huwag i-edit. Galing sa backend/openapi.json (Day 78).',
    '// Para baguhin: baguhin ang Zod schema sa backend, tapos `npm run openapi` sa backend/.',
    '// May test (backend/src/openapi/openapi.test.ts) na babagsak kapag hindi na ito tugma.',
    '',
  ];
  return header.join('\n') + '\n' + Object.entries(schemas).map(([name, s]) => `export type ${name} = ${schemaToType(s)};\n`).join('\n');
}

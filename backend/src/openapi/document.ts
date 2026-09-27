import { z } from 'zod';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/auth.ts';
import { paginationSchema } from '../validations/pagination.ts';
import * as r from '../validations/responses.ts';

// OpenAPI 3.1 spec (Day 78) — ang dokumentasyon ng API, GINAGAWA mula sa parehong Zod schemas na ginagamit ng code.
// Walang dagdag na library para sa schemas: `z.toJSONSchema` ay built-in sa Zod 4, at ang OpenAPI 3.1 ay gumagamit ng
// JSON Schema (2020-12). Ang mga PATH lang (URL, status, paglalarawan) ang isinusulat dito nang kamay (D-027).
//
// Mga limitasyon ng pagsasalin (tapat): ang `.refine()` (hal. "bago ≠ kasalukuyan") at ang mga transform (trim, lowercase)
// ay hindi naisasalin — nasa `description` na lang ang mga iyon. Ang `email` ay `string` lang (ang `.pipe(z.email())` ay pagkatapos ng trim)

type Schema = z.ZodType;
type Json = Record<string, unknown>;

// Zod → JSON Schema. `io`: ang hugis bago i-parse (input — body ng request) o pagkatapos (output — sagot)
function json(schema: Schema, io: 'input' | 'output'): Json {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io, target: 'draft-2020-12' }) as Json;
  return rest;
}

// Ang mga pangalang lalabas sa `components.schemas` — at sa mga type ng frontend (`components['schemas']['MeUser']`)
const requests: Record<string, Schema> = {
  RegisterInput: registerSchema,
  LoginInput: loginSchema,
  ChangePasswordInput: changePasswordSchema,
  ForgotPasswordInput: forgotPasswordSchema,
  ResetPasswordInput: resetPasswordSchema,
  VerifyEmailInput: verifyEmailSchema,
};
const responses: Record<string, Schema> = {
  ErrorResponse: r.errorResponse,
  Message: r.messageResponse,
  PublicUser: r.publicUser,
  UserResponse: r.userResponse,
  MeUser: r.meUser,
  MeResponse: r.meResponse,
  Session: r.session,
  SessionsResponse: r.sessionsResponse,
  AdminUser: r.adminUser,
  AdminUsersResponse: r.adminUsersResponse,
  AuditLog: r.auditLog,
  AuditLogsResponse: r.auditLogsResponse,
  Health: r.healthResponse,
  Count: r.countResponse,
  Echo: r.echoResponse,
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const content = (name: string) => ({ 'application/json': { schema: ref(name) } });

// Isang sagot: [paglalarawan, pangalan ng schema (o wala kung walang body, hal. 204)]
type Reply = [description: string, schema?: string];
type Op = {
  summary: string;
  tag: 'auth' | 'admin' | 'system';
  body?: string; // pangalan ng request schema
  auth?: boolean; // kailangan ang `token` cookie (requireAuth)
  replies: Record<number, Reply>;
  description?: string;
};

// operationId: hal. POST /api/auth/login → postAuthLogin (pangalan ng function sa mga ginawang client)
function operationId(method: string, path: string) {
  const words = path.replace('/api/', '').split(/[/{}-]+/).filter(Boolean);
  return method + words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join('');
}

function operation(method: string, path: string, op: Op) {
  return {
    operationId: operationId(method, path),
    summary: op.summary,
    tags: [op.tag],
    ...(op.description ? { description: op.description } : {}),
    // Tahasang sinasabi kung pampubliko (walang login) — hindi tahimik na "wala lang"
    security: op.auth ? [{ cookieAuth: [] }] : [],
    ...(op.body ? { requestBody: { required: true, content: content(op.body) } } : {}),
    responses: Object.fromEntries(
      Object.entries(op.replies).map(([code, [description, schema]]) => [
        code,
        { description, ...(schema ? { content: content(schema) } : {}) },
      ]),
    ),
  };
}

const invalid: Reply = ['Mali ang input (Zod) — may `fields` bawat field', 'ErrorResponse'];
const unauthenticated: Reply = ['Hindi naka-login (walang tama o expired na `token` cookie)', 'ErrorResponse'];
const tooMany: Reply = ['Rate limit: masyadong maraming subok mula sa IP na ito', 'ErrorResponse'];
const paginationQuery = Object.entries((json(paginationSchema, 'input').properties ?? {}) as Record<string, Json>).map(
  ([name, schema]) => ({ name, in: 'query', required: false, schema }),
);

const paths: Record<string, Record<string, Op>> = {
  '/api/health': { get: { tag: 'system', summary: 'Buhay ba ang server?', replies: { 200: ['Buhay', 'Health'] } } },
  '/api/echo': { post: { tag: 'system', summary: 'Ibinabalik ang body (pang-aral, Day 4)', replies: { 200: ['Ang natanggap', 'Echo'], 400: ['Sirang JSON', 'ErrorResponse'] } } },
  '/api/users/count': { get: { tag: 'system', summary: 'Ilan ang users (bilang lang, hindi listahan)', replies: { 200: ['Bilang', 'Count'] } } },
  '/api/auth/register': {
    post: {
      tag: 'auth',
      summary: 'Gumawa ng account',
      description: 'Ang email ay tina-trim at ginagawang lowercase. Hindi naglo-login (walang cookie). May verification email sa background (Day 60).',
      body: 'RegisterInput',
      replies: { 201: ['Nagawa', 'UserResponse'], 400: invalid, 409: ['May account na ang email (ang natitirang butas ng enumeration — Day 71)', 'ErrorResponse'], 429: tooMany },
    },
  },
  '/api/auth/login': {
    post: {
      tag: 'auth',
      summary: 'Mag-login',
      description:
        'Nagse-set ng `token` (15 min), `refresh_token` (7 araw) at, sa bagong browser, `device_token` (180 araw) — lahat HttpOnly. ' +
        'Pareho ang 401 at 423 may account man o wala (Day 71).',
      body: 'LoginInput',
      replies: {
        200: ['Naka-login (+ Set-Cookie)', 'UserResponse'],
        400: invalid,
        401: ['Maling email o password — iisang mensahe', 'ErrorResponse'],
        423: ['Naka-lock: 5 sunod-sunod na mali (15 min) — may `Retry-After` header', 'ErrorResponse'],
        429: tooMany,
      },
    },
  },
  '/api/auth/me': { get: { tag: 'auth', auth: true, summary: 'Ang naka-login na user', replies: { 200: ['Ang user', 'MeResponse'], 401: unauthenticated } } },
  '/api/auth/refresh': {
    post: {
      tag: 'auth',
      summary: 'Bagong access token gamit ang `refresh_token` cookie (rotation)',
      replies: { 204: ['Bagong cookies'], 401: ['Wala, binawi, expired o ginamit ulit (nakaw) — binura ang cookies', 'ErrorResponse'] },
    },
  },
  '/api/auth/logout': { post: { tag: 'auth', summary: 'Mag-logout (binabawi sa database ang refresh token)', replies: { 204: ['Laging nagtatagumpay'] } } },
  '/api/auth/sessions': { get: { tag: 'auth', auth: true, summary: 'Mga device ko', replies: { 200: ['Mga aktibong session', 'SessionsResponse'], 401: unauthenticated } } },
  '/api/auth/sessions/{id}': {
    delete: {
      tag: 'auth',
      auth: true,
      summary: 'I-logout ang isang device',
      description: '404 sa session ng ibang user, sa id na wala, at sa hindi UUID (IDOR — Day 54).',
      replies: { 204: ['Na-logout'], 401: unauthenticated, 404: ['Walang ganitong session MO', 'ErrorResponse'] },
    },
  },
  '/api/auth/change-password': {
    post: {
      tag: 'auth',
      auth: true,
      summary: 'Palitan ang password',
      description: 'Kailangan ang kasalukuyang password; ang bago ay dapat iba rito. Nala-logout ang lahat ng ibang session at device.',
      body: 'ChangePasswordInput',
      replies: { 204: ['Napalitan (+ bagong cookies)'], 400: ['Mali ang input o ang kasalukuyang password', 'ErrorResponse'], 401: unauthenticated, 429: tooMany },
    },
  },
  '/api/auth/forgot-password': {
    post: {
      tag: 'auth',
      summary: 'Humingi ng reset link',
      description: 'LAGING 202 at parehong mensahe, may account man o wala.',
      body: 'ForgotPasswordInput',
      replies: { 202: ['Kung may account, may email na', 'Message'], 400: invalid, 429: tooMany },
    },
  },
  '/api/auth/reset-password': {
    post: {
      tag: 'auth',
      summary: 'Bagong password gamit ang link',
      body: 'ResetPasswordInput',
      replies: { 204: ['Napalitan (+ device_token cookie); walang auto-login'], 400: ['Mali ang input, o invalid/expired ang link', 'ErrorResponse'] },
    },
  },
  '/api/auth/verify-email': {
    post: { tag: 'auth', summary: 'I-verify ang email gamit ang link', body: 'VerifyEmailInput', replies: { 204: ['Na-verify'], 400: ['Mali ang input, o invalid/expired ang link', 'ErrorResponse'] } },
  },
  '/api/auth/resend-verification': {
    post: {
      tag: 'auth',
      auth: true,
      summary: 'Ipadala ulit ang verification link',
      replies: { 202: ['Naipadala (ang luma ay hindi na gagana)', 'Message'], 401: unauthenticated, 409: ['Verified na', 'ErrorResponse'], 429: tooMany },
    },
  },
  '/api/admin/users': {
    get: { tag: 'admin', auth: true, summary: 'Listahan ng users (admin lang)', replies: { 200: ['Isang page', 'AdminUsersResponse'], 400: invalid, 401: unauthenticated, 403: ['Hindi admin', 'ErrorResponse'] } },
  },
  '/api/admin/audit-logs': {
    get: { tag: 'admin', auth: true, summary: 'Audit log (admin lang)', replies: { 200: ['Isang page', 'AuditLogsResponse'], 400: invalid, 401: unauthenticated, 403: ['Hindi admin', 'ErrorResponse'] } },
  },
};

export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'auth-learning API',
      version: '1.0.0',
      description: 'Ginagawa mula sa Zod schemas ng backend (Day 78). Ang lahat ng POST mula sa browser ay dapat galing sa frontend (Origin check, Day 44).',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' } },
      schemas: {
        ...Object.fromEntries(Object.entries(requests).map(([name, schema]) => [name, json(schema, 'input')])),
        ...Object.fromEntries(Object.entries(responses).map(([name, schema]) => [name, json(schema, 'output')])),
      },
    },
    paths: Object.fromEntries(
      Object.entries(paths).map(([path, methods]) => [
        path,
        Object.fromEntries(
          Object.entries(methods).map(([method, op]) => {
            const built: Json = operation(method, path, op);
            if (path === '/api/auth/sessions/{id}') {
              built.parameters = [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }];
            }
            if (path.startsWith('/api/admin/')) built.parameters = paginationQuery;
            return [method, built];
          }),
        ),
      ]),
    ),
  };
}

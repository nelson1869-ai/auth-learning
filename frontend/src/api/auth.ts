import type { MeUser, PublicUser, Session as SessionFromApi } from './openapi.generated.ts';
// Iisang lugar ng lahat ng pagtawag sa backend. Ang URL ay galing sa build (VITE_API_URL):
// sa Cloudflare Pages → https://api.nelson1869.com/api; sa `npm run dev` → localhost
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000/api' : '');

// Sa production build na walang VITE_API_URL: tumanggi agad, huwag tahimik na tumawag sa localhost
if (!API_URL) {
  throw new Error('VITE_API_URL is not set — add it to the Cloudflare Pages build settings');
}

// Ang mga hugis ng sagot ng backend — GINAWA mula sa OpenAPI spec (Day 78, D-027), hindi na kopya (D-019).
// Kapag binago ng backend ang sagot at `npm run openapi`: kusang nagbabago ang mga type na ito, at ang tsc ang magsasabi
// kung saan nasira ang frontend

// Ang user mula sa /me: + role (Day 49, para sa Admin link — UX lang) at emailVerified (Day 60, para sa paalala)
export type User = MeUser;
// Ang user mula sa login at register: { id, email, name } LANG (walang role at emailVerified — gamitin ang /me)
export type { PublicUser };

// Mga error bawat field mula sa Zod ng backend (400), hal. { password: ['Too small ...'] }
export type FieldErrors = Record<string, string[] | undefined>;

// Error na may kasamang `fields` — para maipakita ang mensahe sa tabi ng bawat input.
// `status` (Day 49): para malaman ng page kung 401 (mag-login) o 403 (bawal) ang nangyari
export class ApiError extends Error {
  fields: FieldErrors;
  status: number;
  constructor(message: string, fields: FieldErrors = {}, status = 0) {
    super(message);
    this.fields = fields;
    this.status = status;
  }
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ipadala at tanggapin ang cookie (kailangan din ng credentials: true sa CORS ng backend)
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  // fetch ay HINDI nagtatapon ng error sa 400/401 — kaya tayo mismo ang tumitingin sa res.ok
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed');
  return data.user;
}

export async function register(email: string, password: string, name?: string): Promise<PublicUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed', data.fields);
  return data.user;
}

// ---------------------------------------------------------------------------------------------
// Refresh (Day 51): ang access token ay 15 minuto lang. Kapag 401, subukang kumuha ng bago gamit ang
// refresh token (cookie), tapos ulitin ang request ISANG beses.
//
// Single-flight: kapag sabay-sabay na nag-401 ang maraming request (hal. 2 sa Admin page), ISANG
// refresh lang ang ipinapadala at hinihintay ng lahat. Kung hindi, sabay silang magre-refresh gamit
// ang iisang token — at mula Day 52 (reuse detection), ituturing iyon na nakaw at mala-logout ang user.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null; // tapos na — ang susunod na 401 ay magre-refresh ulit
    });
  return refreshing;
}

// fetch na may cookie, at kusang nagre-refresh kapag expired ang access token
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () => fetch(`${API_URL}${path}`, { ...init, credentials: 'include' });
  const res = await send();
  if (res.status !== 401) return res;
  const refreshed = await refreshSession();
  return refreshed ? send() : res; // hindi ma-refresh = talagang hindi naka-login → ibigay ang 401
}
// ---------------------------------------------------------------------------------------------

// Sino ang naka-login? null kung hindi — ang 401 dito ay normal, hindi error
export async function getMe(): Promise<User | null> {
  const res = await apiFetch('/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new ApiError('Request failed');
  const data = await res.json();
  return data.user;
}

// Mga device ko (Day 54) — mula sa OpenAPI spec: id, userAgent, ip, since (kailan nag-login), lastUsedAt (huling refresh), current
export type Session = SessionFromApi;

export async function getSessions(): Promise<Session[]> {
  const res = await apiFetch('/auth/sessions');
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed', data.fields, res.status);
  return data.sessions;
}

export async function revokeSession(id: string): Promise<void> {
  const res = await apiFetch(`/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new ApiError('Request failed', {}, res.status);
}

// Change password (Day 55). 204 = napalitan; 400 = may `fields` (hal. maling kasalukuyang password)
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch('/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.ok) return;
  const data = await res.json();
  throw new ApiError(data.error ?? 'Request failed', data.fields, res.status);
}

// ---------------------------------------------------------------------------------------------
// Email (Day 61): forgot/reset password at email verification

// POST na may JSON — ibinabalik ang Response; nagtatapon ng ApiError kapag hindi 2xx
async function postJson(path: string, body?: unknown): Promise<Response> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) return res;
  const data = await res.json().catch(() => ({}));
  throw new ApiError(data.error ?? 'Request failed', data.fields, res.status);
}

// Laging parehong sagot ang backend (may account man o wala) — kaya walang "wala ang email" na mensahe dito
export async function forgotPassword(email: string): Promise<void> {
  await postJson('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await postJson('/auth/reset-password', { token, newPassword });
}

export async function verifyEmail(token: string): Promise<void> {
  await postJson('/auth/verify-email', { token });
}

export async function resendVerification(): Promise<void> {
  await postJson('/auth/resend-verification');
}

// Kunin ang token mula sa #token=… ng URL, tapos TANGGALIN ito sa address bar: hindi mananatili sa history,
// at hindi makikita kapag nag-screenshot o nag-share ng screen (Day 59: huwag i-paste ang link kahit saan)
export function takeTokenFromHash(): string {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
}

// Mensahe mula sa kahit anong error sa catch (`unknown` ang type doon)
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

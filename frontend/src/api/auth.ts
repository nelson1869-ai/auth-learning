// Iisang lugar ng lahat ng pagtawag sa backend. Ang URL ay galing sa build (VITE_API_URL):
// sa Cloudflare Pages → https://api.nelson1869.com/api; sa `npm run dev` → localhost
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000/api' : '');

// Sa production build na walang VITE_API_URL: tumanggi agad, huwag tahimik na tumawag sa localhost
if (!API_URL) {
  throw new Error('VITE_API_URL is not set — add it to the Cloudflare Pages build settings');
}

// Ang hugis ng user na ibinabalik ng backend (docs/07-api-contract.md).
// ⚠️ Kopya ito — kapag binago ng backend ang sagot, HINDI ito malalaman dito (tingnan ang D-019)
export type User = {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin'; // Day 49 — para ipakita/itago ang Admin link (UX lang; ang backend ang bantay)
};

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

export async function login(email: string, password: string): Promise<User> {
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

export async function register(email: string, password: string, name?: string): Promise<User> {
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

// Mga device ko (Day 54) — ⚠️ kopya ng hugis ng sagot ng backend (docs/07-api-contract.md)
export type Session = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  since: string; // kailan nag-login
  lastUsedAt: string; // huling refresh
  current: boolean; // ito ang device na gamit ko ngayon
};

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

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
}

// Mensahe mula sa kahit anong error sa catch (`unknown` ang type doon)
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

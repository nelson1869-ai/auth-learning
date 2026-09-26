// Iisang lugar ng lahat ng pagtawag sa backend. Ang URL ay galing sa build (VITE_API_URL):
// sa Cloudflare Pages → https://api.nelson1869.com/api; sa `npm run dev` → localhost
const API_URL: string =
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
};

// Mga error bawat field mula sa Zod ng backend (400), hal. { password: ['Too small ...'] }
export type FieldErrors = Record<string, string[] | undefined>;

// Error na may kasamang `fields` — para maipakita ang mensahe sa tabi ng bawat input
export class ApiError extends Error {
  fields: FieldErrors;
  constructor(message: string, fields: FieldErrors = {}) {
    super(message);
    this.fields = fields;
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

// Sino ang naka-login? null kung hindi — ang 401 dito ay normal, hindi error
export async function getMe(): Promise<User | null> {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new ApiError('Request failed');
  const data = await res.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
}

// Mensahe mula sa kahit anong error sa catch (`unknown` ang type doon)
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

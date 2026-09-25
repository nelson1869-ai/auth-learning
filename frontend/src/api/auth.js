// Iisang lugar ng lahat ng pagtawag sa backend — kapag nagbago ang URL, dito lang babaguhin
// (Phase 8: magiging env variable para sa production)
const API_URL = 'http://localhost:3000/api';

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ipadala at tanggapin ang cookie (kailangan din ng credentials: true sa CORS ng backend)
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  // fetch ay HINDI nagtatapon ng error sa 400/401 — kaya tayo mismo ang tumitingin sa res.ok
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export async function register(email, password, name) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error ?? 'Request failed');
    err.fields = data.fields; // mga error bawat field mula sa Zod (400) — ipapakita sa tabi ng input
    throw err;
  }
  return data;
}

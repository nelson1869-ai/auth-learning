import { API_URL, ApiError } from './auth.ts';

// Mga tawag sa /api/admin/* (Day 49). Admin lang ang makakakuha ng data — ang backend (requireRole) ang humaharang.
// ⚠️ Kopya ng hugis ng sagot ng backend (docs/07-api-contract.md, D-019)

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  createdAt: string; // ISO date — JSON ay walang Date type
};

export type AuditLog = {
  id: number;
  action: string;
  actorId: number | null;
  actorEmail: string | null;
  targetId: number | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

// Ang pagination na kasama ng bawat listahan (Day 47)
export type PageInfo = { page: number; limit: number; total: number; totalPages: number };

const PAGE_SIZE = 10;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  const data = await res.json();
  // Kasama ang status (401/403) — ang page ang magpapasya kung ano ang ipapakita
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed', data.fields, res.status);
  return data;
}

export function getAdminUsers(page: number) {
  return getJson<PageInfo & { users: AdminUser[] }>(`/admin/users?page=${page}&limit=${PAGE_SIZE}`);
}

export function getAuditLogs(page: number) {
  return getJson<PageInfo & { logs: AuditLog[] }>(`/admin/audit-logs?page=${page}&limit=${PAGE_SIZE}`);
}

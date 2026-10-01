import { ApiError, apiFetch, readJson } from './auth.ts';

// Mga tawag sa /api/admin/* (Day 49). Admin lang ang makakakuha ng data — ang backend (requireRole) ang humaharang.
// Ang mga hugis ay GINAWA mula sa OpenAPI spec (Day 78, D-027) — hindi na kopya (D-019)
import type { AdminUsersResponse, AuditLogsResponse } from './openapi.generated.ts';

export type AdminUser = AdminUsersResponse['users'][number]; // createdAt: ISO string — JSON ay walang Date type
export type AuditLog = AuditLogsResponse['logs'][number];
// Ang pagination na kasama ng bawat listahan (Day 47)
export type PageInfo = Omit<AdminUsersResponse, 'users'>;

const PAGE_SIZE = 10;

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path); // kusang nagre-refresh kapag expired ang access token (Day 51)
  const data = await readJson(res);
  // Kasama ang status (401/403) — ang page ang magpapasya kung ano ang ipapakita
  if (!res.ok) throw new ApiError(data.error ?? 'Request failed', data.fields, res.status);
  return data;
}

export function getAdminUsers(page: number) {
  return getJson<AdminUsersResponse>(`/admin/users?page=${page}&limit=${PAGE_SIZE}`);
}

export function getAuditLogs(page: number) {
  return getJson<AuditLogsResponse>(`/admin/audit-logs?page=${page}&limit=${PAGE_SIZE}`);
}

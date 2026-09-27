// ⚠️ GINAWA NG CODE — huwag i-edit. Galing sa backend/openapi.json (Day 78).
// Para baguhin: baguhin ang Zod schema sa backend, tapos `npm run openapi` sa backend/.
// May test (backend/src/openapi/openapi.test.ts) na babagsak kapag hindi na ito tugma.

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

export type VerifyEmailInput = {
  token: string;
};

export type ErrorResponse = {
  error: string;
  fields?: Record<string, string[]>;
  requestId?: string;
};

export type Message = {
  message: string;
};

export type PublicUser = {
  id: number;
  email: string;
  name: string | null;
};

export type UserResponse = {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
};

export type MeUser = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

export type MeResponse = {
  user: {
    id: number;
    email: string;
    name: string | null;
    role: "user" | "admin";
    emailVerified: boolean;
  };
};

export type Session = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastUsedAt: string;
  since: string;
  current: boolean;
};

export type SessionsResponse = {
  sessions: {
    id: string;
    userAgent: string | null;
    ip: string | null;
    lastUsedAt: string;
    since: string;
    current: boolean;
  }[];
};

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  createdAt: string;
};

export type AdminUsersResponse = {
  users: {
    id: number;
    email: string;
    name: string | null;
    role: "user" | "admin";
    createdAt: string;
  }[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuditLog = {
  id: number;
  action: "register" | "login" | "login_failed" | "logout" | "access_denied" | "admin_list_users" | "admin_list_audit_logs" | "refresh_reuse" | "session_revoked" | "password_changed" | "password_change_failed" | "password_reset_requested" | "password_reset" | "email_verified" | "account_locked";
  actorId: number | null;
  actorEmail: string | null;
  targetId: number | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogsResponse = {
  logs: {
    id: number;
    action: "register" | "login" | "login_failed" | "logout" | "access_denied" | "admin_list_users" | "admin_list_audit_logs" | "refresh_reuse" | "session_revoked" | "password_changed" | "password_change_failed" | "password_reset_requested" | "password_reset" | "email_verified" | "account_locked";
    actorId: number | null;
    actorEmail: string | null;
    targetId: number | null;
    ip: string | null;
    userAgent: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Health = {
  status: "ok";
  time: string;
};

export type Count = {
  count: number;
};

export type Echo = {
  received: unknown;
};

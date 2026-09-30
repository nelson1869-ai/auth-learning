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

export type PasskeyRegisterOptionsInput = {
  currentPassword: string;
};

export type PasskeyRegisterVerifyInput = {
  name?: string;
  response: {
    id: string;
    rawId: string;
    type: "public-key";
    response: {
      clientDataJSON: string;
      attestationObject: string;
      transports?: string[];
    };
    clientExtensionResults?: Record<string, unknown>;
    authenticatorAttachment?: "platform" | "cross-platform";
  };
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

export type Passkey = {
  id: number;
  name: string;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export type PasskeysResponse = {
  passkeys: {
    id: number;
    name: string;
    deviceType: "singleDevice" | "multiDevice";
    backedUp: boolean;
    createdAt: string;
    lastUsedAt: string | null;
  }[];
};

export type PasskeyResponse = {
  passkey: {
    id: number;
    name: string;
    deviceType: "singleDevice" | "multiDevice";
    backedUp: boolean;
    createdAt: string;
    lastUsedAt: string | null;
  };
};

export type PasskeyRegistrationOptions = {
  challenge: string;
  rp: {
    id?: string;
    name: string;
    [key: string]: unknown;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
    [key: string]: unknown;
  };
  pubKeyCredParams: {
    alg: number;
    type: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
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
  action: "register" | "login" | "login_failed" | "logout" | "access_denied" | "admin_list_users" | "admin_list_audit_logs" | "refresh_reuse" | "session_revoked" | "password_changed" | "password_change_failed" | "password_reset_requested" | "password_reset" | "email_verified" | "account_locked" | "passkey_added" | "passkey_add_failed" | "passkey_removed";
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
    action: "register" | "login" | "login_failed" | "logout" | "access_denied" | "admin_list_users" | "admin_list_audit_logs" | "refresh_reuse" | "session_revoked" | "password_changed" | "password_change_failed" | "password_reset_requested" | "password_reset" | "email_verified" | "account_locked" | "passkey_added" | "passkey_add_failed" | "passkey_removed";
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

export type Ready = {
  status: "ready" | "not_ready";
  checks: {
    database: "ok" | "down";
  };
  time: string;
};

export type Count = {
  count: number;
};

export type Echo = {
  received: unknown;
};

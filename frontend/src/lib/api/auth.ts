export type Role = "client" | "employee" | "admin";

type ApiRole = "CLIENT" | "EMPLOYEE" | "ADMIN";

type AuthUser = {
  id: number;
  publicId?: string;
  username: string;
  email: string;
  role: ApiRole;
  token: string;
  expiresAt: number;
};

type AuthError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8088";

export async function loginUser(input: {
  username: string;
  password: string;
  role: Role;
}) {
  return authRequest("/api/auth/login", {
    username: input.username,
    password: input.password,
    role: toApiRole(input.role),
  });
}

export async function signupUser(input: {
  username: string;
  email: string;
  password: string;
  role: Role;
}) {
  return authRequest("/api/auth/signup", {
    username: input.username,
    email: input.email,
    password: input.password,
    role: toApiRole(input.role),
  });
}

function toApiRole(role: Role): ApiRole {
  return role.toUpperCase() as ApiRole;
}

function fromApiRole(role: ApiRole): Role {
  return role.toLowerCase() as Role;
}

async function authRequest(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as AuthUser & AuthError;

  if (!response.ok) {
    throw new Error(payload.message ?? "Authentication request failed.");
  }

  return {
    id: payload.id,
    publicId: payload.publicId,
    username: payload.username,
    email: payload.email,
    role: fromApiRole(payload.role),
    token: payload.token,
    expiresAt: payload.expiresAt,
  };
}

export function getAuthHeaders() {
  const session = JSON.parse(
    localStorage.getItem("servicedesk_session") ?? "null",
  ) as { token?: string } | null;

  if (!session?.token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.token}`,
  };
}

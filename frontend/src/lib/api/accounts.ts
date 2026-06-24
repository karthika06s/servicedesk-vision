import { getAuthHeaders } from "@/lib/api/auth";

export type AccountRole = "ADMIN" | "CLIENT" | "EMPLOYEE";

export type AccountRecord = {
  id: number;
  publicId?: string;
  username: string;
  email: string;
  role: AccountRole;
  position?: string;
};

type ApiError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8088";

export async function getClients() {
  return request<AccountRecord[]>("/api/clients");
}

export async function getEmployees() {
  return request<AccountRecord[]>("/api/employees");
}

export async function createClient(client: { username: string; email: string }) {
  return request<AccountRecord>("/api/clients", {
    method: "POST",
    body: JSON.stringify(client),
  });
}

export async function updateClient(id: number, client: { username: string; email: string }) {
  return request<AccountRecord>(`/api/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(client),
  });
}

export async function deleteClient(id: number) {
  await request<void>(`/api/clients/${id}`, { method: "DELETE" });
}

export async function createEmployee(employee: { username: string; email: string; position: string }) {
  return request<AccountRecord>("/api/employees", {
    method: "POST",
    body: JSON.stringify(employee),
  });
}

export async function updateEmployee(id: number, employee: { username: string; email: string; position: string }) {
  return request<AccountRecord>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(employee),
  });
}

export async function deleteEmployee(id: number) {
  await request<void>(`/api/employees/${id}`, { method: "DELETE" });
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(payload.message ?? "Account request failed.");
  }

  return payload;
}

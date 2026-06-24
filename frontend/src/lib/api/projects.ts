import { getAuthHeaders } from "@/lib/api/auth";

type ProjectPayload = {
  name: string;
  detail: string;
  status: string;
  owner: string;
};

type TaskPayload = ProjectPayload & {
  projectId: number;
  employeeId?: number;
  employeeIds?: number[];
};

export type ProjectRecord = ProjectPayload & {
  id: number;
  tasks: TaskRecord[];
};

export type TaskRecord = ProjectPayload & {
  id: number;
  projectId: number;
  employeeId?: number;
  employeeIds?: number[];
};

type ApiError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8088";

export async function getProjects() {
  return request<ProjectRecord[]>("/api/projects");
}

export async function createProject(project: ProjectPayload) {
  return request<ProjectRecord>("/api/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export async function updateProject(id: number, project: ProjectPayload) {
  return request<ProjectRecord>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
}

export async function deleteProject(id: number) {
  await request<void>(`/api/projects/${id}`, { method: "DELETE" });
}

export async function createTask(task: TaskPayload) {
  return request<TaskRecord>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(id: number, task: TaskPayload) {
  return request<TaskRecord>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(task),
  });
}

export async function deleteTask(id: number) {
  await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
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
    throw new Error(payload.message ?? "Project request failed.");
  }

  return payload;
}

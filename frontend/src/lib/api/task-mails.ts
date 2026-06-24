import { getAuthHeaders } from "@/lib/api/auth";

type TaskMailPayload = {
  taskId: number;
  recipientEmail: string;
  subject: string;
  message: string;
};

type TaskMailResponse = TaskMailPayload & {
  id: number;
  projectId: number;
  senderEmail: string;
  senderUsername: string;
  deliveryStatus: "SAVED" | "SENT";
  createdAt: string;
};

type ApiError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8088";

export async function sendTaskMailReply(payload: TaskMailPayload) {
  const response = await fetch(`${API_BASE_URL}/api/task-mails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as TaskMailResponse & ApiError;

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to send task reply.");
  }

  return data;
}

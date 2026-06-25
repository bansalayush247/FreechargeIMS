import { apiClient } from "./api";

export type NotificationItem = {
  _id: string;
  subject: string;
  body: string;
  status: string;
  type?: string;
  channel?: string;
  recipientEmail?: string;
  createdAt?: string;
  sentAt?: string | null;
  errorMessage?: string;
  providerMessageId?: string;
  spaceId?: string | null;
  recipientUserId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
  } | null;
  metadata?: Record<string, unknown>;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function listNotifications(options?: {
  spaceId?: string;
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  channel?: string;
}) {
  const { spaceId, ...params } = options ?? {};

  const res = await apiClient.get("/notifications", {
    params,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });

  return res.data?.data ?? res.data;
}

export async function getNotification(id: string) {
  const res = await apiClient.get(`/notifications/${id}`);
  return res.data?.data ?? res.data;
}

export async function sendNotification(payload: Record<string, unknown>, spaceId?: string) {
  const res = await apiClient.post("/notifications/send", payload, {
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data?.data ?? res.data;
}

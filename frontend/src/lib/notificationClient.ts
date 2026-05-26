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
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  channel?: string;
}) {
  const res = await apiClient.get("/notifications", {
    params: options,
  });

  return res.data?.data ?? res.data;
}
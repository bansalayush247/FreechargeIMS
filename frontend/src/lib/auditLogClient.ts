import { apiClient } from "@/src/lib/api";
export async function listAuditLogs(params?: Record<string, unknown>) {
  const r = await apiClient.get("/audit-logs", { params });
  return r.data?.data ?? r.data;
}

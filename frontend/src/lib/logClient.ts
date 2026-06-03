import { apiClient } from "@/src/lib/api";
export async function getLogStatus() { const r = await apiClient.get("/logs/status"); return r.data?.data ?? r.data; }
export async function listLogArchives() { const r = await apiClient.get("/logs/archives"); return r.data?.data?.items ?? r.data?.data ?? []; }
export async function triggerArchive() { const r = await apiClient.post("/logs/archive"); return r.data?.data ?? r.data; }
export async function cleanupLogs() { const r = await apiClient.post("/logs/cleanup"); return r.data?.data ?? r.data; }
export async function deleteArchive(id: string) { const r = await apiClient.delete(`/logs/archives/${id}`); return r.data?.data ?? r.data; }

import { apiClient } from "@/src/lib/api";
export async function listRepairs() { const r = await apiClient.get("/repairs"); return r.data?.data?.items ?? r.data?.data ?? []; }
export async function getRepair(id: string) { const r = await apiClient.get(`/repairs/${id}`); return r.data?.data ?? r.data; }
export async function createRepair(payload: Record<string, unknown>) { const r = await apiClient.post("/repairs", payload); return r.data?.data ?? r.data; }
export async function updateRepair(id: string, payload: Record<string, unknown>) { const r = await apiClient.put(`/repairs/${id}`, payload); return r.data?.data ?? r.data; }
export async function completeRepair(id: string) { const r = await apiClient.post(`/repairs/${id}/complete`); return r.data?.data ?? r.data; }
export async function cancelRepair(id: string) { const r = await apiClient.post(`/repairs/${id}/cancel`); return r.data?.data ?? r.data; }

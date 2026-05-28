import { apiClient } from "@/src/lib/api";
export async function listWorkflowDefinitions() { const r = await apiClient.get("/workflows/definitions"); return r.data?.data?.items ?? r.data?.data ?? []; }
export async function createWorkflowDefinition(payload: Record<string, unknown>) { const r = await apiClient.post("/workflows/definitions", payload); return r.data?.data ?? r.data; }
export async function updateWorkflowDefinition(id: string, payload: Record<string, unknown>) { const r = await apiClient.put(`/workflows/definitions/${id}`, payload); return r.data?.data ?? r.data; }
export async function deleteWorkflowDefinition(id: string) { const r = await apiClient.delete(`/workflows/definitions/${id}`); return r.data?.data ?? r.data; }
export async function listWorkflowInstances() { const r = await apiClient.get("/workflows/instances"); return r.data?.data?.items ?? r.data?.data ?? []; }
export async function transitionWorkflow(instanceId: string, transition: string) { const r = await apiClient.post(`/workflows/instances/${instanceId}/transition`, { transition }); return r.data?.data ?? r.data; }

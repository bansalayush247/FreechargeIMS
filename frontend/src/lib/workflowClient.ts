import { apiClient } from "@/src/lib/api";
import { getApiItems } from "@/src/lib/api-data";

function spaceHeaders(spaceId?: string) {
  return spaceId ? { "x-space-id": spaceId } : undefined;
}

export async function listWorkflowDefinitions(spaceId?: string) {
  const response = await apiClient.get("/workflows/definitions", { headers: spaceHeaders(spaceId) });
  return getApiItems<any>(response.data);
}

export async function getWorkflowDefinition(id: string, spaceId?: string) {
  const response = await apiClient.get(`/workflows/definitions/${id}`, { headers: spaceHeaders(spaceId) });
  return response.data?.data ?? response.data;
}

export async function createWorkflowDefinition(payload: Record<string, unknown>, spaceId?: string) {
  const response = await apiClient.post("/workflows/definitions", payload, { headers: spaceHeaders(spaceId) });
  return response.data?.data ?? response.data;
}

export async function updateWorkflowDefinition(id: string, payload: Record<string, unknown>, spaceId?: string) {
  const response = await apiClient.patch(`/workflows/definitions/${id}`, payload, { headers: spaceHeaders(spaceId) });
  return response.data?.data ?? response.data;
}

export async function deleteWorkflowDefinition(id: string, spaceId?: string) {
  const response = await apiClient.delete(`/workflows/definitions/${id}`, { headers: spaceHeaders(spaceId) });
  return response.data?.data ?? response.data;
}

export async function listWorkflowInstances(spaceId?: string) {
  const response = await apiClient.get("/workflows/instances", { headers: spaceHeaders(spaceId) });
  return getApiItems<any>(response.data);
}

export async function transitionWorkflow(instanceId: string, action: string, spaceId?: string) {
  const response = await apiClient.patch(`/workflows/instances/${instanceId}/transition`, { action }, { headers: spaceHeaders(spaceId) });
  return response.data?.data ?? response.data;
}

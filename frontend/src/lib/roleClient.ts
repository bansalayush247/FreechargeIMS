import { apiClient } from "@/src/lib/api";

export type RolePayload = { name: string; code: string; description?: string; permissions: string[] };

export async function listRoles(spaceId?: string) {
  const res = await apiClient.get("/roles", {
    params: { page: 1, limit: 100 },
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return res.data?.data?.items ?? res.data?.data ?? [];
}

export async function getRole(id: string, spaceId?: string) {
  const res = await apiClient.get(`/roles/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

export async function createRole(payload: RolePayload, spaceId?: string) {
  const res = await apiClient.post("/roles", payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

export async function updateRole(id: string, payload: Partial<Omit<RolePayload, "code">>, spaceId?: string) {
  const res = await apiClient.patch(`/roles/${id}`, payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

export async function deleteRole(id: string, spaceId?: string) {
  const res = await apiClient.delete(`/roles/${id}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

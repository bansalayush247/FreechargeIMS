import { apiClient } from "@/src/lib/api";
import { getApiItems } from "@/src/lib/api-data";

export async function listMembers(spaceId?: string) {
  const res = await apiClient.get("/space-members", { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return getApiItems<any>(res.data);
}

export async function listUserRoles(spaceId?: string, params?: { page?: number; limit?: number; userId?: string; roleId?: string }) {
  const res = await apiClient.get("/space-members/user-roles", {
    params,
    headers: spaceId ? { "x-space-id": spaceId } : undefined,
  });
  return getApiItems<any>(res.data);
}

export async function inviteMember(payload: { email: string; roleIds: string[] }, spaceId?: string) {
  const res = await apiClient.post("/space-members", payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}
export async function updateMemberRoles(userId: string, roleIds: string[], spaceId?: string) {
  const roleId = roleIds[0];
  const res = await apiClient.patch(
    "/space-members/user-roles/replace",
    { userId, roleId },
    { headers: spaceId ? { "x-space-id": spaceId } : undefined }
  );
  return res.data?.data ?? res.data;
}
export async function replaceUserRoles(userId: string, roleIds: string[], spaceId?: string) {
  const roleId = roleIds[0];
  const res = await apiClient.patch(
    "/space-members/user-roles/replace",
    { userId, roleId },
    { headers: spaceId ? { "x-space-id": spaceId } : undefined }
  );
  return res.data?.data ?? res.data;
}
export async function removeMember(memberId: string, spaceId?: string) {
  const res = await apiClient.delete(`/space-members/${memberId}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

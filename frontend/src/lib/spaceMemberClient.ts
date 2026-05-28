import { apiClient } from "@/src/lib/api";

export async function listMembers(spaceId?: string) {
  const res = await apiClient.get("/space-members", { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data?.items ?? res.data?.data ?? [];
}
export async function inviteMember(payload: { email: string; roleIds: string[] }, spaceId?: string) {
  const res = await apiClient.post("/space-members/invite", payload, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}
export async function updateMemberRoles(memberId: string, roleIds: string[], spaceId?: string) {
  const res = await apiClient.patch(`/space-members/${memberId}/roles`, { roleIds }, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}
export async function replaceUserRoles(memberId: string, roleIds: string[], spaceId?: string) {
  const res = await apiClient.put(`/space-members/${memberId}/roles`, { roleIds }, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}
export async function removeMember(memberId: string, spaceId?: string) {
  const res = await apiClient.delete(`/space-members/${memberId}`, { headers: spaceId ? { "x-space-id": spaceId } : undefined });
  return res.data?.data ?? res.data;
}

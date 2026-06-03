"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { inviteMember, listMembers, removeMember, replaceUserRoles, updateMemberRoles, listUserRoles } from "@/src/lib/spaceMemberClient";
import { Authorize } from "@/src/components/auth/Authorize";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";

export default function MembersPage() {
  const { activeSpaceId } = useCurrentSpace();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["members", activeSpaceId], queryFn: () => listMembers(activeSpaceId || undefined), enabled: Boolean(activeSpaceId) });
  const { data: userRoles = [] } = useQuery({ queryKey: ["member-user-roles", activeSpaceId], queryFn: () => listUserRoles(activeSpaceId || undefined), enabled: Boolean(activeSpaceId) });
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState("");
  const invite = useMutation({ mutationFn: () => inviteMember({ email, roleIds: roleIds.split(",").map((v) => v.trim()).filter(Boolean) }, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const updateRoles = useMutation({ mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) => updateMemberRoles(userId, roles, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const replaceRoles = useMutation({ mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) => replaceUserRoles(userId, roles, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const remove = useMutation({ mutationFn: (id: string) => removeMember(id, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  return <div className="space-y-4"><PageHeader eyebrow="Members" title="Space members" description="Invite and manage space access." />
    <Authorize anyOf={[BACKEND_PERMISSIONS.MEMBER_INVITE, BACKEND_PERMISSIONS.UPDATE_SPACE]}>
      <div className="flex gap-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" /><Input value={roleIds} onChange={(e) => setRoleIds(e.target.value)} placeholder="roleId1,roleId2" /><Button onClick={() => invite.mutate()}>Invite</Button></div>
    </Authorize>
    {(data as Array<{ id?: string; _id?: string; userId?: { _id?: string; id?: string; email?: string }; email?: string; roles?: Array<{ id?: string; _id?: string; name?: string }> }>).map((m) => { const id = m.id || m._id || ""; const userId = m.userId?._id || m.userId?.id || ""; const roleNames = (userRoles as Array<{ _id?: string; id?: string; userId?: { _id?: string; id?: string }; roleId?: { name?: string; code?: string } }>).filter((r) => String(r.userId?._id || r.userId?.id || "") === String(userId || id)).map((r) => r.roleId?.name || r.roleId?.code).filter(Boolean).join(", "); return <div key={id} className="border rounded-xl p-3 flex items-center justify-between"><div>{m.userId?.email || m.email} - {roleNames || (m.roles || []).map((r) => r.name || r.id || r._id).join(", ") || "No roles"}</div><Authorize permission={BACKEND_PERMISSIONS.ASSIGN_ROLE}><div className="flex gap-2"><Button variant="outline" onClick={() => updateRoles.mutate({ userId, roles: roleIds.split(",").map((v) => v.trim()).filter(Boolean) })} disabled={!userId}>Update roles</Button><Button variant="outline" onClick={() => replaceRoles.mutate({ userId, roles: roleIds.split(",").map((v) => v.trim()).filter(Boolean) })} disabled={!userId}>Replace roles</Button><Button variant="outline" onClick={() => remove.mutate(id)}>Remove</Button></div></Authorize></div>; })}
  </div>;
}

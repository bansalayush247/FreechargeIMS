"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { inviteMember, listMembers, removeMember, replaceUserRoles, updateMemberRoles } from "@/src/lib/spaceMemberClient";
import { PermissionGuard } from "@/src/components/auth/PermissionGuard";

export default function MembersPage() {
  const { activeSpaceId } = useCurrentSpace();
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["members", activeSpaceId], queryFn: () => listMembers(activeSpaceId || undefined), enabled: Boolean(activeSpaceId) });
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState("");
  const invite = useMutation({ mutationFn: () => inviteMember({ email, roleIds: roleIds.split(",").map((v) => v.trim()).filter(Boolean) }, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const updateRoles = useMutation({ mutationFn: ({ id, roles }: { id: string; roles: string[] }) => updateMemberRoles(id, roles, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const replaceRoles = useMutation({ mutationFn: ({ id, roles }: { id: string; roles: string[] }) => replaceUserRoles(id, roles, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  const remove = useMutation({ mutationFn: (id: string) => removeMember(id, activeSpaceId || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }) });
  return <div className="space-y-4"><PageHeader eyebrow="Members" title="Space members" description="Invite and manage space access." />
    <PermissionGuard action="MANAGE" resource="MEMBERS"><div className="flex gap-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" /><Input value={roleIds} onChange={(e) => setRoleIds(e.target.value)} placeholder="roleId1,roleId2" /><Button onClick={() => invite.mutate()}>Invite</Button></div></PermissionGuard>
    {(data as Array<{ id?: string; _id?: string; email?: string; roles?: Array<{ id?: string; _id?: string; name?: string }> }>).map((m) => { const id = m.id || m._id || ""; return <div key={id} className="border rounded-xl p-3 flex items-center justify-between"><div>{m.email} - {(m.roles || []).map((r) => r.name || r.id || r._id).join(", ")}</div><div className="flex gap-2"><Button variant="outline" onClick={() => updateRoles.mutate({ id, roles: roleIds.split(",").map((v) => v.trim()).filter(Boolean) })}>Update roles</Button><Button variant="outline" onClick={() => replaceRoles.mutate({ id, roles: roleIds.split(",").map((v) => v.trim()).filter(Boolean) })}>Replace roles</Button><Button variant="outline" onClick={() => remove.mutate(id)}>Remove</Button></div></div>; })}
  </div>;
}

"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Authorize } from "@/src/components/auth/Authorize";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { inviteMember, listMembers, removeMember, replaceUserRoles, listUserRoles } from "@/src/lib/spaceMemberClient";
import { listRoles } from "@/src/lib/roleClient";

// Explicit interfaces for clean typing
interface SpaceMember {
  id?: string;
  _id?: string;
  email?: string;
  userId?: { id?: string; _id?: string; email?: string };
  roles?: Array<{ id?: string; _id?: string; name?: string }>;
}

interface UserRole {
  id?: string;
  _id?: string;
  userId?: { id?: string; _id?: string };
  roleId?: string | { id?: string; _id?: string; name?: string; code?: string };
}

interface SpaceRole {
  id?: string;
  _id?: string;
  name?: string;
  code?: string;
  type?: string;
}

export default function MembersPage() {
  const { activeSpaceId } = useCurrentSpace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<string, string>>({});

  // Queries
  const { data: members = [] } = useQuery<SpaceMember[]>({ 
    queryKey: ["members", activeSpaceId], 
    queryFn: () => listMembers(activeSpaceId || undefined), 
    enabled: Boolean(activeSpaceId) 
  });

  const { data: userRoles = [] } = useQuery<UserRole[]>({ 
    queryKey: ["member-user-roles", activeSpaceId], 
    queryFn: () => listUserRoles(activeSpaceId || undefined), 
    enabled: Boolean(activeSpaceId) 
  });

  const { data: roles = [] } = useQuery<SpaceRole[]>({
    queryKey: ["roles", activeSpaceId],
    queryFn: () => listRoles(activeSpaceId || undefined),
    enabled: Boolean(activeSpaceId),
  });

  const roleOptions = useMemo(
    () => roles.filter((role) => role.type !== "system" && role.code !== "SUPER_ADMIN"),
    [roles]
  );

  // Helper to cleanly invalidate all relevant caches
  const invalidateMemberData = () => {
    queryClient.invalidateQueries({ queryKey: ["members", activeSpaceId] });
    queryClient.invalidateQueries({ queryKey: ["member-user-roles", activeSpaceId] });
  };

  // Mutations
  const invite = useMutation({ 
    mutationFn: () => inviteMember({ email, roleIds: [] }, activeSpaceId || undefined), 
    onSuccess: invalidateMemberData 
  });

  const replaceRoles = useMutation({ 
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => replaceUserRoles(userId, [roleId], activeSpaceId || undefined), 
    onSuccess: invalidateMemberData 
  });

  const remove = useMutation({ 
    mutationFn: (id: string) => removeMember(id, activeSpaceId || undefined), 
    onSuccess: invalidateMemberData 
  });

  // Optimized O(N) lookup map for user roles
  const roleNamesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    userRoles.forEach((r) => {
      const targetId = r.userId?._id || r.userId?.id;
      if (targetId) {
        const roleName = typeof r.roleId === "string" ? r.roleId : r.roleId?.name || r.roleId?.code;
        if (roleName) {
          if (!map[targetId]) map[targetId] = [];
          map[targetId].push(roleName);
        }
      }
    });
    return map;
  }, [userRoles]);

  const currentRoleIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    userRoles.forEach((assignment) => {
      const targetId = assignment.userId?._id || assignment.userId?.id;
      const roleId = typeof assignment.roleId === "string" ? assignment.roleId : assignment.roleId?._id || assignment.roleId?.id;
      if (targetId && roleId && !map[targetId]) map[targetId] = roleId;
    });
    return map;
  }, [userRoles]);

  const currentUserId = String(user?.id || user?._id || "");
  const pendingRoleUserId = replaceRoles.isPending ? replaceRoles.variables?.userId : "";

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg">
      <PageHeader 
        eyebrow="Members" 
        title="Space members" 
        description="Invite and manage space access." 
      />

      {/* Invite Form */}
      <Authorize anyOf={[BACKEND_PERMISSIONS.MEMBER_INVITE, BACKEND_PERMISSIONS.UPDATE_SPACE]}>
        <div className="flex gap-2">
          <Input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="user@company.com" 
          />
          <Button onClick={() => invite.mutate()} disabled={!email.trim() || invite.isPending}>
            {invite.isPending ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </Authorize>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((m) => {
          const id = m.id || m._id || "";
          const userId = m.userId?._id || m.userId?.id || "";
          const lookupKey = userId || id;
          const isCurrentUser = userId === currentUserId;
          const selectedRoleId = selectedRoleByUser[userId] || currentRoleIdMap[userId] || roleOptions[0]?._id || roleOptions[0]?.id || "";

          // Resolve role names using our optimized map or fallback to inline roles
          const mappedRoles = roleNamesMap[lookupKey]?.join(", ");
          const fallbackRoles = (m.roles || []).map((r) => r.name || r.id || r._id).join(", ");
          const roleDisplay = mappedRoles || fallbackRoles || "No roles";

          return (
            <div key={id} className="border rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-medium">{m.userId?.email || m.email}</span>
                <span className="text-gray-500 text-sm"> — {roleDisplay}</span>
              </div>

              <Authorize permission={BACKEND_PERMISSIONS.ASSIGN_ROLE}>
                {isCurrentUser ? (
                  <span className="rounded-full border px-3 py-1 text-xs uppercase text-gray-500">You</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-10 min-w-48 rounded-md border bg-white px-3 text-sm"
                      value={selectedRoleId}
                      onChange={(event) => setSelectedRoleByUser((current) => ({ ...current, [userId]: event.target.value }))}
                      disabled={!userId || roleOptions.length === 0 || pendingRoleUserId === userId}
                    >
                      {roleOptions.length === 0 ? <option value="">No assignable roles</option> : null}
                      {roleOptions.map((role) => {
                        const roleId = role._id || role.id || "";
                        return roleId ? <option key={roleId} value={roleId}>{role.name || role.code || roleId}</option> : null;
                      })}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => replaceRoles.mutate({ userId, roleId: selectedRoleId })}
                      disabled={!userId || !selectedRoleId || pendingRoleUserId === userId}
                    >
                      {pendingRoleUserId === userId ? "Updating..." : "Update role"}
                    </Button>
                    <Button onClick={() => remove.mutate(id)} disabled={!id || remove.isPending}>Remove</Button>
                  </div>
                )}
              </Authorize>
            </div>
          );
        })}
      </div>
    </div>
  );
}

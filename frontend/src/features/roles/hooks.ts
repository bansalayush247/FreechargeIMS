"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, deleteRole, getRole, listRoles, updateRole, type RolePayload } from "@/src/lib/roleClient";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";

export function useRoles() {
  const { activeSpaceId } = useCurrentSpace();
  return useQuery({ queryKey: ["roles", activeSpaceId], queryFn: () => listRoles(activeSpaceId || undefined), enabled: Boolean(activeSpaceId) });
}
export function useRole(id: string) {
  const { activeSpaceId } = useCurrentSpace();
  return useQuery({ queryKey: ["roles", activeSpaceId, id], queryFn: () => getRole(id, activeSpaceId || undefined), enabled: Boolean(id && activeSpaceId) });
}
export function useRoleMutations() {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useCurrentSpace();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["roles", activeSpaceId] });
  return {
    create: useMutation({ mutationFn: (payload: RolePayload) => createRole(payload, activeSpaceId || undefined), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<RolePayload, "code">> }) => updateRole(id, payload, activeSpaceId || undefined), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteRole(id, activeSpaceId || undefined), onSuccess: refresh }),
  };
}

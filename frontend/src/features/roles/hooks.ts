"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, deleteRole, getRole, listRoles, updateRole, type RolePayload } from "@/src/lib/roleClient";

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: listRoles });
}
export function useRole(id: string) {
  return useQuery({ queryKey: ["roles", id], queryFn: () => getRole(id), enabled: Boolean(id) });
}
export function useRoleMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["roles"] });
  return {
    create: useMutation({ mutationFn: (payload: RolePayload) => createRole(payload), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<RolePayload> }) => updateRole(id, payload), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteRole(id), onSuccess: refresh }),
  };
}

"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { can, hasAllPermissions, hasAnyPermission } from "@/src/lib/authorization";

export function useAuthorization() {
  const { user } = useAuth();
  const { activeSpaceId } = useCurrentSpace();

  return useMemo(
    () => ({
      activeSpaceId,
      can: (permission: string) => can(user, permission, activeSpaceId),
      hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions, activeSpaceId),
      hasAllPermissions: (permissions: string[]) => hasAllPermissions(user, permissions, activeSpaceId),
    }),
    [activeSpaceId, user],
  );
}

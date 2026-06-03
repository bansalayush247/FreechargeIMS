"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { hasPermission, type PermissionCheckInput } from "@/src/lib/authorization";

export function usePermission(input: PermissionCheckInput) {
  const { user } = useAuth();
  const { activeSpaceId } = useCurrentSpace();
  const { action, ownerId, resource, spaceId } = input;
  const effectiveSpaceId = spaceId ?? activeSpaceId;

  return useMemo(
    () => hasPermission(user, { action, ownerId, resource, spaceId: effectiveSpaceId }),
    [action, effectiveSpaceId, ownerId, resource, user],
  );
}

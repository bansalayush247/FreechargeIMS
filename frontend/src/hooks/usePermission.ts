"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { hasPermission, type PermissionCheckInput } from "@/src/lib/permissions";

export function usePermission(input: PermissionCheckInput) {
  const { user } = useAuth();
  const { action, ownerId, resource, spaceId } = input;

  return useMemo(
    () => hasPermission(user, { action, ownerId, resource, spaceId }),
    [action, ownerId, resource, spaceId, user],
  );
}

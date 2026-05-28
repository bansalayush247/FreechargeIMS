"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/auth-provider";
import { hasPermission, type PermissionCheckInput } from "@/src/lib/permissions";

export function usePermission(input: PermissionCheckInput) {
  const { user } = useAuth();

  return useMemo(() => hasPermission(user, input), [user, input.action, input.ownerId, input.resource, input.spaceId]);
}

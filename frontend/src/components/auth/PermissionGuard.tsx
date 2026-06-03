"use client";

import type { ReactNode } from "react";
import { usePermission } from "@/src/hooks/usePermission";

type PermissionGuardProps = {
  action: string;
  resource?: string;
  ownerId?: string;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({ action, resource, ownerId, fallback = null, children }: PermissionGuardProps) {
  const allowed = usePermission({ action, resource, ownerId });
  return allowed ? <>{children}</> : <>{fallback}</>;
}

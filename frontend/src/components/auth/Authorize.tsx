"use client";

import type { ReactNode } from "react";
import { useAuthorization } from "@/src/hooks/useAuthorization";

type AuthorizeProps = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function Authorize({ permission, anyOf, allOf, fallback = null, children }: AuthorizeProps) {
  const authz = useAuthorization();

  const allowed =
    (permission ? authz.can(permission) : true) &&
    (anyOf?.length ? authz.hasAnyPermission(anyOf) : true) &&
    (allOf?.length ? authz.hasAllPermissions(allOf) : true);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

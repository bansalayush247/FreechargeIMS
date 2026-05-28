import type { AuthUser } from "@/src/types/auth";

export type PermissionCheckInput = {
  action: string;
  resource?: string;
  spaceId?: string;
  ownerId?: string;
};

function normalize(value?: string) {
  return (value || "").trim().toUpperCase();
}

export function hasPermission(user: AuthUser | null | undefined, input: PermissionCheckInput) {
  if (!user) {
    return false;
  }

  const role = normalize(user.role);
  if (role === "ADMIN" || role === "SUPERADMIN" || role === "OWNER") {
    return true;
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions.map((p) => normalize(p)) : [];
  const action = normalize(input.action);
  const resource = normalize(input.resource);
  const combined = resource ? `${action}_${resource}` : action;

  if (permissions.includes(action) || permissions.includes(combined)) {
    return true;
  }

  if (input.ownerId && user.id && input.ownerId === user.id && action.startsWith("VIEW")) {
    return true;
  }

  return false;
}

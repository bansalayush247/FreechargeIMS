import type { AuthUser } from "@/src/types/auth";

export const BACKEND_PERMISSIONS = {
  CREATE_SPACE: "space:create",
  UPDATE_SPACE: "space:update",
  VIEW_SPACE: "space:view",
  DELETE_SPACE: "space:delete",
  MEMBER_VIEW: "member:view",
  MEMBER_INVITE: "member:invite",
  MEMBER_UPDATE: "member:update",
  MEMBER_REMOVE: "member:remove",
  CREATE_ROLE: "role:create",
  UPDATE_ROLE: "role:update",
  VIEW_ROLE: "role:view",
  DELETE_ROLE: "role:delete",
  ASSIGN_ROLE: "role:assign",
  CREATE_PRODUCT: "product:create",
  UPDATE_PRODUCT: "product:update",
  VIEW_PRODUCT: "product:view",
  DELETE_PRODUCT: "product:delete",
  CREATE_INVENTORY: "inventory:create",
  UPDATE_INVENTORY: "inventory:update",
  VIEW_INVENTORY: "inventory:view",
  DELETE_INVENTORY: "inventory:delete",
  CREATE_INVENTORY_TRANSACTION: "inventory-transaction:create",
  VIEW_INVENTORY_TRANSACTION: "inventory-transaction:view",
  CREATE_MERCHANT: "merchant:create",
  UPDATE_MERCHANT: "merchant:update",
  VIEW_MERCHANT: "merchant:view",
  DELETE_MERCHANT: "merchant:delete",
  CREATE_ASSET_REQUEST: "asset-request:create",
  VIEW_ASSET_REQUEST: "asset-request:view",
  APPROVE_ASSET_REQUEST: "asset-request:approve",
  FULFILL_ASSET_REQUEST: "asset-request:fulfill",
  CANCEL_ASSET_REQUEST: "asset-request:cancel-own",
  UPDATE_ASSET_REQUEST: "asset-request:update",
  VIEW_ASSET_REGISTRY: "asset-registry:view",
  UPDATE_ASSET_REGISTRY: "asset-registry:update",
  CREATE_WORKFLOW: "workflow:create",
  VIEW_WORKFLOW: "workflow:view",
  UPDATE_WORKFLOW: "workflow:update",
  DELETE_WORKFLOW: "workflow:delete",
  EXECUTE_WORKFLOW: "workflow:execute",
  SEND_NOTIFICATION: "notification:send",
  VIEW_NOTIFICATION: "notification:view",
  VIEW_AUDIT_LOGS: "audit-log:view",
  MANAGE_LOGS: "system-log:view",
} as const;

const PERMISSION_ALIASES: Record<string, string[]> = {
  CREATE_SPACE: [BACKEND_PERMISSIONS.CREATE_SPACE],
  UPDATE_SPACE: [BACKEND_PERMISSIONS.UPDATE_SPACE],
  VIEW_SPACE: [BACKEND_PERMISSIONS.VIEW_SPACE],
  DELETE_SPACE: [BACKEND_PERMISSIONS.DELETE_SPACE],
  CREATE_ROLE: [BACKEND_PERMISSIONS.CREATE_ROLE],
  UPDATE_ROLE: [BACKEND_PERMISSIONS.UPDATE_ROLE],
  VIEW_ROLE: [BACKEND_PERMISSIONS.VIEW_ROLE],
  DELETE_ROLE: [BACKEND_PERMISSIONS.DELETE_ROLE],
  ASSIGN_ROLE: [BACKEND_PERMISSIONS.ASSIGN_ROLE],
  CREATE_WAREHOUSE: [BACKEND_PERMISSIONS.CREATE_INVENTORY],
  UPDATE_WAREHOUSE: [BACKEND_PERMISSIONS.UPDATE_INVENTORY],
  VIEW_WAREHOUSE: [BACKEND_PERMISSIONS.VIEW_INVENTORY],
  DELETE_WAREHOUSE: [BACKEND_PERMISSIONS.DELETE_INVENTORY],
  CREATE_STORAGE_LOCATION: [BACKEND_PERMISSIONS.CREATE_INVENTORY],
  UPDATE_STORAGE_LOCATION: [BACKEND_PERMISSIONS.UPDATE_INVENTORY],
  VIEW_STORAGE_LOCATION: [BACKEND_PERMISSIONS.VIEW_INVENTORY],
  DELETE_STORAGE_LOCATION: [BACKEND_PERMISSIONS.DELETE_INVENTORY],
  CREATE_PRODUCT: [BACKEND_PERMISSIONS.CREATE_PRODUCT],
  UPDATE_PRODUCT: [BACKEND_PERMISSIONS.UPDATE_PRODUCT],
  VIEW_PRODUCT: [BACKEND_PERMISSIONS.VIEW_PRODUCT],
  DELETE_PRODUCT: [BACKEND_PERMISSIONS.DELETE_PRODUCT],
  VIEW_PRODUCTS: [BACKEND_PERMISSIONS.VIEW_PRODUCT],
  VIEW_WAREHOUSES: [BACKEND_PERMISSIONS.VIEW_INVENTORY],
  CREATE_INVENTORY: [BACKEND_PERMISSIONS.CREATE_INVENTORY],
  UPDATE_INVENTORY: [BACKEND_PERMISSIONS.UPDATE_INVENTORY],
  VIEW_INVENTORY: [BACKEND_PERMISSIONS.VIEW_INVENTORY],
  DELETE_INVENTORY: [BACKEND_PERMISSIONS.DELETE_INVENTORY],
  CREATE_INVENTORY_TRANSACTION: [BACKEND_PERMISSIONS.CREATE_INVENTORY_TRANSACTION],
  VIEW_INVENTORY_TRANSACTION: [BACKEND_PERMISSIONS.VIEW_INVENTORY_TRANSACTION],
  CREATE_MERCHANT: [BACKEND_PERMISSIONS.CREATE_MERCHANT],
  UPDATE_MERCHANT: [BACKEND_PERMISSIONS.UPDATE_MERCHANT],
  VIEW_MERCHANT: [BACKEND_PERMISSIONS.VIEW_MERCHANT],
  DELETE_MERCHANT: [BACKEND_PERMISSIONS.DELETE_MERCHANT],
  VIEW_ORDERS: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST],
  CREATE_ORDER: [BACKEND_PERMISSIONS.CREATE_ASSET_REQUEST],
  UPDATE_ORDER: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST],
  CREATE_ASSET_REQUEST: [BACKEND_PERMISSIONS.CREATE_ASSET_REQUEST],
  VIEW_ASSET_REQUEST: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST],
  APPROVE_ASSET_REQUEST: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST],
  FULFILL_ASSET_REQUEST: [BACKEND_PERMISSIONS.FULFILL_ASSET_REQUEST],
  MANAGER_APPROVE_ASSET_REQUEST: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST],
  IT_APPROVE_ASSET_REQUEST: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST],
  ZONAL_MANAGER_APPROVE_ASSET_REQUEST: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST],
  WAREHOUSE_FULFILL_ASSET_REQUEST: [BACKEND_PERMISSIONS.FULFILL_ASSET_REQUEST],
  REJECT_ASSET_REQUEST: [BACKEND_PERMISSIONS.UPDATE_ASSET_REQUEST],
  FORWARD_ASSET_REQUEST: [BACKEND_PERMISSIONS.UPDATE_ASSET_REQUEST],
  CANCEL_ASSET_REQUEST: [BACKEND_PERMISSIONS.CANCEL_ASSET_REQUEST],
  CREATE_WORKFLOW: [BACKEND_PERMISSIONS.CREATE_WORKFLOW],
  VIEW_WORKFLOW: [BACKEND_PERMISSIONS.VIEW_WORKFLOW],
  UPDATE_WORKFLOW: [BACKEND_PERMISSIONS.UPDATE_WORKFLOW],
  DELETE_WORKFLOW: [BACKEND_PERMISSIONS.DELETE_WORKFLOW],
  EXECUTE_WORKFLOW: [BACKEND_PERMISSIONS.EXECUTE_WORKFLOW],
  SEND_NOTIFICATION: [BACKEND_PERMISSIONS.SEND_NOTIFICATION],
  VIEW_NOTIFICATION: [BACKEND_PERMISSIONS.VIEW_NOTIFICATION],
  VIEW_AUDIT_LOGS: [BACKEND_PERMISSIONS.VIEW_AUDIT_LOGS],
  MANAGE_LOGS: [BACKEND_PERMISSIONS.MANAGE_LOGS],
};

const ADMIN_USER_TYPES = new Set(["ADMIN"]);

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getUserId(user: AuthUser | null | undefined) {
  return String(user?.id || user?._id || "");
}

function getNormalizedPermissions(user: AuthUser | null | undefined, activeSpaceId?: string | null) {
  if (!activeSpaceId) {
    return new Set<string>();
  }

  const permissions = Array.isArray(user?.permissionsBySpace?.[activeSpaceId])
    ? user.permissionsBySpace[activeSpaceId]
    : [];
  const normalized = new Set(permissions.map((permission) => normalize(String(permission))));
  for (const permission of Array.from(normalized)) {
    for (const alias of PERMISSION_ALIASES[permission.toUpperCase()] || []) {
      normalized.add(normalize(alias));
    }
  }
  return normalized;
}

function canCheck(user: AuthUser | null | undefined, permission: string, activeSpaceId?: string | null) {
  if (!user) return false;
  if (user.isGlobalSuperAdmin) return true;
  const normalizedPermission = normalize(permission);
  const permissions = getNormalizedPermissions(user, activeSpaceId);

  return permissions.has(normalizedPermission) || (PERMISSION_ALIASES[permission.toUpperCase()] || []).some((alias) => permissions.has(normalize(alias)));
}

export function can(user: AuthUser | null | undefined, permission: string, activeSpaceId?: string | null) {
  return canCheck(user, permission, activeSpaceId);
}

export function hasAnyPermission(user: AuthUser | null | undefined, permissions: string[], activeSpaceId?: string | null) {
  return permissions.some((permission) => canCheck(user, permission, activeSpaceId));
}

export function hasAllPermissions(user: AuthUser | null | undefined, permissions: string[], activeSpaceId?: string | null) {
  return permissions.every((permission) => canCheck(user, permission, activeSpaceId));
}

export type PermissionCheckInput = {
  action: string;
  resource?: string;
  ownerId?: string;
  spaceId?: string | null;
};

export function hasPermission(user: AuthUser | null | undefined, input: PermissionCheckInput) {
  if (!user) return false;
  const action = normalize(input.action);
  const resource = normalize(input.resource);
  const combined = resource ? `${resource}:${action}` : action;
  if (canCheck(user, action, input.spaceId) || canCheck(user, combined, input.spaceId)) return true;
  if (input.ownerId && input.ownerId === getUserId(user) && action.startsWith("view")) return true;
  return false;
}

export function isAdminUserType(user: AuthUser | null | undefined) {
  return ADMIN_USER_TYPES.has(normalize(user?.userType));
}

export const ROUTE_PERMISSION_RULES: Array<{ startsWith: string; anyOf: string[] }> = [
  { startsWith: "/products", anyOf: [BACKEND_PERMISSIONS.VIEW_PRODUCT] },
  { startsWith: "/inventory", anyOf: [BACKEND_PERMISSIONS.VIEW_INVENTORY] },
  { startsWith: "/transactions/create", anyOf: [BACKEND_PERMISSIONS.CREATE_INVENTORY_TRANSACTION] },
  { startsWith: "/transactions", anyOf: [BACKEND_PERMISSIONS.VIEW_INVENTORY_TRANSACTION] },
  { startsWith: "/requests/create", anyOf: [BACKEND_PERMISSIONS.CREATE_ASSET_REQUEST] },
  { startsWith: "/requests/pending-approvals", anyOf: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST] },
  { startsWith: "/requests/fulfillment-queue", anyOf: [BACKEND_PERMISSIONS.FULFILL_ASSET_REQUEST] },
  { startsWith: "/requests", anyOf: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST] },
  { startsWith: "/warehouses", anyOf: [BACKEND_PERMISSIONS.VIEW_INVENTORY] },
  { startsWith: "/members", anyOf: [BACKEND_PERMISSIONS.MEMBER_VIEW, BACKEND_PERMISSIONS.VIEW_SPACE] },
  { startsWith: "/my-assets", anyOf: [BACKEND_PERMISSIONS.VIEW_ASSET_REGISTRY] },
  { startsWith: "/roles", anyOf: [BACKEND_PERMISSIONS.VIEW_ROLE] },
  { startsWith: "/workflows", anyOf: [BACKEND_PERMISSIONS.VIEW_WORKFLOW] },
  { startsWith: "/join-requests", anyOf: [BACKEND_PERMISSIONS.MEMBER_UPDATE, BACKEND_PERMISSIONS.UPDATE_SPACE] },
  { startsWith: "/spaces/requests", anyOf: [BACKEND_PERMISSIONS.MEMBER_UPDATE, BACKEND_PERMISSIONS.UPDATE_SPACE] },
  { startsWith: "/settings", anyOf: [BACKEND_PERMISSIONS.UPDATE_SPACE] },
  { startsWith: "/notifications/send", anyOf: [BACKEND_PERMISSIONS.SEND_NOTIFICATION] },
  { startsWith: "/notifications", anyOf: [BACKEND_PERMISSIONS.VIEW_NOTIFICATION] },
  { startsWith: "/logs", anyOf: [BACKEND_PERMISSIONS.MANAGE_LOGS] },
  { startsWith: "/audit-logs", anyOf: [BACKEND_PERMISSIONS.VIEW_AUDIT_LOGS] },
];

export function canAccessPath(user: AuthUser | null | undefined, pathname: string, activeSpaceId?: string | null) {
  const rule = ROUTE_PERMISSION_RULES.find((item) => pathname === item.startsWith || pathname.startsWith(`${item.startsWith}/`));
  if (!rule) return true;
  return hasAnyPermission(user, rule.anyOf, activeSpaceId);
}

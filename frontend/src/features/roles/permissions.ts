export const ROLE_PERMISSION_GROUPS = [
  { label: "Spaces", permissions: ["space:view", "space:create", "space:update", "space:delete"] },
  { label: "Members", permissions: ["member:view", "member:invite", "member:update", "member:remove"] },
  { label: "Roles", permissions: ["role:view", "role:create", "role:update", "role:delete", "role:assign"] },
  { label: "Inventory", permissions: ["inventory:view", "inventory:create", "inventory:update", "inventory:delete", "inventory-transaction:view", "inventory-transaction:create"] },
  { label: "Catalog", permissions: ["product:view", "product:create", "product:update", "product:delete", "merchant:view", "merchant:create", "merchant:update", "merchant:delete", "storage-location:view", "storage-location:create", "storage-location:update", "storage-location:delete"] },
  { label: "Asset requests", permissions: ["asset-request:view", "asset-request:create", "asset-request:update", "asset-request:approve", "asset-request:fulfill", "asset-request:view-own", "asset-request:view-all", "asset-request:update-own", "asset-request:update-all", "asset-request:cancel-own", "asset-request:cancel-all"] },
  { label: "Asset registry", permissions: ["asset-registry:view", "asset-registry:update"] },
  { label: "Workflows", permissions: ["workflow:view", "workflow:create", "workflow:update", "workflow:delete", "workflow:execute"] },
  { label: "Operations", permissions: ["notification:view", "notification:send", "audit-log:view", "system-log:view"] },
] as const;

export function toRoleCode(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

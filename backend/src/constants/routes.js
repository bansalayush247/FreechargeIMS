/**
 * API Route Paths Constants
 * Centralized location for all route paths used in the application
 */

const ROUTES = {
  // Base paths
  BASE: "/",
  AUTH: "/auth",
  SPACES: "/spaces",
  ROLES: "/roles",
  SPACE_MEMBERS: "/space-members",
  PRODUCTS: "/product",
  WAREHOUSE: "/warehouse",
  INVENTORY_ITEMS: "/inventory-items",
  INVENTORY_TRANSACTIONS: "/inventoryTransactions",
  ASSET_REQUESTS: "/asset-requests",
  REPAIRS: "/repairs",
  AUDIT_LOGS: "/audit-logs",
  LOGS: "/logs",

  // Sub-routes - Auth
  AUTH_ROUTES: {
    SIGNUP: "/signup",
    LOGIN: "/login",
    REFRESH: "/refresh",
    LOGOUT: "/logout",
    ME: "/me",
  },

  // Sub-routes - Products
  PRODUCT_ROUTES: {
    CREATE: "/",
    LIST: "/",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Warehouse
  WAREHOUSE_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Space
  SPACE_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Role
  ROLE_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Space Members
  SPACE_MEMBER_ROUTES: {
    USER_ROLES: "/user-roles",
    ASSIGN_ROLE: "/user-roles",
    REPLACE_ROLE: "/user-roles/replace",
    REMOVE_ROLE: "/user-roles/:id",
    CREATE: "/",
    LIST: "/",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Inventory
  INVENTORY_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  },

  // Sub-routes - Inventory Transactions
  INVENTORY_TRANSACTION_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    ITEM_AUDIT_TRAIL: "/item/:inventoryItemId",
  },

  // Sub-routes - Asset Requests
  ASSET_REQUEST_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    MANAGER_APPROVE: "/:id/manager-approve",
    IT_APPROVE: "/:id/it-approve",
    REJECT: "/:id/reject",
    CANCEL: "/:id/cancel",
  },

  // Sub-routes - Repairs
  REPAIR_ROUTES: {
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    COMPLETE: "/:id/complete",
    CANCEL: "/:id/cancel",
  },

  // Sub-routes - Audit Logs
  AUDIT_LOG_ROUTES: {
    LIST: "/",
    GET_BY_ID: "/:id",
  },

  // Sub-routes - Logs
  LOG_ROUTES: {
    STATUS: "/status",
    ARCHIVES: "/archives",
    TRIGGER_ARCHIVE: "/archive",
    DELETE_ARCHIVE: "/archives/:filename",
    CLEANUP: "/cleanup",
  },
};

module.exports = ROUTES;

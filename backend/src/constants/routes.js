/**
 * API Route Paths Constants
 * Centralized location for all route paths used in the application
 */

const API_VERSION = "/api/v1";
const INVENTORY_TRANSACTION_ROUTES = Object.freeze({
  CREATE: "/",
  LIST: "/",
  GET_BY_ID: "/:id",
  ITEM_AUDIT_TRAIL: "/item/:inventoryItemId",
});
const ASSET_REQUEST_ROUTES = Object.freeze({
  CREATE: "/",
  LIST: "/",
  GET_BY_ID: "/:id",
  MANAGER_APPROVE: "/:id/manager-approve",
  IT_APPROVE: "/:id/it-approve",
  REJECT: "/:id/reject",
  CANCEL: "/:id/cancel",
  FORWARD: "/:id/forward",
});
const REPAIR_ROUTES = Object.freeze({
  CREATE: "/",
  LIST: "/",
  GET_BY_ID: "/:id",
  UPDATE: "/:id",
  COMPLETE: "/:id/complete",
  CANCEL: "/:id/cancel",
});
const NOTIFICATION_ROUTES = Object.freeze({
  SEND_EMAIL: "/email",
  LIST: "/",
  GET_BY_ID: "/:id",
});
const WORKFLOW_ROUTES = Object.freeze({
  DEFINITIONS: "/definitions",
  DEFINITION_BY_ID: "/definitions/:id",
  INSTANCES: "/instances",
  INSTANCE_BY_ID: "/instances/:id",
  INSTANCE_TRANSITION: "/instances/:id/transition",
});
const AUDIT_LOG_ROUTES = Object.freeze({
  LIST: "/",
  GET_BY_ID: "/:id",
});

const ENDPOINTS = Object.freeze({
  HEALTH: `${API_VERSION}/health`,

  BASE: API_VERSION,

  AUTH: Object.freeze({
    BASE: `${API_VERSION}/auth`,
    SIGNUP: "/signup",
    REGISTER: "/signup",
    LOGIN: "/login",
    REFRESH: "/refresh",
    LOGOUT: "/logout",
    ME: "/me",
  }),

  SPACES: Object.freeze({
    BASE: `${API_VERSION}/spaces`,
    CREATE: "/",
    LIST: "/",
    MY: "/mine",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
    CREATE_JOIN_REQUEST: "/:id/join-requests",
    LIST_JOIN_REQUESTS: "/:id/join-requests",
    LIST_MY_JOIN_REQUESTS: "/:id/join-requests/my",
    REVIEW_JOIN_REQUEST: "/:id/join-requests/:requestId/review",
  }),

  ROLES: Object.freeze({
    BASE: `${API_VERSION}/roles`,
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  }),

  SPACE_MEMBERS: `${API_VERSION}/space-members`,
  SPACE_MEMBER_ROUTES: Object.freeze({
    CREATE: "/",
    LIST: "/",
    UPDATE: "/:id",
    DELETE: "/:id",
    USER_ROLES: "/user-roles",
    ASSIGN_ROLE: "/user-roles",
    REPLACE_ROLE: "/user-roles/replace",
    REMOVE_ROLE: "/user-roles/:id",
  }),

  INVENTORY_ROUTES: Object.freeze({
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  }),

  PRODUCTS: Object.freeze({
    BASE: `${API_VERSION}/product`,
    CREATE: "/",
    LIST: "/",
    UPDATE: "/:id",
    DELETE: "/:id",
  }),

  WAREHOUSE: Object.freeze({
    BASE: `${API_VERSION}/warehouse`,
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  }),
  // New alias endpoints for storage locations (backwards-compatible)
  STORAGE_LOCATIONS: Object.freeze({
    BASE: `${API_VERSION}/storage-locations`,
    CREATE: "/",
    LIST: "/",
    GET_BY_ID: "/:id",
    UPDATE: "/:id",
    DELETE: "/:id",
  }),

  INVENTORY_ITEMS: `${API_VERSION}/inventory-items`,

  INVENTORY_TRANSACTIONS: Object.freeze({
    BASE: `${API_VERSION}/inventoryTransactions`,
    ...INVENTORY_TRANSACTION_ROUTES,
  }),
  INVENTORY_TRANSACTION_ROUTES,

  ASSET_REQUESTS: Object.freeze({
    BASE: `${API_VERSION}/asset-requests`,
    ...ASSET_REQUEST_ROUTES,
  }),
  ASSET_REQUEST_ROUTES,

  REPAIRS: Object.freeze({
    BASE: `${API_VERSION}/repairs`,
    ...REPAIR_ROUTES,
  }),
  REPAIR_ROUTES,

  NOTIFICATIONS: Object.freeze({
    BASE: `${API_VERSION}/notifications`,
    ...NOTIFICATION_ROUTES,
  }),
  NOTIFICATION_ROUTES,

  WORKFLOWS: Object.freeze({
    BASE: `${API_VERSION}/workflows`,
    ...WORKFLOW_ROUTES,
  }),
  WORKFLOW_ROUTES,

  AUDIT_LOGS: Object.freeze({
    BASE: `${API_VERSION}/audit-logs`,
    ...AUDIT_LOG_ROUTES,
  }),
  AUDIT_LOG_ROUTES,

  LOGS: Object.freeze({
    BASE: `${API_VERSION}/logs`,
    STATUS: "/status",
    ARCHIVES: "/archives",
    TRIGGER_ARCHIVE: "/archive",
    DELETE_ARCHIVE: "/archives/:filename",
    CLEANUP: "/cleanup",
  }),
});

module.exports = ENDPOINTS;

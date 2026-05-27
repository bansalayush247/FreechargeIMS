const { StatusCodes } = require("http-status-codes");

const ERRORS = {
  INTERNAL_SERVER_ERROR: {
    message: "Internal Server Error",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    errorCode: "GEN_001"
  },
  BAD_REQUEST: {
    message: "Bad request",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "REQ_000"
  },
  VALIDATION_FAILED: {
    message: "Validation failed",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "REQ_002"
  },
  RESOURCE_NOT_FOUND: {
    message: "Resource not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "RES_001"
  },
  DUPLICATE_RESOURCE: {
    message: "Resource already exists",
    statusCode: StatusCodes.CONFLICT,
    errorCode: "RES_002"
  },
  UNAUTHORIZED: {
    message: "Unauthorized access",
    statusCode: StatusCodes.UNAUTHORIZED,
    errorCode: "AUTH_001"
  },
  INVALID_TOKEN: {
    message: "Invalid token",
    statusCode: StatusCodes.UNAUTHORIZED,
    errorCode: "AUTH_002"
  },
  USER_ALREADY_EXISTS: {
    message: "A user with this emailId or employeeId already exists in this system",
    statusCode: StatusCodes.CONFLICT,
    errorCode: "USR_002"
  },
  USER_NOT_FOUND: {
    message: "User not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "USR_001"
  },
  SYSTEM_ROLE_MISSING: {
    message: "Critical System Error: The default VIEWER role could not be found in the database",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    errorCode: "SYS_002"
  },
  CASBIN_NOT_INITIALIZED: {
    message: "Critical System Error: Casbin enforcer has not been initialized yet.",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    errorCode: "SYS_003"
  },
  ROLE_NOT_FOUND: {
    message: "Role not found or inactive",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "ROL_001"
  },
  INSUFFICIENT_PERMISSIONS: {
    message: "Insufficient permissions",
    statusCode: StatusCodes.FORBIDDEN,
    errorCode: "AUTH_003"
  },
  SPACE_ID_REQUIRED: {
    message: "Space ID is required",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "REQ_001"
  },
  ACCESS_DENIED: {
    message: "Access denied",
    statusCode: StatusCodes.FORBIDDEN,
    errorCode: "AUTH_004"
  },
  SPACE_NOT_FOUND: {
    message: "Space not found or inactive",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "SPC_001"
  },
  PRODUCT_NOT_FOUND: {
    message: "Product not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "PRD_001"
  },
  WAREHOUSE_NOT_FOUND: {
    message: "Warehouse not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "WAR_001"
  },
  INVENTORY_NOT_FOUND: {
    message: "Inventory item not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "INV_001"
  },
  INVALID_SPACE_SCOPE: {
    message: "Entity does not belong to the requested space",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "SPC_002"
  },
  WORKFLOW_NOT_FOUND: {
    message: "Workflow definition not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "WFL_001"
  },
  REQUEST_NOT_FOUND: {
    message: "Request not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "REQ_404"
  },
  DB_DUPLICATE_KEY: {
    message: "Duplicate key conflict",
    statusCode: StatusCodes.CONFLICT,
    errorCode: "DB_11000"
  },
  REFRESH_TOKEN_REQUIRED: {
    message: "Refresh token is required",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "AUTH_005"
  },
  INVALID_SPACE_ID_FORMAT: {
    message: "Invalid Space ID format",
    statusCode: StatusCodes.BAD_REQUEST,
    errorCode: "REQ_003"
  },
  ROUTE_NOT_FOUND: {
    message: "Route not found",
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "ROUTE_404"
  },
  ADMIN_ACCESS_REQUIRED: {
    message: "Admin access required",
    statusCode: StatusCodes.FORBIDDEN,
    errorCode: "AUTH_006"
  }
};

const ERROR_LIST = Object.values(ERRORS);
const resolveErrorByMessageAndStatus = (message, statusCode) => {
  return (
    ERROR_LIST.find(
      (item) =>
        item.message === message &&
        Number(item.statusCode) === Number(statusCode)
    ) || null
  );
};

module.exports = { ERRORS, resolveErrorByMessageAndStatus };

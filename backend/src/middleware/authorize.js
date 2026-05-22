const logger = require("../config/logger");

const AppError = require("../utils/appError");

const {
  findUserRolesByUserAndSpace,
} = require("../repositories/userRole");

const {
  findActiveRolesByIds,
} = require("../repositories/role");

const { HTTP_STATUS } = require("../constants/http");
const { PERMISSIONS } = require("../constants/permission");
const { USER_TYPES } = require("../constants/user");

// System-level permissions that don't require a space ID
const SYSTEM_LEVEL_PERMISSIONS = new Set([
  PERMISSIONS.CREATE_SPACE,
  PERMISSIONS.CREATE_ROLE,
  PERMISSIONS.CREATE_WAREHOUSE,
  PERMISSIONS.CREATE_PRODUCT,
  PERMISSIONS.CREATE_USER,
]);

// Handles authorize.
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const spaceId = req.headers["x-space-id"];

      // Check if all required permissions are system-level
      const isSystemLevelOperation = requiredPermissions.every(
        (perm) => SYSTEM_LEVEL_PERMISSIONS.has(perm)
      );

      let permissionSet;

      // ADMIN users can perform any authorized operation without role lookup.
      if (req.user.userType === USER_TYPES.ADMIN) {
        permissionSet = new Set(requiredPermissions);
      } else if (isSystemLevelOperation) {
        logger.warn(`Non-admin user ${userId} attempted system-level operation`);
        throw new AppError("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
      } else {
        // Space-scoped operations require a space ID
        if (!spaceId) {
          logger.warn("Space ID missing in request");
          throw new AppError("Space ID is required", HTTP_STATUS.BAD_REQUEST);
        }

        const userRoles = await findUserRolesByUserAndSpace(userId, spaceId);

        if (!userRoles.length) {
          logger.warn(`No roles found for user=${userId} space=${spaceId}`);

          throw new AppError("Access denied", HTTP_STATUS.FORBIDDEN);
        }

        // Handles role ids.
        const roleIds = userRoles.map((item) => item.roleId);

        const roles = await findActiveRolesByIds(roleIds);

        permissionSet = new Set(
          roles.flatMap((role) => role.permissions)
        );
      }

      // Handles has permission.
      const hasPermission = requiredPermissions.every((permission) =>
        permissionSet.has(permission)
      );

      if (!hasPermission) {
        logger.warn(`Permission denied user=${userId}`);

        throw new AppError("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
      }

      req.permissions = Array.from(permissionSet);

      next();
    } catch (error) {
      logger.error(
        "Authorization failed",
        {
          error: error.message,
          stack: error.stack,
        }
      );

      next(error);
    }
  };
};

module.exports = authorize;


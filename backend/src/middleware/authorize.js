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

// System-level permissions that don't require a space ID
const SYSTEM_LEVEL_PERMISSIONS = [
  PERMISSIONS.CREATE_SPACE,
  PERMISSIONS.CREATE_ROLE,
  PERMISSIONS.CREATE_WAREHOUSE,
  PERMISSIONS.CREATE_PRODUCT,
  PERMISSIONS.CREATE_USER,
];

const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { USER_TYPES } = require("../constants/user");

      const spaceId = req.headers["x-space-id"];

      // Check if all required permissions are system-level
      const isSystemLevelOperation = requiredPermissions.every(
        (perm) => SYSTEM_LEVEL_PERMISSIONS.includes(perm)
      );

      let permissions = [];

      // ADMIN users can perform any authorized operation without role lookup.
      if (req.user.userType === USER_TYPES.ADMIN) {
        permissions = requiredPermissions;
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

        const roleIds = userRoles.map((item) => item.roleId);

        const roles = await findActiveRolesByIds(roleIds);

        permissions = roles.flatMap((role) => role.permissions);
      }

      const hasPermission = requiredPermissions.every((permission) =>
        permissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn(`Permission denied user=${userId}`);

        throw new AppError("Insufficient permissions", HTTP_STATUS.FORBIDDEN);
      }

      req.permissions = permissions;

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


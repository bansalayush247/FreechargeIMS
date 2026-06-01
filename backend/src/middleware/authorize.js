const logger = require("../config/logger");
const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");
const { normalizePermission } = require("../constants/permission");
const { authorizePermission } = require("../services/permissionResolver");

const authorize = (...requiredPermissions) => {
  return async (req, _res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const spaceId = req.spaceId || req.headers["x-space-id"];

      if (!userId || !spaceId) {
        throw new AppError(
          ERRORS.SPACE_ID_REQUIRED.message,
          ERRORS.SPACE_ID_REQUIRED.statusCode,
          ERRORS.SPACE_ID_REQUIRED.errorCode
        );
      }

      const permissions = requiredPermissions.map(normalizePermission);
      const checks = await Promise.all(
        permissions.map((permission) => authorizePermission({ userId, spaceId, permission }))
      );

      if (!checks.every(Boolean)) {
        throw new AppError(
          ERRORS.INSUFFICIENT_PERMISSIONS.message,
          ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
          ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
        );
      }

      req.authz = {
        permissionChecks: permissions,
        subject: `${String(userId)}:${String(spaceId)}`,
      };
      return next();
    } catch (error) {
      logger.error("Authorization failed", {
        error: error.message,
        stack: error.stack,
      });
      return next(error);
    }
  };
};

module.exports = authorize;

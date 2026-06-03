const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");
const { authorizePermission } = require("../services/permissionResolver");
const { getEnforcer } = require("../config/casbin");

const authorize = (...requiredPermissions) => {
  return async (req, _res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;
      
      // FIX: Never use req.params.id here because it holds resource IDs (like roleId or productId)
      const spaceId = req.spaceId || req.headers["x-space-id"] || req.params.id;

      if (!userId) {
        throw new AppError(
          ERRORS.UNAUTHORIZED.message,
          ERRORS.UNAUTHORIZED.statusCode,
          ERRORS.UNAUTHORIZED.errorCode
        );
      }

      const enforcer = await getEnforcer();
      
      // 1. Evaluate Global System Override via Casbin
      const globalRoles = await enforcer.getRolesForUser(`${String(userId)}:SYSTEM`);
      const isGlobalSuperAdmin = globalRoles.includes("SUPER_ADMIN:SYSTEM");

      if (isGlobalSuperAdmin) {
        req.spaceId = spaceId || "SYSTEM"; 
        return next(); // Total system clearance granted
      }

      // 2. Tenant Validation Constraints
      if (!spaceId) {
        throw new AppError(
          ERRORS.SPACE_ID_REQUIRED.message,
          ERRORS.SPACE_ID_REQUIRED.statusCode,
          ERRORS.SPACE_ID_REQUIRED.errorCode
        );
      }

      req.spaceId = spaceId;

      // 3. Loop through and evaluate all permissions requested by the route
      for (const permission of requiredPermissions) {
        const hasAccess = await authorizePermission({ userId, spaceId, permission });
        if (!hasAccess) {
          throw new AppError(
            ERRORS.INSUFFICIENT_PERMISSIONS.message,
            ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
            ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
          );
        }
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
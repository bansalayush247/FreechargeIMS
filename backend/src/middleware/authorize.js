const logger = require("../config/logger");
const { getEnforcer } = require("../config/casbin");
const {
  getAuthzCache,
  setAuthzCache,
} = require("../services/rbacCache");

const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

const {
  findUserRolesByUserAndSpace,
} = require("../repositories/userRole");

const {
  findActiveRolesByIds,
} = require("../repositories/role");

const { PERMISSIONS } = require("../constants/permission");
const { USER_TYPES } = require("../constants/user");

// System-level permissions that don't require a space ID
const SYSTEM_LEVEL_PERMISSIONS = new Set([
  PERMISSIONS.CREATE_SPACE,
  PERMISSIONS.CREATE_ROLE,
  PERMISSIONS.CREATE_WAREHOUSE,
  PERMISSIONS.CREATE_PRODUCT,
  PERMISSIONS.CREATE_USER,
  PERMISSIONS.VIEW_AUDIT_LOGS,
  PERMISSIONS.MANAGE_LOGS,
]);

// Handles authorize.
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const spaceId = req.headers["x-space-id"];
      const enforcer = await getEnforcer();

      // Check if all required permissions are system-level
      const isSystemLevelOperation = requiredPermissions.every(
        (perm) => SYSTEM_LEVEL_PERMISSIONS.has(perm)
      );

      let permissionSet;
      let subjectRoleCodes = [];
      let roles = [];
      let roleSubjects = [];

      // ADMIN users can perform any authorized operation without role lookup.
      if (req.user.userType === USER_TYPES.ADMIN) {
        permissionSet = new Set(requiredPermissions);
      } else if (isSystemLevelOperation) {
        logger.warn(`Non-admin user ${userId} attempted system-level operation`);
        throw new AppError(
          ERRORS.INSUFFICIENT_PERMISSIONS.message,
          ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
          ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
        );
      } else {
        // Space-scoped operations require a space ID
        if (!spaceId) {
          logger.warn("Space ID missing in request");
          throw new AppError(
            ERRORS.SPACE_ID_REQUIRED.message,
            ERRORS.SPACE_ID_REQUIRED.statusCode,
            ERRORS.SPACE_ID_REQUIRED.errorCode
          );
        }

        const userRoles = await findUserRolesByUserAndSpace(userId, spaceId);

        if (!userRoles.length) {
          logger.warn(`No roles found for user=${userId} space=${spaceId}`);

          throw new AppError(
            ERRORS.ACCESS_DENIED.message,
            ERRORS.ACCESS_DENIED.statusCode,
            ERRORS.ACCESS_DENIED.errorCode
          );
        }

        // Handles role ids.
        const roleIds = userRoles.map((item) => item.roleId);

        roles = await findActiveRolesByIds(roleIds);
        subjectRoleCodes = roles.map((role) => String(role.code));
        roleSubjects = roles.map(
          (role) => `space:${String(spaceId)}:role:${String(role.code)}`
        );

        permissionSet = new Set(
          roles.flatMap((role) => role.permissions)
        );
      }

      if (req.user.userType !== USER_TYPES.ADMIN) {
        const cached = getAuthzCache(String(userId), String(spaceId));

        if (!cached) {
          await enforcer.removeFilteredGroupingPolicy(0, String(userId));

          for (const roleSubject of roleSubjects) {
            await enforcer.removeFilteredPolicy(0, roleSubject);
          }

          const roleGroupingPolicies = roleSubjects.map((roleSubject) => [
            String(userId),
            roleSubject,
          ]);
          if (roleGroupingPolicies.length) {
            await enforcer.addGroupingPolicies(roleGroupingPolicies);
          }

          const uniquePolicyRows = [];
          const dedupe = new Set();
          for (let idx = 0; idx < roles.length; idx += 1) {
            const role = roles[idx];
            const roleSubject = roleSubjects[idx];
            for (const permission of role.permissions || []) {
              const key = `${roleSubject}::${permission}`;
              if (!dedupe.has(key)) {
                dedupe.add(key);
                uniquePolicyRows.push([roleSubject, permission, "access"]);
              }
            }
          }

          if (uniquePolicyRows.length) {
            await enforcer.addPolicies(uniquePolicyRows);
          }

          setAuthzCache(String(userId), String(spaceId), {
            permissions: Array.from(permissionSet),
          });
        } else {
          permissionSet = new Set(cached.permissions || []);
        }
      }

      const hasPermission = req.user.userType === USER_TYPES.ADMIN
        ? true
        : (await Promise.all(
          requiredPermissions.map((permission) =>
            enforcer.enforce(String(userId), permission, "access")
          )
        )).every(Boolean);

      if (!hasPermission) {
        logger.warn(`Permission denied user=${userId}`);

        throw new AppError(
          ERRORS.INSUFFICIENT_PERMISSIONS.message,
          ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
          ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
        );
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


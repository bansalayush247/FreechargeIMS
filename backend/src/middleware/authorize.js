const logger = require("../config/logger");
const { getEnforcer } = require("../config/casbin");
const { getAuthzCache, invalidateByUser, setAuthzCache } = require("../services/rbacCache");

const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

const { findUserRolesByUserAndSpace } = require("../repositories/userRole");

const { findActiveRolesByIds } = require("../repositories/role");
const spaceRepository = require("../repositories/space");
const { ROLE_CODES } = require("../constants/role");
const { SYSTEM_SPACES } = require("../constants/space");

const { PERMISSIONS } = require("../constants/permission");
const { USER_TYPES } = require("../constants/user");

// System-level permissions that don't require a space ID
const SYSTEM_LEVEL_PERMISSIONS = new Set([
  PERMISSIONS.CREATE_SPACE,
  PERMISSIONS.DELETE_SPACE,
  PERMISSIONS.CREATE_USER,
  PERMISSIONS.VIEW_AUDIT_LOGS,
  PERMISSIONS.MANAGE_LOGS,
]);

// Handles authorize.
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id || req.user.id;
      // Prefer `req.spaceId` (set by validateSpaceId) when available, fallback to header string
      const spaceId = req.spaceId || req.headers["x-space-id"];
      const enforcer = await getEnforcer();
      let bypassEnforce = false;

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
            // Allow SUPER_ADMIN (a role in the super-admin space) to perform system operations
            // except delete operations. Otherwise deny.
            try {
              const superSpace = await spaceRepository.findByCode(SYSTEM_SPACES.SUPER_ADMIN.code);
              let isSuperAdmin = false;
              let globalPermissionSet = new Set();
              if (superSpace) {
                const globalUserRoles = await findUserRolesByUserAndSpace(userId, superSpace._id);
                if (globalUserRoles && globalUserRoles.length) {
                  const globalRoleIds = globalUserRoles.map((r) => r.roleId);
                  const globalRoles = await findActiveRolesByIds(globalRoleIds);
                  isSuperAdmin = globalRoles.some((r) => String(r.code) === String(ROLE_CODES.SUPER_ADMIN));
                  globalPermissionSet = new Set(globalRoles.flatMap((r) => r.permissions || []));
                }
              }

              if (isSuperAdmin) {
                // Grant permissions from global role for this check and bypass Casbin enforcement
                permissionSet = new Set(requiredPermissions.filter((p) => globalPermissionSet.has(p)));
                bypassEnforce = true;
                // If permissionSet is empty, fallthrough to deny below
                if (!permissionSet.size) {
                  logger.warn(`Global admin lacks required permission user=${userId}`);
                  throw new AppError(
                    ERRORS.INSUFFICIENT_PERMISSIONS.message,
                    ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
                    ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
                  );
                }
              } else {
                logger.warn(`Non-admin user ${userId} attempted system-level operation`);
                throw new AppError(
                  ERRORS.INSUFFICIENT_PERMISSIONS.message,
                  ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
                  ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
                );
              }
            } catch (err) {
              // bubble existing AppError or wrap others
              if (err instanceof AppError) throw err;
              throw new AppError(
                ERRORS.INSUFFICIENT_PERMISSIONS.message,
                ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
                ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
              );
            }
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
          logger.warn(`No roles found for user=${userId} space=${String(spaceId)}`);

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
          invalidateByUser(String(userId));
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
        : bypassEnforce
          ? true
          : (await Promise.all(
            requiredPermissions.map(async (permission) => {
              // Try enforcing the requested permission first
              const ok = await enforcer.enforce(String(userId), permission, "access");
              if (ok) return true;

              // Compute simple aliases to maintain backwards compatibility
              // e.g. CREATE_STORAGE_LOCATION <-> CREATE_WAREHOUSE, STORAGE_LOCATIONS <-> WAREHOUSES
              const alt = permission
                .replace(/STORAGE_LOCATION(S)?/g, (m, p1) => (p1 ? "WAREHOUSES" : "WAREHOUSE"))
                .replace(/STORAGE_LOCATION/g, "WAREHOUSE");
              if (alt !== permission) {
                const okAlt = await enforcer.enforce(String(userId), alt, "access");
                if (okAlt) return true;
              }

              // Also try the reverse mapping if permission mentions WAREHOUSE
              const alt2 = permission
                .replace(/WAREHOUSE(S)?/g, (m, p1) => (p1 ? "STORAGE_LOCATIONS" : "STORAGE_LOCATION"));
              if (alt2 !== permission) {
                const okAlt2 = await enforcer.enforce(String(userId), alt2, "access");
                if (okAlt2) return true;
              }

              return false;
            })
          )).every(Boolean);

      if (!hasPermission) {
        logger.warn(`Permission denied user=${userId} space=${String(spaceId)} required=${JSON.stringify(requiredPermissions)}`);

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


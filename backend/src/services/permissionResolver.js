const { getEnforcer } = require("../config/casbin");
const { normalizePermission } = require("../constants/permission");
const { findByUserAndSpace } = require("../repositories/spaceMember");
const spaceMemberRepository = require("../repositories/spaceMember");
const userRoleRepository = require("../repositories/userRole");
const roleRepository = require("../repositories/role");
const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

const resolveSubject = (userId, spaceId) => `${String(userId)}:${String(spaceId)}`;

const assertActiveMembership = async (userId, spaceId) => {
  const membership = await findByUserAndSpace(userId, spaceId);
  if (!membership || !membership.isActive) {
    throw new AppError(
      ERRORS.INSUFFICIENT_PERMISSIONS.message,
      ERRORS.INSUFFICIENT_PERMISSIONS.statusCode,
      ERRORS.INSUFFICIENT_PERMISSIONS.errorCode
    );
  }
  return membership;
};

const authorizePermission = async ({ userId, spaceId, permission }) => {
  const requestedPermission = normalizePermission(permission);
  if (!requestedPermission) return false;

  const [resource, action] = requestedPermission.split(":");
  if (!resource || !action) return false;

  const enforcer = await getEnforcer();

  // 1. SYSTEM SCOPE CHECK: Is this user a global system admin?
  const isSystemAdmin = await enforcer.enforce(`${String(userId)}:SYSTEM`, resource, action);
  if (isSystemAdmin) {
    return true; 
  }

  // 2. TENANT SCOPE CHECK: Standard workspace access isolation rule
  await assertActiveMembership(userId, spaceId);
  
  const subject = resolveSubject(userId, spaceId);
  const allowed = await enforcer.enforce(subject, resource, action);
  return Boolean(allowed);
};

const getAuthzSnapshotByUser = async (userId) => {
  const enforcer = await getEnforcer();
  const memberships = await spaceMemberRepository.findActiveByUser(userId);
  const rolesBySpace = {};
  const permissionsBySpace = {};

  const globalRoles = await enforcer.getRolesForUser(`${String(userId)}:SYSTEM`);
  const isGlobalSuperAdmin = globalRoles.includes("SUPER_ADMIN:SYSTEM");

  for (const membership of memberships) {
    const spaceId = String(membership.spaceId);
    const userRoles = await userRoleRepository.findUserRolesByUserAndSpace(userId, spaceId);
    const roles = await roleRepository.findActiveRolesByIds(userRoles.map((item) => item.roleId));

    rolesBySpace[spaceId] = roles;
    permissionsBySpace[spaceId] = [
      ...new Set(
        roles
          .flatMap((role) => role.permissions || [])
          .map(normalizePermission)
          .filter(Boolean)
      ),
    ];
  }

  return {
    memberships,
    rolesBySpace,
    permissionsBySpace,
    isGlobalSuperAdmin,
  };
};

module.exports = {
  resolveSubject,
  assertActiveMembership,
  authorizePermission,
  getAuthzSnapshotByUser,
};

const { getEnforcer } = require("../config/casbin");
const { normalizePermission } = require("../constants/permission");
const { findByUserAndSpace, findActiveByUser } = require("../repositories/spaceMember");
const { findUserRolesByUserAndSpace } = require("../repositories/userRole");
const { findActiveRolesByIds } = require("../repositories/role");
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

const getRolesAndPermissions = async (userId, spaceId) => {
  const userRoles = await findUserRolesByUserAndSpace(userId, spaceId);
  const roleIds = userRoles.map((item) => item.roleId);
  const roles = await findActiveRolesByIds(roleIds);
  const permissions = Array.from(
    new Set((roles || []).flatMap((role) => (role.permissions || []).map(normalizePermission)))
  );

  return {
    roles,
    permissions,
  };
};

const authorizePermission = async ({ userId, spaceId, permission }) => {
  await assertActiveMembership(userId, spaceId);
  const requestedPermission = normalizePermission(permission);
  const { permissions } = await getRolesAndPermissions(userId, spaceId);

  if (permissions.includes(requestedPermission)) {
    return true;
  }

  const [resource, action] = requestedPermission.split(":");
  if (!resource || !action) {
    return false;
  }

  const enforcer = await getEnforcer();
  const allowed = await enforcer.enforce(resolveSubject(userId, spaceId), resource, action);
  return Boolean(allowed);
};

const getAuthzSnapshotByUser = async (userId) => {
  const memberships = await findActiveByUser(userId);
  const rolesBySpace = {};
  const permissionsBySpace = {};

  for (const membership of memberships) {
    const spaceKey = String(membership.spaceId);
    const { roles, permissions } = await getRolesAndPermissions(userId, membership.spaceId);
    rolesBySpace[spaceKey] = roles.map((role) => role.code);
    permissionsBySpace[spaceKey] = permissions;
  }

  return {
    memberships,
    rolesBySpace,
    permissionsBySpace,
  };
};

module.exports = {
  resolveSubject,
  assertActiveMembership,
  getRolesAndPermissions,
  authorizePermission,
  getAuthzSnapshotByUser,
};

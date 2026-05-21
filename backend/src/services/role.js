const roleRepository = require("../repositories/role");
const spaceRepository = require("../repositories/space");
const userRoleRepository = require(
  "../repositories/userRole"
);
const auditLogService = require("./auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

// Handles assert space exists.
const assertSpaceExists = async (spaceId) => {
  const space = await spaceRepository.findById(spaceId);

  if (!space || !space.isActive) {
    throw new AppError("Space not found or inactive", 404);
  }

  return space;
};

// Handles create role.
const createRole = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  await assertSpaceExists(spaceId);

  const existingRole =
    await roleRepository.findBySpaceAndCode(
      spaceId,
      payload.code
    );

  if (existingRole) {
    throw new AppError("Role code already exists", 400);
  }

  const role = await roleRepository.create({
    ...payload,
    spaceId,
    isSystemRole: false,
    createdBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.ROLE,
    entityId: role._id,
    before: null,
    after: role,
    metadata: {
      code: role.code,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role created", {
    roleId: role._id,
  });

  return role;
};

// Handles get roles.
const getRoles = async (spaceId, filters) => {
  await assertSpaceExists(spaceId);

  return roleRepository.paginate({
    ...filters,
    spaceId,
  });
};

// Handles get role by id.
const getRoleById = async (id, spaceId) => {
  const role = await roleRepository.findById(id);

  if (!role || String(role.spaceId) !== String(spaceId)) {
    throw new AppError("Role not found", 404);
  }

  return role;
};

// Handles update role.
const updateRole = async (
  id,
  spaceId,
  payload,
  userId,
  context = {}
) => {
  const role = await getRoleById(id, spaceId);

  if (role.isSystemRole && payload.permissions) {
    throw new AppError(
      "System role permissions cannot be updated",
      400
    );
  }

  const updatedRole = await roleRepository.updateById(id, {
    ...payload,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.ROLE,
    entityId: id,
    before: role,
    after: updatedRole,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role updated", {
    roleId: id,
  });

  return updatedRole;
};

// Handles delete role.
const deleteRole = async (
  id,
  spaceId,
  userId,
  context = {}
) => {
  const role = await getRoleById(id, spaceId);

  if (role.isSystemRole) {
    throw new AppError("System role cannot be deleted", 400);
  }

  const deletePayload = {
    isActive: false,
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    updatedBy: userId,
  };

  const deletedRole = await roleRepository.updateById(
    id,
    deletePayload
  );

  await userRoleRepository.softDeleteByRoleAndSpace(
    id,
    spaceId,
    deletePayload
  );

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.ROLE,
    entityId: id,
    before: role,
    after: deletedRole,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role deleted", {
    roleId: id,
  });

  return deletedRole;
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};



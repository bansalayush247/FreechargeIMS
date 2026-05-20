const spaceRepository = require("../repositories/space.repository");
const spaceMemberRepository = require(
  "../repositories/spaceMember.repository"
);
const roleRepository = require("../repositories/role.repository");
const userRoleRepository = require(
  "../repositories/userRole.repository"
);
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog.constant");
const { ROLE_CODES } = require("../constants/role.constant");
const {
  PERMISSIONS,
} = require("../constants/permission.constant");

const DEFAULT_SYSTEM_ROLES = [
  {
    name: "Space Admin",
    code: ROLE_CODES.SPACE_ADMIN,
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: "Inventory Manager",
    code: ROLE_CODES.INVENTORY_MANAGER,
    permissions: [
      PERMISSIONS.CREATE_INVENTORY,
      PERMISSIONS.UPDATE_INVENTORY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.ASSIGN_INVENTORY,
      PERMISSIONS.CREATE_REPAIR,
      PERMISSIONS.VIEW_REPAIR,
      PERMISSIONS.UPDATE_REPAIR,
      PERMISSIONS.COMPLETE_REPAIR,
      PERMISSIONS.CANCEL_REPAIR,
    ],
  },
  {
    name: "Viewer",
    code: ROLE_CODES.VIEWER,
    permissions: [
      PERMISSIONS.VIEW_SPACE,
      PERMISSIONS.VIEW_ROLE,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_INVENTORY_TRANSACTION,
      PERMISSIONS.VIEW_REPAIR,
    ],
  },
];

const assertUniqueSpaceFields = async (
  payload,
  existingSpaceId
) => {
  if (payload.code) {
    const existingByCode =
      await spaceRepository.findByCode(payload.code);

    if (
      existingByCode &&
      String(existingByCode._id) !== String(existingSpaceId)
    ) {
      throw new AppError("Space code already exists", 400);
    }
  }

  if (payload.name) {
    const existingByName =
      await spaceRepository.findByName(payload.name);

    if (
      existingByName &&
      String(existingByName._id) !== String(existingSpaceId)
    ) {
      throw new AppError("Space name already exists", 400);
    }
  }
};

const createSpace = async (payload, userId, context = {}) => {
  logger.info("Creating space");

  await assertUniqueSpaceFields(payload);

  const space = await spaceRepository.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId,
  });

  const member = await spaceMemberRepository.create({
    spaceId: space._id,
    userId,
    isActive: true,
    createdBy: userId,
    updatedBy: userId,
  });

  const roles = [];

  for (const rolePayload of DEFAULT_SYSTEM_ROLES) {
    const role = await roleRepository.create({
      ...rolePayload,
      spaceId: space._id,
      isSystemRole: true,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    roles.push(role);
  }

  const spaceAdminRole = roles.find(
    (role) => role.code === ROLE_CODES.SPACE_ADMIN
  );

  const assignment = await userRoleRepository.create({
    spaceId: space._id,
    userId,
    roleId: spaceAdminRole._id,
    assignedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: space._id,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.SPACE,
    entityId: space._id,
    before: null,
    after: space,
    metadata: {
      code: space.code,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await auditLogService.recordAuditLog({
    spaceId: space._id,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
    entityId: member._id,
    before: null,
    after: member,
    metadata: {
      userId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await auditLogService.recordAuditLog({
    spaceId: space._id,
    actorId: userId,
    action: AUDIT_ACTIONS.ASSIGN,
    entityType: AUDIT_ENTITY_TYPES.USER_ROLE,
    entityId: assignment._id,
    before: null,
    after: assignment,
    metadata: {
      userId,
      roleId: spaceAdminRole._id,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space created", {
    spaceId: space._id,
  });

  return space;
};

const getSpaces = async (filters) => {
  return spaceRepository.paginate(filters);
};

const getSpaceById = async (id) => {
  const space = await spaceRepository.findById(id);

  if (!space) {
    throw new AppError("Space not found", 404);
  }

  return space;
};

const updateSpace = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const space = await getSpaceById(id);

  await assertUniqueSpaceFields(payload, id);

  const updatedSpace = await spaceRepository.updateById(id, {
    ...payload,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: id,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.SPACE,
    entityId: id,
    before: space,
    after: updatedSpace,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space updated", {
    spaceId: id,
  });

  return updatedSpace;
};

const deleteSpace = async (id, userId, context = {}) => {
  const space = await getSpaceById(id);

  if (space.code === "SUPER_ADMIN") {
    throw new AppError("SUPER_ADMIN space cannot be deleted", 400);
  }

  const deletedSpace = await spaceRepository.updateById(id, {
    isActive: false,
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: id,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.SPACE,
    entityId: id,
    before: space,
    after: deletedSpace,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space deleted", {
    spaceId: id,
  });

  return deletedSpace;
};

module.exports = {
  createSpace,
  getSpaces,
  getSpaceById,
  updateSpace,
  deleteSpace,
};

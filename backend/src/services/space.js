const spaceRepository = require("../repositories/space");
const spaceMemberRepository = require("../repositories/spaceMember");
const roleRepository = require("../repositories/role");
const userRoleRepository = require("../repositories/userRole");
const auditLogService = require("./auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const { getEnforcer } = require("../config/casbin");
const WorkflowDefinition = require("../models/workflowDefinition");

const { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES} = require("../constants/auditLog");
const { ROLE_CODES } = require("../constants/role");
const { SPACE_CODES, SPACE_TYPES } = require("../constants/space");
const {
  PERMISSIONS,
  PERMISSION_REGISTRY,
} = require("../constants/permission");

const DEFAULT_SYSTEM_ROLES = [
  {
    name: "Space Admin",
    code: ROLE_CODES.SPACE_ADMIN,
    permissions: Object.values(PERMISSION_REGISTRY),
  },
  {
    name: "Member",
    code: ROLE_CODES.MEMBER,
    permissions: [
      PERMISSIONS.CREATE_ASSET_REQUEST,
      PERMISSIONS.VIEW_SPACE,
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.VIEW_PRODUCT,
      PERMISSIONS.VIEW_NOTIFICATION,
    ],
  },
];

const syncRolePolicies = async (role, spaceId) => {
  const enforcer = await getEnforcer();
  const roleSubject = `${String(role.code)}:${String(spaceId)}`;

  for (const permissionString of role.permissions || []) {
    const [resource, action] = permissionString.split(":");
    if (resource && action) {
      await enforcer.addPolicy(roleSubject, resource, action);
    }
  }

  await enforcer.savePolicy();
};

const syncUserRoleGrouping = async (userId, role, spaceId) => {
  const enforcer = await getEnforcer();
  await enforcer.addGroupingPolicy(
    `${String(userId)}:${String(spaceId)}`,
    `${String(role.code)}:${String(spaceId)}`
  );
  await enforcer.savePolicy();
};

const normalizeSpacePayload = (payload) => {
  const normalized = { ...payload };

  if (!normalized.type) {
    if (Object.values(SPACE_TYPES).includes(normalized.spaceType)) {
      normalized.type = normalized.spaceType;
    } else if (Object.values(SPACE_TYPES).includes(normalized.code)) {
      normalized.type = normalized.code;
    } else if (Object.values(SPACE_TYPES).includes(normalized.spaceCode)) {
      normalized.type = normalized.spaceCode;
    }
  }

  delete normalized.spaceType;
  delete normalized.spaceCode;

  return normalized;
};

const assertWorkflowSelections = async (spaceId, payload) => {
  const selectedIds = [payload.employeeWorkflowDefinitionId, payload.merchantWorkflowDefinitionId].filter(Boolean);
  if (!selectedIds.length) return;

  const count = await WorkflowDefinition.countDocuments({
    _id: { $in: selectedIds },
    spaceId,
    entityType: "ASSET_REQUEST",
    isActive: true,
    isDeleted: false,
  });

  if (count !== new Set(selectedIds.map(String)).size) {
    throw new AppError("Selected workflow must be an active asset request workflow in this space", 400);
  }
};

const isUserTypeSpaceScoped = (userType) =>
  Object.values(SPACE_TYPES).includes(userType);

// Handles assert unique space fields.
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

// Handles create space.
const createSpace = async (payload, userId, userType, globalSuperAdmin = false, context = {}) => {
  logger.info("Creating space");

  const normalizedPayload = normalizeSpacePayload(payload);

  if (!globalSuperAdmin && normalizedPayload.type && normalizedPayload.type !== userType) {
    throw new AppError("Space type must match your user type", 403);
  }

  await assertUniqueSpaceFields(normalizedPayload);

  const space = await spaceRepository.create({
    ...normalizedPayload,
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

    await syncRolePolicies(role, space._id);
    roles.push(role);
  }

  const spaceAdminRole = roles[0];

  const assignment = await userRoleRepository.create({
    spaceId: space._id,
    userId,
    roleId: spaceAdminRole._id,
    assignedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await syncUserRoleGrouping(userId, spaceAdminRole, space._id);

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
      type: space.type,
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

// Handles get spaces.
const getSpaces = async (filters, userType, globalSuperAdmin = false) => {
  const query = { ...filters };

  if (!globalSuperAdmin && isUserTypeSpaceScoped(userType)) {
    query.type = userType;
  }

  return spaceRepository.paginate(query);
};

// Handles get space by id.
const getSpaceById = async (id) => {
  const space = await spaceRepository.findById(id);

  if (!space) {
    throw new AppError("Space not found", 404);
  }

  return space;
};

// Handles update space.
const updateSpace = async (
  id,
  payload,
  userId,
  userType,
  globalSuperAdmin = false,
  context = {}
) => {
  console.log("Updating space", id, payload);
  const space = await getSpaceById(id);

  const normalizedPayload = normalizeSpacePayload(payload);

  if (!globalSuperAdmin && isUserTypeSpaceScoped(userType) && normalizedPayload.type && normalizedPayload.type !== userType) {
    throw new AppError("Space type must match your user type", 403);
  }

  await assertUniqueSpaceFields(normalizedPayload, id);
  await assertWorkflowSelections(id, normalizedPayload);

  const updatedSpace = await spaceRepository.updateById(id, {
    ...normalizedPayload,
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

// Handles delete space.
const deleteSpace = async (id, userId, context = {}) => {
  const space = await getSpaceById(id);

  if (space.code === SPACE_CODES.SUPER_ADMIN) {
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



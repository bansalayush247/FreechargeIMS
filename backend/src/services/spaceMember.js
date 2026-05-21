const spaceMemberRepository = require(
  "../repositories/spaceMember"
);
const userRoleRepository = require(
  "../repositories/userRole"
);
const roleRepository = require("../repositories/role");
const spaceRepository = require("../repositories/space");
const { findActiveUserById } = require(
  "../repositories/user"
);
const auditLogService = require("./auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");
const { ROLE_CODES } = require("../constants/role");

const assertSpaceExists = async (spaceId) => {
  const space = await spaceRepository.findById(spaceId);

  if (!space || !space.isActive) {
    throw new AppError("Space not found or inactive", 404);
  }

  return space;
};

const assertActiveUser = async (userId) => {
  const user = await findActiveUserById(userId);

  if (!user) {
    throw new AppError("User not found or inactive", 404);
  }

  return user;
};

const addMember = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  await Promise.all([
    assertSpaceExists(spaceId),
    assertActiveUser(payload.userId),
  ]);

  const existingMember =
    await spaceMemberRepository.findByUserAndSpace(
      payload.userId,
      spaceId
    );

  if (existingMember) {
    if (existingMember.isActive) {
      throw new AppError("User is already a space member", 400);
    }

    const reactivatedMember =
      await spaceMemberRepository.updateById(
        existingMember._id,
        {
          isActive: true,
          joinedAt: new Date(),
          updatedBy: userId,
        }
      );

    // Check if user has any role, if not assign VIEWER
    const userRoles = await userRoleRepository.findUserRolesByUserAndSpace(
      payload.userId,
      spaceId
    );

    if (!userRoles || userRoles.length === 0) {
      try {
        const viewerRole = await roleRepository.findBySpaceAndCode(
          spaceId,
          ROLE_CODES.VIEWER
        );

        if (viewerRole) {
          await userRoleRepository.create({
            spaceId,
            userId: payload.userId,
            roleId: viewerRole._id,
            assignedBy: userId,
            createdBy: userId,
            updatedBy: userId,
          });

          logger.info("Default VIEWER role assigned on reactivation", {
            memberId: existingMember._id,
            roleId: viewerRole._id,
          });
        }
      } catch (error) {
        logger.warn("Failed to auto-assign VIEWER role on reactivation", { 
          error: error.message 
        });
      }
    }

    await auditLogService.recordAuditLog({
      spaceId,
      actorId: userId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
      entityId: existingMember._id,
      before: existingMember,
      after: reactivatedMember,
      metadata: {
        userId: payload.userId,
      },
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
    });

    return reactivatedMember;
  }

  const member = await spaceMemberRepository.create({
    spaceId,
    userId: payload.userId,
    isActive: true,
    createdBy: userId,
    updatedBy: userId,
  });

  // Auto-assign VIEWER role to new member (lowest access)
  try {
    const viewerRole = await roleRepository.findBySpaceAndCode(
      spaceId,
      ROLE_CODES.VIEWER
    );

    if (viewerRole) {
      await userRoleRepository.create({
        spaceId,
        userId: payload.userId,
        roleId: viewerRole._id,
        assignedBy: userId,
        createdBy: userId,
        updatedBy: userId,
      });

      logger.info("Default VIEWER role assigned to new member", {
        memberId: member._id,
        roleId: viewerRole._id,
      });
    }
  } catch (error) {
    logger.warn("Failed to auto-assign VIEWER role", { error: error.message });
  }

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
    entityId: member._id,
    before: null,
    after: member,
    metadata: {
      userId: payload.userId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space member added", {
    memberId: member._id,
  });

  return member;
};

const getMembers = async (spaceId, filters) => {
  await assertSpaceExists(spaceId);

  return spaceMemberRepository.paginate({
    ...filters,
    spaceId,
  });
};

const updateMember = async (
  id,
  spaceId,
  payload,
  userId,
  context = {}
) => {
  const member = await spaceMemberRepository.findById(id);

  if (!member || String(member.spaceId) !== String(spaceId)) {
    throw new AppError("Space member not found", 404);
  }

  const updatedMember = await spaceMemberRepository.updateById(
    id,
    {
      ...payload,
      updatedBy: userId,
    }
  );

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
    entityId: id,
    before: member,
    after: updatedMember,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedMember;
};

const removeMember = async (
  id,
  spaceId,
  userId,
  context = {}
) => {
  const member = await spaceMemberRepository.findById(id);

  if (!member || String(member.spaceId) !== String(spaceId)) {
    throw new AppError("Space member not found", 404);
  }

  const deletePayload = {
    isActive: false,
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    updatedBy: userId,
  };

  const removedMember =
    await spaceMemberRepository.updateById(id, deletePayload);

  await userRoleRepository.softDeleteByUserAndSpace(
    member.userId._id || member.userId,
    spaceId,
    deletePayload
  );

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.REMOVE,
    entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
    entityId: id,
    before: member,
    after: removedMember,
    metadata: {
      userId: member.userId._id || member.userId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space member removed", {
    memberId: id,
  });

  return removedMember;
};

const assignRole = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  await Promise.all([
    assertSpaceExists(spaceId),
    assertActiveUser(payload.userId),
  ]);

  const member =
    await spaceMemberRepository.findByUserAndSpace(
      payload.userId,
      spaceId
    );

  if (!member || !member.isActive) {
    throw new AppError("User is not an active space member", 400);
  }

  const role = await roleRepository.findById(payload.roleId);

  if (
    !role ||
    !role.isActive ||
    String(role.spaceId) !== String(spaceId)
  ) {
    throw new AppError("Role not found or inactive", 404);
  }

  const existingAssignment =
    await userRoleRepository.findByUserRoleAndSpace(
      payload.userId,
      payload.roleId,
      spaceId
    );

  if (existingAssignment) {
    throw new AppError("Role is already assigned to user", 400);
  }

  const assignment = await userRoleRepository.create({
    spaceId,
    userId: payload.userId,
    roleId: payload.roleId,
    assignedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.ASSIGN,
    entityType: AUDIT_ENTITY_TYPES.USER_ROLE,
    entityId: assignment._id,
    before: null,
    after: assignment,
    metadata: {
      assignedUserId: payload.userId,
      roleId: payload.roleId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role assigned to user", {
    userRoleId: assignment._id,
  });

  return assignment;
};

const replaceRole = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  await Promise.all([
    assertSpaceExists(spaceId),
    assertActiveUser(payload.userId),
  ]);

  const member = await spaceMemberRepository.findByUserAndSpace(
    payload.userId,
    spaceId
  );

  if (!member || !member.isActive) {
    throw new AppError("User is not an active space member", 400);
  }

  const role = await roleRepository.findById(payload.roleId);

  if (
    !role ||
    !role.isActive ||
    String(role.spaceId) !== String(spaceId)
  ) {
    throw new AppError("Role not found or inactive", 404);
  }

  const existingAssignments =
    await userRoleRepository.findUserRolesByUserAndSpace(
      payload.userId,
      spaceId
    );

  if (!existingAssignments.length) {
    throw new AppError("No role assignment found for user", 404);
  }

  const alreadyAssigned = existingAssignments.some(
    (assignment) =>
      String(assignment.roleId) === String(payload.roleId)
  );

  if (alreadyAssigned && existingAssignments.length === 1) {
    throw new AppError("Role is already assigned to user", 400);
  }

  const deletePayload = {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId,
    updatedBy: userId,
  };

  const removeResult = await userRoleRepository.softDeleteByUserAndSpace(
    payload.userId,
    spaceId,
    deletePayload
  );

  const assignment = await userRoleRepository.create({
    spaceId,
    userId: payload.userId,
    roleId: payload.roleId,
    assignedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.ASSIGN,
    entityType: AUDIT_ENTITY_TYPES.USER_ROLE,
    entityId: assignment._id,
    before: null,
    after: assignment,
    metadata: {
      assignedUserId: payload.userId,
      roleId: payload.roleId,
      replacedRoleAssignmentCount:
        removeResult.modifiedCount || 0,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role replaced for user", {
    userRoleId: assignment._id,
    replacedRoleAssignmentCount:
      removeResult.modifiedCount || 0,
  });

  return {
    assignment,
    replacedRoleAssignmentCount:
      removeResult.modifiedCount || 0,
  };
};

const getUserRoles = async (spaceId, filters) => {
  await assertSpaceExists(spaceId);

  return userRoleRepository.paginate({
    ...filters,
    spaceId,
  });
};

const removeRole = async (
  id,
  spaceId,
  userId,
  context = {}
) => {
  const assignment = await userRoleRepository.findById(id);

  if (
    !assignment ||
    String(assignment.spaceId) !== String(spaceId)
  ) {
    throw new AppError("User role assignment not found", 404);
  }

  const removedAssignment =
    await userRoleRepository.softDeleteById(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      updatedBy: userId,
    });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.REMOVE,
    entityType: AUDIT_ENTITY_TYPES.USER_ROLE,
    entityId: id,
    before: assignment,
    after: removedAssignment,
    metadata: {
      assignedUserId: assignment.userId._id || assignment.userId,
      roleId: assignment.roleId._id || assignment.roleId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Role removed from user", {
    userRoleId: id,
  });

  return removedAssignment;
};

module.exports = {
  addMember,
  getMembers,
  updateMember,
  removeMember,
  assignRole,
  replaceRole,
  getUserRoles,
  removeRole,
};



const spaceMemberRepository = require("../repositories/spaceMember");
const userRoleRepository = require("../repositories/userRole");
const roleRepository = require("../repositories/role");
const spaceRepository = require("../repositories/space");
const { findActiveUserById } = require("../repositories/user");
const auditLogService = require("./auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const { getEnforcer } = require("../config/casbin"); //  Added Casbin connection helper
const { invalidateByUser } = require("./rbacCache");

const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");
const { ROLE_CODES } = require("../constants/role");

//  Reusable Helper: Sync individual user-role links into Casbin grouping rules
const syncGroupingPolicy = async (userId, spaceId, roleCode, action) => {
  try {
    const enforcer = await getEnforcer();
    // Super Admins operate globally under SYSTEM context, everyone else is bound to their Space
    const scope = roleCode === "SUPER_ADMIN" ? "SYSTEM" : String(spaceId);
    const userSubject = `${String(userId)}:${scope}`;
    const roleSubject = `${String(roleCode)}:${scope}`;

    if (action === "ADD") {
      await enforcer.addGroupingPolicy(userSubject, roleSubject);
    } else if (action === "REMOVE") {
      await enforcer.removeGroupingPolicy(userSubject, roleSubject);
    }
    await enforcer.savePolicy();
  } catch (error) {
    logger.error("Failed to sync Casbin grouping policy", { 
      userId, spaceId, roleCode, action, error: error.message 
    });
  }
};

//  Reusable Helper: Flush all space-specific grouping policies for a user
const clearUserSpacePolicies = async (userId, spaceId) => {
  try {
    const enforcer = await getEnforcer();
    const userSubject = `${String(userId)}:${String(spaceId)}`;
    
    // Deletes any policy line matching the user's space scope identifier from v0
    await enforcer.removeFilteredPolicy("g", "g", 0, userSubject);
    await enforcer.savePolicy();
  } catch (error) {
    logger.error("Failed to clear Casbin space policies", { 
      userId, spaceId, error: error.message 
    });
  }
};

// Handles assert space exists.
const assertSpaceExists = async (spaceId) => {
  const space = await spaceRepository.findById(spaceId);

  if (!space || !space.isActive) {
    throw new AppError("Space not found or inactive", 404);
  }

  return space;
};

// Handles assert active user.
const assertActiveUser = async (userId) => {
  const user = await findActiveUserById(userId);

  if (!user) {
    throw new AppError("User not found or inactive", 404);
  }

  return user;
};

// Handles add member.
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

    // Check if user has any role, if not assign MEMBER
    const userRoles = await userRoleRepository.findUserRolesByUserAndSpace(
      payload.userId,
      spaceId
    );

    if (!userRoles || userRoles.length === 0) {
      try {
        const memberRole = await roleRepository.findBySpaceAndCode(
          spaceId,
          ROLE_CODES.MEMBER
        );

        if (memberRole) {
          await userRoleRepository.create({
            spaceId,
            userId: payload.userId,
            roleId: memberRole._id,
            assignedBy: userId,
            createdBy: userId,
            updatedBy: userId,
          });

          //  Casbin Sync: Add tracking on role inheritance fallback
          await syncGroupingPolicy(payload.userId, spaceId, memberRole.code, "ADD");

          logger.info("Default MEMBER role assigned on reactivation", {
            memberId: existingMember._id,
            roleId: memberRole._id,
          });
          invalidateByUser(payload.userId);
        }
      } catch (error) {
        logger.warn("Failed to auto-assign MEMBER role on reactivation", { 
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

  // Auto-assign MEMBER role to new member (lowest access)
  try {
    const memberRole = await roleRepository.findBySpaceAndCode(
      spaceId,
      ROLE_CODES.MEMBER
    );

    if (memberRole) {
      await userRoleRepository.create({
        spaceId,
        userId: payload.userId,
        roleId: memberRole._id,
        assignedBy: userId,
        createdBy: userId,
        updatedBy: userId,
      });

      //  Casbin Sync: Add tracking rule mapping on initial profile build
      await syncGroupingPolicy(payload.userId, spaceId, memberRole.code, "ADD");

      logger.info("Default MEMBER role assigned to new member", {
        memberId: member._id,
        roleId: memberRole._id,
      });
      invalidateByUser(payload.userId);
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

// Handles get members.
const getMembers = async (spaceId, filters) => {
  await assertSpaceExists(spaceId);

  return spaceMemberRepository.paginate({
    ...filters,
    spaceId,
  });
};

// Handles update member.
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

// Handles remove member.
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

  const targetUserId = member.userId._id || member.userId;

  //for now assume users cannot remove themselves from space,
  //as we have not implemented any ownership transfer flow yet.
  //This is to prevent accidental lockout scenarios.
  //We can revisit this logic once we have a more robust handling of ownership and admin roles in place.
  if (String(targetUserId) === String(userId)) {
    throw new AppError("You cannot remove yourself from this space", 400);
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
    targetUserId,
    spaceId,
    deletePayload
  );

  //  Casbin Sync: Wipe all groupings for this user inside this isolated space context
  await clearUserSpacePolicies(targetUserId, spaceId);
  invalidateByUser(targetUserId);

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.REMOVE,
    entityType: AUDIT_ENTITY_TYPES.SPACE_MEMBER,
    entityId: id,
    before: member,
    after: removedMember,
    metadata: {
      userId: targetUserId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Space member removed", {
    memberId: id,
  });

  return removedMember;
};

// Prevent users from changing their own role assignments.
const assertNotSelfRoleMutation = (targetUserId, actorUserId) => {
  if (String(targetUserId) === String(actorUserId)) {
    throw new AppError("You cannot change your own role", 400);
  }
};

const assertRoleAssignable = (role) => {
  if (role.isSystemRole || role.type === "system" || role.type === "space_builtin") {
    throw new AppError("System roles cannot be assigned from member management", 400);
  }
};

// Handles assign role.
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

  assertNotSelfRoleMutation(payload.userId, userId);

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
    !role.isActive ) {
    throw new AppError("Role not found or inactive", 404);
  }

  assertRoleAssignable(role);

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

  //  Casbin Sync: Establish the newly generated role assignment inside Casbin rule tree
  await syncGroupingPolicy(payload.userId, spaceId, role.code, "ADD");

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
  invalidateByUser(payload.userId);

  return assignment;
};

// Handles replace role.
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

  assertNotSelfRoleMutation(payload.userId, userId);

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
    !role.isActive  ) {
    throw new AppError("Role not found or inactive", 404);
  }

  assertRoleAssignable(role);

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

  //  Casbin Sync: Wipe out previous space-related bindings prior to writing the newly target structure
  await clearUserSpacePolicies(payload.userId, spaceId);

  const assignment = await userRoleRepository.create({
    spaceId,
    userId: payload.userId,
    roleId: payload.roleId,
    assignedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  //  Casbin Sync: Inject newly calculated replacement profile mapping entries
  await syncGroupingPolicy(payload.userId, spaceId, role.code, "ADD");

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
  invalidateByUser(payload.userId);

  return {
    assignment,
    replacedRoleAssignmentCount:
      removeResult.modifiedCount || 0,
  };
};

// Handles get user roles.
const getUserRoles = async (spaceId, filters) => {
  await assertSpaceExists(spaceId);

  return userRoleRepository.paginate({
    ...filters,
    spaceId,
  });
};

// Handles remove role.
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

  const targetUserId = assignment.userId._id || assignment.userId;
  assertNotSelfRoleMutation(targetUserId, userId);

  //  Query role details to capture role code configuration prior to deletion execution
  const role = await roleRepository.findById(assignment.roleId._id || assignment.roleId);

  const removedAssignment =
    await userRoleRepository.softDeleteById(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      updatedBy: userId,
    });

  //  Casbin Sync: Remove tracking rules matching deleted single structural components
  if (role) {
    await syncGroupingPolicy(targetUserId, spaceId, role.code, "REMOVE");
  }
  invalidateByUser(targetUserId);

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.REMOVE,
    entityType: AUDIT_ENTITY_TYPES.USER_ROLE,
    entityId: id,
    before: assignment,
    after: removedAssignment,
    metadata: {
      assignedUserId: targetUserId,
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

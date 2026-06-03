const joinRequestRepository = require("../repositories/joinRequest");
const spaceRepository = require("../repositories/space");
const spaceMemberRepository = require("../repositories/spaceMember");
const roleRepository = require("../repositories/role");
const userRoleRepository = require("../repositories/userRole");
const spaceMemberService = require("./spaceMember");
const notificationService = require("./notification");
const auditLogService = require("./auditLog");

const { ROLE_CODES } = require("../constants/role");
const { NOTIFICATION_TYPES } = require("../constants/notification");
const { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } = require("../constants/auditLog");
const { SPACE_TYPES } = require("../constants/space");
const AppError = require("../utils/appError");
const logger = require("../config/logger");

const isUserTypeSpaceScoped = (userType) =>
  Object.values(SPACE_TYPES).includes(userType);

// Create join request
const createJoinRequest = async (spaceId, payload, userId, userType, context = {}) => {
  const space = await spaceRepository.findById(spaceId);
  if (!space) throw new AppError("Space not found", 404);

  if (isUserTypeSpaceScoped(userType) && (!space.type || space.type !== userType)) {
    throw new AppError("Space type does not match your user type", 403);
  }

  const activeMember = await spaceMemberRepository.findByUserAndSpace(
    userId,
    spaceId
  );

  if (activeMember && activeMember.isActive) {
    throw new AppError("User is already a member of this space", 400);
  }

  const existing = await joinRequestRepository.findByUserAndSpace(userId, spaceId);
  if (existing) {
    if (existing.status === "PENDING") {
      throw new AppError("Join request already pending", 400);
    }

    return joinRequestRepository.updateById(existing._id, {
      status: "PENDING",
      message: payload.message || "",
      reviewedBy: null,
      reviewedAt: null,
      reviewRemarks: "",
      updatedBy: userId,
    });
  }

  const request = await joinRequestRepository.create({
    spaceId,
    userId,
    message: payload.message || "",
    createdBy: userId,
    updatedBy: userId,
  });

  // Notify space admins
  const adminRole = await roleRepository.findBySpaceAndCode(spaceId, ROLE_CODES.SPACE_ADMIN);
  if (adminRole) {
    const admins = await userRoleRepository.paginate({ spaceId, roleId: adminRole._id, page: 1, limit: 100 });
    for (const a of admins.items) {
      try {
        await notificationService.notifyUserByEmail(
          {
            spaceId,
            recipientUserId: a.userId._id || a.userId,
            type: NOTIFICATION_TYPES.MANUAL,
            subject: `Join request for space ${space.name}`,
            body: `User ${request.userId.firstName || ''} ${request.userId.lastName || ''} requested to join space ${space.name}`,
            metadata: { joinRequestId: request._id },
          },
          userId
        );
      } catch (err) {
        logger.warn("Failed to notify admin about join request", { error: err.message });
      }
    }
  }

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST || "JOIN_REQUEST",
    entityId: request._id,
    before: null,
    after: request,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return request;
};

// Admin reviews join request
const reviewJoinRequest = async (spaceId, requestId, payload, adminUserId, context = {}) => {
  const request = await joinRequestRepository.findById(requestId);
  if (!request || String(request.spaceId) !== String(spaceId)) {
    throw new AppError("Join request not found", 404);
  }

  if (request.status !== "PENDING") {
    throw new AppError("Only pending requests can be reviewed", 400);
  }

  if (payload.action === "APPROVE") {
    const targetUserId = request.userId._id || request.userId;
    const existingMember = await spaceMemberRepository.findByUserAndSpace(targetUserId, spaceId);

    if (!existingMember || !existingMember.isActive) {
      // Add member to space. If the user was previously removed, addMember reactivates membership.
      await spaceMemberService.addMember(spaceId, { userId: targetUserId }, adminUserId, context);
    }

    const updated = await joinRequestRepository.updateById(requestId, {
      status: "APPROVED",
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      reviewRemarks: payload.remarks || "",
      updatedBy: adminUserId,
    });

    // Notify requester
    await notificationService.notifyUserByEmail(
      {
        spaceId,
        recipientUserId: targetUserId,
        type: NOTIFICATION_TYPES.MANUAL,
        subject: `Join request approved for ${spaceId}`,
        body: `Your request to join space has been approved`,
        metadata: { joinRequestId: requestId },
      },
      adminUserId
    );

    await auditLogService.recordAuditLog({
      spaceId,
      actorId: adminUserId,
      action: AUDIT_ACTIONS.APPROVE,
      entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST || "JOIN_REQUEST",
      entityId: requestId,
      before: request,
      after: updated,
      metadata: { approvalLevel: "SPACE_ADMIN" },
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
    });

    return updated;
  }

  // Reject
  const updated = await joinRequestRepository.updateById(requestId, {
    status: "REJECTED",
    reviewedBy: adminUserId,
    reviewedAt: new Date(),
    reviewRemarks: payload.remarks || "",
    updatedBy: adminUserId,
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId,
      recipientUserId: request.userId._id || request.userId,
      type: NOTIFICATION_TYPES.MANUAL,
      subject: `Join request rejected for ${spaceId}`,
      body: `Your request to join space has been rejected`,
      metadata: { joinRequestId: requestId },
    },
    adminUserId
  );

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: adminUserId,
    action: AUDIT_ACTIONS.REJECT,
    entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST || "JOIN_REQUEST",
    entityId: requestId,
    before: request,
    after: updated,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updated;
};

const getJoinRequests = async (filters) => {
  return joinRequestRepository.paginate(filters);
};

const getJoinRequestById = async (id) => {
  const req = await joinRequestRepository.findById(id);
  if (!req) throw new AppError("Join request not found", 404);
  return req;
};

module.exports = {
  createJoinRequest,
  reviewJoinRequest,
  getJoinRequests,
  getJoinRequestById,
};

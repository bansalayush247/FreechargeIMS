const AssetRequest = require("../models/assetRequest");
const Product = require("../models/product");
const InventoryItem = require("../models/inventory");

const assetRequestRepository = require(
  "../repositories/assetRequest"
);

const inventoryTransactionService = require(
  "./inventoryTransaction"
);
const auditLogService = require("./auditLog");
const notificationService = require("./notification");

const {
  ASSET_REQUEST_STATUS,
} = require("../constants/assetRequest");

const {
  INVENTORY_STATUS,
  getInventoryStatusQueryValues,
} = require("../constants/inventory");

const {
  INVENTORY_TRANSACTION_TYPES,
} = require(
  "../constants/inventoryTransaction"
);
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");
const {
  NOTIFICATION_TYPES,
} = require("../constants/notification");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

// Handles generate request number.
const generateRequestNumber = async () => {
  const count = await AssetRequest.countDocuments();

  const sequence = String(count + 1).padStart(5, "0");

  return `AR-${new Date().getFullYear()}-${sequence}`;
};

// Handles create asset request.
const createAssetRequest = async (
  payload,
  userId,
  context = {}
) => {
  logger.info("Creating asset request");

  const product = await Product.findOne({
    _id: payload.productId,
    isDeleted: false,
  }).lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const requestNumber = await generateRequestNumber();

  const request = await assetRequestRepository.create({
    ...payload,
    requestNumber,
    employeeId: userId,
    createdBy: userId,
  });

  logger.info("Asset request created", {
    requestId: request._id,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.ASSET_REQUEST,
    entityId: request._id,
    before: null,
    after: request,
    metadata: {
      requestNumber: request.requestNumber,
      productId: payload.productId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId: context.spaceId || null,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_CREATED,
      subject: `Asset request ${request.requestNumber} created`,
      body: `Your asset request ${request.requestNumber} has been created and is pending manager approval.`,
      metadata: { assetRequestId: request._id },
    },
    userId
  );

  return request;
};

// Handles get asset requests.
const getAssetRequests = async (filters) => {
  return assetRequestRepository.paginate(filters);
};

// Handles get asset request by id.
const getAssetRequestById = async (id) => {
  const request = await assetRequestRepository.findById(id);

  if (!request) {
    throw new AppError("Asset request not found", 404);
  }

  return request;
};

// Handles manager approve request.
const managerApproveRequest = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const request = await getAssetRequestById(id);

  if (
    request.status !== ASSET_REQUEST_STATUS.PENDING
  ) {
    throw new AppError(
      "Only pending requests can be approved",
      400
    );
  }

  const updatedRequest =
    await assetRequestRepository.updateById(id, {
    status:
      ASSET_REQUEST_STATUS.MANAGER_APPROVED,
    managerApprovalBy: userId,
    managerApprovalAt: new Date(),
    managerRemarks: payload.remarks,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: AUDIT_ENTITY_TYPES.ASSET_REQUEST,
    entityId: id,
    before: request,
    after: updatedRequest,
    metadata: {
      approvalLevel: "MANAGER",
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId: context.spaceId || null,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_MANAGER_APPROVED,
      subject: `Asset request ${request.requestNumber} manager approved`,
      body: `Your asset request ${request.requestNumber} has been approved by manager and is pending IT approval.`,
      metadata: { assetRequestId: id },
    },
    userId
  );

  return updatedRequest;
};

// Handles it approve request.
const itApproveRequest = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const request = await getAssetRequestById(id);

  if (
    request.status !==
    ASSET_REQUEST_STATUS.MANAGER_APPROVED
  ) {
    throw new AppError("Manager approval required", 400);
  }

  const inventoryItem =
    await InventoryItem.findOne({
      productId: request.productId,
      status: {
        $in: getInventoryStatusQueryValues(
          INVENTORY_STATUS.IN_STOCK
        ),
      },
      isDeleted: false,
    });

  if (!inventoryItem) {
    throw new AppError(
      "No available inventory item found",
      400
    );
  }

  await inventoryTransactionService.createTransaction(
    {
      inventoryItemId: inventoryItem._id,
      toUserId: request.employeeId,
      transactionType:
        INVENTORY_TRANSACTION_TYPES.ASSIGNED,
      remarks:
        "Asset assigned through request workflow",
    },
    userId,
    context
  );

  const updatedRequest =
    await assetRequestRepository.updateById(id, {
    status: ASSET_REQUEST_STATUS.FULFILLED,

    inventoryItemId: inventoryItem._id,

    itApprovalBy: userId,
    itApprovalAt: new Date(),
    itRemarks: payload.remarks,

    approvedAt: new Date(),
    fulfilledAt: new Date(),

    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: AUDIT_ENTITY_TYPES.ASSET_REQUEST,
    entityId: id,
    before: request,
    after: updatedRequest,
    metadata: {
      approvalLevel: "IT",
      inventoryItemId: inventoryItem._id,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId: context.spaceId || null,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLED,
      subject: `Asset request ${request.requestNumber} fulfilled`,
      body: `Your asset request ${request.requestNumber} has been approved by IT and fulfilled.`,
      metadata: { assetRequestId: id, inventoryItemId: inventoryItem._id },
    },
    userId
  );

  return updatedRequest;
};

// Handles reject request.
const rejectRequest = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const request = await getAssetRequestById(id);

  if (
    [
      ASSET_REQUEST_STATUS.REJECTED,
      ASSET_REQUEST_STATUS.CANCELLED,
      ASSET_REQUEST_STATUS.FULFILLED,
    ].includes(request.status)
  ) {
    throw new AppError("Request cannot be rejected", 400);
  }

  const updatedRequest =
    await assetRequestRepository.updateById(id, {
    status: ASSET_REQUEST_STATUS.REJECTED,
    rejectionReason: payload.rejectionReason,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.REJECT,
    entityType: AUDIT_ENTITY_TYPES.ASSET_REQUEST,
    entityId: id,
    before: request,
    after: updatedRequest,
    metadata: {
      rejectionReason: payload.rejectionReason,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId: context.spaceId || null,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_REJECTED,
      subject: `Asset request ${request.requestNumber} rejected`,
      body: `Your asset request ${request.requestNumber} was rejected. Reason: ${payload.rejectionReason}.`,
      metadata: { assetRequestId: id },
    },
    userId
  );

  return updatedRequest;
};

// Handles cancel request.
const cancelRequest = async (
  id,
  userId,
  context = {}
) => {
  const request = await getAssetRequestById(id);

  if (
    request.status ===
    ASSET_REQUEST_STATUS.FULFILLED
  ) {
    throw new AppError(
      "Fulfilled request cannot be cancelled",
      400
    );
  }

  const updatedRequest =
    await assetRequestRepository.updateById(id, {
    status: ASSET_REQUEST_STATUS.CANCELLED,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.CANCEL,
    entityType: AUDIT_ENTITY_TYPES.ASSET_REQUEST,
    entityId: id,
    before: request,
    after: updatedRequest,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  await notificationService.notifyUserByEmail(
    {
      spaceId: context.spaceId || null,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_CANCELLED,
      subject: `Asset request ${request.requestNumber} cancelled`,
      body: `Your asset request ${request.requestNumber} has been cancelled.`,
      metadata: { assetRequestId: id },
    },
    userId
  );

  return updatedRequest;
};

module.exports = {
  createAssetRequest,
  getAssetRequests,
  getAssetRequestById,
  managerApproveRequest,
  itApproveRequest,
  rejectRequest,
  cancelRequest,
};



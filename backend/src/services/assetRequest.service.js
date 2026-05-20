const AssetRequest = require("../models/assetRequest.model");
const Product = require("../models/product.model");
const InventoryItem = require("../models/inventory.model");

const assetRequestRepository = require(
  "../repositories/assetRequest.repository"
);

const inventoryTransactionService = require(
  "./inventoryTransaction.service"
);
const auditLogService = require("./auditLog.service");

const {
  ASSET_REQUEST_STATUS,
} = require("../constants/assetRequest.constant");

const {
  INVENTORY_STATUS,
} = require("../constants/inventory.constant");

const {
  INVENTORY_TRANSACTION_TYPES,
} = require(
  "../constants/inventoryTransaction.constant"
);
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog.constant");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const generateRequestNumber = async () => {
  const count = await AssetRequest.countDocuments();

  const sequence = String(count + 1).padStart(5, "0");

  return `AR-${new Date().getFullYear()}-${sequence}`;
};

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

  return request;
};

const getAssetRequests = async (filters) => {
  return assetRequestRepository.paginate(filters);
};

const getAssetRequestById = async (id) => {
  const request = await assetRequestRepository.findById(id);

  if (!request) {
    throw new AppError("Asset request not found", 404);
  }

  return request;
};

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

  return updatedRequest;
};

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
      status: INVENTORY_STATUS.AVAILABLE,
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

  return updatedRequest;
};

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

  return updatedRequest;
};

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

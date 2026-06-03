const mongoose = require("mongoose");

const AssetRequest = require("../models/assetRequest");
const inventoryTransactionRepository = require("../repositories/inventoryTransaction");
const assetRegistryRepository = require("../repositories/assetRegistry");
const auditLogService = require("./auditLog");
const { authorizePermission } = require("./permissionResolver");

const InventoryItem = require("../models/inventory");
const Warehouse = require("../models/warehouse");
const Space = require("../models/space");
const User = require("../models/user");

const {
  INVENTORY_STATUS,
  normalizeInventoryStatus,
} = require("../constants/inventory");

const {
  INVENTORY_TRANSACTION_TYPES,
  normalizeInventoryTransactionType,
} = require("../constants/inventoryTransaction");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const { USER_TYPES } = require("../constants/user");

const TRANSACTION_UNSUPPORTED_ERROR_MESSAGE =
  "Transaction numbers are only allowed on a replica set member or mongos";

const isTransactionUnsupportedError = (error) =>
  Boolean(
    error &&
      typeof error.message === "string" &&
      error.message.includes(
        TRANSACTION_UNSUPPORTED_ERROR_MESSAGE
      )
  );

const readId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
};

const resolveAuditTrailAccessSpaceId = async (inventoryItemId) => {
  const assetRequest = await AssetRequest.findOne({
    inventoryItemId,
    isDeleted: false,
  })
    .select("spaceId originSpaceId employeeId")
    .lean();

  if (assetRequest) {
    return {
      ownerUserId: readId(assetRequest.employeeId),
      spaceId: readId(assetRequest.originSpaceId || assetRequest.spaceId),
    };
  }

  const inventoryItem = await InventoryItem.findOne({
    _id: inventoryItemId,
    isDeleted: false,
  })
    .select("warehouseId assignedUserId")
    .lean();

  if (!inventoryItem) {
    return { ownerUserId: "", spaceId: "" };
  }

  const warehouse = await Warehouse.findById(inventoryItem.warehouseId)
    .select("spaceId")
    .lean();

  return {
    ownerUserId: readId(inventoryItem.assignedUserId),
    spaceId: readId(warehouse?.spaceId),
  };
};

const canViewItemAuditTrail = async ({ inventoryItemId, userId, userType }) => {
  if (!inventoryItemId || !userId) {
    return false;
  }

  const { ownerUserId, spaceId } = await resolveAuditTrailAccessSpaceId(inventoryItemId);

  if (ownerUserId && String(ownerUserId) === String(userId)) {
    return true;
  }

  if (!spaceId) {
    return false;
  }

  try {
    return await authorizePermission({
      userId,
      spaceId,
      permission: "inventory-transaction:view",
    });
  } catch (_error) {
    return false;
  }
};

// Handles the core inventory transaction flow.
const runCreateTransaction = async (
  payload,
  userId,
  context = {},
  session = null
) => {
  logger.info("Creating inventory transaction");

  const inventoryItemQuery = InventoryItem.findOne({
    _id: payload.inventoryItemId,
    isDeleted: false,
  });

  if (session) {
    inventoryItemQuery.session(session);
  }

  const inventoryItem = await inventoryItemQuery;

  if (!inventoryItem) {
    throw new AppError("Inventory item not found", 404);
  }

  if (payload.toWarehouseId) {
    const warehouse = await Warehouse.findOne({
      _id: payload.toWarehouseId,
      isDeleted: false,
    }).lean();

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
  }

  if (payload.toUserId) {
    const userQuery = User.findById(payload.toUserId);
    const user = typeof userQuery?.lean === "function" ? await userQuery.lean() : await userQuery;

    if (!user) {
      throw new AppError("Assigned user not found", 404);
    }
  }

  const transactionType = normalizeInventoryTransactionType(payload.transactionType);

  const previousStatus = normalizeInventoryStatus(
    inventoryItem.status
  );
  const beforeInventoryItem = inventoryItem.toObject();
  let newStatus = previousStatus;
  let fromUserId = payload.fromUserId || null;
  let fromMerchantId = payload.fromMerchantId || null;

  switch (transactionType) {
    case INVENTORY_TRANSACTION_TYPES.STOCK_IN:
    case INVENTORY_TRANSACTION_TYPES.PURCHASE:
    case INVENTORY_TRANSACTION_TYPES.PROCUREMENT:
      inventoryItem.status = INVENTORY_STATUS.AVAILABLE;
      newStatus = INVENTORY_STATUS.AVAILABLE;
      break;

    case INVENTORY_TRANSACTION_TYPES.ASSIGNMENT:
    case INVENTORY_TRANSACTION_TYPES.ALLOCATION:
      if (!payload.toUserId && !payload.toMerchantId) {
        throw new AppError("toUserId or toMerchantId is required for assignment", 400);
      }
      if ((inventoryItem.quantity || 0) <= 0) {
        throw new AppError("Insufficient inventory quantity for allocation", 400);
      }
      if (inventoryItem.assetTag || inventoryItem.serialNumber || Number(inventoryItem.quantity || 0) <= 1) {
        inventoryItem.status = payload.toMerchantId ? INVENTORY_STATUS.ASSIGNED_MERCHANT : INVENTORY_STATUS.ASSIGNED_EMPLOYEE;
        inventoryItem.assignedUserId = payload.toUserId || null;
        inventoryItem.assignedMerchantId = payload.toMerchantId || null;
        inventoryItem.assignedAt = new Date();
      } else {
        inventoryItem.quantity = Math.max(0, (inventoryItem.quantity || 0) - 1);
      }
      await assetRegistryRepository.create(
        {
          productId: inventoryItem.productId,
          assignedToUserId: payload.toUserId || null,
          assignedToMerchantId: payload.toMerchantId || null,
          assignedSpaceId: context.spaceId || payload.spaceId || inventoryItem.spaceId,
          assignedByUserId: userId,
          requestId: payload.requestId || null,
          sourceInventoryItemId: inventoryItem._id,
          status: assetRegistryRepository.ASSET_REGISTRY_STATUS.ASSIGNED,
        },
        session
      );
      newStatus = payload.toMerchantId ? INVENTORY_STATUS.ASSIGNED_MERCHANT : INVENTORY_STATUS.ASSIGNED_EMPLOYEE;
      break;

    case INVENTORY_TRANSACTION_TYPES.RETURN:
      {
        const activeAssignment = await assetRegistryRepository.findActiveByInventoryItemAndAssignee(
          {
            sourceInventoryItemId: inventoryItem._id,
            assignedToUserId: payload.fromUserId || null,
            assignedToMerchantId: payload.fromMerchantId || null,
          },
          session
        );
        if (!activeAssignment) {
          throw new AppError("No active asset registry allocation found for return", 400);
        }
        await assetRegistryRepository.create(
          {
            productId: inventoryItem.productId,
            assignedToUserId: activeAssignment.assignedToUserId || null,
            assignedToMerchantId: activeAssignment.assignedToMerchantId || null,
            assignedSpaceId: activeAssignment.assignedSpaceId,
            assignedByUserId: activeAssignment.assignedByUserId,
            returnedByUserId: userId,
            requestId: activeAssignment.requestId || null,
            quantity: activeAssignment.quantity || 1,
            sourceInventoryItemId: inventoryItem._id,
            status: assetRegistryRepository.ASSET_REGISTRY_STATUS.RETURNED,
          },
          session
        );
      }
      if (inventoryItem.assetTag || inventoryItem.serialNumber) {
        inventoryItem.assignedUserId = null;
        inventoryItem.assignedMerchantId = null;
      } else {
        inventoryItem.quantity = (inventoryItem.quantity || 0) + 1;
      }
      inventoryItem.status = INVENTORY_STATUS.AVAILABLE;
      newStatus = INVENTORY_STATUS.AVAILABLE;
      break;

    case INVENTORY_TRANSACTION_TYPES.TRANSFER:
      inventoryItem.warehouseId = payload.toWarehouseId;
      break;

    case INVENTORY_TRANSACTION_TYPES.STATUS_CHANGE:
      if (payload.newStatus) {
        inventoryItem.status = normalizeInventoryStatus(payload.newStatus);
      }
      newStatus = normalizeInventoryStatus(inventoryItem.status);
      break;

    case INVENTORY_TRANSACTION_TYPES.LOSS:
      inventoryItem.status = INVENTORY_STATUS.LOST;
      newStatus = INVENTORY_STATUS.LOST;
      break;

    case INVENTORY_TRANSACTION_TYPES.DAMAGE:
      inventoryItem.status = INVENTORY_STATUS.DAMAGED;
      newStatus = INVENTORY_STATUS.DAMAGED;
      break;

    case INVENTORY_TRANSACTION_TYPES.RETIREMENT:
      inventoryItem.status = INVENTORY_STATUS.RETIRED;
      newStatus = INVENTORY_STATUS.RETIRED;
      break;

    case INVENTORY_TRANSACTION_TYPES.DISPOSE:
      inventoryItem.status = INVENTORY_STATUS.DISPOSED;
      newStatus = INVENTORY_STATUS.DISPOSED;
      break;

    default:
      break;
  }

  inventoryItem.updatedBy = userId;

  const saveOptions = session ? { session } : {};
  await inventoryItem.save(saveOptions);

    const inventoryIdForTransaction = inventoryItem._id;

    const transaction = await inventoryTransactionRepository.create(
      {
        spaceId: context.spaceId || payload.spaceId || inventoryItem.spaceId,
        inventoryItemId: inventoryIdForTransaction,
        productId: inventoryItem.productId,
        fromWarehouseId: payload.fromWarehouseId || inventoryItem.warehouseId,
        toWarehouseId: payload.toWarehouseId || null,
        fromUserId,
        toUserId: payload.toUserId || null,
        fromMerchantId,
        toMerchantId: payload.toMerchantId || null,
        transactionType,
        remarks: payload.remarks,
        previousStatus,
        newStatus,
        performedBy: userId,
      },
      session
    );

  await auditLogService.recordAuditLog(
    {
      spaceId: context.spaceId || null,
      actorId: userId,
      action: AUDIT_ACTIONS.TRANSACTION,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_TRANSACTION,
      entityId: transaction._id,
      before: {
        inventoryItem: beforeInventoryItem,
      },
      after: {
        transaction,
        inventoryItem: inventoryItem.toObject(),
      },
      metadata: {
        transactionType,
        inventoryItemId: inventoryIdForTransaction,
      },
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
    },
    session
  );

  return transaction;
};

// Handles create transaction.
const createTransaction = async (
  payload,
  userId,
  context = {}
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transaction = await runCreateTransaction(
      payload,
      userId,
      context,
      session
    );

    await session.commitTransaction();

    logger.info("Inventory transaction created", {
      transactionId: transaction._id,
    });

    return transaction;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    if (isTransactionUnsupportedError(error)) {
      logger.warn(
        "MongoDB transactions unsupported; retrying inventory transaction without a session"
      );

      return runCreateTransaction(payload, userId, context);
    }

    logger.error("Inventory transaction failed", {
      error: error.message,
    });

    throw error;
  } finally {
    session.endSession();
  }
};

// Handles get transactions.
const getTransactions = async (filters) => {
  return inventoryTransactionRepository.paginate(filters);
};

// Handles get transaction by id.
const getTransactionById = async (id, context = {}) => {
  const transaction =
    await inventoryTransactionRepository.findById(id, context.spaceId);

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return transaction;
};

// Handles get item audit trail.
const getItemAuditTrail = async (inventoryItemId, context = {}) => {
  const allowed = await canViewItemAuditTrail({
    inventoryItemId,
    userId: context.userId,
    userType: context.userType,
  });

  if (!allowed) {
    throw new AppError("Insufficient permissions", 403);
  }

  return inventoryTransactionRepository.getItemAuditTrail(
    inventoryItemId,
    context.spaceId
  );
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getItemAuditTrail,
};

const mongoose = require("mongoose");

const inventoryTransactionRepository = require("../repositories/inventoryTransaction");
const auditLogService = require("./auditLog");

const InventoryItem = require("../models/inventory");
const Warehouse = require("../models/warehouse");
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
    const user = await User.findById(payload.toUserId).lean();

    if (!user) {
      throw new AppError("Assigned user not found", 404);
    }
  }

  const transactionType = normalizeInventoryTransactionType(
    payload.transactionType
  );

  const previousStatus = normalizeInventoryStatus(
    inventoryItem.status
  );
  const beforeInventoryItem = inventoryItem.toObject();
  let newStatus = previousStatus;

  switch (transactionType) {
    case INVENTORY_TRANSACTION_TYPES.STOCK_IN:
      inventoryItem.status = INVENTORY_STATUS.IN_STOCK;
      newStatus = INVENTORY_STATUS.IN_STOCK;
      break;

    case INVENTORY_TRANSACTION_TYPES.ASSIGN:
      // If consumable stock has quantity > 1, decrement and create an assigned item
      // so assigned items remain single-quantity records.
      if ((inventoryItem.quantity || 0) > 1) {
        // reduce available quantity
        inventoryItem.quantity = (inventoryItem.quantity || 0) - 1;
        // save will happen below; create the assigned item
        const assignedPayload = {
          productId: inventoryItem.productId,
          warehouseId: inventoryItem.warehouseId,
          assignedUserId: payload.toUserId,
          quantity: 1,
          status: INVENTORY_STATUS.ASSIGNED,
          createdBy: userId,
          updatedBy: userId,
        };

        const [assignedItem] = await InventoryItem.create([
          assignedPayload,
        ], session ? { session } : {});

        // Use the newly created assigned item for the transaction
        // and return it later via transaction record.
        payload._assignedInventoryItemId = assignedItem._id;

        newStatus = INVENTORY_STATUS.ASSIGNED;
      } else {
        inventoryItem.status = INVENTORY_STATUS.ASSIGNED;
        inventoryItem.assignedUserId = payload.toUserId;
        newStatus = INVENTORY_STATUS.ASSIGNED;
      }
      break;

    case INVENTORY_TRANSACTION_TYPES.RETURN:
      inventoryItem.status = INVENTORY_STATUS.IN_STOCK;
      inventoryItem.assignedUserId = null;
      newStatus = INVENTORY_STATUS.IN_STOCK;
      break;

    case INVENTORY_TRANSACTION_TYPES.TRANSFER:
      inventoryItem.warehouseId = payload.toWarehouseId;
      break;

    case INVENTORY_TRANSACTION_TYPES.REPAIR:
      if (previousStatus === INVENTORY_STATUS.REPAIR) {
        inventoryItem.status = INVENTORY_STATUS.IN_STOCK;
        newStatus = INVENTORY_STATUS.IN_STOCK;
      } else {
        inventoryItem.status = INVENTORY_STATUS.REPAIR;
        newStatus = INVENTORY_STATUS.REPAIR;
      }
      break;

    case INVENTORY_TRANSACTION_TYPES.LOST:
      inventoryItem.status = INVENTORY_STATUS.LOST;
      newStatus = INVENTORY_STATUS.LOST;
      break;

    case INVENTORY_TRANSACTION_TYPES.DAMAGED:
      inventoryItem.status = INVENTORY_STATUS.DAMAGED;
      newStatus = INVENTORY_STATUS.DAMAGED;
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

    const inventoryIdForTransaction =
      payload._assignedInventoryItemId || inventoryItem._id;

    const transaction =
      await inventoryTransactionRepository.create(
        {
          inventoryItemId: inventoryIdForTransaction,
        productId: inventoryItem.productId,
        fromWarehouseId:
          payload.fromWarehouseId || inventoryItem.warehouseId,
        toWarehouseId: payload.toWarehouseId || null,
        fromUserId:
          payload.fromUserId || inventoryItem.assignedUserId,
        toUserId: payload.toUserId || null,
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
const getTransactionById = async (id) => {
  const transaction =
    await inventoryTransactionRepository.findById(id);

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return transaction;
};

// Handles get item audit trail.
const getItemAuditTrail = async (inventoryItemId) => {
  return inventoryTransactionRepository.getItemAuditTrail(
    inventoryItemId
  );
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getItemAuditTrail,
};



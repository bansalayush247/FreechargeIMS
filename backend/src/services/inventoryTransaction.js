const mongoose = require("mongoose");

const inventoryTransactionRepository = require(
  "../repositories/inventoryTransaction"
);
const auditLogService = require("./auditLog");

const InventoryItem = require("../models/inventory");
const Warehouse = require("../models/warehouse");
const User = require("../models/user");

const {
  INVENTORY_STATUS,
} = require("../constants/inventory");

const {
  INVENTORY_TRANSACTION_TYPES,
} = require("../constants/inventoryTransaction");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const createTransaction = async (
  payload,
  userId,
  context = {}
) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    logger.info("Creating inventory transaction");

    const inventoryItem = await InventoryItem.findOne({
      _id: payload.inventoryItemId,
      isDeleted: false,
    }).session(session);

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
    
    const previousStatus = inventoryItem.status;
    const beforeInventoryItem = inventoryItem.toObject();
    let newStatus = inventoryItem.status;

    switch (payload.transactionType) {
      case INVENTORY_TRANSACTION_TYPES.ASSIGNED:
        inventoryItem.status = INVENTORY_STATUS.ASSIGNED;
        inventoryItem.assignedUserId = payload.toUserId;
        newStatus = INVENTORY_STATUS.ASSIGNED;
        break;

      case INVENTORY_TRANSACTION_TYPES.RETURNED:
        inventoryItem.status = INVENTORY_STATUS.AVAILABLE;
        inventoryItem.assignedUserId = null;
        newStatus = INVENTORY_STATUS.AVAILABLE;
        break;

      case INVENTORY_TRANSACTION_TYPES.TRANSFERRED:
        inventoryItem.warehouseId = payload.toWarehouseId;
        break;

      case INVENTORY_TRANSACTION_TYPES.REPAIR_SENT:
        inventoryItem.status = INVENTORY_STATUS.IN_REPAIR;
        newStatus = INVENTORY_STATUS.IN_REPAIR;
        break;

      case INVENTORY_TRANSACTION_TYPES.REPAIR_COMPLETED:
        inventoryItem.status = INVENTORY_STATUS.AVAILABLE;
        newStatus = INVENTORY_STATUS.AVAILABLE;
        break;

      case INVENTORY_TRANSACTION_TYPES.LOST:
        inventoryItem.status = INVENTORY_STATUS.LOST;
        newStatus = INVENTORY_STATUS.LOST;
        break;

      case INVENTORY_TRANSACTION_TYPES.DAMAGED:
        inventoryItem.status = INVENTORY_STATUS.DAMAGED;
        newStatus = INVENTORY_STATUS.DAMAGED;
        break;

      case INVENTORY_TRANSACTION_TYPES.RETIRED:
        inventoryItem.status = INVENTORY_STATUS.RETIRED;
        newStatus = INVENTORY_STATUS.RETIRED;
        break;

      default:
        break;
    }

    inventoryItem.updatedBy = userId;

    await inventoryItem.save({ session });

    const transaction =
      await inventoryTransactionRepository.create(
        {
          inventoryItemId: inventoryItem._id,
          productId: inventoryItem.productId,
          fromWarehouseId:
            payload.fromWarehouseId ||
            inventoryItem.warehouseId,

          toWarehouseId: payload.toWarehouseId || null,

          fromUserId:
            payload.fromUserId ||
            inventoryItem.assignedUserId,

          toUserId: payload.toUserId || null,

          transactionType: payload.transactionType,

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
        entityType:
          AUDIT_ENTITY_TYPES.INVENTORY_TRANSACTION,
        entityId: transaction._id,
        before: {
          inventoryItem: beforeInventoryItem,
        },
        after: {
          transaction,
          inventoryItem: inventoryItem.toObject(),
        },
        metadata: {
          transactionType: payload.transactionType,
          inventoryItemId: inventoryItem._id,
        },
        ipAddress: context.ipAddress || "",
        userAgent: context.userAgent || "",
      },
      session
    );

    await session.commitTransaction();

    logger.info("Inventory transaction created", {
      transactionId: transaction._id,
    });

    return transaction;
  } catch (error) {
    await session.abortTransaction();

    logger.error("Inventory transaction failed", {
      error: error.message,
    });

    throw error;
  } finally {
    session.endSession();
  }
};

const getTransactions = async (filters) => {
  return inventoryTransactionRepository.paginate(filters);
};

const getTransactionById = async (id) => {
  const transaction =
    await inventoryTransactionRepository.findById(id);

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  return transaction;
};

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



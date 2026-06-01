const InventoryItem = require("../models/inventory");

const { INVENTORY_STATUS, normalizeInventoryStatus } = require("../constants/inventory");
const { INVENTORY_TRANSACTION_TYPES, normalizeInventoryTransactionType } = require("../constants/inventoryTransaction");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const validateInventoryTransaction = async (req, res, next) => {
  try {
    if (!req.body.fromWarehouseId && req.body.fromStorageLocationId) {
      req.body.fromWarehouseId = req.body.fromStorageLocationId;
    }
    if (!req.body.toWarehouseId && req.body.toStorageLocationId) {
      req.body.toWarehouseId = req.body.toStorageLocationId;
    }

    const { inventoryItemId, transactionType, toUserId, toMerchantId, toWarehouseId } = req.body;

    const inventoryItem = await InventoryItem.findOne({ _id: inventoryItemId, isDeleted: false }).lean();
    if (!inventoryItem) {
      logger.warn("Inventory item not found", { inventoryItemId });
      throw new AppError("Inventory item not found", 404);
    }

    const normalizedTransactionType = normalizeInventoryTransactionType(transactionType);
    const currentStatus = normalizeInventoryStatus(inventoryItem.status);

    switch (normalizedTransactionType) {
      case INVENTORY_TRANSACTION_TYPES.ASSIGN_EMPLOYEE:
        if (currentStatus !== INVENTORY_STATUS.AVAILABLE) throw new AppError("Only available inventory can be assigned", 400);
        if (!toUserId) throw new AppError("toUserId is required for employee assignment", 400);
        break;

      case INVENTORY_TRANSACTION_TYPES.ASSIGN_MERCHANT:
        if (currentStatus !== INVENTORY_STATUS.AVAILABLE) throw new AppError("Only available inventory can be assigned", 400);
        if (!toMerchantId) throw new AppError("toMerchantId is required for merchant assignment", 400);
        break;

      case INVENTORY_TRANSACTION_TYPES.RETURN:
        if (![INVENTORY_STATUS.ASSIGNED_EMPLOYEE, INVENTORY_STATUS.ASSIGNED_MERCHANT].includes(currentStatus)) {
          throw new AppError("Only assigned inventory can be returned", 400);
        }
        break;

      case INVENTORY_TRANSACTION_TYPES.TRANSFER:
        if (!toWarehouseId) throw new AppError("toWarehouseId is required for transfer", 400);
        if (String(inventoryItem.warehouseId) === String(toWarehouseId)) {
          throw new AppError("Source and destination warehouse cannot be same", 400);
        }
        break;

      case INVENTORY_TRANSACTION_TYPES.DISPOSE:
        if (currentStatus === INVENTORY_STATUS.DISPOSED) throw new AppError("Inventory already disposed", 400);
        break;

      default:
        break;
    }

    req.inventoryItem = inventoryItem;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateInventoryTransaction;

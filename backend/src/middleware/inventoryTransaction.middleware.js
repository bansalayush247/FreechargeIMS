const InventoryItem = require("../models/inventory.model");

const {
  INVENTORY_STATUS,
} = require("../constants/inventory.constant");

const {
  INVENTORY_TRANSACTION_TYPES,
} = require("../constants/inventoryTransaction.constant");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const validateInventoryTransaction = async (
  req,
  res,
  next
) => {
  try {
    const {
      inventoryItemId,
      transactionType,
      toUserId,
      toWarehouseId,
    } = req.body;

    const inventoryItem = await InventoryItem.findOne({
      _id: inventoryItemId,
      isDeleted: false,
    }).lean();

    if (!inventoryItem) {
      logger.warn("Inventory item not found", {
        inventoryItemId,
      });

      throw new AppError("Inventory item not found", 404);
    }

    switch (transactionType) {
      case INVENTORY_TRANSACTION_TYPES.ASSIGNED:
        if (
          inventoryItem.status !==
          INVENTORY_STATUS.AVAILABLE
        ) {
          throw new AppError("Only available inventory can be assigned", 400);
        }

        if (!toUserId) {
          throw new AppError(
            "toUserId is required for assignment",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.RETURNED:
        if (
          inventoryItem.status !==
          INVENTORY_STATUS.ASSIGNED
        ) {
          throw new AppError(
            "Only assigned inventory can be returned",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.TRANSFERRED:
        if (!toWarehouseId) {
          throw new AppError(
            "toWarehouseId is required for transfer",
            400
          );
        }

        if (
          inventoryItem.warehouseId.toString() ===
          toWarehouseId
        ) {
          throw new AppError(
            "Source and destination warehouse cannot be same",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.REPAIR_SENT:
        if (
          inventoryItem.status ===
          INVENTORY_STATUS.RETIRED
        ) {
          throw new AppError(
            "Retired inventory cannot be repaired",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.REPAIR_COMPLETED:
        if (
          inventoryItem.status !==
          INVENTORY_STATUS.IN_REPAIR
        ) {
          throw new AppError(
            "Inventory is not under repair",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.LOST:
        if (
          inventoryItem.status ===
          INVENTORY_STATUS.RETIRED
        ) {
          throw new AppError(
            "Retired inventory cannot be marked lost",
            400
          );
        }

        break;

      case INVENTORY_TRANSACTION_TYPES.RETIRED:
        if (
          inventoryItem.status ===
          INVENTORY_STATUS.RETIRED
        ) {
          throw new AppError("Inventory already retired", 400);
        }

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
